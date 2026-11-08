using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Server.Controllers;
using Server.Models;
using Server.Services;
using Server.Services.Costing;
using Server.Tests.Tenancy;
using Server.Validation;

namespace Server.Tests.Recipes
{
    // ====================================================================== unit rules (R3)

    public class RecipeUnitsTests
    {
        [Theory]
        // exact (same kind)
        [InlineData(UnitOfMeasure.Gram, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.Exact)]
        [InlineData(UnitOfMeasure.Kilogram, UnitOfMeasure.Gram, RecipeUnits.Conversion.Exact)]
        [InlineData(UnitOfMeasure.Milliliter, UnitOfMeasure.Liter, RecipeUnits.Conversion.Exact)]
        [InlineData(UnitOfMeasure.Teaspoon, UnitOfMeasure.Liter, RecipeUnits.Conversion.Exact)]     // 5 ml, metric
        [InlineData(UnitOfMeasure.Tablespoon, UnitOfMeasure.Liter, RecipeUnits.Conversion.Exact)]   // 15 ml, metric
        [InlineData(UnitOfMeasure.Dozen, UnitOfMeasure.Unit, RecipeUnits.Conversion.Exact)]
        [InlineData(UnitOfMeasure.Package, UnitOfMeasure.Package, RecipeUnits.Conversion.Exact)]
        // never a universal culinary factor
        [InlineData(UnitOfMeasure.Tablespoon, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.WeightVersusVolume)]
        [InlineData(UnitOfMeasure.Teaspoon, UnitOfMeasure.Gram, RecipeUnits.Conversion.WeightVersusVolume)]
        [InlineData(UnitOfMeasure.Milliliter, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.WeightVersusVolume)]
        [InlineData(UnitOfMeasure.Gram, UnitOfMeasure.Liter, RecipeUnits.Conversion.WeightVersusVolume)]
        [InlineData(UnitOfMeasure.Cup, UnitOfMeasure.Liter, RecipeUnits.Conversion.CupSizeUndefined)]
        [InlineData(UnitOfMeasure.Cup, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.CupSizeUndefined)]
        [InlineData(UnitOfMeasure.Unit, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.CountVersusMeasure)]
        [InlineData(UnitOfMeasure.Gram, UnitOfMeasure.Unit, RecipeUnits.Conversion.CountVersusMeasure)]
        [InlineData(UnitOfMeasure.Unit, UnitOfMeasure.Package, RecipeUnits.Conversion.PackageSizeUndefined)]
        [InlineData(UnitOfMeasure.Package, UnitOfMeasure.Kilogram, RecipeUnits.Conversion.PackageSizeUndefined)]
        public void OnlyExactConversionsAreTrusted(UnitOfMeasure line, UnitOfMeasure price, RecipeUnits.Conversion expected)
        {
            Assert.Equal(expected, RecipeUnits.Check((int)line, price));
        }

        [Fact]
        public void UndefinedUnitsAreReported()
        {
            Assert.Equal(RecipeUnits.Conversion.UnknownLineUnit, RecipeUnits.Check(0, UnitOfMeasure.Kilogram));
            Assert.Equal(RecipeUnits.Conversion.UnknownPriceUnit, RecipeUnits.Check((int)UnitOfMeasure.Gram, (UnitOfMeasure)0));
        }

        [Theory]
        [InlineData(500, UnitOfMeasure.Liter, true)]       // the real case: meant 500 ml
        [InlineData(200, UnitOfMeasure.Kilogram, true)]    // meant 200 g
        [InlineData(20, UnitOfMeasure.Kilogram, true)]
        [InlineData(19.9, UnitOfMeasure.Kilogram, false)]
        [InlineData(500, UnitOfMeasure.Milliliter, false)]
        [InlineData(600, UnitOfMeasure.Gram, false)]
        [InlineData(600, UnitOfMeasure.Unit, true)]
        [InlineData(4, UnitOfMeasure.Unit, false)]
        public void SuspiciousQuantities(double quantity, UnitOfMeasure unit, bool expected)
        {
            Assert.Equal(expected, RecipeUnits.IsSuspicious((decimal)quantity, (int)unit));
        }

