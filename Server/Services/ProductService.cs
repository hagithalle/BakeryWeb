using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
        private readonly decimal _vatRate;

        public ProductService(BakeryDbContext db, CostCalculatorService costCalculator, IConfiguration configuration)
        {
            _db = db;
            _costCalculator = costCalculator;
            _vatRate = configuration.GetValue<decimal>("PricingSettings:VatRate", 0.17m);
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
                    product.PackagingOverheadCost = costs.PackagingOverheadCost;
                    product.TotalCost = costs.TotalCost;

                    // חישוב מחיר מכירה
                    CalculateSellingPrice(product);
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
                    product.PackagingOverheadCost = costs.PackagingOverheadCost;
                    product.TotalCost = costs.TotalCost;

                    // חישוב מחיר מכירה
                    CalculateSellingPrice(product);
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
            existing.ImageUrl = product.ImageUrl;
            existing.Description = product.Description;
            existing.ProfitMarginPercent = product.ProfitMarginPercent;
            existing.ManualSellingPrice = product.ManualSellingPrice;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RecalculateSellingPriceAsync(int id)
        {
            var product = await _db.Products
                .Include(p => p.Recipe)
                    .ThenInclude(r => r.Ingredients)
                        .ThenInclude(ri => ri.Ingredient)
                .Include(p => p.Packaging)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return false;

            var costs = _costCalculator.CalculateProductCost(product);
            if (costs != null)
            {
                product.RecipeIngredientsCost = costs.RecipeIngredientsCost;
                product.RecipeLaborCost = costs.RecipeLaborCost;
                product.RecipeOverheadCost = costs.RecipeOverheadCost;
                product.PackagingCost = costs.PackagingCost;
                product.PackagingLaborCost = costs.PackagingLaborCost;
                product.PackagingOverheadCost = costs.PackagingOverheadCost;
                product.TotalCost = costs.TotalCost;
            }

            product.ManualSellingPrice = CalculateAutomaticSellingPrice(product);
            await _db.SaveChangesAsync();
            return true;
        }

        // חישוב מחיר מכירה (עם רווח ומע"מ)
        private void CalculateSellingPrice(Product product)
        {
            // אם הוגדר מחיר ידני, השתמש בו
            if (product.ManualSellingPrice.HasValue && product.ManualSellingPrice.Value > 0)
            {
                product.SellingPriceBeforeVAT = product.ManualSellingPrice.Value;
                product.SellingPriceWithVAT = product.ManualSellingPrice.Value * (1 + _vatRate);
                product.ProfitAmount = product.ManualSellingPrice.Value - product.TotalCost;
            }
            else
            {
                // חישוב אוטומטי לפי אחוז רווח
                product.ProfitAmount = product.TotalCost * product.ProfitMarginPercent;
                product.SellingPriceBeforeVAT = product.TotalCost + product.ProfitAmount;
                product.SellingPriceWithVAT = product.SellingPriceBeforeVAT * (1 + _vatRate);
            }
        }

        private decimal CalculateAutomaticSellingPrice(Product product)
        {
            return product.TotalCost + (product.TotalCost * product.ProfitMarginPercent);
        }
    }
}
