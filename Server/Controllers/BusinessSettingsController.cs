using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services.Pricing;

namespace Server.Controllers
{
    /// <summary>The signed-in user's own pricing settings (VAT status and default markup).</summary>
    [ApiController]
    [Route("api/business-settings")]
    public class BusinessSettingsController : ControllerBase
    {
        private readonly BusinessSettingsService _settings;
        private readonly PricingService _pricing;

        public BusinessSettingsController(BusinessSettingsService settings, PricingService pricing)
        {
            _settings = settings;
            _pricing = pricing;
        }

        [HttpGet]
        public IActionResult Get() => Ok(Describe());

        [HttpPut]
        public async Task<IActionResult> Save([FromBody] SaveBusinessSettingsRequest request)
        {
            if (request.VatStatus == null || request.DefaultMarkupPercent == null)
                return BadRequest(new { message = "יש לבחור סטטוס מע\"מ ולהזין אחוז תוספת על העלות" });
            try
            {
                await _settings.SaveAsync(request.VatStatus.Value, request.DefaultMarkupPercent.Value);
            }
            catch (PricingValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            return Ok(Describe());
        }

        private object Describe()
        {
            var today = _pricing.TodaysVatRate();
            return new
            {
                vatStatus = _settings.VatStatus,                         // null until chosen
                isConfigured = _settings.VatStatus != null,
                defaultMarkupPercent = _settings.EffectiveDefaultMarkup, // 0.15 until changed
                currentVatRate = today?.Rate,
                currentVatRateEffectiveFrom = today?.EffectiveFrom,
            };
        }
    }

    public class SaveBusinessSettingsRequest
    {
        public VatStatus? VatStatus { get; set; }
        public decimal? DefaultMarkupPercent { get; set; }
    }
}