        [Fact]
        public void BlockingWarnings_AreExactlyTheUnreliableOnes()
        {
            Assert.True(CostWarning.ApproximateConversion(1, 1, "x").Blocking);
            Assert.True(CostWarning.SuspiciousQuantity(1, 1, "x", 500, 3).Blocking);
            Assert.True(CostWarning.ZeroPrice(1, 1, "x").Blocking);
            Assert.True(CostWarning.NoIngredients(1, "x").Blocking);
            Assert.False(CostWarning.PurchaseVatUnknown("חומר הגלם", "x").Blocking);   // VAT behaviour unchanged
            Assert.False(CostWarning.NoLaborSettings().Blocking);
        }
    }

    // ====================================================================== save validation through the controller (R2)

    public class RecipeSaveGuardTests : IAsyncLifetime
    {
        private readonly GuardFakeService _service = new();
        private WebApplication _app = null!;
        private HttpClient _client = null!;

        public async Task InitializeAsync()
        {
            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseTestServer();
            builder.Services.AddSingleton<IRecipeService>(_service);
            builder.Services.AddControllers().AddApplicationPart(typeof(RecipeController).Assembly)
                .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
            _app = builder.Build();
            _app.MapControllers();
            await _app.StartAsync();
            _client = _app.GetTestClient();
        }

        public async Task DisposeAsync()
        {
            _client.Dispose();
            await _app.DisposeAsync();
        }

        private static MultipartFormDataContent Form(params (string IngredientId, string Quantity, string Unit)[] lines)
        {
            var form = new MultipartFormDataContent { { new StringContent("R"), "Name" }, { new StringContent("1"), "OutputUnits" } };
            for (var i = 0; i < lines.Length; i++)
            {
                form.Add(new StringContent(lines[i].IngredientId), $"Ingredients[{i}].IngredientId");
                form.Add(new StringContent(lines[i].Quantity), $"Ingredients[{i}].Quantity");
                form.Add(new StringContent(lines[i].Unit), $"Ingredients[{i}].Unit");
            }
            return form;
        }

        private static async Task<string> Code(HttpResponseMessage response) =>
            JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.GetProperty("code").GetString()!;

        private void StoreRecipeWithLines(int count)
        {
            var stored = new Recipe { Id = 5, Name = "כדורי שוקולד", OutputUnits = 70 };
            for (var i = 0; i < count; i++) stored.Ingredients.Add(new RecipeIngredient { Id = 200 + i, IngredientId = 3, Quantity = 60, Unit = 2 });
            _service.Stored = stored;
        }

        [Fact]
        public async Task Update_WithNoIngredients_ForRecipeThatHasSome_IsRejected_AndNothingIsSaved()
        {
            // The data-loss bug: the edit form sent no lines and the server replaced 5 lines with none.
            StoreRecipeWithLines(5);
            var response = await _client.PutAsync("/api/recipe/5", Form());
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("IngredientsWouldBeRemoved", await Code(response));
            Assert.Empty(_service.Updated);
        }

        [Fact]
        public async Task Update_WithNoIngredients_IsAllowed_OnlyWithExplicitConfirmation()
        {
            StoreRecipeWithLines(5);
            var form = Form();
            form.Add(new StringContent("true"), "ConfirmRemoveAllIngredients");
            var response = await _client.PutAsync("/api/recipe/5", form);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Single(_service.Updated);
        }

        [Fact]
        public async Task Update_OfRecipeWithoutLines_NeedsNoConfirmation()
        {
            StoreRecipeWithLines(0);
            Assert.Equal(HttpStatusCode.NoContent, (await _client.PutAsync("/api/recipe/5", Form())).StatusCode);
        }

