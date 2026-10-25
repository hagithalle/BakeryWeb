using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Validation
{
    /// <summary>
    /// Thrown before anything is written when a request references a row the current user does not own.
    /// Missing rows and other users' rows produce exactly the same error, so a caller cannot learn whether
    /// another user's row with that id exists.
    /// </summary>
    public sealed class InvalidReferenceException : Exception
    {
        public const string UserMessage = "אחד או יותר מהפריטים המקושרים אינם קיימים";

        public InvalidReferenceException(IReadOnlyList<string> fields) : base(UserMessage)
        {
            Fields = fields;
        }

        /// <summary>Request fields with an invalid reference, e.g. "Ingredients[0].IngredientId".</summary>
        public IReadOnlyList<string> Fields { get; }
    }

    /// <summary>
    /// Checks that every id a recipe or product refers to belongs to the current user. All lookups go through
    /// BakeryDbContext's per-user query filters, so another user's row and a non-existent row look the same.
    /// Must be called before any change is saved.
    /// </summary>
    public sealed class ReferenceValidator
    {
        private readonly BakeryDbContext _db;

        public ReferenceValidator(BakeryDbContext db)
        {
            _db = db;
        }

        /// <param name="recipeId">The recipe being updated, or null when creating a new recipe.</param>
        public async Task EnsureRecipeReferencesAsync(Recipe recipe, int? recipeId)
        {
            var errors = new List<string>();
            var ingredients = recipe.Ingredients ?? new List<RecipeIngredient>();
            var baseRecipes = recipe.BaseRecipes ?? new List<RecipeItem>();

            var ownIngredients = await OwnedIdsAsync(_db.Ingredients, ingredients.Select(i => i.IngredientId));
            for (var i = 0; i < ingredients.Count; i++)
                if (!ownIngredients.Contains(ingredients[i].IngredientId))
                    errors.Add($"Ingredients[{i}].IngredientId");

            var ownRecipes = await OwnedIdsAsync(_db.Recipes, baseRecipes.Select(b => b.BaseRecipeId));
            for (var i = 0; i < baseRecipes.Count; i++)
            {
                var baseId = baseRecipes[i].BaseRecipeId;
                if (!ownRecipes.Contains(baseId) || baseId == recipeId)
                    errors.Add($"BaseRecipes[{i}].BaseRecipeId");
            }

            // A new recipe cannot be part of a cycle yet; an existing one must not (indirectly) contain itself.
            if (errors.Count == 0 && recipeId != null && baseRecipes.Count > 0
                && await ReachesAsync(baseRecipes.Select(b => b.BaseRecipeId), recipeId.Value))
                errors.Add("BaseRecipes");

            if (errors.Count > 0) throw new InvalidReferenceException(errors);
        }

        public async Task EnsureProductReferencesAsync(
            int? recipeId,
            int? packagingId,
            IReadOnlyList<int> packageItemRecipeIds,
            IReadOnlyList<int> additionalPackagingIds)
        {
            var errors = new List<string>();

            var recipeIds = packageItemRecipeIds.Concat(recipeId is int r ? new[] { r } : Array.Empty<int>());
            var ownRecipes = await OwnedIdsAsync(_db.Recipes, recipeIds);
            if (recipeId != null && !ownRecipes.Contains(recipeId.Value)) errors.Add("RecipeId");
            for (var i = 0; i < packageItemRecipeIds.Count; i++)
                if (!ownRecipes.Contains(packageItemRecipeIds[i])) errors.Add($"PackageItems[{i}].RecipeId");

            var packagingIds = additionalPackagingIds.Concat(packagingId is int p ? new[] { p } : Array.Empty<int>());
            var ownPackaging = await OwnedIdsAsync(_db.Packagings, packagingIds);
            if (packagingId != null && !ownPackaging.Contains(packagingId.Value)) errors.Add("PackagingId");
            for (var i = 0; i < additionalPackagingIds.Count; i++)
                if (!ownPackaging.Contains(additionalPackagingIds[i])) errors.Add($"AdditionalPackaging[{i}].PackagingId");

            if (errors.Count > 0) throw new InvalidReferenceException(errors);
        }

        // The DbSet is filtered to the current user, so only the caller's own ids come back.
        private static async Task<HashSet<int>> OwnedIdsAsync<T>(IQueryable<T> set, IEnumerable<int> ids) where T : class
        {
            var wanted = ids.Distinct().ToList();
            if (wanted.Count == 0) return new HashSet<int>();
            var found = await set.Where(e => wanted.Contains(EF.Property<int>(e, "Id"))).Select(e => EF.Property<int>(e, "Id")).ToListAsync();
            return found.ToHashSet();
        }

        /// <summary>True when <paramref name="target"/> is reachable from <paramref name="start"/> through base-recipe lines.</summary>
        private async Task<bool> ReachesAsync(IEnumerable<int> start, int target)
        {
            // The current user's composition graph (small for a bakery); query filters limit it to their recipes.
            var edges = await _db.RecipeItems
                .Select(x => new { x.ComposingRecipeId, x.BaseRecipeId })
                .ToListAsync();
            var children = edges.GroupBy(e => e.ComposingRecipeId).ToDictionary(g => g.Key, g => g.Select(e => e.BaseRecipeId).ToList());

            var seen = new HashSet<int>();
            var queue = new Queue<int>(start);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (current == target) return true;
                if (!seen.Add(current)) continue;
                if (children.TryGetValue(current, out var next))
                    foreach (var n in next) queue.Enqueue(n);
            }
            return false;
        }
    }
}
