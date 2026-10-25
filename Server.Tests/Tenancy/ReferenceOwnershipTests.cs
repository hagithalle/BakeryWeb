using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using static Server.Tests.Tenancy.TenantApi;

namespace Server.Tests.Tenancy
{
    /// <summary>
    /// P3: every reference in a recipe or product must point to one of the caller's own rows. Missing rows and
    /// other users' rows are rejected with the same 400, before anything is written.
    /// </summary>
    public class ReferenceOwnershipTests : IClassFixture<TenantAppsFixture>
    {
        private readonly TenantAppsFixture _apps;
        public ReferenceOwnershipTests(TenantAppsFixture apps) => _apps = apps;

        public static TheoryData<TestDatabase> Databases => TestDatabases.All();

        private async Task<(TenantTestApp App, OwnerlessRows Ownerless, TestUser A, TestUser B)> SetupAsync(TestDatabase database)
        {
            var (app, ownerless) = await _apps.GetAsync(database);
            return (app, ownerless, await app.CreateUserAsync("alice"), await app.CreateUserAsync("bob"));
        }

        /// <summary>Row counts of every table a recipe/product write can touch.</summary>
        private static async Task<string> WriteFootprintAsync(TenantTestApp app)
        {
            await using var db = app.CreateUnscopedContext();
            return string.Join(",",
                await db.Recipes.CountAsync(), await db.RecipeIngredients.CountAsync(), await db.RecipeSteps.CountAsync(),
                await db.RecipeItems.CountAsync(), await db.Products.CountAsync(), await db.PackageItems.CountAsync(),
                await db.ProductAdditionalPackagings.CountAsync());
        }

        private static async Task<(HttpStatusCode Status, string Body, JsonElement Json)> SendAsync(TestUser user, HttpMethod method, string path, HttpContent content)
        {
            var response = await user.SendAsync(method, path, content);
            var body = await response.Content.ReadAsStringAsync();
            return (response.StatusCode, body, string.IsNullOrEmpty(body) ? default : JsonDocument.Parse(body).RootElement.Clone());
        }

        private static void AssertInvalidReference((HttpStatusCode Status, string Body, JsonElement Json) result, string field)
        {
            Assert.Equal(HttpStatusCode.BadRequest, result.Status);
            Assert.Equal(Server.Validation.InvalidReferenceException.UserMessage, result.Json.GetProperty("message").GetString());
            Assert.Contains(field, result.Json.GetProperty("errors").EnumerateArray().Select(e => e.GetString()));
        }

