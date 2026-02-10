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
        private readonly CostCalculatorService _costCalculator;

        public RecipeService(BakeryDbContext db, CostCalculatorService costCalculator)
        {
            _db = db;
            _costCalculator = costCalculator;
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
                        Console.WriteLine($"         - IngredientId={ri.IngredientId}, Qty={ri.Quantity}, Unit={ri.Unit}, Ingredient.Name={ri.Ingredient?.Name ?? "null"}");
                        // חישוב עלות הרכיב
                        if (ri.Ingredient != null)
                        {
                            ri.Cost = _costCalculator.CalculateIngredientCost(ri);
                            Console.WriteLine($"         ✅ Calculated Cost: {ri.Cost}");
                        }
                    }
                }
                Console.WriteLine($"      Steps: {r.Steps?.Count ?? 0}");

                // חישוב עלויות
                var costs = _costCalculator.CalculateRecipeCost(r);
                if (costs != null)
                {
                    r.IngredientsCost = costs.IngredientsCost;
                    r.LaborCost = costs.LaborCost;
                    r.OverheadCost = costs.OverheadCost;
                    r.PackagingCost = costs.PackagingCost;
                    r.TotalCost = costs.TotalCost;
                    r.CostPerUnit = costs.CostPerUnit;
                }
            }
            Console.WriteLine(">>> RecipeService.GetAllAsync END\n");
            return recipes;
        }

        public async Task<Recipe?> GetByIdAsync(int id)
        {
            var recipe = await _db.Recipes
                .Include(r => r.Ingredients)
                .ThenInclude(ri => ri.Ingredient)
                .Include(r => r.Steps)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe != null)
            {
                // חישוב עלות כל רכיב
                if (recipe.Ingredients != null)
                {
                    foreach (var ri in recipe.Ingredients)
                    {
                        if (ri.Ingredient != null)
                        {
                            ri.Cost = _costCalculator.CalculateIngredientCost(ri);
                            Console.WriteLine($"   GetByIdAsync - Ingredient: {ri.Ingredient.Name}, Cost: {ri.Cost}");
                        }
                    }
                }

                // חישוב עלויות
                var costs = _costCalculator.CalculateRecipeCost(recipe);
                if (costs != null)
                {
                    recipe.IngredientsCost = costs.IngredientsCost;
                    recipe.LaborCost = costs.LaborCost;
                    recipe.OverheadCost = costs.OverheadCost;
                    recipe.PackagingCost = costs.PackagingCost;
                    recipe.TotalCost = costs.TotalCost;
                    recipe.CostPerUnit = costs.CostPerUnit;
                }
            }

            return recipe;
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
                    Quantity = ri.Quantity,
                    Unit = ri.Unit // הוסף את Unit
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
