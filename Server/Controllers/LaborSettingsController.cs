using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LaborSettingsController : ControllerBase
    {
        private readonly ILaborSettingsService _service;

        public LaborSettingsController(ILaborSettingsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var settings = await _service.GetAsync();
            return Ok(settings);
        }

        [HttpPost]
        public async Task<IActionResult> Upsert(LaborSettings settings)
        {
            var result = await _service.UpsertAsync(settings);
            return Ok(result);
        }
    }
}