        [Theory]
        [InlineData("3", "0", "2")]
        [InlineData("3", "-5", "2")]
        [InlineData("0", "60", "2")]
        public async Task InvalidLines_AreRejected_NeverSkippedOrDefaulted(string ingredientId, string quantity, string unit)
        {
            StoreRecipeWithLines(1);
            var put = await _client.PutAsync("/api/recipe/5", Form(("47", "500", "2"), (ingredientId, quantity, unit)));
            Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
            Assert.Equal("InvalidLines", await Code(put));
            var post = await _client.PostAsync("/api/recipe", Form((ingredientId, quantity, unit)));
            Assert.Equal(HttpStatusCode.BadRequest, post.StatusCode);
            Assert.Empty(_service.Updated);
            Assert.Empty(_service.Created);
        }

        [Fact]
        public async Task SuspiciousQuantity_NeedsExplicitConfirmation_AndIsSavedExactlyAsEntered()
        {
            StoreRecipeWithLines(1);
            var rejected = await _client.PutAsync("/api/recipe/5", Form(("49", "500", "3")));   // 500 ליטר
            Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
            Assert.Equal("SuspiciousQuantities", await Code(rejected));
            Assert.Empty(_service.Updated);

            var form = Form(("49", "500", "3"));
            form.Add(new StringContent("true"), "ConfirmSuspiciousQuantities");
            Assert.Equal(HttpStatusCode.NoContent, (await _client.PutAsync("/api/recipe/5", form)).StatusCode);
            var saved = Assert.Single(Assert.Single(_service.Updated).Recipe.Ingredients);
            Assert.Equal(500m, saved.Quantity);     // never corrected automatically
            Assert.Equal(3, saved.Unit);
        }

        [Fact]
        public async Task DuplicateIngredientLines_AreAccepted()
        {
            StoreRecipeWithLines(1);
            var response = await _client.PutAsync("/api/recipe/5", Form(("2", "100", "2"), ("2", "30", "2")));
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Equal(2, Assert.Single(_service.Updated).Recipe.Ingredients.Count);
        }

        private sealed class GuardFakeService : IRecipeService
        {
            public Recipe? Stored { get; set; }
            public List<Recipe> Created { get; } = new();
            public List<(int Id, Recipe Recipe)> Updated { get; } = new();
            public Task<IEnumerable<Recipe>> GetAllAsync() => Task.FromResult<IEnumerable<Recipe>>(Stored != null ? new[] { Stored } : Array.Empty<Recipe>());
            public Task<Recipe?> GetByIdAsync(int id) => Task.FromResult(Stored?.Id == id ? Stored : null);
            public Task<Recipe> CreateAsync(Recipe recipe) { recipe.Id = 100; Created.Add(recipe); return Task.FromResult(recipe); }
            public Task<bool> UpdateAsync(int id, Recipe recipe) { Updated.Add((id, recipe)); return Task.FromResult(Stored?.Id == id); }
            public Task<bool> DeleteAsync(int id) => Task.FromResult(true);
        }
    }

    // ====================================================================== real API: costs, blocking and propagation (R3)

    public class RecipeCostSafetyTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public RecipeCostSafetyTests(TenantAppsFixture apps) => _apps = apps;
        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        private sealed record World(Dictionary<string, int> Recipes, Dictionary<string, int> Products, int Cream, int Flour);

