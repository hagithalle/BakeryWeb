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
            Console.WriteLine($"\n>>> RecipeService.CreateAsync START");
            Console.WriteLine($"   Recipe: Name={recipe.Name}, OutputUnits={recipe.OutputUnits}");
            
            _db.Recipes.Add(recipe);
            await _db.SaveChangesAsync();
            
            Console.WriteLine($"   ✅ Recipe saved with ID: {recipe.Id}");

            // שמור את החומרים
            Console.WriteLine($"   Ingredients count: {recipe.Ingredients?.Count ?? 0}");
            if (recipe.Ingredients != null && recipe.Ingredients.Count > 0)
            {
                foreach (var ri in recipe.Ingredients)
                {
                    Console.WriteLine($"      Adding Ingredient: ID={ri.IngredientId}, Qty={ri.Quantity}");
                    ri.Id = 0; // Ensure new PK
                    ri.RecipeId = recipe.Id;
                    _db.RecipeIngredients.Add(ri);
                }
                await _db.SaveChangesAsync();
                Console.WriteLine($"   ✅ {recipe.Ingredients.Count} ingredients saved");
            }
            else
            {
                Console.WriteLine($"   ℹ️ No ingredients to save");
            }
            
            // שמור את השלבים
            Console.WriteLine($"   Steps count: {recipe.Steps?.Count ?? 0}");
            if (recipe.Steps != null && recipe.Steps.Count > 0)
            {
                foreach (var rs in recipe.Steps)
                {
                    Console.WriteLine($"      Adding Step: Order={rs.Order}, Desc={rs.Description}");
                    rs.Id = 0; // Ensure new PK
                    rs.RecipeId = recipe.Id;
                    _db.RecipeSteps.Add(rs);
                }
                await _db.SaveChangesAsync();
                Console.WriteLine($"   ✅ {recipe.Steps.Count} steps saved");
            }
            else
            {
                Console.WriteLine($"   ℹ️ No steps to save");
            }
            
            Console.WriteLine($">>> RecipeService.CreateAsync END\n");
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
            Console.WriteLine("\n>>> RecipeService.GetAllAsync START");
            var recipes = await _db.Recipes
                .Include(r => r.Ingredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.Steps)
                .ToListAsync();
            
            Console.WriteLine($"   Found {recipes.Count} recipes");
            foreach (var r in recipes)
            {
                Console.WriteLine($"   Recipe ID={r.Id}, Name={r.Name}");
                Console.WriteLine($"      Ingredients: {r.Ingredients?.Count ?? 0}");
                if (r.Ingredients != null)
                {
                    foreach (var ri in r.Ingredients)
                    {
                        Console.WriteLine($"         - IngredientId={ri.IngredientId}, Qty={ri.Quantity}, Ingredient.Name={ri.Ingredient?.Name ?? "null"}");
                    }
                }
                Console.WriteLine($"      Steps: {r.Steps?.Count ?? 0}");
            }
            Console.WriteLine(">>> RecipeService.GetAllAsync END\n");
            return recipes;
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
            existing.Description = recipe.Description;
            existing.Category = recipe.Category;
            existing.OutputUnits = recipe.OutputUnits;
            existing.PrepTime = recipe.PrepTime;
            existing.BakeTime = recipe.BakeTime;
            existing.Temperature = recipe.Temperature;
            existing.RecipeType = recipe.RecipeType;
            if (!string.IsNullOrWhiteSpace(recipe.ImageUrl))
            {
                existing.ImageUrl = recipe.ImageUrl;
            }

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
