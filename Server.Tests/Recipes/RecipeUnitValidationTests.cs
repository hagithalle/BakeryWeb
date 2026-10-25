using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Server.Controllers;
using Server.Models;
using Server.Services;
using Server.Validation;

namespace Server.Tests.Recipes
{
    public class RecipeUnitValidatorTests
    {
        private static Recipe RecipeWith(int? ingredientUnit = null, UnitOfMeasure? baseRecipeUnit = null)
        {
            var recipe = new Recipe { Name = "Test" };
            if (ingredientUnit != null)
                recipe.Ingredients.Add(new RecipeIngredient { IngredientId = 7, Quantity = 100, Unit = ingredientUnit.Value });
            if (baseRecipeUnit != null)
                recipe.BaseRecipes.Add(new RecipeItem { BaseRecipeId = 3, Quantity = 1, Unit = baseRecipeUnit.Value });
            return recipe;
        }

        public static TheoryData<int> AllDefinedUnits()
        {
            var data = new TheoryData<int>();
            foreach (var unit in Enum.GetValues<UnitOfMeasure>()) data.Add((int)unit);
            return data;
        }

        [Theory]
        [MemberData(nameof(AllDefinedUnits))]
        public void EveryDefinedUnit_IsValid_ForIngredientsAndSubRecipes(int unit)
        {
            Assert.Empty(RecipeUnitValidator.Validate(RecipeWith(unit, (UnitOfMeasure)unit)));
        }

        [Theory]
        [InlineData(0)]   // default / historical "unknown"
        [InlineData(-1)]
        [InlineData(11)]
        [InlineData(999)]
        public void UndefinedIngredientUnit_IsRejected(int unit)
        {
            var errors = RecipeUnitValidator.Validate(RecipeWith(ingredientUnit: unit));

            var error = Assert.Single(errors);
            Assert.StartsWith("Ingredients[0].Unit", error);
            Assert.Contains($"({unit})", error);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(11)]
        public void UndefinedSubRecipeUnit_IsRejected(int unit)
        {
            var error = Assert.Single(RecipeUnitValidator.Validate(RecipeWith(baseRecipeUnit: (UnitOfMeasure)unit)));
            Assert.StartsWith("BaseRecipes[0].Unit", error);
        }

        [Fact]
        public void EveryInvalidLine_IsReported()
        {
            var recipe = RecipeWith(ingredientUnit: 2);
            recipe.Ingredients.Add(new RecipeIngredient { IngredientId = 8, Quantity = 1, Unit = 0 });
            recipe.Ingredients.Add(new RecipeIngredient { IngredientId = 9, Quantity = 1, Unit = 42 });
            recipe.BaseRecipes.Add(new RecipeItem { BaseRecipeId = 4, Quantity = 1, Unit = 0 });

            var errors = RecipeUnitValidator.Validate(recipe);

            Assert.Equal(3, errors.Count);
            Assert.Contains(errors, e => e.StartsWith("Ingredients[1].Unit"));
            Assert.Contains(errors, e => e.StartsWith("Ingredients[2].Unit"));
            Assert.Contains(errors, e => e.StartsWith("BaseRecipes[0].Unit"));
        }

        [Fact]
        public void RecipeWithoutLines_IsValid()
        {
            Assert.Empty(RecipeUnitValidator.Validate(new Recipe { Name = "Empty" }));
        }
    }

    /// <summary>
    /// HTTP tests through the real RecipeController and real form binding (as the React client sends it).
    /// The recipe service is faked, so no database is involved and we can assert it is never reached.
    /// </summary>
    public class RecipeControllerUnitValidationTests : IAsyncLifetime
    {
        private readonly FakeRecipeService _service = new();
        private WebApplication _app = null!;
        private HttpClient _client = null!;

