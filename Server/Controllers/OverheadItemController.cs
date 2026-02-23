using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/overheaditem")]
    public class OverheadItemController : ControllerBase
    {
        private readonly IOverheadItemService _service;
        private readonly ILogger<OverheadItemController> _logger;

        public OverheadItemController(IOverheadItemService service, ILogger<OverheadItemController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            foreach (var item in list)
            {
                _logger.LogInformation($"[GET] FixedExpenseCard expense: {{title: '{item.Name}', category: '{item.Category}', amount: {item.MonthlyCost}, type: '{item.Type}', isActive: {item.IsActive}, id: {item.Id}}}");
            }
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
        public async Task<IActionResult> Create(OverheadItem item)
        {
            var created = await _service.CreateAsync(item);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, OverheadItem item)
        {
            var ok = await _service.UpdateAsync(id, item);
            _logger.LogInformation($"[UPDATE] FixedExpenseCard expense: {{title: '{item.Name}', category: '{item.Category}', amount: {item.MonthlyCost}, type: '{item.Type}', isActive: {item.IsActive}, id: {item.Id}}}");
            return ok ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }
    }
}
