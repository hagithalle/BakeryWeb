using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    /// <summary>
    /// Service that provides CRUD operations for <see cref="Ingredient"/> entities.
    /// </summary>
    public class IngredientService : IIngredientService
    {
        private readonly BakeryDbContext _context;
        public IngredientService(BakeryDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Returns all ingredients ordered by name.
        /// </summary>
        public async Task<List<Ingredient>> GetAllAsync()
        {
            return await _context.Ingredients
                .OrderBy(i => i.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves a single ingredient by id or null if not found.
        /// </summary>
        public async Task<Ingredient?> GetByIdAsync(int id)
        {
            return await _context.Ingredients.FindAsync(id);
        }

        /// <summary>
        /// Creates a new ingredient and saves it to the database.
        /// </summary>
        public async Task<Ingredient> CreateAsync(Ingredient ingredient)
        {
            _context.Ingredients.Add(ingredient);
            await _context.SaveChangesAsync();
            return ingredient;
        }

        /// <summary>
        /// Updates an existing ingredient. Returns true when update succeeds.
        /// </summary>
        public async Task<bool> UpdateAsync(int id, Ingredient ingredient)
        {
            var existing = await _context.Ingredients.FindAsync(id);
            if (existing == null) return false;

            existing.Name = ingredient.Name;
            existing.PricePerKg = ingredient.PricePerKg;
            existing.StockQuantity = ingredient.StockQuantity;
            existing.Unit = ingredient.Unit;
            existing.Category = ingredient.Category;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Deletes an ingredient by id. Returns true when deletion succeeds.
        /// </summary>
        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.Ingredients.FindAsync(id);
            if (existing == null) return false;

            _context.Ingredients.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
