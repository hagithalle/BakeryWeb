using System.Net.Http.Json;
using System.Text.Json;

namespace Server.Tests.Tenancy
{
    /// <summary>Small request builders shared by the tenant tests (shapes match what the React client sends).</summary>
    public static class TenantApi
    {
        public const int NonExistentId = 2_000_000_000;

        public static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
            JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();

        public static async Task<int> CreateAsync(TestUser user, string path, HttpContent content)
        {
            var response = await user.SendAsync(HttpMethod.Post, path, content);
            Assert.True(response.IsSuccessStatusCode,
                $"POST {path} as {user.Label} failed: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}");
            return (await ReadJson(response)).GetProperty("id").GetInt32();
        }

        public static Task<int> IngredientAsync(TestUser user, string name) =>
            CreateAsync(user, "/api/ingredients", JsonContent.Create(new { name, pricePerKg = 10m, stockQuantity = 1, unit = 1, stockUnit = 1, category = 1 }));

        public static Task<int> PackagingAsync(TestUser user, string name) =>
            CreateAsync(user, "/api/packaging", JsonContent.Create(new { name, cost = 2m, stockUnits = 5 }));

        /// <summary>Recipe form: ingredient lines (id, qty) and base-recipe lines (id).</summary>
        public static MultipartFormDataContent RecipeForm(string name, IReadOnlyList<int>? ingredientIds = null, IReadOnlyList<int>? baseRecipeIds = null)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent(name), "Name" },
                { new StringContent("1"), "OutputUnits" },
            };
            for (var i = 0; i < (ingredientIds?.Count ?? 0); i++)
            {
                form.Add(new StringContent(ingredientIds![i].ToString()), $"Ingredients[{i}].IngredientId");
                form.Add(new StringContent("100"), $"Ingredients[{i}].Quantity");
                form.Add(new StringContent("2"), $"Ingredients[{i}].Unit");
            }
            for (var i = 0; i < (baseRecipeIds?.Count ?? 0); i++)
            {
                form.Add(new StringContent(baseRecipeIds![i].ToString()), $"BaseRecipes[{i}].BaseRecipeId");
                form.Add(new StringContent("1"), $"BaseRecipes[{i}].Quantity");
                form.Add(new StringContent("5"), $"BaseRecipes[{i}].Unit");
            }
            return form;
        }

        public static Task<int> RecipeAsync(TestUser user, string name, IReadOnlyList<int>? ingredientIds = null, IReadOnlyList<int>? baseRecipeIds = null) =>
            CreateAsync(user, "/api/recipe", RecipeForm(name, ingredientIds, baseRecipeIds));

        /// <summary>Product create form (multipart, as createProductWithImage sends it).</summary>
        public static MultipartFormDataContent ProductForm(
            string name, int? recipeId = null, int? packagingId = null,
            IReadOnlyList<int>? packageRecipeIds = null, IReadOnlyList<int>? additionalPackagingIds = null)
        {
            var isBox = packageRecipeIds != null;
            var form = new MultipartFormDataContent
            {
                { new StringContent(name), "Name" },
                { new StringContent(isBox ? "1" : "0"), "ProductType" },
                { new StringContent("1"), "RecipeUnits" },
                { new StringContent("0.2"), "ProfitMarginPercent" },
            };
            if (recipeId != null) form.Add(new StringContent(recipeId.Value.ToString()), "RecipeId");
            if (packagingId != null) form.Add(new StringContent(packagingId.Value.ToString()), "PackagingId");
            for (var i = 0; i < (packageRecipeIds?.Count ?? 0); i++)
            {
                form.Add(new StringContent(packageRecipeIds![i].ToString()), $"PackageItems[{i}].RecipeId");
                form.Add(new StringContent("2"), $"PackageItems[{i}].Quantity");
            }
            for (var i = 0; i < (additionalPackagingIds?.Count ?? 0); i++)
            {
                form.Add(new StringContent(additionalPackagingIds![i].ToString()), $"AdditionalPackaging[{i}].PackagingId");
                form.Add(new StringContent("1"), $"AdditionalPackaging[{i}].Quantity");
            }
            return form;
        }

        /// <summary>Product update body (JSON, as the products page sends it).</summary>
        public static JsonContent ProductUpdate(
            int id, string name, int? recipeId = null, int? packagingId = null,
            IReadOnlyList<int>? packageRecipeIds = null, IReadOnlyList<int>? additionalPackagingIds = null) =>
            JsonContent.Create(new
            {
                id,
                name,
                productType = packageRecipeIds != null ? 1 : 0,
                recipeId,
                unitConversionRate = 1,
                packagingId,
                profitMarginPercent = 0.2m,
                packageItems = (packageRecipeIds ?? Array.Empty<int>()).Select(r => new { recipeId = r, quantity = 2 }).ToList(),
                additionalPackaging = (additionalPackagingIds ?? Array.Empty<int>()).Select(p => new { packagingId = p, quantity = 1 }).ToList(),
            });
    }
}
