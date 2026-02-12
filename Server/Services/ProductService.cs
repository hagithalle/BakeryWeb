using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Server.Controllers;
using Server.Data;
using Server.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Services
{
    public class ProductService : IProductService
    {
        private readonly BakeryDbContext _db;
        private readonly CostCalculatorService _costCalculator;
        private readonly IConfiguration _configuration;
        private readonly decimal _vatRate;
        private readonly string _uploadPath;

        public ProductService(BakeryDbContext db, CostCalculatorService costCalculator, IConfiguration configuration)
        {
            _db = db;
            _costCalculator = costCalculator;
            _configuration = configuration;
            _vatRate = configuration.GetValue<decimal>("PricingSettings:VatRate", 0.17m);
            _uploadPath = configuration.GetValue<string>("FileUpload:Path") ?? "Uploads/Products";
        }

        public async Task<Product> CreateAsync(CreateProductRequest request)
        {
            // יצירת המוצר החדש
            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                ProductType = (ProductType)request.ProductType,
                RecipeId = request.RecipeId,
                RecipeUnitsQuantity = request.RecipeUnits,  // מפה RecipeUnits → RecipeUnitsQuantity
                PackagingId = request.PackagingId,
                PackagingTimeMinutes = request.PackagingTimeMinutes,
                ProfitMarginPercent = request.ProfitMarginPercent,
                ManualSellingPrice = request.ManualSellingPrice
            };

            // שמירת תמונה אם יש
            if (request.imageFile != null && request.imageFile.Length > 0)
            {
                try
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.imageFile.FileName);
                    var filePath = Path.Combine(_uploadPath, fileName);

                    // יצירת התיקייה אם לא קיימת
                    Directory.CreateDirectory(_uploadPath);

                    // שמירת הקובץ
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.imageFile.CopyToAsync(stream);
                    }

                    product.ImageUrl = $"/uploads/products/{fileName}";
                    Console.WriteLine($"✓ Image saved: {product.ImageUrl}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"✗ Error saving image: {ex.Message}");
                    throw;
                }
            }

            // הוספת המוצר לבסיס הנתונים
            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            Console.WriteLine($"✓ Product created with ID: {product.Id}");

            // הוספת פריטי המארז אם זה סוג Package
            if ((ProductType)request.ProductType == ProductType.Package && request.PackageItems != null && request.PackageItems.Any())
            {
                var itemIds = request.PackageItems.Select(item => item.RecipeId).Distinct().ToList();
                var existingItemIds = await _db.Recipes
                    .Where(r => itemIds.Contains(r.Id))
                    .Select(r => r.Id)
                    .ToListAsync();
                var missingItemIds = itemIds.Except(existingItemIds).ToList();
                if (missingItemIds.Count > 0)
                {
                    throw new InvalidOperationException($"Package items reference missing recipes: {string.Join(", ", missingItemIds)}");
                }

                Console.WriteLine($"  Adding {request.PackageItems.Count} package items...");
                foreach (var item in request.PackageItems)
                {
                    var packageItem = new PackageItem
                    {
                        ProductId = product.Id,
                        RecipeId = item.RecipeId,
                        Quantity = item.Quantity
                    };
                    _db.PackageItems.Add(packageItem);
                    Console.WriteLine($"    ✓ PackageItem: RecipeId={item.RecipeId}, Qty={item.Quantity}");
                }
                await _db.SaveChangesAsync();
            }

            // הוספת אריזה נוספת
            if (request.AdditionalPackaging != null && request.AdditionalPackaging.Any())
            {
                Console.WriteLine($"  Adding {request.AdditionalPackaging.Count} additional packaging items...");
                foreach (var item in request.AdditionalPackaging)
                {
                    var packaging = new ProductAdditionalPackaging
                    {
                        ProductId = product.Id,
                        PackagingId = item.PackagingId,
                        Quantity = item.Quantity
                    };
                    _db.ProductAdditionalPackagings.Add(packaging);
                    Console.WriteLine($"    ✓ AdditionalPackaging: PackagingId={item.PackagingId}, Qty={item.Quantity}");
                }
                await _db.SaveChangesAsync();
            }

            // חישוב עלויות
            var updatedProduct = await GetByIdAsync(product.Id);
            return updatedProduct!;
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
                .Include(p => p.PackageItems)
                    .ThenInclude(pi => pi.Recipe)
                        .ThenInclude(r => r.Ingredients)
                            .ThenInclude(ri => ri.Ingredient)
                .Include(p => p.AdditionalPackaging)
                    .ThenInclude(ap => ap.Packaging)
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
                .Include(p => p.PackageItems)
                    .ThenInclude(pi => pi.Recipe)
                        .ThenInclude(r => r.Ingredients)
                            .ThenInclude(ri => ri.Ingredient)
                .Include(p => p.AdditionalPackaging)
                    .ThenInclude(ap => ap.Packaging)
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
            var existing = await _db.Products
                .Include(p => p.PackageItems)
                .Include(p => p.AdditionalPackaging)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (existing == null) return false;

            // עדכון שדות בסיסיים
            existing.Name = product.Name;
            existing.ProductType = product.ProductType;
            existing.RecipeId = product.RecipeId;
            existing.RecipeUnitsQuantity = product.RecipeUnitsQuantity;
            existing.PackagingId = product.PackagingId;
            existing.PackagingTimeMinutes = product.PackagingTimeMinutes;
            existing.ImageUrl = product.ImageUrl;
            existing.Description = product.Description;
            existing.Category = product.Category;
            existing.ProfitMarginPercent = product.ProfitMarginPercent;
            existing.ManualSellingPrice = product.ManualSellingPrice;

            // עדכון PackageItems אם יש
            if (product.PackageItems != null)
            {
                var itemIds = product.PackageItems
                    .Select(item => item.RecipeId)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();
                var existingItemIds = await _db.Recipes
                    .Where(r => itemIds.Contains(r.Id))
                    .Select(r => r.Id)
                    .ToListAsync();
                var missingItemIds = itemIds.Except(existingItemIds).ToList();
                if (missingItemIds.Count > 0)
                {
                    throw new InvalidOperationException($"Package items reference missing recipes: {string.Join(", ", missingItemIds)}");
                }

                // מחיקת פריטים ישנים
                _db.PackageItems.RemoveRange(existing.PackageItems);
                
                // הוספת חדשים
                foreach (var item in product.PackageItems)
                {
                    _db.PackageItems.Add(new PackageItem
                    {
                        ProductId = id,
                        RecipeId = item.RecipeId,
                        Quantity = item.Quantity
                    });
                }
            }

            // עדכון AdditionalPackaging אם יש
            if (product.AdditionalPackaging != null)
            {
                // מחיקת פריטים ישנים
                _db.ProductAdditionalPackagings.RemoveRange(existing.AdditionalPackaging);
                
                // הוספת חדשים
                foreach (var item in product.AdditionalPackaging)
                {
                    _db.ProductAdditionalPackagings.Add(new ProductAdditionalPackaging
                    {
                        ProductId = id,
                        PackagingId = item.PackagingId,
                        Quantity = item.Quantity
                    });
                }
            }

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
