using BakeryWeb.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Services.Pricing;
using Server.Validation;

namespace Server.Services
{
    public class ProductService : IProductService
    {
        private readonly LogManager _logManager;
        private readonly BakeryDbContext _db;
        private readonly CostCalculatorService _costCalculator;
        private readonly IConfiguration _configuration;
        private readonly ReferenceValidator _references;
        private readonly PricingService _pricing;
        private readonly string _uploadPath;

        public ProductService(BakeryDbContext db, CostCalculatorService costCalculator, IConfiguration configuration, LogManager logManager, ReferenceValidator references, PricingService pricing)
        {
            _references = references;
            _db = db;
            _costCalculator = costCalculator;
            _configuration = configuration;
            _pricing = pricing;
            _uploadPath = configuration.GetValue<string>("FileUpload:Path") ?? "Uploads/Products";
            _logManager = logManager;
        }

        public async Task<Product> CreateAsync(CreateProductRequest request)
        {
            var productType = (ProductType)request.ProductType;
            var packageItems = productType == ProductType.Package
                ? request.PackageItems ?? new List<PackageItemRequest>()
                : new List<PackageItemRequest>();
            var additionalPackaging = request.AdditionalPackaging ?? new List<AdditionalPackagingRequest>();
            var pricingMode = (PricingMode?)request.PricingMode;
            PricingService.Validate(pricingMode, request.ManualSellingPrice, request.ProfitMarginPercent);

            // 1. Every referenced recipe / packaging must belong to the current user - checked before anything is
            //    written to the database or to disk.
            await _references.EnsureProductReferencesAsync(
                request.RecipeId,
                request.PackagingId,
                packageItems.Select(i => i.RecipeId).ToList(),
                additionalPackaging.Select(i => i.PackagingId).ToList());

            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                ProductType = productType,
                Category = request.Category,
                RecipeId = request.RecipeId,
                UnitConversionRate = request.RecipeUnits,
                SaleUnitType = (UnitType)request.SaleUnitType,
                PackagingId = request.PackagingId,
                PackagingTimeMinutes = request.PackagingTimeMinutes,
                ProfitMarginPercent = request.ProfitMarginPercent,
                ManualSellingPrice = request.ManualSellingPrice,
                PricingMode = pricingMode,
                PackageItems = packageItems
                    .Select(i => new PackageItem { RecipeId = i.RecipeId, Quantity = i.Quantity })
                    .ToList(),
                AdditionalPackaging = additionalPackaging
                    .Select(i => new ProductAdditionalPackaging { PackagingId = i.PackagingId, Quantity = i.Quantity })
                    .ToList(),
            };

            // 2. Image file (only after validation succeeded)
            string? savedImagePath = null;
            if (request.imageFile != null && request.imageFile.Length > 0)
            {
                try
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.imageFile.FileName);
                    savedImagePath = Path.Combine(_uploadPath, fileName);

                    Directory.CreateDirectory(_uploadPath);
                    using (var stream = new FileStream(savedImagePath, FileMode.Create))
                    {
                        await request.imageFile.CopyToAsync(stream);
                    }