        public async Task InitializeAsync()
        {
            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseTestServer();
            builder.Services.AddSingleton<IRecipeService>(_service);
            builder.Services.AddControllers()
                .AddApplicationPart(typeof(RecipeController).Assembly)
                .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler =
                    System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

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

        private static MultipartFormDataContent RecipeForm(string? ingredientUnit = "2", string? baseRecipeUnit = null)
        {
            var form = new MultipartFormDataContent
            {
                { new StringContent("Test recipe"), "Name" },
                { new StringContent("1"), "OutputUnits" },
                { new StringContent("7"), "Ingredients[0].IngredientId" },
                { new StringContent("100"), "Ingredients[0].Quantity" },
            };
            if (ingredientUnit != null) form.Add(new StringContent(ingredientUnit), "Ingredients[0].Unit");
            if (baseRecipeUnit != null)
            {
                form.Add(new StringContent("3"), "BaseRecipes[0].BaseRecipeId");
                form.Add(new StringContent("1"), "BaseRecipes[0].Quantity");
                form.Add(new StringContent(baseRecipeUnit), "BaseRecipes[0].Unit");
            }
            return form;
        }

        [Fact]
        public async Task Create_WithValidUnits_IsSaved()
        {
            var response = await _client.PostAsync("/api/recipe", RecipeForm(ingredientUnit: "2", baseRecipeUnit: "5"));

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var saved = Assert.Single(_service.Created);
            Assert.Equal(2, saved.Ingredients.Single().Unit);
            Assert.Equal(UnitOfMeasure.Unit, saved.BaseRecipes.Single().Unit);
        }

        [Theory]
        [InlineData("0")]
        [InlineData("11")]
        public async Task Create_WithInvalidIngredientUnit_Returns400_AndSavesNothing(string unit)
        {
            var response = await _client.PostAsync("/api/recipe", RecipeForm(ingredientUnit: unit));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.False(string.IsNullOrEmpty(body.GetProperty("message").GetString())); // shown by the recipes page
            Assert.Contains("Ingredients[0].Unit", body.GetProperty("errors")[0].GetString());
            Assert.Empty(_service.Created);
        }

        [Fact]
        public async Task Create_WithMissingIngredientUnit_Returns400_InsteadOfStoringZero()
        {
            var response = await _client.PostAsync("/api/recipe", RecipeForm(ingredientUnit: null));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Empty(_service.Created);
        }

        [Theory]
        [InlineData("0")]
        [InlineData("11")]
        public async Task Create_WithInvalidSubRecipeUnit_Returns400_AndSavesNothing(string unit)
        {
            var response = await _client.PostAsync("/api/recipe", RecipeForm(ingredientUnit: "2", baseRecipeUnit: unit));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Empty(_service.Created);
        }

        [Fact]
        public async Task Update_WithValidUnits_IsSaved()
        {
            var response = await _client.PutAsync("/api/recipe/5", RecipeForm(ingredientUnit: "8", baseRecipeUnit: "1"));

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            var (id, saved) = Assert.Single(_service.Updated);
            Assert.Equal(5, id);
            Assert.Equal(8, saved.Ingredients.Single().Unit);
        }

        [Theory]
        [InlineData("0", null)]
        [InlineData("2", "0")]
        public async Task Update_WithInvalidUnit_Returns400_AndLeavesStoredRecipeUntouched(string ingredientUnit, string? baseRecipeUnit)
        {
            var response = await _client.PutAsync("/api/recipe/5", RecipeForm(ingredientUnit, baseRecipeUnit));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Empty(_service.Updated);
        }

        [Fact]
        public async Task HistoricalInvalidUnit_CanStillBeRead_Unchanged()
        {
            _service.Stored = new Recipe
            {
                Id = 5,
                Name = "Old recipe",
                Ingredients = { new RecipeIngredient { Id = 1, RecipeId = 5, IngredientId = 7, Quantity = 200, Unit = 0 } },
            };

            var response = await _client.GetAsync("/api/recipe/5");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal(0, body.GetProperty("ingredients")[0].GetProperty("unit").GetInt32());
        }

        private sealed class FakeRecipeService : IRecipeService
        {
            public List<Recipe> Created { get; } = new();
            public List<(int Id, Recipe Recipe)> Updated { get; } = new();
            public Recipe? Stored { get; set; }

            public Task<IEnumerable<Recipe>> GetAllAsync() =>
                Task.FromResult<IEnumerable<Recipe>>(Stored != null ? new[] { Stored } : Array.Empty<Recipe>());

            public Task<Recipe?> GetByIdAsync(int id) => Task.FromResult(Stored?.Id == id ? Stored : null);

            public Task<Recipe> CreateAsync(Recipe recipe)
            {
                recipe.Id = 100 + Created.Count;
                Created.Add(recipe);
                return Task.FromResult(recipe);
            }

            public Task<bool> UpdateAsync(int id, Recipe recipe)
            {
                Updated.Add((id, recipe));
                return Task.FromResult(true);
            }

            public Task<bool> DeleteAsync(int id) => Task.FromResult(true);
        }
    }
}
