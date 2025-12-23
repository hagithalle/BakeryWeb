using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Server.Services
{
    public class RecipeService : IRecipeService
    {
        private readonly BakeryDbContext _db;

        public RecipeService(BakeryDbContext db)
        {
            _db = db;
        }

        public async Task<Recipe> CreateAsync(Recipe recipe)
        {
            _db.Recipes.Add(recipe);
            await _db.SaveChangesAsync();
            return recipe;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _db.Recipes.FindAsync(id);
            if (existing == null) return false;
            _db.Recipes.Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Recipe>> GetAllAsync()
        {
            return await _db.Recipes
                .Include(r => r.Ingredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.Steps)
                .ToListAsync();
        }

        public async Task<Recipe?> GetByIdAsync(int id)
        {
            return await _db.Recipes
                .Include(r => r.Ingredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.Steps)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<bool> UpdateAsync(int id, Recipe recipe)
        {
            var existing = await _db.Recipes
                .Include(r => r.Ingredients)
                .Include(r => r.Steps)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existing == null) return false;

            existing.Name = recipe.Name;
            existing.OutputUnits = recipe.OutputUnits;

            // Replace ingredients: simple approach - remove existing and add new
            _db.RecipeIngredients.RemoveRange(existing.Ingredients);
            existing.Ingredients.Clear();
            foreach (var ri in recipe.Ingredients)
            {
                existing.Ingredients.Add(new RecipeIngredient
                {
                    IngredientId = ri.IngredientId,
                    Quantity = ri.Quantity
                });
            }

            // Replace steps
            _db.RecipeSteps.RemoveRange(existing.Steps);
            existing.Steps.Clear();
            foreach (var rs in recipe.Steps)
            {
                existing.Steps.Add(new RecipeStep
                {
                    Order = rs.Order,
                    Description = rs.Description,
                    EstimatedMinutes = rs.EstimatedMinutes
                });
            }

            await _db.SaveChangesAsync();
            return true;
        }
    }
}
