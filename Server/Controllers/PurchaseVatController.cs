using Microsoft.AspNetCore.Mvc;
using Server.Services.Pricing;

namespace Server.Controllers
{
    /// <summary>Bulk review of the VAT information of the signed-in user's purchases.</summary>
    [ApiController]
    [Route("api/purchase-vat")]
    public class PurchaseVatController : ControllerBase
    {
        private readonly PurchaseVatService _service;

        public PurchaseVatController(PurchaseVatService service)
        {
            _service = service;
        }

        /// <summary>Every ingredient, packaging item and overhead expense with its entered price and effective cost.</summary>
        [HttpGet("review")]
        public async Task<IActionResult> Get() => Ok(await _service.GetReviewAsync());

        /// <summary>Effective costs for proposed choices. Nothing is saved.</summary>
        [HttpPost("review/preview")]
        public async Task<IActionResult> Preview([FromBody] PurchaseVatChangesRequest request) =>
            Ok(await _service.PreviewAsync(request.Items ?? new()));

        /// <summary>Saves only the listed items, all or nothing; requires "confirmed": true.</summary>
        [HttpPut("review")]
        public async Task<IActionResult> Apply([FromBody] PurchaseVatChangesRequest request) =>
            Ok(await _service.ApplyAsync(request.Items ?? new(), request.Confirmed));
    }

    public class PurchaseVatChangesRequest
    {
        public List<PurchaseVatService.Change>? Items { get; set; }
        public bool Confirmed { get; set; }
    }
}
