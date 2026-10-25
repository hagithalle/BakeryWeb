using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Server.Data;
using Server.Models;

namespace Server.Tests.Tenancy
{
    /// <summary>Shares one app per database kind across the isolation tests (each test uses fresh users).</summary>
    public sealed class TenantAppsFixture : IAsyncLifetime
    {
        private readonly Dictionary<TestDatabase, TenantTestApp> _apps = new();
        private readonly Dictionary<TestDatabase, OwnerlessRows> _ownerless = new();
        private readonly SemaphoreSlim _lock = new(1, 1);

        public async Task<(TenantTestApp App, OwnerlessRows Ownerless)> GetAsync(TestDatabase database)
        {
            await _lock.WaitAsync();
            try
            {
                if (!_apps.TryGetValue(database, out var app))
                {
                    app = new TenantTestApp(database);
                    try
                    {
                        await app.InitializeDatabaseAsync();
                        _ownerless[database] = await OwnerlessRows.SeedAsync(app);
                    }
                    catch
                    {
                        await app.DisposeAsync(); // drops the temporary database even when setup fails
                        throw;
                    }
                    _apps[database] = app;
                }
                return (app, _ownerless[database]);
            }
            finally
            {
                _lock.Release();
            }
        }

        public Task InitializeAsync() => Task.CompletedTask;

        public async Task DisposeAsync()
        {
            foreach (var app in _apps.Values) await app.DisposeAsync();
        }
    }

    /// <summary>Legacy rows without an owner, like the existing local data. They must stay invisible and untouched.</summary>
    public sealed record OwnerlessRows(int Ingredient, int Packaging, int Overhead, int Labor, int Recipe, int Product)
    {
        public const string Marker = "OWNERLESS-";

        public static async Task<OwnerlessRows> SeedAsync(TenantTestApp app)
        {
            await using var db = app.CreateUnscopedContext();
            var ingredient = new Ingredient { Name = Marker + "ingredient", PricePerKg = 1, Unit = UnitOfMeasure.Kilogram, StockUnit = UnitOfMeasure.Kilogram, Category = IngredientCategory.Dry };
            var packaging = new Packaging { Name = Marker + "packaging", Cost = 1 };
            var overhead = new OverheadItem { Name = Marker + "overhead", MonthlyCost = 99999, IsActive = true };
            var labor = new LaborSettings { DesiredMonthlySalary = 99999, WorkingDaysPerMonth = 20, WorkingHoursPerDay = 8 };
            var recipe = new Recipe { Name = Marker + "recipe", OutputUnits = 1 };
            db.AddRange(ingredient, packaging, overhead, labor, recipe);
            await db.SaveChangesAsync();
            var product = new Product { Name = Marker + "product", RecipeId = recipe.Id };
            db.Products.Add(product);
            await db.SaveChangesAsync();
            return new OwnerlessRows(ingredient.Id, packaging.Id, overhead.Id, labor.Id, recipe.Id, product.Id);
        }
    }

    public static class TestDatabases
    {
        /// <summary>In-memory always; PostgreSQL only when BAKERY_TEST_POSTGRES is set.</summary>
        public static TheoryData<TestDatabase> All()
        {
            var data = new TheoryData<TestDatabase> { TestDatabase.InMemory };
            if (TenantTestApp.PostgresConfigured) data.Add(TestDatabase.Postgres);
            return data;
        }
    }

    /// <summary>Skipped (and reported as skipped) unless a local PostgreSQL test server is configured.</summary>
    public sealed class PostgresFactAttribute : FactAttribute
    {
        public PostgresFactAttribute()
        {
            if (!TenantTestApp.PostgresConfigured)
                Skip = $"Set {TenantTestApp.PostgresEnvironmentVariable} to run the PostgreSQL integration tests.";
        }
    }

    // ============================================================== anonymous access

    public class AnonymousAccessTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public AnonymousAccessTests(TenantAppsFixture apps) => _apps = apps;

        private static readonly HttpMethod[] AllMethods = { HttpMethod.Get, HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete };

