using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BakeryWeb.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class IngredientService : IIngredientService
    {
        private readonly BakeryDbContext _context;
        private readonly LogManager _logManager;
        private readonly IHttpContextAccessor _http;

        public IngredientService(BakeryDbContext context, LogManager logManager, IHttpContextAccessor http)
        {
            _context = context;
            _logManager = logManager;
            _http = http;
        }

        private int? UserId =>
            int.TryParse(_http.HttpContext?.User.FindFirst("userId")?.Value, out var id) ? id : null;

        public async Task<List<Ingredient>> GetAllAsync()
        {
            var uid = UserId;
            return await _context.Ingredients
                .Where(i => i.UserId == null || i.UserId == uid)
                .OrderBy(i => i.Name)
                .ToListAsync();
        }

        public async Task<Ingredient?> GetByIdAsync(int id)
        {
            var uid = UserId;
            return await _context.Ingredients
                .FirstOrDefaultAsync(i => i.Id == id && (i.UserId == null || i.UserId == uid));
        }

        public async Task<Ingredient> CreateAsync(Ingredient ingredient)
        {
            ingredient.UserId = UserId;
            _logManager.LogSuccess(nameof(IngredientService), nameof(CreateAsync), $"קיבלתי אובייקט: {System.Text.Json.JsonSerializer.Serialize(ingredient)}");
            try
            {
                _context.Ingredients.Add(ingredient);
                await _context.SaveChangesAsync();
                _logManager.LogSuccess(nameof(IngredientService), nameof(CreateAsync), "נשמר בהצלחה");
                return ingredient;
            }
            catch (Exception ex)
            {
                _logManager.LogError(nameof(IngredientService), nameof(CreateAsync), $"שגיאה: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
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
            existing.StockUnit = ingredient.StockUnit;
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
