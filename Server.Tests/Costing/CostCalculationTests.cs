using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Tests.Tenancy;

namespace Server.Tests.Costing
{
    /// <summary>
    /// A1 regression tests: recipe and product costs through the real API, on EF in-memory and (when configured)
    /// a temporary PostgreSQL database. Every expected value is calculated by hand in <see cref="Bakery"/>.
    ///
    /// The original bug: products (and boxes) ignored sub-recipes completely, and GET /api/recipe/{id} ignored the
    /// ingredients of sub-recipes, because costs depended on what each endpoint happened to load. With that bug the
    /// single product below would cost 36.75 instead of 86.75 and the box 35.50 instead of 68.00.
    /// </summary>
    public class CostCalculationTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public CostCalculationTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        // ================================================================== recipes

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeList_IncludesNestedSubRecipes_ExactlyOnce(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var recipes = await RecipesById(user);

            // C: own ingredients 10, labor 5, overhead 10 -> 25 per batch of 5
            AssertRecipe(recipes[w.C], ingredients: 10, subRecipes: 0, labor: 5, overhead: 10, total: 25, perUnit: 5);
            // B: own ingredients 10 + 2 units of C (10) + labor 10 + overhead 10 -> 40 per batch of 4
            AssertRecipe(recipes[w.B], ingredients: 10, subRecipes: 10, labor: 10, overhead: 10, total: 40, perUnit: 10);
            // A: own ingredients 2 + 2 units of B (20) + 1 unit of C (5) + overhead 10 -> 37 (C counted once via B, once directly)
            AssertRecipe(recipes[w.A], ingredients: 2, subRecipes: 25, labor: 0, overhead: 10, total: 37, perUnit: 37);

            // Line costs are calculated by the server, including each sub-recipe line's share.
            var aLines = recipes[w.A].GetProperty("baseRecipes").EnumerateArray()
                .ToDictionary(l => l.GetProperty("baseRecipeId").GetInt32(), l => Dec(l, "totalCost"));
            Assert.Equal(20m, aLines[w.B]);
            Assert.Equal(5m, aLines[w.C]);
            Assert.Equal(10m, Dec(recipes[w.C].GetProperty("ingredients")[0], "cost"));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeDetail_EqualsRecipeList_IncludingSubRecipeIngredients(TestDatabase database)
        {
            // Before A1, GET /api/recipe/{id} loaded sub-recipes WITHOUT their ingredients (or theirs): A cost 25 instead of 37.
            var (_, user, w) = await SetupAsync(database);
            var list = await RecipesById(user);

            foreach (var id in new[] { w.A, w.B, w.C })
            {
                var detail = await user.GetJsonAsync($"/api/recipe/{id}");
                foreach (var field in new[] { "ingredientsCost", "baseRecipesCost", "laborCost", "overheadCost", "totalCost", "costPerUnit" })
                    Assert.Equal(Dec(list[id], field), Dec(detail, field));
            }
            Assert.Equal(37m, Dec(await user.GetJsonAsync($"/api/recipe/{w.A}"), "costPerUnit"));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeBreakdown_AddsUpToTotal(TestDatabase database)
        {
            var (_, user, _) = await SetupAsync(database);
            foreach (var recipe in (await RecipesById(user)).Values)
            {
                var sum = Dec(recipe, "ingredientsCost") + Dec(recipe, "baseRecipesCost") + Dec(recipe, "laborCost") + Dec(recipe, "overheadCost");
                Assert.Equal(Round(Dec(recipe, "totalCost")), Round(sum));
            }
        }

        // ================================================================== products

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task SingleProduct_IncludesSubRecipes_AndEveryCostOnce(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var detail = await user.GetJsonAsync($"/api/products/{w.Single}");
            var listed = (await user.GetJsonAsync("/api/products")).EnumerateArray().Single(p => p.GetProperty("id").GetInt32() == w.Single);

            foreach (var product in new[] { detail, listed })
            {
                // 2 units of A (37 each) = 74 -> ingredients 22, labor 14, overhead 38 (sub-recipe shares included)
                Assert.Equal(22m, Round(Dec(product, "recipeIngredientsCost")));
                Assert.Equal(14m, Round(Dec(product, "recipeLaborCost")));
                Assert.Equal(38m, Round(Dec(product, "recipeOverheadCost")));
                // packaging 1.50 + extra 2 x 0.25; 12 minutes packaging: labor 10, overhead 12/60 x 3.75
                Assert.Equal(2m, Round(Dec(product, "packagingCost")));
                Assert.Equal(10m, Round(Dec(product, "packagingLaborCost")));
                Assert.Equal(0.75m, Round(Dec(product, "packagingOverheadCost")));
                Assert.Equal(86.75m, Round(Dec(product, "totalCost")));
                AssertProductAddsUp(product);
            }
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Box_IncludesSubRecipesOfItsItems(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var box = await user.GetJsonAsync($"/api/products/{w.Box}");

            // 1 x A (37) + 3 x B (10) = 67, + extra packaging 4 x 0.25 = 1, no packaging time
            Assert.Equal(21.5m, Round(Dec(box, "recipeIngredientsCost")));
            Assert.Equal(16m, Round(Dec(box, "recipeLaborCost")));
            Assert.Equal(29.5m, Round(Dec(box, "recipeOverheadCost")));
            Assert.Equal(1m, Round(Dec(box, "packagingCost")));
            Assert.Equal(68m, Round(Dec(box, "totalCost")));
            AssertProductAddsUp(box);
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecalculatePrice_ForBox_UsesItsItems(TestDatabase database)
        {
            // Before A1 the endpoint did not load box items, so a box cost only its packaging.
            var (app, user, w) = await SetupAsync(database);
            var response = await user.SendAsync(HttpMethod.Post, $"/api/products/{w.Box}/recalculate-price");
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            await using var db = app.CreateUnscopedContext();
            var stored = await db.Products.Where(p => p.Id == w.Box).Select(p => p.ManualSellingPrice).SingleAsync();
            Assert.Equal(68m * 1.2m, Round(stored!.Value));   // cost x (1 + 20% markup), the existing formula
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task CostPreview_EqualsSavedProducts(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);

            var single = await PreviewAsync(user, new
            {
                productType = 0, recipeId = w.A, recipeUnits = 2, packagingId = w.Packaging, packagingTimeMinutes = 12,
                additionalPackaging = new[] { new { packagingId = w.Sticker, quantity = 2 } },
            });
            var box = await PreviewAsync(user, new
            {
                productType = 1,
                packageItems = new[] { new { recipeId = w.A, quantity = 1 }, new { recipeId = w.B, quantity = 3 } },
                additionalPackaging = new[] { new { packagingId = w.Sticker, quantity = 4 } },
            });

            var savedSingle = await user.GetJsonAsync($"/api/products/{w.Single}");
            var savedBox = await user.GetJsonAsync($"/api/products/{w.Box}");
            foreach (var (preview, saved) in new[] { (single, savedSingle), (box, savedBox) })
            {
                foreach (var field in new[] { "recipeIngredientsCost", "recipeLaborCost", "recipeOverheadCost", "packagingCost",
                                              "packagingLaborCost", "packagingOverheadCost", "totalCost" })
                    Assert.Equal(Round(Dec(saved, field)), Round(Dec(preview, field)));
                Assert.Empty(preview.GetProperty("warnings").EnumerateArray());
            }
        }

        // ================================================================== isolation and safety

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task OtherUsersSettingsAndRecipes_NeverAffectCosts(TestDatabase database)
        {
            var (app, alice, w) = await SetupAsync(database);
            var bob = await app.CreateUserAsync("bob");
            await Bakery.SeedAsync(app, bob.InternalId, salary: 100_000m, overhead: 9_000m);   // very different settings

            Assert.Equal(37m, Round(Dec((await RecipesById(alice))[w.A], "costPerUnit")));
            Assert.Equal(86.75m, Round(Dec(await alice.GetJsonAsync($"/api/products/{w.Single}"), "totalCost")));

            // Bob cannot cost Alice's recipe through the preview: treated exactly like a missing recipe.
            var foreign = await PreviewAsync(bob, new { productType = 0, recipeId = w.A, recipeUnits = 1 });
            var missing = await PreviewAsync(bob, new { productType = 0, recipeId = TenantApi.NonExistentId, recipeUnits = 1 });
            Assert.Equal(0m, Dec(foreign, "totalCost"));
            Assert.Equal(missing.GetRawText(), foreign.GetRawText());
            Assert.Contains(foreign.GetProperty("warnings").EnumerateArray(), x => x.GetProperty("code").GetString() == "MissingRecipe");
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task DataProblems_ProduceWarnings_WithoutChangingValues(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            int odd;
            await using (var db = app.CreateUnscopedContext())
            {
                var free = new Ingredient { Name = "free", PricePerKg = 0, Unit = UnitOfMeasure.Kilogram, UserId = user.InternalId };
                var unknownPriceUnit = new Ingredient { Name = "legacy", PricePerKg = 4, Unit = 0, UserId = user.InternalId };
                db.AddRange(free, unknownPriceUnit);
                await db.SaveChangesAsync();
                var recipe = new Recipe
                {
                    Name = "odd", OutputUnits = 1, UserId = user.InternalId,
                    Ingredients =
                    {
                        new RecipeIngredient { IngredientId = w.Flour, Quantity = 0.2m, Unit = 0 },                     // unknown unit: used as-is
                        new RecipeIngredient { IngredientId = w.Flour, Quantity = 3, Unit = (int)UnitOfMeasure.Unit },  // per-kg price x count
                        new RecipeIngredient { IngredientId = free.Id, Quantity = 1, Unit = (int)UnitOfMeasure.Kilogram },
                        new RecipeIngredient { IngredientId = unknownPriceUnit.Id, Quantity = 1, Unit = (int)UnitOfMeasure.Kilogram },
                        new RecipeIngredient { IngredientId = w.Flour, Quantity = 1, Unit = (int)UnitOfMeasure.Liter }, // volume vs mass
                    },
                    BaseRecipes = { new RecipeItem { BaseRecipeId = w.C, Quantity = 2, Unit = UnitOfMeasure.Gram } }, // unit ignored
                };
                db.Recipes.Add(recipe);
                await db.SaveChangesAsync();
                odd = recipe.Id;
            }
            var before = await SnapshotAsync(app, user.InternalId);

            var r = (await RecipesById(user))[odd];
            // Exactly the previous formula: 20 x 0.2 + 20 x 3 + 0 + 4 x 1 + 20 x 1 = 88, + 2 x C (5) = 10, + overhead 10
            Assert.Equal(88m, Round(Dec(r, "ingredientsCost")));
            Assert.Equal(10m, Round(Dec(r, "baseRecipesCost")));
            Assert.Equal(108m, Round(Dec(r, "totalCost")));
            var codes = r.GetProperty("costWarnings").EnumerateArray().Select(x => x.GetProperty("code").GetString()).ToList();
            Assert.Contains("UnknownUnit", codes);
            Assert.Contains("UnitMismatch", codes);
            Assert.Contains("ZeroPrice", codes);
            Assert.Contains("UnknownIngredientUnit", codes);
            Assert.Contains("ApproximateConversion", codes);
            Assert.Contains("SubRecipeUnitIgnored", codes);

            // A correct recipe has no warnings, and reading costs never writes anything.
            Assert.Empty((await RecipesById(user))[w.A].GetProperty("costWarnings").EnumerateArray());
            await user.GetJsonAsync("/api/products");
            Assert.Equal(before, await SnapshotAsync(app, user.InternalId));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task CycleInStoredData_IsReported_NotFollowedForever(TestDatabase database)
        {
            // The API refuses cycles (P3); this simulates one already in the database.
            var (app, user, w) = await SetupAsync(database);
            await using (var db = app.CreateUnscopedContext())
            {
                db.RecipeItems.Add(new RecipeItem { ComposingRecipeId = w.C, BaseRecipeId = w.A, Quantity = 1, Unit = UnitOfMeasure.Unit });
                await db.SaveChangesAsync();
            }

            var recipes = await RecipesById(user);
            Assert.Contains(recipes[w.A].GetProperty("costWarnings").EnumerateArray(), x => x.GetProperty("code").GetString() == "Cycle");
            Assert.Equal(HttpStatusCode.OK, (await user.SendAsync(HttpMethod.Get, $"/api/products/{w.Single}")).StatusCode);
        }

        // ================================================================== helpers

        private async Task<(TenantTestApp App, TestUser User, Bakery World)> SetupAsync(TestDatabase database)
        {
            var (app, _) = await _apps.GetAsync(database);
            var user = await app.CreateUserAsync("baker");
            return (app, user, await Bakery.SeedAsync(app, user.InternalId));
        }

        private static async Task<Dictionary<int, JsonElement>> RecipesById(TestUser user) =>
            (await user.GetJsonAsync("/api/recipe")).EnumerateArray().ToDictionary(r => r.GetProperty("id").GetInt32());

        private static async Task<JsonElement> PreviewAsync(TestUser user, object body)
        {
            var response = await user.SendAsync(HttpMethod.Post, "/api/products/cost-preview", JsonContent.Create(body));
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return await TenantApi.ReadJson(response);
        }

        private static decimal Dec(JsonElement e, string name) => e.GetProperty(name).GetDecimal();

        private static decimal Round(decimal value) => Math.Round(value, 10);

        private static void AssertRecipe(JsonElement r, decimal ingredients, decimal subRecipes, decimal labor, decimal overhead, decimal total, decimal perUnit)
        {
            Assert.Equal(ingredients, Round(Dec(r, "ingredientsCost")));
            Assert.Equal(subRecipes, Round(Dec(r, "baseRecipesCost")));
            Assert.Equal(labor, Round(Dec(r, "laborCost")));
            Assert.Equal(overhead, Round(Dec(r, "overheadCost")));
            Assert.Equal(total, Round(Dec(r, "totalCost")));
            Assert.Equal(perUnit, Round(Dec(r, "costPerUnit")));
        }

        private static void AssertProductAddsUp(JsonElement p)
        {
            var sum = Dec(p, "recipeIngredientsCost") + Dec(p, "recipeLaborCost") + Dec(p, "recipeOverheadCost")
                      + Dec(p, "packagingCost") + Dec(p, "packagingLaborCost") + Dec(p, "packagingOverheadCost");
            Assert.Equal(Round(Dec(p, "totalCost")), Round(sum));
        }

        /// <summary>Every cost input of one user, to prove that calculating costs changes nothing.</summary>
        private static async Task<string> SnapshotAsync(TenantTestApp app, int userId)
        {
            await using var db = app.CreateUnscopedContext();
            var data = new
            {
                Ingredients = await db.Ingredients.Where(i => i.UserId == userId).OrderBy(i => i.Id).Select(i => new { i.Id, i.PricePerKg, i.Unit }).ToListAsync(),
                Lines = await db.RecipeIngredients.Where(l => l.Recipe!.UserId == userId).OrderBy(l => l.Id).Select(l => new { l.Id, l.Quantity, l.Unit }).ToListAsync(),
                Subs = await db.RecipeItems.Where(l => l.ComposingRecipe!.UserId == userId).OrderBy(l => l.Id).Select(l => new { l.Id, l.Quantity, l.Unit }).ToListAsync(),
                Labor = await db.LaborSettings.Where(l => l.UserId == userId).Select(l => new { l.DesiredMonthlySalary, l.WorkingDaysPerMonth, l.WorkingHoursPerDay }).ToListAsync(),
                Overhead = await db.OverheadItems.Where(o => o.UserId == userId).OrderBy(o => o.Id).Select(o => new { o.MonthlyCost, o.IsActive }).ToListAsync(),
                Prices = await db.Products.Where(p => p.UserId == userId).OrderBy(p => p.Id).Select(p => new { p.ManualSellingPrice, p.ProfitMarginPercent }).ToListAsync(),
            };
            return JsonSerializer.Serialize(data);
        }
    }

    /// <summary>
    /// A small bakery with hand-calculated costs.
    ///   Labor: 4000 / (20 days x 4 hours) = 50 per hour.  Overhead: 300 active (+60 inactive) per month
    ///   -> 10 per recipe batch (300 / 30), 3.75 per packaging hour (300 / 80).
    ///   C (5 units):  X 500 g (20/kg) = 10, prep 6 min = 5, overhead 10             -> 25, 5 per unit
    ///   B (4 units):  Y 1 kg (10/kg) = 10, 2 x C = 10, prep 12 min = 10, overhead 10 -> 40, 10 per unit
    ///   A (1 unit):   Z 250 g (8/kg) = 2, 2 x B = 20, 1 x C = 5, overhead 10         -> 37
    ///   Single: 2 x A = 74, packaging 1.50, extra 2 x 0.25, 12 min: labor 10 + overhead 0.75 -> 86.75
    ///   Box:    1 x A + 3 x B = 67, extra packaging 4 x 0.25 = 1                             -> 68.00
    /// </summary>
    public sealed record Bakery(int Flour, int A, int B, int C, int Packaging, int Sticker, int Single, int Box)
    {
        public static async Task<Bakery> SeedAsync(TenantTestApp app, int userId, decimal salary = 4000m, decimal overhead = 300m)
        {
            await using var db = app.CreateUnscopedContext();
            // Every purchase is reviewed as "price includes VAT" (A3), so these costing tests carry no VAT warnings;
            // without a business VAT status the prices are used exactly as entered either way.
            const PurchaseVatTreatment Incl = PurchaseVatTreatment.IncludesVat;
            var x = new Ingredient { Name = "X", PricePerKg = 20, Unit = UnitOfMeasure.Kilogram, UserId = userId, PurchaseVatTreatment = Incl };
            var y = new Ingredient { Name = "Y", PricePerKg = 10, Unit = UnitOfMeasure.Kilogram, UserId = userId, PurchaseVatTreatment = Incl };
            var z = new Ingredient { Name = "Z", PricePerKg = 8, Unit = UnitOfMeasure.Kilogram, UserId = userId, PurchaseVatTreatment = Incl };
            var box = new Packaging { Name = "box", Cost = 1.5m, UserId = userId, PurchaseVatTreatment = Incl };
            var sticker = new Packaging { Name = "sticker", Cost = 0.25m, UserId = userId, PurchaseVatTreatment = Incl };
            db.AddRange(x, y, z, box, sticker,
                new LaborSettings { DesiredMonthlySalary = salary, WorkingDaysPerMonth = 20, WorkingHoursPerDay = 4, UserId = userId },
                new OverheadItem { Name = "rent", MonthlyCost = overhead, IsActive = true, UserId = userId, PurchaseVatTreatment = Incl },
                new OverheadItem { Name = "old", MonthlyCost = 60, IsActive = false, UserId = userId, PurchaseVatTreatment = Incl });
            await db.SaveChangesAsync();

            var c = new Recipe { Name = "C", OutputUnits = 5, PrepTime = 6, UserId = userId,
                Ingredients = { new RecipeIngredient { IngredientId = x.Id, Quantity = 500, Unit = (int)UnitOfMeasure.Gram } } };
            db.Recipes.Add(c);
            await db.SaveChangesAsync();
            var b = new Recipe { Name = "B", OutputUnits = 4, PrepTime = 12, UserId = userId,
                Ingredients = { new RecipeIngredient { IngredientId = y.Id, Quantity = 1, Unit = (int)UnitOfMeasure.Kilogram } },
                BaseRecipes = { new RecipeItem { BaseRecipeId = c.Id, Quantity = 2, Unit = UnitOfMeasure.Unit } } };
            db.Recipes.Add(b);
            await db.SaveChangesAsync();
            var a = new Recipe { Name = "A", OutputUnits = 1, UserId = userId,
                Ingredients = { new RecipeIngredient { IngredientId = z.Id, Quantity = 250, Unit = (int)UnitOfMeasure.Gram } },
                BaseRecipes =
                {
                    new RecipeItem { BaseRecipeId = b.Id, Quantity = 2, Unit = UnitOfMeasure.Unit },
                    new RecipeItem { BaseRecipeId = c.Id, Quantity = 1, Unit = UnitOfMeasure.Unit },
                } };
            db.Recipes.Add(a);
            await db.SaveChangesAsync();

            var single = new Product { Name = "single", ProductType = ProductType.Single, RecipeId = a.Id, UnitConversionRate = 2,
                PackagingId = box.Id, PackagingTimeMinutes = 12, ProfitMarginPercent = 0.2m, UserId = userId,
                AdditionalPackaging = { new ProductAdditionalPackaging { PackagingId = sticker.Id, Quantity = 2 } } };
            var gift = new Product { Name = "box", ProductType = ProductType.Package, ProfitMarginPercent = 0.2m, UserId = userId,
                PackageItems = { new PackageItem { RecipeId = a.Id, Quantity = 1 }, new PackageItem { RecipeId = b.Id, Quantity = 3 } },
                AdditionalPackaging = { new ProductAdditionalPackaging { PackagingId = sticker.Id, Quantity = 4 } } };
            db.Products.AddRange(single, gift);
            await db.SaveChangesAsync();
            return new Bakery(x.Id, a.Id, b.Id, c.Id, box.Id, sticker.Id, single.Id, gift.Id);
        }
    }
}
