using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Tests.Costing;
using Server.Tests.Tenancy;

namespace Server.Tests.Pricing
{
    /// <summary>
    /// Phase A3 through the real API (in-memory and temporary PostgreSQL built by the migrations, including M2).
    /// The seeded bakery (see <see cref="Bakery"/>): ingredient X costs 20/kg and C uses 500 g of it, so C's own
    /// ingredients cost 10 per batch; the single product costs 86.75 and the box 68.00 with every price as entered.
    /// </summary>
    public class PurchaseVatApiTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public PurchaseVatApiTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        // ================================================================== costs everywhere

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task UnreviewedPurchases_KeepTheirEnteredPrices_AndAreFlagged(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 1);
            var reviewed = await CostsAsync(user, w);
            await SetVatAsync(app, w.Flour, null, null);   // as every existing record after M2
            await SetPackagingVatAsync(app, w.Sticker, null, null);

            var unknown = await CostsAsync(user, w);
            Assert.Equal(reviewed, unknown with { Warnings = reviewed.Warnings });   // identical costs
            Assert.Contains("PurchaseVatUnknown", unknown.Warnings);
            var pricing = (await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing");
            Assert.Contains(pricing.GetProperty("issues").EnumerateArray(),
                i => i.GetProperty("code").GetString() == "PurchaseVatNotVerified" && i.GetProperty("message").GetString()!.StartsWith("2 "));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Exempt_PriceExcludingVat_CostsMore_InRecipesProductsBoxesPreviewAndProfit(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 1);
            await SetProductPriceAsync(app, w.Single, 120m);
            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.ExcludesVat, null);   // X: 20 + 18% = 23.60/kg

            var c = await CostsAsync(user, w);
            Assert.Equal(11.8m, c.CIngredients);        // 0.5 kg x 23.60 (was 10)
            Assert.Equal(88.19m, c.Single);             // 86.75 + 2 x (2 x 0.18 + 1 x 0.36) = 86.75 + 1.44
            Assert.Equal(69.26m, c.Box);                // 68 + 1 x 0.72 + 3 x 0.18
            Assert.Equal(c.Single, c.Preview);          // the dialog preview uses the same effective cost
            Assert.Equal(120m - 88.19m, c.Profit);      // profit from the effective cost (exempt: no VAT on the price)
            Assert.DoesNotContain("PurchaseVatUnknown", c.Warnings);
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Exempt_OverheadAndPackagingExcludingVat_CostMore(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 1);
            await using (var db = app.CreateUnscopedContext())
            {
                var rent = await db.OverheadItems.SingleAsync(o => o.UserId == user.InternalId && o.Name == "rent");   // 300 / month
                rent.PurchaseVatTreatment = PurchaseVatTreatment.ExcludesVat;
                await db.SaveChangesAsync();
            }
            await SetPackagingVatAsync(app, w.Sticker, PurchaseVatTreatment.ExcludesVat, null);   // 0.25 -> 0.295

