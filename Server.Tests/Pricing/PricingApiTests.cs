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
    /// Phase A2 through the real API (in-memory and temporary PostgreSQL built by the migrations, including M1).
    /// The seeded single product costs 86.75 (see <see cref="Bakery"/>). Prices are quoted for today (18% VAT).
    /// </summary>
    public class PricingApiTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public PricingApiTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        // ================================================================== business settings

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Settings_StartUnchosen_AreSavedPerUser_AndIsolated(TestDatabase database)
        {
            var (app, alice, _) = await SetupAsync(database);
            var bob = await app.CreateUserAsync("bob");

            var initial = await alice.GetJsonAsync("/api/business-settings");
            Assert.Equal(JsonValueKind.Null, initial.GetProperty("vatStatus").ValueKind);   // never assumed
            Assert.False(initial.GetProperty("isConfigured").GetBoolean());
            Assert.Equal(0.15m, initial.GetProperty("defaultMarkupPercent").GetDecimal());
            Assert.Equal(0.18m, initial.GetProperty("currentVatRate").GetDecimal());

            var saved = await alice.SendAsync(HttpMethod.Put, "/api/business-settings", JsonContent.Create(new { vatStatus = 1, defaultMarkupPercent = 0.2m }));
            Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
            var after = await alice.GetJsonAsync("/api/business-settings");
            Assert.Equal(1, after.GetProperty("vatStatus").GetInt32());
            Assert.Equal(0.2m, after.GetProperty("defaultMarkupPercent").GetDecimal());

            // saving again updates the same row (one row per user)
            await alice.SendAsync(HttpMethod.Put, "/api/business-settings", JsonContent.Create(new { vatStatus = 2, defaultMarkupPercent = 0.3m }));
            await using (var db = app.CreateUnscopedContext())
                Assert.Equal(1, await db.BusinessSettings.CountAsync(b => b.UserId == alice.InternalId));

            // Bob is not affected and cannot see Alice's settings
            var bobs = await bob.GetJsonAsync("/api/business-settings");
            Assert.Equal(JsonValueKind.Null, bobs.GetProperty("vatStatus").ValueKind);
            Assert.Equal(0.15m, bobs.GetProperty("defaultMarkupPercent").GetDecimal());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Settings_RejectInvalidValues_AndRequireSignIn(TestDatabase database)
        {
            var (app, user, _) = await SetupAsync(database);
            foreach (var body in new object[]
            {
                new { vatStatus = 9, defaultMarkupPercent = 0.15m },
                new { vatStatus = 1, defaultMarkupPercent = -0.1m },
                new { vatStatus = 1, defaultMarkupPercent = 11m },
                new { defaultMarkupPercent = 0.15m },
            })
                Assert.Equal(HttpStatusCode.BadRequest, (await user.SendAsync(HttpMethod.Put, "/api/business-settings", JsonContent.Create(body))).StatusCode);
            await using (var db = app.CreateUnscopedContext())
                Assert.Equal(0, await db.BusinessSettings.CountAsync(b => b.UserId == user.InternalId));

            var anonymous = app.CreateAnonymousClient();
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/business-settings")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PutAsJsonAsync("/api/business-settings", new { vatStatus = 1, defaultMarkupPercent = 0.15m })).StatusCode);
        }

        // ================================================================== legacy prices

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task LegacyProduct_ShowsExactlyThePreviousPrice_WhateverTheVatStatus(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetProductAsync(app, w.Single, mode: null, stored: 48m, markup: 0.1m);
            var before = await RowsAsync(app, user.InternalId);

            foreach (var status in new int?[] { null, 1, 2 })
            {
                if (status != null) await SaveSettingsAsync(user, status.Value);
                var p = await user.GetJsonAsync($"/api/products/{w.Single}");
                // identical to the API before A2: stored + 17%, profit = stored - cost
                Assert.Equal(56.16m, p.GetProperty("sellingPriceWithVAT").GetDecimal());
                Assert.Equal(48m, p.GetProperty("sellingPriceBeforeVAT").GetDecimal());
                Assert.Equal(48m - p.GetProperty("totalCost").GetDecimal(), p.GetProperty("profitAmount").GetDecimal());

                var pricing = p.GetProperty("pricing");
                Assert.True(pricing.GetProperty("isLegacy").GetBoolean());
                Assert.Equal(56.16m, pricing.GetProperty("finalPrice").GetDecimal());
                Assert.Equal(JsonValueKind.Null, pricing.GetProperty("profit").ValueKind);   // not claimed until confirmed
                Assert.Equal(48m, pricing.GetProperty("legacy").GetProperty("finalIfStoredIsFinal").GetDecimal());
                Assert.Equal(56.16m, pricing.GetProperty("legacy").GetProperty("finalIfStoredExcludesVat").GetDecimal());
            }
            Assert.Equal(before.Products, (await RowsAsync(app, user.InternalId)).Products);   // reading changed nothing
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task LegacyProduct_SavedWithoutAMode_StaysLegacy_WithTheExactStoredPrice(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetProductAsync(app, w.Box, mode: null, stored: 63.91728841269841m, markup: 0.15m);
            await SaveSettingsAsync(user, 1);
            var before = await RowsAsync(app, user.InternalId);

            // what an existing client (or the dialog without a confirmation) sends: no pricingMode
            var put = await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Box}", UpdateBody(await user.GetJsonAsync($"/api/products/{w.Box}"), mode: null));
            Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);

            Assert.Equal(before.Products, (await RowsAsync(app, user.InternalId)).Products);
            Assert.True((await user.GetJsonAsync($"/api/products/{w.Box}")).GetProperty("pricing").GetProperty("isLegacy").GetBoolean());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ConfirmingALegacyPrice_IsExplicit_AndKeepsTheStoredValueByteForByte(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetProductAsync(app, w.Box, mode: null, stored: 63.91728841269841m, markup: 0.15m);
            await SaveSettingsAsync(user, 1);   // exempt

            var put = await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Box}", UpdateBody(await user.GetJsonAsync($"/api/products/{w.Box}"), mode: 1));
            Assert.Equal(HttpStatusCode.NoContent, put.StatusCode);

            await using (var db = app.CreateUnscopedContext())
            {
                var row = await db.Products.AsNoTracking().SingleAsync(p => p.Id == w.Box);
                Assert.Equal(PricingMode.Manual, row.PricingMode);
                Assert.Equal("63.91728841269841", row.ManualSellingPrice!.Value.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            var pricing = (await user.GetJsonAsync($"/api/products/{w.Box}")).GetProperty("pricing");
            Assert.False(pricing.GetProperty("isLegacy").GetBoolean());
            Assert.Equal(63.91728841269841m, pricing.GetProperty("finalPrice").GetDecimal());   // final, no VAT added (exempt)
            Assert.Equal(0m, pricing.GetProperty("vatAmount").GetDecimal());
            Assert.Equal(Math.Round(63.91728841269841m - 68m, 2, MidpointRounding.AwayFromZero), pricing.GetProperty("profit").GetDecimal());
        }

        // ================================================================== new pricing modes

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ManualPrice_IsFinal_ForExemptAndRegistered(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetProductAsync(app, w.Single, mode: PricingMode.Manual, stored: 118m, markup: 0.1m);

            await SaveSettingsAsync(user, 1);
            var exempt = (await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing");
            Assert.Equal((118m, 118m, 0m, 31.25m), (Dec(exempt, "finalPrice"), Dec(exempt, "priceBeforeVat"), Dec(exempt, "vatAmount"), Dec(exempt, "profit")));

            await SaveSettingsAsync(user, 2);
            var registered = (await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing");
            Assert.Equal((118m, 100m, 18m, 13.25m), (Dec(registered, "finalPrice"), Dec(registered, "priceBeforeVat"), Dec(registered, "vatAmount"), Dec(registered, "profit")));
            Assert.Equal(0.18m, Dec(registered, "vatRate"));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecommendedPrice_UsesTheDefaultMarkup_InWholeShekels(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetProductAsync(app, w.Single, mode: PricingMode.Recommended, stored: null, markup: 0.5m);

            var unchosen = (await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing");
            Assert.Equal(JsonValueKind.Null, unchosen.GetProperty("finalPrice").ValueKind);   // VAT status unknown: no guess

            await SaveSettingsAsync(user, 1);   // default markup 15%
            Assert.Equal(100m, Dec((await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing"), "finalPrice"));   // 99.7625
            await SaveSettingsAsync(user, 2);
            Assert.Equal(118m, Dec((await user.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing"), "finalPrice"));   // 117.72
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task Preview_PricesAProductBeingEdited_WithoutSavingAnything(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SaveSettingsAsync(user, 1);
            var before = await RowsAsync(app, user.InternalId);

            var body = new { productType = 0, recipeId = w.A, recipeUnits = 2, packagingId = w.Packaging, packagingTimeMinutes = 12,
                additionalPackaging = new[] { new { packagingId = w.Sticker, quantity = 2 } } };
            async Task<JsonElement> Preview(object pricing)
            {
                var merged = JsonSerializer.SerializeToElement(body).EnumerateObject()
                    .Concat(JsonSerializer.SerializeToElement(pricing).EnumerateObject())
                    .ToDictionary(p => p.Name, p => p.Value);
                var r = await user.SendAsync(HttpMethod.Post, "/api/products/cost-preview", JsonContent.Create(merged));
                Assert.Equal(HttpStatusCode.OK, r.StatusCode);
                return (await TenantApi.ReadJson(r)).GetProperty("pricing");
            }

            Assert.Equal(100m, Dec(await Preview(new { pricingMode = 3 }), "finalPrice"));
            Assert.Equal(108.44m, Dec(await Preview(new { pricingMode = 2, profitMarginPercent = 0.25m }), "finalPrice"));   // 86.75 x 1.25
            var manual = await Preview(new { pricingMode = 1, manualSellingPrice = 95m });
            Assert.Equal((95m, 8.25m), (Dec(manual, "finalPrice"), Dec(manual, "profit")));
            Assert.Equal(before, await RowsAsync(app, user.InternalId));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task InvalidPricing_IsRejected_BeforeAnythingIsWritten(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            var before = await RowsAsync(app, user.InternalId);
            var current = await user.GetJsonAsync($"/api/products/{w.Single}");

            Assert.Equal(HttpStatusCode.BadRequest, (await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Single}", UpdateBody(current, mode: 1, manualPrice: 0m))).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Single}", UpdateBody(current, mode: 7))).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Single}", UpdateBody(current, mode: 2, markup: -1m))).StatusCode);

            var form = TenantApi.ProductForm("manual without price", recipeId: w.A);
            form.Add(new StringContent("1"), "PricingMode");
            Assert.Equal(HttpStatusCode.BadRequest, (await user.SendAsync(HttpMethod.Post, "/api/products", form)).StatusCode);

            Assert.Equal(before, await RowsAsync(app, user.InternalId));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task AnotherUsersVatStatus_NeverAppliesToMyPrices(TestDatabase database)
        {
            var (app, alice, w) = await SetupAsync(database);
            var bob = await app.CreateUserAsync("bob");
            await SetProductAsync(app, w.Single, mode: PricingMode.Manual, stored: 118m, markup: 0.1m);
            await SaveSettingsAsync(alice, 1);   // exempt
            await SaveSettingsAsync(bob, 2);     // registered

            var pricing = (await alice.GetJsonAsync($"/api/products/{w.Single}")).GetProperty("pricing");
            Assert.Equal(0m, Dec(pricing, "vatAmount"));
            Assert.Equal(1, pricing.GetProperty("vatStatus").GetInt32());
        }

        // ================================================================== helpers

        private async Task<(TenantTestApp App, TestUser User, Bakery World)> SetupAsync(TestDatabase database)
        {
            var (app, _) = await _apps.GetAsync(database);
            var user = await app.CreateUserAsync("pricer");
            return (app, user, await Bakery.SeedAsync(app, user.InternalId));
        }

        private static decimal Dec(JsonElement e, string name) => e.GetProperty(name).GetDecimal();

        private static async Task SaveSettingsAsync(TestUser user, int vatStatus)
        {
            var r = await user.SendAsync(HttpMethod.Put, "/api/business-settings", JsonContent.Create(new { vatStatus, defaultMarkupPercent = 0.15m }));
            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        }

        private static async Task SetProductAsync(TenantTestApp app, int id, PricingMode? mode, decimal? stored, decimal markup)
        {
            await using var db = app.CreateUnscopedContext();
            var p = await db.Products.SingleAsync(x => x.Id == id);
            p.PricingMode = mode;
            p.ManualSellingPrice = stored;
            p.ProfitMarginPercent = markup;
            p.PackagingTimeMinutes ??= 0;
            await db.SaveChangesAsync();
        }

        /// <summary>All of a user's product rows (text of every stored value) and settings rows.</summary>
        private static async Task<(string Products, string Settings)> RowsAsync(TenantTestApp app, int userId)
        {
            await using var db = app.CreateUnscopedContext();
            var products = await db.Products.AsNoTracking().Where(p => p.UserId == userId).OrderBy(p => p.Id)
                .Select(p => new { p.Id, p.PricingMode, p.ManualSellingPrice, p.ProfitMarginPercent, p.Name, p.RecipeId, p.PackagingTimeMinutes })
                .ToListAsync();
            var settings = await db.BusinessSettings.AsNoTracking().Where(s => s.UserId == userId).ToListAsync();
            return (JsonSerializer.Serialize(products.Select(p => new { p.Id, p.PricingMode, Price = p.ManualSellingPrice?.ToString(System.Globalization.CultureInfo.InvariantCulture), p.ProfitMarginPercent, p.Name, p.RecipeId, p.PackagingTimeMinutes })),
                    JsonSerializer.Serialize(settings.Select(s => new { s.VatStatus, s.DefaultMarkupPercent })));
        }

        /// <summary>The update body the products page sends (see productForm.js buildUpdatePayload).</summary>
        private static JsonContent UpdateBody(JsonElement p, int? mode, decimal? manualPrice = null, decimal? markup = null)
        {
            var isBox = p.GetProperty("productType").GetInt32() == 1;
            int? Int(string n) => p.GetProperty(n).ValueKind == JsonValueKind.Null ? null : p.GetProperty(n).GetInt32();
            decimal? Decimal(string n) => p.GetProperty(n).ValueKind == JsonValueKind.Null ? null : p.GetProperty(n).GetDecimal();
            return JsonContent.Create(new
            {
                id = p.GetProperty("id").GetInt32(),
                name = p.GetProperty("name").GetString(),
                productType = isBox ? 1 : 0,
                recipeId = isBox ? null : Int("recipeId"),
                unitConversionRate = isBox ? 1 : p.GetProperty("unitConversionRate").GetInt32(),
                packagingId = Int("packagingId"),
                packagingTimeMinutes = Int("packagingTimeMinutes") ?? 0,
                profitMarginPercent = markup ?? p.GetProperty("profitMarginPercent").GetDecimal(),
                manualSellingPrice = manualPrice ?? Decimal("manualSellingPrice"),
                pricingMode = mode,
                packageItems = p.GetProperty("packageItems").EnumerateArray()
                    .Select(i => new { recipeId = i.GetProperty("recipeId").GetInt32(), quantity = i.GetProperty("quantity").GetInt32() }).ToList(),
                additionalPackaging = p.GetProperty("additionalPackaging").EnumerateArray()
                    .Select(i => new { packagingId = i.GetProperty("packagingId").GetInt32(), quantity = i.GetProperty("quantity").GetInt32() }).ToList(),
            });
        }
    }
}
