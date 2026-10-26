using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Tests.Costing;
using Server.Tests.Tenancy;

namespace Server.Tests.Products
{
    /// <summary>
    /// Phase B: editing existing products must keep their items, packaging and prices, and product images must
    /// be reachable at the URL the API returns (anonymously, as designed) while product data still needs sign-in.
    /// </summary>
    public class ProductEditingTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public ProductEditingTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        // ================================================================== editing keeps data

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task SavingAnUnchangedBox_AsTheClientSendsIt_KeepsItemsPackagingAndPrices(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetPricesAsync(app, w.Box, manual: 63.91728841269841m, margin: 0.15m);
            var before = await ProductRowsAsync(app, w.Box);
            var costBefore = (await user.GetJsonAsync($"/api/products/{w.Box}")).GetProperty("totalCost").GetDecimal();

            var response = await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Box}", ClientUpdatePayload(await user.GetJsonAsync($"/api/products/{w.Box}")));

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Equal(before, await ProductRowsAsync(app, w.Box));
            Assert.Equal(costBefore, (await user.GetJsonAsync($"/api/products/{w.Box}")).GetProperty("totalCost").GetDecimal());
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task SavingAnUnchangedSingleProduct_KeepsRecipeUnitsSaleUnitPackagingAndPrices(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            await SetPricesAsync(app, w.Single, manual: 48m, margin: 0.1m, saleUnit: UnitType.Whole);
            var before = await ProductRowsAsync(app, w.Single);

            var response = await user.SendAsync(HttpMethod.Put, $"/api/products/{w.Single}", ClientUpdatePayload(await user.GetJsonAsync($"/api/products/{w.Single}")));

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Equal(before, await ProductRowsAsync(app, w.Single));
        }

        // ================================================================== images

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductImage_IsServedAtTheReturnedUrl_WithoutAToken_WhileProductDataNeedsSignIn(TestDatabase database)
        {
            var (app, user, w) = await SetupAsync(database);
            var png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4 };
            var form = TenantApi.ProductForm("with image", recipeId: w.A);
            var image = new ByteArrayContent(png);
            image.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            form.Add(image, "imageFile", "cake.png");