        private static List<(RouteEndpoint Endpoint, string Path, IReadOnlyList<string> Methods)> Endpoints(TenantTestApp app) =>
            app.Services.GetRequiredService<EndpointDataSource>().Endpoints
                .OfType<RouteEndpoint>()
                .Select(e => (e,
                    "/" + System.Text.RegularExpressions.Regex.Replace(e.RoutePattern.RawText ?? "", @"\{[^}]+\}", "1").TrimStart('/'),
                    (IReadOnlyList<string>)(e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? AllMethods.Select(m => m.Method).ToList())))
                .ToList();

        [Fact]
        public async Task OnlyTheHealthCheckAllowsAnonymousAccess()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);

            var anonymous = Endpoints(app)
                .Where(x => x.Endpoint.Metadata.GetMetadata<IAllowAnonymous>() != null)
                .Select(x => x.Path)
                .ToList();

            Assert.Equal(new[] { "/" }, anonymous);
        }

        [Fact]
        public async Task EveryOtherEndpoint_Returns401_WithoutAToken()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            var client = app.CreateAnonymousClient();
            var checkedCount = 0;

            foreach (var (endpoint, path, methods) in Endpoints(app).Where(x => x.Endpoint.Metadata.GetMetadata<IAllowAnonymous>() == null))
            {
                foreach (var method in methods)
                {
                    var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), path) { Content = JsonContent.Create(new { }) });
                    Assert.True(response.StatusCode == HttpStatusCode.Unauthorized, $"{method} {path} returned {(int)response.StatusCode} without a token");
                    checkedCount++;
                }
            }

            // Business, auth and AI-import endpoints are all covered by this sweep.
            Assert.True(checkedCount >= 30, $"only {checkedCount} endpoint/method pairs were checked");
        }

        [Fact]
        public async Task EveryOtherEndpoint_Returns401_WithAnInvalidToken()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            var client = app.CreateAnonymousClient();

            foreach (var (endpoint, path, methods) in Endpoints(app).Where(x => x.Endpoint.Metadata.GetMetadata<IAllowAnonymous>() == null))
            {
                foreach (var method in methods)
                {
                    var request = new HttpRequestMessage(new HttpMethod(method), path) { Content = JsonContent.Create(new { }) };
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "not.a.valid.token");
                    var response = await client.SendAsync(request);
                    Assert.True(response.StatusCode == HttpStatusCode.Unauthorized, $"{method} {path} returned {(int)response.StatusCode} with an invalid token");
                }
            }
        }

        [Fact]
        public async Task AnonymousCallers_GetNoBusinessDataAndCannotCreateAny()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            var client = app.CreateAnonymousClient();
            await using var before = app.CreateUnscopedContext();
            var ingredientsBefore = await before.Ingredients.CountAsync();

            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/ingredients")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/ingredients", new { name = "anon" })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/laborsettings", new { desiredMonthlySalary = 1 })).StatusCode);

            await using var after = app.CreateUnscopedContext();
            Assert.Equal(ingredientsBefore, await after.Ingredients.CountAsync());
        }

        [Fact]
        public async Task HealthCheck_IsPublic()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            var response = await app.CreateAnonymousClient().GetAsync("/");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task UploadedImages_StayReachableWithoutAToken_AsCurrentlyDesigned()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            var file = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", $"tenant-test-{Guid.NewGuid():N}.png");
            await File.WriteAllBytesAsync(file, new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
            try
            {
                var response = await app.CreateAnonymousClient().GetAsync("/uploads/" + Path.GetFileName(file));
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
            finally
            {
                File.Delete(file);
            }
        }

        [Fact]
        public async Task TestApp_NeverUsesTheLocalBakeryDb()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.InMemory);
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BakeryDbContext>();
            Assert.Equal("Microsoft.EntityFrameworkCore.InMemory", db.Database.ProviderName);
        }
    }

    // ============================================================== two-user isolation

    public class TenantIsolationTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public TenantIsolationTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        // ---------- request helpers ----------

        private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
            JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();

        private static async Task<int> CreateJsonAsync(TestUser user, string path, object body)
        {
            var response = await user.SendAsync(HttpMethod.Post, path, JsonContent.Create(body));
            Assert.True(response.IsSuccessStatusCode, $"POST {path} as {user.Label} failed: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}");
            return (await ReadJson(response)).GetProperty("id").GetInt32();
        }

        private static Task<int> CreateIngredientAsync(TestUser user, string name) =>
            CreateJsonAsync(user, "/api/ingredients", new { name, pricePerKg = 10m, stockQuantity = 5, unit = 1, stockUnit = 1, category = 1 });

        private static Task<int> CreatePackagingAsync(TestUser user, string name) =>
            CreateJsonAsync(user, "/api/packaging", new { name, cost = 2m, stockUnits = 10 });

        private static Task<int> CreateOverheadAsync(TestUser user, string name, decimal monthlyCost = 3000m) =>
            CreateJsonAsync(user, "/api/overheaditem", new { name, monthlyCost, isActive = true, type = 0, category = 0 });

        private static MultipartFormDataContent RecipeForm(string name, int? ingredientId, int prepMinutes = 60)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent(name), "Name" },
                { new StringContent("1"), "OutputUnits" },
                { new StringContent(prepMinutes.ToString()), "PrepTime" },
            };
            if (ingredientId != null)
            {
                form.Add(new StringContent(ingredientId.Value.ToString()), "Ingredients[0].IngredientId");
                form.Add(new StringContent("100"), "Ingredients[0].Quantity");
                form.Add(new StringContent("2"), "Ingredients[0].Unit");
            }
            return form;
        }

        private static async Task<int> CreateRecipeAsync(TestUser user, string name, int? ingredientId)
        {
            var response = await user.SendAsync(HttpMethod.Post, "/api/recipe", RecipeForm(name, ingredientId));
            Assert.True(response.IsSuccessStatusCode, $"create recipe as {user.Label}: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}");
            return (await ReadJson(response)).GetProperty("id").GetInt32();
        }

        private static async Task<int> CreateProductAsync(TestUser user, string name, int recipeId)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent(name), "Name" },
                { new StringContent("0"), "ProductType" },
                { new StringContent(recipeId.ToString()), "RecipeId" },
                { new StringContent("1"), "RecipeUnits" },
                { new StringContent("0.2"), "ProfitMarginPercent" },
            };
            var response = await user.SendAsync(HttpMethod.Post, "/api/products", form);
            Assert.True(response.IsSuccessStatusCode, $"create product as {user.Label}: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}");
            return (await ReadJson(response)).GetProperty("id").GetInt32();
        }

        private static async Task<string> ListAsync(TestUser user, string path)
        {
            var response = await user.SendAsync(HttpMethod.Get, path);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return await response.Content.ReadAsStringAsync();
        }

        private async Task<(TenantTestApp App, OwnerlessRows Ownerless, TestUser A, TestUser B)> SetupAsync(TestDatabase database)
        {
            var (app, ownerless) = await _apps.GetAsync(database);
            var a = await app.CreateUserAsync("alice");
            var b = await app.CreateUserAsync("bob");
            Assert.NotEqual(a.InternalId, b.InternalId);
            return (app, ownerless, a, b);
        }

        // ---------- per-resource isolation ----------

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Ingredients_AreIsolated(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var name = "A-ingredient-" + Guid.NewGuid().ToString("N")[..8];
            var id = await CreateIngredientAsync(a, name);

            Assert.DoesNotContain(name, await ListAsync(b, "/api/ingredients"));
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Get, $"/api/ingredients/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Put, $"/api/ingredients/{id}",
                JsonContent.Create(new { name = "hijacked", pricePerKg = 0m, stockQuantity = 0, unit = 1, stockUnit = 1, category = 1 }))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Delete, $"/api/ingredients/{id}")).StatusCode);

            Assert.Contains(name, await ListAsync(a, "/api/ingredients"));
            var stored = await a.GetJsonAsync($"/api/ingredients/{id}");
            Assert.Equal(name, stored.GetProperty("name").GetString());
            Assert.Equal(10m, stored.GetProperty("pricePerKg").GetDecimal());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Packaging_IsIsolated(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var name = "A-packaging-" + Guid.NewGuid().ToString("N")[..8];
            var id = await CreatePackagingAsync(a, name);

            Assert.DoesNotContain(name, await ListAsync(b, "/api/packaging"));
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Get, $"/api/packaging/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Put, $"/api/packaging/{id}", JsonContent.Create(new { name = "hijacked", cost = 0m, stockUnits = 0 }))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Delete, $"/api/packaging/{id}")).StatusCode);

            Assert.Equal(name, (await a.GetJsonAsync($"/api/packaging/{id}")).GetProperty("name").GetString());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task OverheadItems_AreIsolated(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var name = "A-overhead-" + Guid.NewGuid().ToString("N")[..8];
            var id = await CreateOverheadAsync(a, name);

            Assert.DoesNotContain(name, await ListAsync(b, "/api/overheaditem"));
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Get, $"/api/overheaditem/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Put, $"/api/overheaditem/{id}", JsonContent.Create(new { name = "hijacked", monthlyCost = 0m, isActive = false, type = 0, category = 0 }))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Delete, $"/api/overheaditem/{id}")).StatusCode);

            Assert.Equal(3000m, (await a.GetJsonAsync($"/api/overheaditem/{id}")).GetProperty("monthlyCost").GetDecimal());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task LaborSettings_AreIsolated_AndOnePerUser(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var settings = new { desiredMonthlySalary = 20000m, pensionPercent = 0m, kerenHishtalmutPercent = 0m, otherEmployerCostsPercent = 0m, workingDaysPerMonth = 20, workingHoursPerDay = 8m };

            Assert.Equal(HttpStatusCode.OK, (await a.SendAsync(HttpMethod.Post, "/api/laborsettings", JsonContent.Create(settings))).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await a.SendAsync(HttpMethod.Post, "/api/laborsettings", JsonContent.Create(settings with { desiredMonthlySalary = 21000m }))).StatusCode);

            // B has no settings: neither A's nor the ownerless row (salary 99999) is visible.
            var bView = await b.SendAsync(HttpMethod.Get, "/api/laborsettings");
            Assert.True(bView.StatusCode == HttpStatusCode.NoContent || (await bView.Content.ReadAsStringAsync()) is "" or "null",
                $"B saw labor settings: {(int)bView.StatusCode} {await bView.Content.ReadAsStringAsync()}");

            Assert.Equal(21000m, (await a.GetJsonAsync("/api/laborsettings")).GetProperty("desiredMonthlySalary").GetDecimal());
            await using var db = app.CreateUnscopedContext();
            Assert.Equal(1, await db.LaborSettings.CountAsync(s => s.UserId == a.InternalId));
            Assert.Equal(0, await db.LaborSettings.CountAsync(s => s.UserId == b.InternalId));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Recipes_AreIsolated(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var name = "A-recipe-" + Guid.NewGuid().ToString("N")[..8];
            var ingredient = await CreateIngredientAsync(a, "A-recipe-ingredient");
            var id = await CreateRecipeAsync(a, name, ingredient);

            Assert.DoesNotContain(name, await ListAsync(b, "/api/recipe"));
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Get, $"/api/recipe/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Put, $"/api/recipe/{id}", RecipeForm("hijacked", null))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Delete, $"/api/recipe/{id}")).StatusCode);

            var stored = await a.GetJsonAsync($"/api/recipe/{id}");
            Assert.Equal(name, stored.GetProperty("name").GetString());
            // Only isolation is asserted here; the line count is affected by a known, separate bug
            // (see RecipeCreate_StoresEachIngredientLineOnce).
            Assert.True(stored.GetProperty("ingredients").GetArrayLength() >= 1);
        }

        [Theory(Skip = "Known existing bug pending approval: RecipeService.CreateAsync adds every ingredient line and step twice (since 2026-02-04).")]
        [MemberData(nameof(Databases))]
        public async Task RecipeCreate_StoresEachIngredientLineOnce(TestDatabase database)
        {
            var (app, _, a, _) = await SetupAsync(database);
            var ingredient = await CreateIngredientAsync(a, "single-line-ingredient");
            var id = await CreateRecipeAsync(a, "single-line-recipe", ingredient);

            Assert.Equal(1, (await a.GetJsonAsync($"/api/recipe/{id}")).GetProperty("ingredients").GetArrayLength());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Products_AreIsolated(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var name = "A-product-" + Guid.NewGuid().ToString("N")[..8];
            var recipe = await CreateRecipeAsync(a, "A-product-recipe", null);
            var id = await CreateProductAsync(a, name, recipe);

            Assert.DoesNotContain(name, await ListAsync(b, "/api/products"));
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Get, $"/api/products/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Put, $"/api/products/{id}",
                JsonContent.Create(new { id, name = "hijacked", productType = 0, unitConversionRate = 1, profitMarginPercent = 0m }))).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Post, $"/api/products/{id}/recalculate-price")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await b.SendAsync(HttpMethod.Delete, $"/api/products/{id}")).StatusCode);

            var stored = await a.GetJsonAsync($"/api/products/{id}");
            Assert.Equal(name, stored.GetProperty("name").GetString());
            Assert.Equal(recipe, stored.GetProperty("recipeId").GetInt32());
        }

        // ---------- ownership cannot be supplied by the client ----------

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ClientSuppliedOwnerAndId_AreIgnored(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aName = "A-original-" + Guid.NewGuid().ToString("N")[..8];
            var aId = await CreateIngredientAsync(a, aName);

            // B tries to create a row owned by A, reusing A's id.
            var response = await b.SendAsync(HttpMethod.Post, "/api/ingredients",
                JsonContent.Create(new { id = aId, userId = a.InternalId, name = "B-spoof", pricePerKg = 1m, unit = 1, stockUnit = 1, category = 1 }));
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var newId = (await ReadJson(response)).GetProperty("id").GetInt32();

            Assert.NotEqual(aId, newId);
            await using var db = app.CreateUnscopedContext();
            Assert.Equal(b.InternalId, (await db.Ingredients.SingleAsync(i => i.Id == newId)).UserId);
            var aRow = await db.Ingredients.SingleAsync(i => i.Id == aId);
            Assert.Equal(aName, aRow.Name);
            Assert.Equal(a.InternalId, aRow.UserId);
            Assert.DoesNotContain("B-spoof", await ListAsync(a, "/api/ingredients"));
        }

        // ---------- legacy ownerless rows ----------

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task OwnerlessRows_AreInvisibleAndUntouchable(TestDatabase database)
        {
            var (app, ownerless, a, _) = await SetupAsync(database);

            foreach (var path in new[] { "/api/ingredients", "/api/packaging", "/api/overheaditem", "/api/recipe", "/api/products" })
                Assert.DoesNotContain(OwnerlessRows.Marker, await ListAsync(a, path));

            foreach (var path in new[] { $"/api/ingredients/{ownerless.Ingredient}", $"/api/packaging/{ownerless.Packaging}", $"/api/overheaditem/{ownerless.Overhead}", $"/api/recipe/{ownerless.Recipe}", $"/api/products/{ownerless.Product}" })
            {
                Assert.Equal(HttpStatusCode.NotFound, (await a.SendAsync(HttpMethod.Get, path)).StatusCode);
                Assert.Equal(HttpStatusCode.NotFound, (await a.SendAsync(HttpMethod.Delete, path)).StatusCode);
            }
            Assert.Equal(HttpStatusCode.NotFound, (await a.SendAsync(HttpMethod.Put, $"/api/ingredients/{ownerless.Ingredient}",
                JsonContent.Create(new { name = "claimed", pricePerKg = 0m, unit = 1, stockUnit = 1, category = 1 }))).StatusCode);

            var labor = await a.SendAsync(HttpMethod.Get, "/api/laborsettings");
            Assert.DoesNotContain("99999", await labor.Content.ReadAsStringAsync());

            await using var db = app.CreateUnscopedContext();
            Assert.Equal(OwnerlessRows.Marker + "ingredient", (await db.Ingredients.SingleAsync(i => i.Id == ownerless.Ingredient)).Name);
            Assert.Null((await db.Ingredients.SingleAsync(i => i.Id == ownerless.Ingredient)).UserId);
            Assert.NotNull(await db.Recipes.FirstOrDefaultAsync(r => r.Id == ownerless.Recipe && r.UserId == null));
            Assert.NotNull(await db.Products.FirstOrDefaultAsync(p => p.Id == ownerless.Product && p.UserId == null));
            Assert.NotNull(await db.LaborSettings.FirstOrDefaultAsync(l => l.Id == ownerless.Labor && l.UserId == null));
        }

        // ---------- costing uses only the caller's own settings ----------

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Costing_UsesOnlyTheCallersLaborAndOverhead(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            await a.SendAsync(HttpMethod.Post, "/api/laborsettings", JsonContent.Create(new
            {
                desiredMonthlySalary = 16000m, pensionPercent = 0m, kerenHishtalmutPercent = 0m, otherEmployerCostsPercent = 0m,
                workingDaysPerMonth = 20, workingHoursPerDay = 8m,
            }));
            await CreateOverheadAsync(a, "A rent", monthlyCost: 3000m);

            var aRecipe = await CreateRecipeAsync(a, "A costed", null);
            var bRecipe = await CreateRecipeAsync(b, "B costed", null);
            var aCost = await a.GetJsonAsync($"/api/recipe/{aRecipe}");
            var bCost = await b.GetJsonAsync($"/api/recipe/{bRecipe}");

            // A: 16000 / (20 * 8) = 100 per hour * 1 hour prep; overhead 3000 / 30 = 100 (never the ownerless 99999).
            Assert.Equal(100m, aCost.GetProperty("laborCost").GetDecimal());
            Assert.Equal(100m, aCost.GetProperty("overheadCost").GetDecimal());
            // B has no settings and no overhead: A's values and the ownerless rows must not leak in.
            Assert.Equal(0m, bCost.GetProperty("laborCost").GetDecimal());
            Assert.Equal(0m, bCost.GetProperty("overheadCost").GetDecimal());
        }

        // ---------- references to another user's rows never expose their data (P2) ----------

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ReferencingAnotherUsersRows_NeverExposesTheirData(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var secretIngredient = "A-secret-ingredient-" + Guid.NewGuid().ToString("N")[..8];
            var secretRecipe = "A-secret-recipe-" + Guid.NewGuid().ToString("N")[..8];
            var aIngredient = await CreateIngredientAsync(a, secretIngredient);
            var aRecipe = await CreateRecipeAsync(a, secretRecipe, aIngredient);

            // P2 does not yet reject these references (explicit 400 validation is P3), but B must never see A's data.
            var bRecipeResponse = await b.SendAsync(HttpMethod.Post, "/api/recipe", RecipeForm("B-recipe", aIngredient));
            if (bRecipeResponse.IsSuccessStatusCode)
            {
                var bRecipeId = (await ReadJson(bRecipeResponse)).GetProperty("id").GetInt32();
                Assert.DoesNotContain(secretIngredient, await (await b.SendAsync(HttpMethod.Get, $"/api/recipe/{bRecipeId}")).Content.ReadAsStringAsync());
            }
            Assert.DoesNotContain(secretIngredient, await ListAsync(b, "/api/recipe"));

            var productForm = new MultipartFormDataContent
            {
                { new StringContent("B-product"), "Name" }, { new StringContent("0"), "ProductType" },
                { new StringContent(aRecipe.ToString()), "RecipeId" }, { new StringContent("1"), "RecipeUnits" },
            };
            var bProductResponse = await b.SendAsync(HttpMethod.Post, "/api/products", productForm);
            if (bProductResponse.IsSuccessStatusCode)
                Assert.DoesNotContain(secretRecipe, await bProductResponse.Content.ReadAsStringAsync());
            var bProducts = await ListAsync(b, "/api/products");
            Assert.DoesNotContain(secretRecipe, bProducts);
            Assert.DoesNotContain(secretIngredient, bProducts);

            // A box product referencing A's recipe is already rejected, because the existence check is user-filtered.
            var boxForm = new MultipartFormDataContent
            {
                { new StringContent("B-box"), "Name" }, { new StringContent("1"), "ProductType" },
                { new StringContent(aRecipe.ToString()), "PackageItems[0].RecipeId" }, { new StringContent("1"), "PackageItems[0].Quantity" },
            };
            Assert.Equal(HttpStatusCode.BadRequest, (await b.SendAsync(HttpMethod.Post, "/api/products", boxForm)).StatusCode);
        }

        // ---------- PostgreSQL sanity ----------

        [PostgresFact]
        public async Task PostgresSuite_RunsOnATemporaryDatabase_NotBakeryDb()
        {
            var (app, _) = await _apps.GetAsync(TestDatabase.Postgres);
            Assert.StartsWith("bakery_tenant_test_", app.PostgresDatabaseName);
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BakeryDbContext>();
            Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", db.Database.ProviderName);
            Assert.Equal(app.PostgresDatabaseName, db.Database.GetDbConnection().Database);
            Assert.NotEqual("BakeryDb", db.Database.GetDbConnection().Database);
            Assert.True(await db.Database.CanConnectAsync());
        }
    }
}