                    product.ImageUrl = $"/uploads/products/{fileName}";
                    _logManager.LogSuccess(nameof(ProductService), nameof(CreateAsync), $"Image saved: {product.ImageUrl}");
                }
                catch (Exception ex)
                {
                    _logManager.LogError(nameof(ProductService), nameof(CreateAsync), $"Error saving image: {ex.Message}");
                    throw;
                }
            }

            // 3. Product, box items and extra packaging in ONE save (one transaction): all or nothing.
            _db.Products.Add(product);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch
            {
                if (savedImagePath != null && File.Exists(savedImagePath)) File.Delete(savedImagePath);
                throw;
            }
            _logManager.LogSuccess(nameof(ProductService), nameof(CreateAsync),
                $"Product created with ID: {product.Id} ({product.PackageItems.Count} package items, {product.AdditionalPackaging.Count} extra packaging)");

            // חישוב עלויות
            var updatedProduct = await GetByIdAsync(product.Id);
            return updatedProduct!;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
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

            // חישוב עלויות ומחיר מכירה לכל מוצר (המחשבון טוען בעצמו מתכונים, מתכוני בסיס ואריזות)
            foreach (var product in products)
            {
                _pricing.Apply(product, _costCalculator.ApplyProductCosts(product));
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
                _pricing.Apply(product, _costCalculator.ApplyProductCosts(product));
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

            // Checked before anything is changed: every referenced recipe / packaging must be the user's own.
            await _references.EnsureProductReferencesAsync(
                product.RecipeId,
                product.PackagingId,
                (product.PackageItems ?? new List<PackageItem>()).Select(i => i.RecipeId).ToList(),
                (product.AdditionalPackaging ?? new List<ProductAdditionalPackaging>()).Select(i => i.PackagingId).ToList());
            PricingService.Validate(product.PricingMode ?? existing.PricingMode, product.ManualSellingPrice, product.ProfitMarginPercent);

            // עדכון שדות בסיסיים
            existing.Name = product.Name;
            existing.ProductType = product.ProductType;
            existing.RecipeId = product.RecipeId;
            existing.UnitConversionRate = product.UnitConversionRate;
            existing.SaleUnitType = product.SaleUnitType;
            existing.PackagingId = product.PackagingId;
            existing.PackagingTimeMinutes = product.PackagingTimeMinutes;
            existing.ImageUrl = product.ImageUrl;
            existing.Description = product.Description;
            existing.Category = product.Category;
            existing.ProfitMarginPercent = product.ProfitMarginPercent;
            existing.ManualSellingPrice = product.ManualSellingPrice;
            // A request without a mode (older clients, or a legacy product saved without confirming its price)
            // keeps the current mode: a legacy price is only confirmed by explicitly choosing a mode.
            if (product.PricingMode != null)
                existing.PricingMode = product.PricingMode;

            // עדכון PackageItems אם יש
            if (product.PackageItems != null)
            {
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
            // Box items and extra packaging are part of the cost, so they must be loaded too.
            var product = await _db.Products
                .Include(p => p.PackageItems)
                .Include(p => p.AdditionalPackaging)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return false;

            _costCalculator.ApplyProductCosts(product);

            product.ManualSellingPrice = CalculateAutomaticSellingPrice(product);
            await _db.SaveChangesAsync();
            return true;
        }

        public ProductCostPreview PreviewCost(ProductCostPreviewRequest request)
        {
            // A product object that is never added to the context: only used to calculate. Ids the current user
            // does not own are treated like missing ones (the calculator only sees the user's own rows).
            var productType = (ProductType)request.ProductType;
            var draft = new Product
            {
                ProductType = productType,
                RecipeId = productType == ProductType.Package ? null : request.RecipeId,
                UnitConversionRate = request.RecipeUnits,
                PackagingId = request.PackagingId,
                PackagingTimeMinutes = request.PackagingTimeMinutes,
                PackageItems = productType == ProductType.Package
                    ? (request.PackageItems ?? new List<PackageItemRequest>())
                        .Select(i => new PackageItem { RecipeId = i.RecipeId, Quantity = i.Quantity }).ToList()
                    : new List<PackageItem>(),
                AdditionalPackaging = (request.AdditionalPackaging ?? new List<AdditionalPackagingRequest>())
                    .Select(i => new ProductAdditionalPackaging { PackagingId = i.PackagingId, Quantity = i.Quantity }).ToList(),
                PricingMode = (PricingMode?)request.PricingMode,
                ManualSellingPrice = request.ManualSellingPrice,
                ProfitMarginPercent = request.ProfitMarginPercent,
            };
            if (draft.PricingMode is PricingMode mode && !Enum.IsDefined(mode))
                throw new PricingValidationException("אופן התמחור לא תקין");
            var costs = _costCalculator.CalculateProductCost(draft);
            return ProductCostPreview.From(costs, _pricing.Price(draft, costs));
        }

        private decimal CalculateAutomaticSellingPrice(Product product)
        {
            return product.TotalCost + (product.TotalCost * product.ProfitMarginPercent);
        }
    }
}