        /// <summary>Exempt business (no VAT on sales), every purchase "price includes VAT": prices are used as entered.</summary>
        private static async Task<World> SeedAsync(TenantTestApp app, int userId)
        {
            await using var db = app.CreateUnscopedContext();
            const PurchaseVatTreatment Incl = PurchaseVatTreatment.IncludesVat;
            Ingredient Ing(string name, decimal price, UnitOfMeasure unit) =>
                new() { Name = name, PricePerKg = price, Unit = unit, UserId = userId, PurchaseVatTreatment = Incl };
            var flour = Ing("קמח", 10, UnitOfMeasure.Kilogram);
            var cream = Ing("שמנת מתוקה", 30, UnitOfMeasure.Liter);
            var coffee = Ing("קפה", 70, UnitOfMeasure.Kilogram);
            var egg = Ing("ביצה", 1.5m, UnitOfMeasure.Unit);
            var boxed = Ing("קרם בחבילה", 20, UnitOfMeasure.Package);
            var free = Ing("ללא מחיר", 0, UnitOfMeasure.Kilogram);
            db.AddRange(flour, cream, coffee, egg, boxed, free,
                new BusinessSettings { UserId = userId, VatStatus = VatStatus.Exempt, DefaultMarkupPercent = 0.5m });
            await db.SaveChangesAsync();

            RecipeIngredient L(Ingredient i, decimal q, UnitOfMeasure u) => new() { IngredientId = i.Id, Quantity = q, Unit = (int)u };
            Recipe R(string name, params RecipeIngredient[] lines)
            {
                var r = new Recipe { Name = name, OutputUnits = 1, UserId = userId };
                r.Ingredients.AddRange(lines);
                return r;
            }
            var recipes = new Dictionary<string, Recipe>
            {
                ["valid"] = R("valid", L(flour, 500, UnitOfMeasure.Gram), L(cream, 500, UnitOfMeasure.Milliliter), L(egg, 2, UnitOfMeasure.Unit)),
                ["duplicates"] = R("duplicates", L(flour, 200, UnitOfMeasure.Gram), L(flour, 300, UnitOfMeasure.Gram)),
                ["spoonVolume"] = R("spoonVolume", L(cream, 2, UnitOfMeasure.Tablespoon)),
                ["spoonOfWeighed"] = R("spoonOfWeighed", L(coffee, 1, UnitOfMeasure.Tablespoon)),
                ["cup"] = R("cup", L(cream, 1, UnitOfMeasure.Cup)),
                ["eggInGrams"] = R("eggInGrams", L(egg, 4, UnitOfMeasure.Gram)),
                ["packageAsUnits"] = R("packageAsUnits", L(boxed, 2, UnitOfMeasure.Unit)),
                ["zeroPrice"] = R("zeroPrice", L(free, 100, UnitOfMeasure.Gram)),
                ["cream500L"] = R("cream500L", L(cream, 500, UnitOfMeasure.Liter)),
                ["cream500ml"] = R("cream500ml", L(cream, 500, UnitOfMeasure.Milliliter)),
                ["noLines"] = R("noLines"),
            };
            db.Recipes.AddRange(recipes.Values);
            await db.SaveChangesAsync();
            var parent = new Recipe { Name = "parent", OutputUnits = 1, UserId = userId,
                Ingredients = { L(flour, 100, UnitOfMeasure.Gram) },
                BaseRecipes = { new RecipeItem { BaseRecipeId = recipes["spoonOfWeighed"].Id, Quantity = 1, Unit = UnitOfMeasure.Unit } } };
            db.Recipes.Add(parent);
            await db.SaveChangesAsync();
            recipes["parent"] = parent;

            Product P(string name, Recipe r, PricingMode? mode, decimal? stored) =>
                new() { Name = name, ProductType = ProductType.Single, RecipeId = r.Id, UnitConversionRate = 1, UserId = userId,
                        PricingMode = mode, ManualSellingPrice = stored, ProfitMarginPercent = 0.2m };
            var products = new Dictionary<string, Product>
            {
                ["autoValid"] = P("autoValid", recipes["valid"], PricingMode.Recommended, null),
                ["autoBlocked"] = P("autoBlocked", recipes["cream500L"], PricingMode.Recommended, null),
                ["percentBlocked"] = P("percentBlocked", recipes["parent"], PricingMode.Percentage, null),
                ["manualBlocked"] = P("manualBlocked", recipes["cream500L"], PricingMode.Manual, 45m),
                ["manualValid"] = P("manualValid", recipes["valid"], PricingMode.Manual, 45m),
                ["legacyStoredBlocked"] = P("legacyStoredBlocked", recipes["cream500L"], null, 50m),
                ["legacyNoPriceBlocked"] = P("legacyNoPriceBlocked", recipes["cream500L"], null, null),
            };
            db.Products.AddRange(products.Values);
            await db.SaveChangesAsync();
            return new World(recipes.ToDictionary(kv => kv.Key, kv => kv.Value.Id), products.ToDictionary(kv => kv.Key, kv => kv.Value.Id), cream.Id, flour.Id);
        }