            var recipes = (await user.GetJsonAsync("/api/recipe")).EnumerateArray().ToDictionary(r => r.GetProperty("id").GetInt32());
            Assert.Equal(11.8m, Math.Round(recipes[w.C].GetProperty("overheadCost").GetDecimal(), 6));   // 354 / 30 per batch (was 10)
            var single = await user.GetJsonAsync($"/api/products/{w.Single}");
            Assert.Equal(2.09m, Math.Round(single.GetProperty("packagingCost").GetDecimal(), 6));          // 1.50 + 2 x 0.295
            Assert.Equal(0.885m, Math.Round(single.GetProperty("packagingOverheadCost").GetDecimal(), 6)); // 12 min x 354 / 80 h
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Registered_RemovesVatOnlyWhenMarkedDeductible(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 2);

            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.IncludesVat, true);
            Assert.Equal(Math.Round(0.5m * 16.949153m, 4), Math.Round((await CostsAsync(user, w)).CIngredients, 4));   // 20 / 1.18

            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.IncludesVat, false);
            Assert.Equal(10m, (await CostsAsync(user, w)).CIngredients);

            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.ExcludesVat, false);
            Assert.Equal(11.8m, (await CostsAsync(user, w)).CIngredients);

            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.IncludesVat, null);   // deductibility not answered
            var unanswered = await CostsAsync(user, w);
            Assert.Equal(10m, unanswered.CIngredients);                                    // never assumed
            Assert.Contains("InputVatDeductibilityUnknown", unanswered.Warnings);

            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.NoVat, null);
            Assert.Equal(10m, (await CostsAsync(user, w)).CIngredients);
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task WithoutBusinessVatStatus_PurchasePricesAreNotConverted(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: null);
            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.ExcludesVat, null);
            Assert.Equal(10m, (await CostsAsync(user, w)).CIngredients);
        }

        // ================================================================== saving single items

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task OlderClientsOmittingTheFields_CannotResetAReviewedTreatment(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 2);
            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.ExcludesVat, false);

            var put = await user.SendAsync(HttpMethod.Put, $"/api/ingredients/{w.Flour}", JsonContent.Create(new
            { id = w.Flour, name = "X", pricePerKg = 20m, stockQuantity = 0, unit = 1, stockUnit = 1, category = 0 }));
            Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);
            await using var db = app.CreateUnscopedContext();
            var row = await db.Ingredients.AsNoTracking().SingleAsync(i => i.Id == w.Flour);
            Assert.Equal((PurchaseVatTreatment.ExcludesVat, false), (row.PurchaseVatTreatment!.Value, row.InputVatDeductible!.Value));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task SavingAnItem_WithItsVatTreatment_AndRejectingContradictions(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 1);
            var created = await TenantApi.ReadJson(await user.SendAsync(HttpMethod.Post, "/api/packaging",
                JsonContent.Create(new { name = "ribbon", cost = 3m, stockUnits = 1, purchaseVatTreatment = 2 })));
            Assert.Equal(2, created.GetProperty("purchaseVatTreatment").GetInt32());

            var before = await SnapshotAsync(app, user.InternalId);
            foreach (var body in new object[]
            {
                new { name = "x", monthlyCost = 10m, isActive = true, purchaseVatTreatment = 9 },                              // unknown value
                new { name = "x", monthlyCost = 10m, isActive = true, purchaseVatTreatment = 1, inputVatDeductible = true },   // exempt cannot deduct
                new { name = "x", monthlyCost = 10m, isActive = true, purchaseVatTreatment = 3, inputVatDeductible = false },  // no VAT, nothing to deduct
                new { name = "x", monthlyCost = 10m, isActive = true, inputVatDeductible = false },                             // deductibility without treatment
            })
            {
                var r = await user.SendAsync(HttpMethod.Post, "/api/overheaditem", JsonContent.Create(body));
                Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
            }
            var bad = await user.SendAsync(HttpMethod.Put, $"/api/ingredients/{w.Flour}", JsonContent.Create(new
            { id = w.Flour, name = "X", pricePerKg = 20m, unit = 1, stockUnit = 1, purchaseVatTreatment = 3, inputVatDeductible = true }));
            Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
            Assert.Equal(before, await SnapshotAsync(app, user.InternalId));
        }

        // ================================================================== bulk review

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Review_ListsOnlyMyItems_WithEnteredAndEffectivePrices(TestDatabase database)
        {
            var (app, alice, w) = await SetupAsync(database, vatStatus: 1);
            var bob = await app.CreateUserAsync("bob");
            await Bakery.SeedAsync(app, bob.InternalId);
            await SetVatAsync(app, w.Flour, PurchaseVatTreatment.ExcludesVat, null);
            await SetPackagingVatAsync(app, w.Sticker, null, null);

            var review = await alice.GetJsonAsync("/api/purchase-vat/review");
            var items = review.GetProperty("items").EnumerateArray().ToList();
            Assert.Equal(3 + 2 + 2, items.Count);   // Alice's 3 ingredients, 2 packaging, 2 overhead - none of Bob's
            var flour = items.Single(i => i.GetProperty("kind").GetString() == "ingredient" && i.GetProperty("id").GetInt32() == w.Flour);
            Assert.Equal((20m, 23.6m), (flour.GetProperty("enteredPrice").GetDecimal(), flour.GetProperty("effectivePrice").GetDecimal()));
            Assert.Equal(1, review.GetProperty("unreviewedCount").GetInt32());   // the sticker
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ReviewPreview_ShowsResultingCosts_WithoutSaving(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database, vatStatus: 1);
            await SetVatAsync(app, w.Flour, null, null);
            var before = await SnapshotAsync(app, user.InternalId);

            var r = await user.SendAsync(HttpMethod.Post, "/api/purchase-vat/review/preview", JsonContent.Create(new
            { items = new[] { new { kind = "ingredient", id = w.Flour, purchaseVatTreatment = 2 } } }));
            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            var item = (await TenantApi.ReadJson(r)).GetProperty("items")[0];
            Assert.Equal(23.6m, item.GetProperty("effectivePrice").GetDecimal());
            Assert.Equal(before, await SnapshotAsync(app, user.InternalId));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ReviewApply_SavesOnlySelectedItems_AfterConfirmation_AllOrNothing(TestDatabase database)
        {
            var (app, alice, w) = await SetupAsync(database, vatStatus: 1);
            var bob = await app.CreateUserAsync("bob");
            var bobs = await Bakery.SeedAsync(app, bob.InternalId);
            await SetVatAsync(app, w.Flour, null, null);
            await SetPackagingVatAsync(app, w.Sticker, null, null);
            await SetPackagingVatAsync(app, w.Packaging, null, null);
            var before = await SnapshotAsync(app, alice.InternalId);

            async Task<HttpStatusCode> Apply(object body) =>
                (await alice.SendAsync(HttpMethod.Put, "/api/purchase-vat/review", JsonContent.Create(body))).StatusCode;
            var flour = new { kind = "ingredient", id = w.Flour, purchaseVatTreatment = (int?)1, inputVatDeductible = (bool?)null };

            Assert.Equal(HttpStatusCode.BadRequest, await Apply(new { items = new[] { flour } }));                    // not confirmed
            Assert.Equal(HttpStatusCode.BadRequest, await Apply(new { confirmed = true, items = new[] { flour,         // Bob's item
                new { kind = "ingredient", id = bobs.Flour, purchaseVatTreatment = (int?)1, inputVatDeductible = (bool?)null } } }));
            Assert.Equal(HttpStatusCode.BadRequest, await Apply(new { confirmed = true, items = new[] { flour,         // a contradiction
                new { kind = "packaging", id = w.Sticker, purchaseVatTreatment = (int?)3, inputVatDeductible = (bool?)false } } }));
            Assert.Equal(HttpStatusCode.BadRequest, await Apply(new { confirmed = true, items = new[] {                // no treatment chosen
                new { kind = "packaging", id = w.Sticker, purchaseVatTreatment = (int?)null, inputVatDeductible = (bool?)null } } }));
            Assert.Equal(before, await SnapshotAsync(app, alice.InternalId));                                           // nothing written

            Assert.Equal(HttpStatusCode.OK, await Apply(new { confirmed = true, items = new[] { flour,
                new { kind = "packaging", id = w.Sticker, purchaseVatTreatment = (int?)3, inputVatDeductible = (bool?)null } } }));
            await using var db = app.CreateUnscopedContext();
            Assert.Equal(PurchaseVatTreatment.IncludesVat, (await db.Ingredients.SingleAsync(i => i.Id == w.Flour)).PurchaseVatTreatment);
            Assert.Equal(PurchaseVatTreatment.NoVat, (await db.Packagings.SingleAsync(p => p.Id == w.Sticker)).PurchaseVatTreatment);
            Assert.Null((await db.Packagings.SingleAsync(p => p.Id == w.Packaging)).PurchaseVatTreatment);           // not selected: untouched
            Assert.Equal(PurchaseVatTreatment.IncludesVat, (await db.Ingredients.SingleAsync(i => i.Id == bobs.Flour)).PurchaseVatTreatment);
            // prices are never changed by a review
            Assert.Equal(20m, (await db.Ingredients.SingleAsync(i => i.Id == w.Flour)).PricePerKg);
        }

        // ================================================================== helpers

        private sealed record Costs(decimal CIngredients, decimal Single, decimal Box, decimal Preview, decimal? Profit, string Warnings);

        private async Task<(TenantTestApp App, TestUser User, Bakery World)> SetupAsync(TestDatabase database, int? vatStatus)
        {
            var (app, _) = await _apps.GetAsync(database);
            var user = await app.CreateUserAsync("buyer");
            var world = await Bakery.SeedAsync(app, user.InternalId);
            if (vatStatus != null)
            {
                var r = await user.SendAsync(HttpMethod.Put, "/api/business-settings", JsonContent.Create(new { vatStatus, defaultMarkupPercent = 0.15m }));
                Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            }
            return (app, user, world);
        }

        private static async Task<Costs> CostsAsync(TestUser user, Bakery w)
        {
            var recipes = (await user.GetJsonAsync("/api/recipe")).EnumerateArray().ToDictionary(r => r.GetProperty("id").GetInt32());
            var single = await user.GetJsonAsync($"/api/products/{w.Single}");
            var box = await user.GetJsonAsync($"/api/products/{w.Box}");
            var preview = await TenantApi.ReadJson(await user.SendAsync(HttpMethod.Post, "/api/products/cost-preview", JsonContent.Create(new
            {
                productType = 0, recipeId = w.A, recipeUnits = 2, packagingId = w.Packaging, packagingTimeMinutes = 12,
                additionalPackaging = new[] { new { packagingId = w.Sticker, quantity = 2 } },
            })));
            var profit = single.GetProperty("pricing").GetProperty("profit");
            var warnings = string.Join(",", recipes.Values.SelectMany(r => r.GetProperty("costWarnings").EnumerateArray())
                .Concat(single.GetProperty("costWarnings").EnumerateArray()).Select(x => x.GetProperty("code").GetString()).Distinct().OrderBy(x => x));
            static decimal R(decimal v) => Math.Round(v, 6);
            return new Costs(R(recipes[w.C].GetProperty("ingredientsCost").GetDecimal()), Math.Round(single.GetProperty("totalCost").GetDecimal(), 2),
                Math.Round(box.GetProperty("totalCost").GetDecimal(), 2), Math.Round(preview.GetProperty("totalCost").GetDecimal(), 2),
                profit.ValueKind == JsonValueKind.Null ? null : profit.GetDecimal(), warnings);
        }

        private static async Task SetVatAsync(TenantTestApp app, int ingredientId, PurchaseVatTreatment? t, bool? deductible)
        {
            await using var db = app.CreateUnscopedContext();
            var row = await db.Ingredients.SingleAsync(i => i.Id == ingredientId);
            (row.PurchaseVatTreatment, row.InputVatDeductible) = (t, deductible);
            await db.SaveChangesAsync();
        }

        private static async Task SetPackagingVatAsync(TenantTestApp app, int packagingId, PurchaseVatTreatment? t, bool? deductible)
        {
            await using var db = app.CreateUnscopedContext();
            var row = await db.Packagings.SingleAsync(p => p.Id == packagingId);
            (row.PurchaseVatTreatment, row.InputVatDeductible) = (t, deductible);
            await db.SaveChangesAsync();
        }

        private static async Task SetProductPriceAsync(TenantTestApp app, int productId, decimal finalPrice)
        {
            await using var db = app.CreateUnscopedContext();
            var p = await db.Products.SingleAsync(x => x.Id == productId);
            (p.PricingMode, p.ManualSellingPrice) = (PricingMode.Manual, finalPrice);
            await db.SaveChangesAsync();
        }

        /// <summary>Every price and VAT field of a user's purchases and products.</summary>
        private static async Task<string> SnapshotAsync(TenantTestApp app, int userId)
        {
            await using var db = app.CreateUnscopedContext();
            return JsonSerializer.Serialize(new
            {
                I = await db.Ingredients.Where(i => i.UserId == userId).OrderBy(i => i.Id).Select(i => new { i.Id, i.Name, i.PricePerKg, i.PurchaseVatTreatment, i.InputVatDeductible }).ToListAsync(),
                P = await db.Packagings.Where(p => p.UserId == userId).OrderBy(p => p.Id).Select(p => new { p.Id, p.Name, p.Cost, p.PurchaseVatTreatment, p.InputVatDeductible }).ToListAsync(),
                O = await db.OverheadItems.Where(o => o.UserId == userId).OrderBy(o => o.Id).Select(o => new { o.Id, o.Name, o.MonthlyCost, o.PurchaseVatTreatment, o.InputVatDeductible }).ToListAsync(),
                Products = await db.Products.Where(p => p.UserId == userId).OrderBy(p => p.Id).Select(p => new { p.Id, p.ManualSellingPrice, p.PricingMode }).ToListAsync(),
            });
        }
    }
}
