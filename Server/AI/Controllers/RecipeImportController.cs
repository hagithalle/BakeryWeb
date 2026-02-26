using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Exceptions;
using BakeryWeb.Server.AI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BakeryWeb.Server.Controllers
{
    [ApiController]
    [Route("api/recipes/import")]
    public class RecipeImportController : ControllerBase
    {
        private readonly RecipeImportService _importService;

        public RecipeImportController(RecipeImportService importService)
        {
            _importService = importService;
        }

        // DTOs לבקשות
        public record ImportTextRequest(string Text);
        public record ImportUrlRequest(string Url);

        /// <summary>
        /// ייבוא מתכון מטקסט חופשי (ממשק עם תיבת טקסט)
        /// </summary>
        [HttpPost("text")]
        public async Task<ActionResult<RecipeDto>> ImportFromText([FromBody] ImportTextRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                    return BadRequest("יש לספק טקסט לניתוח");

                var result = await _importService.ImportFromTextAsync(request.Text);

                if (result == null)
                    return BadRequest("לא הצלחנו לחלץ מתכון מהטקסט");

                return Ok(result);
            }
            catch (AiApiKeyMissingException)
            {
                return StatusCode(500, "חסר מפתח AI בשרת. נא להגדיר אותו או לפנות לתמיכה.");
            }
            catch (Exception)
            {
                return StatusCode(500, "אירעה שגיאה, נא לבדוק הגדרות שרת או לפנות לתמיכה.");
            }
        }

        /// <summary>
        /// ייבוא מתכון מ-URL (דף אתר)
        /// </summary>
        [HttpPost("url")]
        public async Task<ActionResult<RecipeDto>> ImportFromUrl([FromBody] ImportUrlRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Url))
                    return BadRequest("יש לספק כתובת URL");

                var result = await _importService.ImportFromUrlAsync(request.Url);

                if (result == null)
                    return BadRequest("לא הצלחנו לחלץ מתכון מהכתובת");

                return Ok(result);
            }
            catch (AiApiKeyMissingException)
            {
                return StatusCode(500, "חסר מפתח AI בשרת. נא להגדיר אותו או לפנות לתמיכה.");
            }
            catch (Exception)
            {
                return StatusCode(500, "אירעה שגיאה, נא לבדוק הגדרות שרת או לפנות לתמיכה.");
            }
        }

        /// <summary>
        /// ייבוא מתכון מקובץ (PDF / DOCX / TXT וכו') – form-data
        /// </summary>
        [HttpPost("file")]
        [RequestSizeLimit(20_000_000)] // אופציונלי: עד 20MB
        public async Task<ActionResult<RecipeDto>> ImportFromFile([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("יש להעלות קובץ");

                var result = await _importService.ImportFromFileAsync(file);

                if (result == null)
                    return BadRequest("לא הצלחנו לחלץ מתכון מהקובץ");

                return Ok(result);
            }
            catch (AiApiKeyMissingException)
            {
                return StatusCode(500, "חסר מפתח AI בשרת. נא להגדיר אותו או לפנות לתמיכה.");
            }
            catch (Exception)
            {
                return StatusCode(500, "אירעה שגיאה, נא לבדוק הגדרות שרת או לפנות לתמיכה.");
            }
        }

        /// <summary>
        /// ייבוא מתכון מתמונה (צילום מסך / תמונה של דף מתכון)
        /// </summary>
        [HttpPost("image")]
        [RequestSizeLimit(20_000_000)]
        public async Task<ActionResult<RecipeDto>> ImportFromImage([FromForm] IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest("יש להעלות תמונה");

                var result = await _importService.ImportFromImageAsync(image);

                if (result == null)
                    return BadRequest("לא הצלחנו לחלץ טקסט מהתמונה");

                return Ok(result);
            }
            catch (AiApiKeyMissingException)
            {
                return StatusCode(500, "חסר מפתח AI בשרת. נא להגדיר אותו או לפנות לתמיכה.");
            }
            catch (Exception)
            {
                return StatusCode(500, "אירעה שגיאה, נא לבדוק הגדרות שרת או לפנות לתמיכה.");
            }
        }
    }
}