            var created = await TenantApi.ReadJson(await user.SendAsync(HttpMethod.Post, "/api/products", form));
            var url = created.GetProperty("imageUrl").GetString()!;
            var savedFile = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Products", Path.GetFileName(url));
            try
            {
                Assert.Matches(@"^/uploads/products/[0-9a-f-]{36}\.png$", url);

                var anonymous = app.CreateAnonymousClient();
                var file = await anonymous.GetAsync(url);
                Assert.Equal(HttpStatusCode.OK, file.StatusCode);
                Assert.Equal("image/png", file.Content.Headers.ContentType?.MediaType);
                Assert.Equal(png, await file.Content.ReadAsByteArrayAsync());

                // The product itself (and its image URL) is only visible to its owner.
                var id = created.GetProperty("id").GetInt32();
                Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/products/{id}")).StatusCode);
                Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/products")).StatusCode);

                // Missing files and paths outside the uploads folder are not served.
                // (a missing file falls through to the sign-in requirement: 401, never content)
                Assert.Contains((await anonymous.GetAsync("/uploads/products/does-not-exist.png")).StatusCode,
                    new[] { HttpStatusCode.NotFound, HttpStatusCode.Unauthorized });
                Assert.NotEqual(HttpStatusCode.OK, (await anonymous.GetAsync("/uploads/..%2F..%2Fappsettings.json")).StatusCode);
            }
            finally
            {
                if (File.Exists(savedFile)) File.Delete(savedFile);
            }
        }

        // ================================================================== helpers

        private async Task<(TenantTestApp App, TestUser User, Bakery World)> SetupAsync(TestDatabase database)
        {
            var (app, _) = await _apps.GetAsync(database);
            var user = await app.CreateUserAsync("editor");
            return (app, user, await Bakery.SeedAsync(app, user.InternalId));
        }

        private static async Task SetPricesAsync(TenantTestApp app, int productId, decimal manual, decimal margin, UnitType saleUnit = UnitType.Piece)
        {
            await using var db = app.CreateUnscopedContext();
            var p = await db.Products.SingleAsync(x => x.Id == productId);
            p.ManualSellingPrice = manual;
            p.ProfitMarginPercent = margin;
            p.SaleUnitType = saleUnit;
            p.ImageUrl = "/uploads/products/existing.png";
            // Like every existing product. (An empty packaging time is saved as 0 by the client - same cost.)
            p.PackagingTimeMinutes ??= 5;
            await db.SaveChangesAsync();
        }

        /// <summary>The product row and its lines, without generated line ids (lines are replaced on update).</summary>
        private static async Task<string> ProductRowsAsync(TenantTestApp app, int productId)
        {
            await using var db = app.CreateUnscopedContext();
            var p = await db.Products.AsNoTracking().SingleAsync(x => x.Id == productId);
            var items = await db.PackageItems.Where(i => i.ProductId == productId).OrderBy(i => i.RecipeId).ThenBy(i => i.Quantity)
                .Select(i => new { i.RecipeId, i.Quantity }).ToListAsync();
            var packaging = await db.ProductAdditionalPackagings.Where(i => i.ProductId == productId).OrderBy(i => i.PackagingId).ThenBy(i => i.Quantity)
                .Select(i => new { i.PackagingId, i.Quantity }).ToListAsync();
            return JsonSerializer.Serialize(new
            {
                p.Name, p.ProductType, p.RecipeId, p.UnitConversionRate, p.SaleUnitType, p.PackagingId, p.PackagingTimeMinutes,
                p.ImageUrl, p.Description, p.Category, p.ProfitMarginPercent, p.ManualSellingPrice, p.UserId, items, packaging,
            });
        }

        /// <summary>
        /// The body Client/src/utils/productForm.js buildUpdatePayload produces for an unchanged form
        /// (covered on the client by productForm.test.js).
        /// </summary>
        private static JsonContent ClientUpdatePayload(JsonElement p)
        {
            var isBox = p.GetProperty("productType").GetInt32() == 1;
            int? Int(string name) => p.GetProperty(name).ValueKind == JsonValueKind.Null ? null : p.GetProperty(name).GetInt32();
            return JsonContent.Create(new
            {
                id = p.GetProperty("id").GetInt32(),
                name = p.GetProperty("name").GetString(),
                description = p.GetProperty("description").GetString(),
                category = p.GetProperty("category").GetString(),
                productType = isBox ? 1 : 0,
                recipeId = isBox ? null : Int("recipeId"),
                unitConversionRate = isBox ? 1 : p.GetProperty("unitConversionRate").GetInt32(),
                saleUnitType = isBox ? 0 : p.GetProperty("saleUnitType").GetInt32(),
                packagingId = Int("packagingId"),
                packagingTimeMinutes = Int("packagingTimeMinutes") ?? 0,
                imageUrl = p.GetProperty("imageUrl").GetString(),
                profitMarginPercent = p.GetProperty("profitMarginPercent").GetDecimal(),
                manualSellingPrice = p.GetProperty("manualSellingPrice").GetDecimal(),
                // a single product has no box items, so this is [] for it - as the client sends
                packageItems = p.GetProperty("packageItems").EnumerateArray()
                    .Select(i => new { recipeId = i.GetProperty("recipeId").GetInt32(), quantity = i.GetProperty("quantity").GetInt32() }).ToList(),
                additionalPackaging = p.GetProperty("additionalPackaging").EnumerateArray()
                    .Select(i => new { packagingId = i.GetProperty("packagingId").GetInt32(), quantity = i.GetProperty("quantity").GetInt32() }).ToList(),
            });
        }
    }
}
