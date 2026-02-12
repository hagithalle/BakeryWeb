using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                var created = await _service.CreateAsync(request);
                return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Product product)
        {
            var ok = await _service.UpdateAsync(id, product);
            return ok ? NoContent() : NotFound();
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
    /// </summary>
    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ProductType { get; set; } // 0 = Single, 1 = Package
        public int? RecipeId { get; set; }
        public int RecipeUnits { get; set; } = 1;
        public int? PackagingId { get; set; }
        public int? PackagingTimeMinutes { get; set; }
        public string? Category { get; set; }
        public decimal ProfitMarginPercent { get; set; }
        public decimal? ManualSellingPrice { get; set; }
        public IFormFile? imageFile { get; set; }

        // Package Items
        public List<PackageItemRequest>? PackageItems { get; set; }

        // Additional Packaging
        public List<AdditionalPackagingRequest>? AdditionalPackaging { get; set; }
    }

    public class PackageItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class AdditionalPackagingRequest
    {
        public int PackagingId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
