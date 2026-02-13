using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _service;

        public ProductController(IProductService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateProductRequest request)
        {
            try
            {
                var packageCount = request.PackageItems?.Count ?? 0;
                var additionalCount = request.AdditionalPackaging?.Count ?? 0;
                var packageIds = request.PackageItems == null
                    ? "(none)"
                    : string.Join(", ", request.PackageItems.Select(item => $"{item.RecipeId}:{item.Quantity}"));
                var additionalIds = request.AdditionalPackaging == null
                    ? "(none)"
                    : string.Join(", ", request.AdditionalPackaging.Select(item => $"{item.PackagingId}:{item.Quantity}"));
                Console.WriteLine($"Create Product Name={request.Name}, Type={request.ProductType}, RecipeId={request.RecipeId}, PackageItems={packageCount}, AdditionalPackaging={additionalCount}");
                Console.WriteLine($"  PackageItems: {packageIds}");
                Console.WriteLine($"  AdditionalPackaging: {additionalIds}");

                var created = await _service.CreateAsync(request);
                return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { error = ex.Message, detail });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Product product)
        {
            try
            {
                var packageCount = product.PackageItems?.Count ?? 0;
                var additionalCount = product.AdditionalPackaging?.Count ?? 0;
                var packageIds = product.PackageItems == null
                    ? "(none)"
                    : string.Join(", ", product.PackageItems.Select(item => $"{item.RecipeId}:{item.Quantity}"));
                var additionalIds = product.AdditionalPackaging == null
                    ? "(none)"
                    : string.Join(", ", product.AdditionalPackaging.Select(item => $"{item.PackagingId}:{item.Quantity}"));
                Console.WriteLine($"Update Product ID={id}, Type={product.ProductType}, RecipeId={product.RecipeId}, PackageItems={packageCount}, AdditionalPackaging={additionalCount}");
                Console.WriteLine($"  PackageItems: {packageIds}");
                Console.WriteLine($"  AdditionalPackaging: {additionalIds}");

                var ok = await _service.UpdateAsync(id, product);
                return ok ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(new { error = ex.Message, detail });
            }
        }

        [HttpPost("{id}/recalculate-price")]
        public async Task<IActionResult> RecalculatePrice(int id)
        {
            var ok = await _service.RecalculateSellingPriceAsync(id);
            return ok ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }
    }

    /// <summary>
    /// Request model for creating a product with form data and file upload
    /// תואם לפורמט ש-Client שולח ב-createProductWithImage
    /// </summary>
    public class CreateProductRequest
    {
        // שדות בסיסיים
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ProductType { get; set; } // 0 = Single, 1 = Package
        public string? Category { get; set; }
        public decimal ProfitMarginPercent { get; set; }
        public decimal? ManualSellingPrice { get; set; }

        // עבור Single type
        public int? RecipeId { get; set; }
        public int RecipeUnits { get; set; } = 1;  // מתאים ל-UnitConversionRate בModel
        public int SaleUnitType { get; set; } = (int)Models.UnitType.Piece;  // סוג היחידה שמוכרים

        // עבור כל סוג
        public int? PackagingId { get; set; }
        public int? PackagingTimeMinutes { get; set; }

        // תמונה
        public IFormFile? imageFile { get; set; }

        // Package Items (עבור Package type)
        public List<PackageItemRequest>? PackageItems { get; set; }

        // Additional Packaging (אריזה נוספת)
        public List<AdditionalPackagingRequest>? AdditionalPackaging { get; set; }
    }

    public class PackageItemRequest
    {
        public int RecipeId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class AdditionalPackagingRequest
    {
        public int PackagingId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