        // ================================================================== recipes: create

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeCreate_WithOtherUsersOwnerlessOrMissingIngredient_IsRejectedIdentically_AndWritesNothing(TestDatabase database)
        {
            var (app, ownerless, a, b) = await SetupAsync(database);
            var aIngredient = await IngredientAsync(a, "A-flour");
            var bIngredient = await IngredientAsync(b, "B-sugar");
            var before = await WriteFootprintAsync(app);

            // The invalid reference is the SECOND line; the first one is B's own - nothing may be saved.
            var foreign = await SendAsync(b, HttpMethod.Post, "/api/recipe", RecipeForm("B-recipe", new[] { bIngredient, aIngredient }));
            var missing = await SendAsync(b, HttpMethod.Post, "/api/recipe", RecipeForm("B-recipe", new[] { bIngredient, NonExistentId }));
            var legacy = await SendAsync(b, HttpMethod.Post, "/api/recipe", RecipeForm("B-recipe", new[] { bIngredient, ownerless.Ingredient }));

            AssertInvalidReference(foreign, "Ingredients[1].IngredientId");
            Assert.Equal(missing.Body, foreign.Body);   // cannot tell "A's ingredient" from "does not exist"
            Assert.Equal(missing.Body, legacy.Body);
            Assert.Equal(before, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeCreate_WithOtherUsersBaseRecipe_IsRejected_AndWritesNothing(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aBase = await RecipeAsync(a, "A-cream");
            var bBase = await RecipeAsync(b, "B-dough");
            var before = await WriteFootprintAsync(app);

            var foreign = await SendAsync(b, HttpMethod.Post, "/api/recipe", RecipeForm("B-cake", baseRecipeIds: new[] { bBase, aBase }));
            var missing = await SendAsync(b, HttpMethod.Post, "/api/recipe", RecipeForm("B-cake", baseRecipeIds: new[] { bBase, NonExistentId }));

            AssertInvalidReference(foreign, "BaseRecipes[1].BaseRecipeId");
            Assert.Equal(missing.Body, foreign.Body);
            Assert.Equal(before, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeCreate_WithOwnReferences_Succeeds(TestDatabase database)
        {
            var (app, _, _, b) = await SetupAsync(database);
            var ingredient = await IngredientAsync(b, "B-own-flour");
            var baseRecipe = await RecipeAsync(b, "B-own-base", new[] { ingredient });

            var id = await RecipeAsync(b, "B-own-cake", new[] { ingredient }, new[] { baseRecipe });

            var stored = await b.GetJsonAsync($"/api/recipe/{id}");
            Assert.Equal(1, stored.GetProperty("ingredients").GetArrayLength());
            Assert.Equal(1, stored.GetProperty("baseRecipes").GetArrayLength());
        }

        // ================================================================== recipes: update

        private static async Task<string> RecipeStateAsync(TenantTestApp app, int recipeId)
        {
            await using var db = app.CreateUnscopedContext();
            var r = await db.Recipes.AsNoTracking().SingleAsync(x => x.Id == recipeId);
            var lines = await db.RecipeIngredients.Where(x => x.RecipeId == recipeId).OrderBy(x => x.Id).Select(x => $"{x.Id}:{x.IngredientId}:{x.Quantity}").ToListAsync();
            var bases = await db.RecipeItems.Where(x => x.ComposingRecipeId == recipeId).OrderBy(x => x.Id).Select(x => $"{x.Id}:{x.BaseRecipeId}").ToListAsync();
            return $"{r.Name}|{r.OutputUnits}|{string.Join(",", lines)}|{string.Join(",", bases)}";
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeUpdate_WithOtherUsersIngredientOrBaseRecipe_IsRejected_AndRecipeUnchanged(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aIngredient = await IngredientAsync(a, "A-butter");
            var aRecipe = await RecipeAsync(a, "A-ganache");
            var bIngredient = await IngredientAsync(b, "B-eggs");
            var bRecipe = await RecipeAsync(b, "B-original", new[] { bIngredient });
            var before = await RecipeStateAsync(app, bRecipe);
            var footprint = await WriteFootprintAsync(app);

            var badIngredient = await SendAsync(b, HttpMethod.Put, $"/api/recipe/{bRecipe}", RecipeForm("B-renamed", new[] { aIngredient }));
            var badBase = await SendAsync(b, HttpMethod.Put, $"/api/recipe/{bRecipe}", RecipeForm("B-renamed", new[] { bIngredient }, new[] { aRecipe }));

            AssertInvalidReference(badIngredient, "Ingredients[0].IngredientId");
            AssertInvalidReference(badBase, "BaseRecipes[0].BaseRecipeId");
            Assert.Equal(before, await RecipeStateAsync(app, bRecipe));   // name, lines and base recipes untouched
            Assert.Equal(footprint, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeUpdate_ReferencingItself_IsRejected(TestDatabase database)
        {
            var (app, _, _, b) = await SetupAsync(database);
            var recipe = await RecipeAsync(b, "B-self");
            var before = await RecipeStateAsync(app, recipe);

            var result = await SendAsync(b, HttpMethod.Put, $"/api/recipe/{recipe}", RecipeForm("B-self", baseRecipeIds: new[] { recipe }));

            AssertInvalidReference(result, "BaseRecipes[0].BaseRecipeId");
            Assert.Equal(before, await RecipeStateAsync(app, recipe));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task RecipeUpdate_CreatingAnIndirectCycle_IsRejected(TestDatabase database)
        {
            var (app, _, _, b) = await SetupAsync(database);
            // r3 -> r2 -> r1 already exists; making r1 use r2 (2-step) or r3 (3-step) would close a cycle.
            var r1 = await RecipeAsync(b, "B-r1");
            var r2 = await RecipeAsync(b, "B-r2", baseRecipeIds: new[] { r1 });
            var r3 = await RecipeAsync(b, "B-r3", baseRecipeIds: new[] { r2 });
            var before = await RecipeStateAsync(app, r1);

            var twoStep = await SendAsync(b, HttpMethod.Put, $"/api/recipe/{r1}", RecipeForm("B-r1", baseRecipeIds: new[] { r2 }));
            var threeStep = await SendAsync(b, HttpMethod.Put, $"/api/recipe/{r1}", RecipeForm("B-r1", baseRecipeIds: new[] { r3 }));

            AssertInvalidReference(twoStep, "BaseRecipes");
            AssertInvalidReference(threeStep, "BaseRecipes");
            Assert.Equal(before, await RecipeStateAsync(app, r1));

            // A legitimate change elsewhere in the same graph is still allowed (r1 -> a new, unrelated recipe).
            var r4 = await RecipeAsync(b, "B-r4");
            var ok = await b.SendAsync(HttpMethod.Put, $"/api/recipe/{r1}", RecipeForm("B-r1", baseRecipeIds: new[] { r4 }));
            Assert.Equal(HttpStatusCode.NoContent, ok.StatusCode);
        }

        // ================================================================== products: create

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductCreate_WithOtherUsersRecipe_IsRejectedLikeAMissingOne_AndWritesNothing(TestDatabase database)
        {
            var (app, ownerless, a, b) = await SetupAsync(database);
            var aRecipe = await RecipeAsync(a, "A-brownie");
            var before = await WriteFootprintAsync(app);

            var foreign = await SendAsync(b, HttpMethod.Post, "/api/products", ProductForm("B-product", recipeId: aRecipe));
            var missing = await SendAsync(b, HttpMethod.Post, "/api/products", ProductForm("B-product", recipeId: NonExistentId));
            var legacy = await SendAsync(b, HttpMethod.Post, "/api/products", ProductForm("B-product", recipeId: ownerless.Recipe));

            AssertInvalidReference(foreign, "RecipeId");
            Assert.Equal(missing.Body, foreign.Body);
            Assert.Equal(missing.Body, legacy.Body);
            Assert.Equal(before, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductCreate_WithOtherUsersPackaging_IsRejected(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aBox = await PackagingAsync(a, "A-box");
            var bRecipe = await RecipeAsync(b, "B-cookie");
            var before = await WriteFootprintAsync(app);

            AssertInvalidReference(await SendAsync(b, HttpMethod.Post, "/api/products", ProductForm("B-p1", recipeId: bRecipe, packagingId: aBox)), "PackagingId");
            Assert.Equal(before, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductCreate_BoxWithOneForeignItem_IsRejected_AndNoProductOrItemsAreSaved(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aRecipe = await RecipeAsync(a, "A-macaron");
            var bRecipe = await RecipeAsync(b, "B-cookie");
            var before = await WriteFootprintAsync(app);

            // Valid first item, foreign second item: previously the product row was saved before items were checked.
            var name = "B-rejected-box-" + Guid.NewGuid().ToString("N")[..8];
            var result = await SendAsync(b, HttpMethod.Post, "/api/products", ProductForm(name, packageRecipeIds: new[] { bRecipe, aRecipe }));

            AssertInvalidReference(result, "PackageItems[1].RecipeId");
            Assert.Equal(before, await WriteFootprintAsync(app));
            await using var db = app.CreateUnscopedContext();
            Assert.False(await db.Products.AnyAsync(p => p.Name == name));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductCreate_WithOtherUsersAdditionalPackaging_IsRejected_AndWritesNothing(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aRibbon = await PackagingAsync(a, "A-ribbon");
            var bRibbon = await PackagingAsync(b, "B-ribbon");
            var bRecipe = await RecipeAsync(b, "B-cupcake");
            var before = await WriteFootprintAsync(app);

            var result = await SendAsync(b, HttpMethod.Post, "/api/products",
                ProductForm("B-gift", recipeId: bRecipe, additionalPackagingIds: new[] { bRibbon, aRibbon }));

            AssertInvalidReference(result, "AdditionalPackaging[1].PackagingId");
            Assert.Equal(before, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductCreate_WithOwnReferences_SavesProductItemsAndPackagingTogether(TestDatabase database)
        {
            var (app, _, _, b) = await SetupAsync(database);
            var r1 = await RecipeAsync(b, "B-r1");
            var r2 = await RecipeAsync(b, "B-r2");
            var box = await PackagingAsync(b, "B-box");
            var ribbon = await PackagingAsync(b, "B-ribbon");

            var id = await CreateAsync(b, "/api/products", ProductForm("B-own-box", packagingId: box, packageRecipeIds: new[] { r1, r2 }, additionalPackagingIds: new[] { ribbon }));

            await using var db = app.CreateUnscopedContext();
            Assert.Equal(2, await db.PackageItems.CountAsync(x => x.ProductId == id));
            Assert.Equal(1, await db.ProductAdditionalPackagings.CountAsync(x => x.ProductId == id));
            Assert.Equal(b.InternalId, (await db.Products.SingleAsync(p => p.Id == id)).UserId);
        }

        // ================================================================== products: update

        private static async Task<string> ProductStateAsync(TenantTestApp app, int productId)
        {
            await using var db = app.CreateUnscopedContext();
            var p = await db.Products.AsNoTracking().SingleAsync(x => x.Id == productId);
            var items = await db.PackageItems.Where(x => x.ProductId == productId).OrderBy(x => x.Id).Select(x => $"{x.Id}:{x.RecipeId}").ToListAsync();
            var extra = await db.ProductAdditionalPackagings.Where(x => x.ProductId == productId).OrderBy(x => x.Id).Select(x => $"{x.Id}:{x.PackagingId}").ToListAsync();
            return $"{p.Name}|{p.ProductType}|{p.RecipeId}|{p.PackagingId}|{string.Join(",", items)}|{string.Join(",", extra)}";
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductUpdate_WithAnyForeignReference_IsRejected_AndProductUnchanged(TestDatabase database)
        {
            var (app, _, a, b) = await SetupAsync(database);
            var aRecipe = await RecipeAsync(a, "A-tart");
            var aPack = await PackagingAsync(a, "A-tray");
            var bRecipe = await RecipeAsync(b, "B-tart");
            var bPack = await PackagingAsync(b, "B-tray");
            var product = await CreateAsync(b, "/api/products", ProductForm("B-box", packagingId: bPack, packageRecipeIds: new[] { bRecipe }, additionalPackagingIds: new[] { bPack }));
            var before = await ProductStateAsync(app, product);
            var footprint = await WriteFootprintAsync(app);

            AssertInvalidReference(await SendAsync(b, HttpMethod.Put, $"/api/products/{product}",
                ProductUpdate(product, "B-renamed", recipeId: aRecipe)), "RecipeId");
            AssertInvalidReference(await SendAsync(b, HttpMethod.Put, $"/api/products/{product}",
                ProductUpdate(product, "B-renamed", packagingId: aPack, packageRecipeIds: new[] { bRecipe })), "PackagingId");
            AssertInvalidReference(await SendAsync(b, HttpMethod.Put, $"/api/products/{product}",
                ProductUpdate(product, "B-renamed", packageRecipeIds: new[] { bRecipe, aRecipe })), "PackageItems[1].RecipeId");
            AssertInvalidReference(await SendAsync(b, HttpMethod.Put, $"/api/products/{product}",
                ProductUpdate(product, "B-renamed", packageRecipeIds: new[] { bRecipe }, additionalPackagingIds: new[] { aPack })), "AdditionalPackaging[0].PackagingId");

            Assert.Equal(before, await ProductStateAsync(app, product));   // name, type, references, items, packaging
            Assert.Equal(footprint, await WriteFootprintAsync(app));
        }

        [Theory]
        [MemberData(nameof(Databases))]
        public async Task ProductUpdate_WithOwnReferences_Succeeds(TestDatabase database)
        {
            var (app, _, _, b) = await SetupAsync(database);
            var r1 = await RecipeAsync(b, "B-r1");
            var r2 = await RecipeAsync(b, "B-r2");
            var pack = await PackagingAsync(b, "B-pack");
            var product = await CreateAsync(b, "/api/products", ProductForm("B-box", packageRecipeIds: new[] { r1 }));

            var response = await b.SendAsync(HttpMethod.Put, $"/api/products/{product}",
                ProductUpdate(product, "B-box-v2", packagingId: pack, packageRecipeIds: new[] { r1, r2 }, additionalPackagingIds: new[] { pack }));

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            await using var db = app.CreateUnscopedContext();
            Assert.Equal(2, await db.PackageItems.CountAsync(x => x.ProductId == product));
            Assert.Equal(1, await db.ProductAdditionalPackagings.CountAsync(x => x.ProductId == product));
            Assert.Equal("B-box-v2", (await db.Products.SingleAsync(p => p.Id == product)).Name);
        }
    }
}
