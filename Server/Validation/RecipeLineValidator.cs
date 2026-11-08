using System.Collections.Generic;
using Server.Models;
using Server.Services.Costing;

namespace Server.Validation
{
    /// <summary>
    /// Checks the lines of a recipe before it is saved (in addition to <see cref="RecipeUnitValidator"/>).
    /// Nothing is ever corrected automatically: an invalid line rejects the save, a suspicious one needs an
    /// explicit confirmation from the user.
    /// </summary>
    public static class RecipeLineValidator
    {
        public sealed record SuspiciousLine(int Index, int IngredientId, decimal Quantity, int Unit, string Text);

        /// <summary>Lines that can never be saved: no ingredient / sub-recipe, or a quantity that is not above 0.</summary>
        public static IReadOnlyList<string> InvalidLines(Recipe recipe)
        {
            var errors = new List<string>();
            var ingredients = recipe.Ingredients ?? new List<RecipeIngredient>();
            for (var i = 0; i < ingredients.Count; i++)
            {
                if (ingredients[i].IngredientId <= 0)
                    errors.Add($"Ingredients[{i}].IngredientId: שורה {i + 1} – לא נבחר חומר גלם");
                if (ingredients[i].Quantity <= 0)
                    errors.Add($"Ingredients[{i}].Quantity: שורה {i + 1} – הכמות חייבת להיות גדולה מ-0");
            }
            var baseRecipes = recipe.BaseRecipes ?? new List<RecipeItem>();
            for (var i = 0; i < baseRecipes.Count; i++)
            {
                if (baseRecipes[i].BaseRecipeId <= 0)
                    errors.Add($"BaseRecipes[{i}].BaseRecipeId: מתכון בסיס {i + 1} – לא נבחר מתכון");
                if (baseRecipes[i].Quantity <= 0)
                    errors.Add($"BaseRecipes[{i}].Quantity: מתכון בסיס {i + 1} – הכמות חייבת להיות גדולה מ-0");
            }
            return errors;
        }

        /// <summary>Ingredient lines whose quantity is very likely a unit mistake (see <see cref="RecipeUnits.SuspiciousFrom"/>).</summary>
        public static IReadOnlyList<SuspiciousLine> SuspiciousLines(Recipe recipe)
        {
            var result = new List<SuspiciousLine>();
            var ingredients = recipe.Ingredients ?? new List<RecipeIngredient>();
            for (var i = 0; i < ingredients.Count; i++)
            {
                var line = ingredients[i];
                if (RecipeUnits.IsSuspicious(line.Quantity, line.Unit))
                    result.Add(new SuspiciousLine(i, line.IngredientId, line.Quantity, line.Unit,
                        $"שורה {i + 1}: {line.Quantity:0.###} {RecipeUnits.HebrewName(line.Unit)}"));
            }
            return result;
        }
    }
}
