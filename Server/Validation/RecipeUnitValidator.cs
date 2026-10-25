using Server.Models;

namespace Server.Validation
{
    /// <summary>
    /// Rejects unit values that are not defined in <see cref="UnitOfMeasure"/> when a recipe is saved.
    ///
    /// 0 is the most common invalid value: it is the C#/database default when a unit is omitted, and it was
    /// the default given to rows created before units were stored. It is not a real unit, and the cost
    /// calculator would silently treat it as a quantity in kilograms. Existing invalid rows are not changed;
    /// they can be listed with docs/sql/report-invalid-units.sql and must be fixed explicitly.
    /// </summary>
    public static class RecipeUnitValidator
    {
        public static IReadOnlyList<string> Validate(Recipe recipe)
        {
            var errors = new List<string>();

            var ingredients = recipe.Ingredients ?? new List<RecipeIngredient>();
            for (var i = 0; i < ingredients.Count; i++)
            {
                var unit = ingredients[i].Unit;
                if (!Enum.IsDefined(typeof(UnitOfMeasure), unit))
                    errors.Add($"Ingredients[{i}].Unit: יחידת מידה לא חוקית ({unit}) עבור חומר גלם {ingredients[i].IngredientId}");
            }

            var baseRecipes = recipe.BaseRecipes ?? new List<RecipeItem>();
            for (var i = 0; i < baseRecipes.Count; i++)
            {
                var unit = baseRecipes[i].Unit;
                if (!Enum.IsDefined(unit))
                    errors.Add($"BaseRecipes[{i}].Unit: יחידת מידה לא חוקית ({(int)unit}) עבור מתכון בסיס {baseRecipes[i].BaseRecipeId}");
            }

            return errors;
        }
    }
}