        private async Task<(TenantTestApp App, TestUser User, World W)> SetupAsync(TestDatabase database)
        {
            var (app, _) = await _apps.GetAsync(database);
            var user = await app.CreateUserAsync("safety");
            return (app, user, await SeedAsync(app, user.InternalId));
        }

        private static async Task<Dictionary<int, JsonElement>> ById(TestUser user, string path) =>
            (await user.GetJsonAsync(path)).EnumerateArray().ToDictionary(r => r.GetProperty("id").GetInt32());

        private static string[] Codes(JsonElement e) =>
            e.GetProperty("costWarnings").EnumerateArray().Select(w => w.GetProperty("code").GetString()!).ToArray();

        private static bool AnyBlocking(JsonElement e) =>
            e.GetProperty("costWarnings").EnumerateArray().Any(w => w.GetProperty("blocking").GetBoolean());

        private static decimal? NullableDec(JsonElement e, string name) =>
            e.GetProperty(name).ValueKind == JsonValueKind.Null ? null : e.GetProperty(name).GetDecimal();

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ValidRecipes_KeepExactCosts_AndAreComplete(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var recipes = await ById(user, "/api/recipe");

            var valid = recipes[w.Recipes["valid"]];
            Assert.Equal("Complete", valid.GetProperty("costStatus").GetString());
            Assert.Equal(23m, valid.GetProperty("ingredientsCost").GetDecimal());     // 5 + 15 + 3
            Assert.False(AnyBlocking(valid));

            Assert.Equal(15m, recipes[w.Recipes["cream500ml"]].GetProperty("ingredientsCost").GetDecimal());  // 0.5 L x 30
            Assert.Equal(0.9m, recipes[w.Recipes["spoonVolume"]].GetProperty("ingredientsCost").GetDecimal()); // 2 x 15 ml x 30/L
            Assert.Equal("Complete", recipes[w.Recipes["spoonVolume"]].GetProperty("costStatus").GetString());

            var duplicates = recipes[w.Recipes["duplicates"]];
            Assert.Equal(2, duplicates.GetProperty("ingredients").GetArrayLength());
            Assert.Equal(5m, duplicates.GetProperty("ingredientsCost").GetDecimal());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task UnreliableLines_BlockTheCost_WithAClearReason(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var recipes = await ById(user, "/api/recipe");
            void Blocked(string recipe, string code)
            {
                var r = recipes[w.Recipes[recipe]];
                Assert.Equal("Blocked", r.GetProperty("costStatus").GetString());
                Assert.Contains(code, Codes(r));
            }
            Blocked("spoonOfWeighed", "ApproximateConversion");   // no universal grams per tablespoon
            Blocked("cup", "UnsupportedUnit");
            Blocked("eggInGrams", "UnitMismatch");
            Blocked("packageAsUnits", "UnsupportedUnit");
            Blocked("zeroPrice", "ZeroPrice");
            Blocked("cream500L", "SuspiciousQuantity");
            Blocked("noLines", "NoIngredients");
            Blocked("parent", "ApproximateConversion");             // propagated from the sub-recipe
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task BlockedCost_NeverProducesAProfitOrAutomaticPrice_ManualPricesStayExact(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var products = await ById(user, "/api/products");
            JsonElement Pricing(string name) => products[w.Products[name]].GetProperty("pricing");

            // valid cost: automatic price as before (23 x 1.5 = 34.5 -> whole shekel 35, exempt), profit calculated
            Assert.Equal("Complete", Pricing("autoValid").GetProperty("costStatus").GetString());
            Assert.Equal(35m, NullableDec(Pricing("autoValid"), "finalPrice"));
            Assert.Equal(45m, NullableDec(Pricing("manualValid"), "finalPrice"));
            Assert.Equal(22m, NullableDec(Pricing("manualValid"), "profit"));

            // 500 L of cream (cost 15,000): no automatic price, no profit, no production cost
            foreach (var name in new[] { "autoBlocked", "percentBlocked", "legacyNoPriceBlocked" })
            {
                Assert.Equal("Incomplete", Pricing(name).GetProperty("costStatus").GetString());
                Assert.Null(NullableDec(Pricing(name), "finalPrice"));
                Assert.Null(NullableDec(Pricing(name), "profit"));
                Assert.Null(NullableDec(Pricing(name), "productionCost"));
                Assert.Equal("Blocked", products[w.Products[name]].GetProperty("costStatus").GetString());
            }

            // a manually confirmed price is kept exactly; only the profit is withheld
            Assert.Equal(45m, NullableDec(Pricing("manualBlocked"), "finalPrice"));
            Assert.Null(NullableDec(Pricing("manualBlocked"), "profit"));

            // legacy stored price: displayed exactly as before (stored + legacy VAT), no profit claimed
            var legacy = products[w.Products["legacyStoredBlocked"]];
            Assert.Equal(50m * 1.17m, NullableDec(legacy.GetProperty("pricing"), "finalPrice"));
            Assert.Equal(50m * 1.17m, NullableDec(legacy, "sellingPriceWithVAT"));
            Assert.Null(NullableDec(legacy, "profitAmount"));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task EmptyUpdate_DoesNotDeleteStoredLines(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            var id = w.Recipes["valid"];
            var form = new MultipartFormDataContent { { new StringContent("valid"), "Name" }, { new StringContent("1"), "OutputUnits" } };
            var response = await user.SendAsync(HttpMethod.Put, $"/api/recipe/{id}", form);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            await using var db = app.CreateUnscopedContext();
            Assert.Equal(3, await db.RecipeIngredients.CountAsync(l => l.RecipeId == id));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task SavedLines_RoundTripExactly_IncludingDuplicates(TestDatabase database)
        {
            var (_, user, w) = await SetupAsync(database);
            var id = w.Recipes["duplicates"];
            var form = new MultipartFormDataContent { { new StringContent("duplicates"), "Name" }, { new StringContent("1"), "OutputUnits" } };
            (int Ing, string Q, int U)[] lines = { (w.Flour, "200", 2), (w.Flour, "300", 2), (w.Cream, "500", 4) };
            for (var i = 0; i < lines.Length; i++)
            {
                form.Add(new StringContent(lines[i].Ing.ToString()), $"Ingredients[{i}].IngredientId");
                form.Add(new StringContent(lines[i].Q), $"Ingredients[{i}].Quantity");
                form.Add(new StringContent(lines[i].U.ToString()), $"Ingredients[{i}].Unit");
            }
            Assert.Equal(HttpStatusCode.NoContent, (await user.SendAsync(HttpMethod.Put, $"/api/recipe/{id}", form)).StatusCode);

            var saved = (await ById(user, "/api/recipe"))[id].GetProperty("ingredients").EnumerateArray()
                .Select(l => (l.GetProperty("ingredientId").GetInt32(), l.GetProperty("quantity").GetDecimal(), l.GetProperty("unit").GetInt32()))
                .OrderBy(l => l.Item2).ToArray();
            Assert.Equal(new[] { (w.Flour, 200m, 2), (w.Flour, 300m, 2), (w.Cream, 500m, 4) }, saved);
        }
    }
}
