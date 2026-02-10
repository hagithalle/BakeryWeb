using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Server.Services
{
    public class ProductService : IProductService
    {
        private readonly BakeryDbContext _db;
        private readonly CostCalculatorService _costCalculator;

        public ProductService(BakeryDbContext db, CostCalculatorService costCalculator)
        {
            _db = db;
            _costCalculator = costCalculator;
        }

        public async Task<Product> CreateAsync(Product product)
        {
            _db.Products.Add(product);
            await _db.SaveChangesAsync();
            return product;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _db.Products.FindAsync(id);
            if (existing == null) return false;
            _db.Products.Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            var products = await _db.Products
                .Include(p => p.Recipe)
                    .ThenInclude(r => r.Ingredients)
                        .ThenInclude(ri => ri.Ingredient)
                .Include(p => p.Packaging)
                .ToListAsync();

            // חישוב עלויות לכל מוצר
            foreach (var product in products)
            {
                var costs = _costCalculator.CalculateProductCost(product);
                if (costs != null)
                {
                    product.RecipeIngredientsCost = costs.RecipeIngredientsCost;
                    product.RecipeLaborCost = costs.RecipeLaborCost;
                    product.RecipeOverheadCost = costs.RecipeOverheadCost;
                    product.PackagingCost = costs.PackagingCost;
                    product.PackagingLaborCost = costs.PackagingLaborCost;
                    product.TotalCost = costs.TotalCost;
                }
            }

            return products;
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            var product = await _db.Products
                .Include(p => p.Recipe)
                    .ThenInclude(r => r.Ingredients)
                        .ThenInclude(ri => ri.Ingredient)
                .Include(p => p.Packaging)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product != null)
            {
                // חישוב עלויות
                var costs = _costCalculator.CalculateProductCost(product);
                if (costs != null)
                {
                    product.RecipeIngredientsCost = costs.RecipeIngredientsCost;
                    product.RecipeLaborCost = costs.RecipeLaborCost;
                    product.RecipeOverheadCost = costs.RecipeOverheadCost;
                    product.PackagingCost = costs.PackagingCost;
                    product.PackagingLaborCost = costs.PackagingLaborCost;
                    product.TotalCost = costs.TotalCost;
                }
            }

            return product;
        }

        public async Task<bool> UpdateAsync(int id, Product product)
        {
            var existing = await _db.Products.FindAsync(id);
            if (existing == null) return false;

            existing.Name = product.Name;
            existing.RecipeId = product.RecipeId;
            existing.RecipeUnitsQuantity = product.RecipeUnitsQuantity;
            existing.PackagingId = product.PackagingId;
            existing.PackagingTimeMinutes = product.PackagingTimeMinutes;

            await _db.SaveChangesAsync();
            return true;
        }
    }
}
