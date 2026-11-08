using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services;
using Server.Validation;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/recipe")]
    public class RecipeController : ControllerBase
    {
        private readonly IRecipeService _service;

        public RecipeController(IRecipeService service)
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
        public async Task<IActionResult> Create([FromForm] Recipe recipe, [FromForm] IFormFile? imageFile,
            [FromForm] bool confirmSuspiciousQuantities = false)
        {
            Console.WriteLine("\n========== CREATE START ==========");
            Console.WriteLine($"recipe={recipe}");
            Console.WriteLine($"recipe==null: {recipe == null}");
            
            if (recipe == null)
            {
                Console.WriteLine("❌ Recipe is NULL!");
                return BadRequest("Recipe is null");
            }

            var unitErrors = RecipeUnitValidator.Validate(recipe);
            if (unitErrors.Count > 0)
                return InvalidUnits(unitErrors);
            if (LineProblems(recipe, confirmSuspiciousQuantities) is { } lineProblem)
                return lineProblem;

            Console.WriteLine($"Name: {recipe.Name}");
            Console.WriteLine($"Ingredients: {recipe.Ingredients?.Count ?? 0}");
            Console.WriteLine($"Steps: {recipe.Steps?.Count ?? 0}");
            Console.WriteLine($"BaseRecipes: {recipe.BaseRecipes?.Count ?? 0}");
            if (recipe.BaseRecipes != null && recipe.BaseRecipes.Count > 0)
            {
                foreach (var br in recipe.BaseRecipes)
                {
                    Console.WriteLine($"  BaseRecipe: BaseRecipeId={br.BaseRecipeId}, Qty={br.Quantity}, Unit={br.Unit}");
                }
            }
            Console.WriteLine("========== CREATE END INIT ==========");
            
            try
            {
                Console.WriteLine("📤 Calling _service.CreateAsync...");
                var created = await _service.CreateAsync(recipe);
                Console.WriteLine($"✅ Saved with ID: {created.Id}");
                return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
            }
            catch (InvalidReferenceException ex)
            {
                return InvalidReferences(ex);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] Recipe recipe, [FromForm] IFormFile? imageFile,
            [FromForm] bool confirmSuspiciousQuantities = false, [FromForm] bool confirmRemoveAllIngredients = false)
        {
            Console.WriteLine("\n╔════════════════════════════════════════════════════╗");
            Console.WriteLine($"║   RecipeController.Update - ID: {id,-40}║");
            Console.WriteLine("╚════════════════════════════════════════════════════╝");

            // [1] בדוק ModelState
            Console.WriteLine("\n[1] 📋 ModelState Validation:");
            if (!ModelState.IsValid)
            {
                Console.WriteLine("   ❌ Errors:");
                var errors = ModelState.Values.SelectMany(v => v.Errors);
                foreach (var error in errors)
                    Console.WriteLine($"      • {error.ErrorMessage}");
                return BadRequest(new { errors = errors.Select(e => e.ErrorMessage).ToList() });
            }
            Console.WriteLine("   ✅ ModelState is valid");

            var unitErrors = RecipeUnitValidator.Validate(recipe);
            if (unitErrors.Count > 0)
                return InvalidUnits(unitErrors);
            if (LineProblems(recipe, confirmSuspiciousQuantities) is { } lineProblem)
                return lineProblem;

            // An update replaces all ingredient lines. A request with none, for a recipe that has some, is almost
            // always a client that failed to load them (the edit-form bug that deleted recipe lines), so it needs an
            // explicit confirmation. (Unknown or another user's recipe: UpdateAsync answers NotFound as before.)
            if ((recipe.Ingredients?.Count ?? 0) == 0 && !confirmRemoveAllIngredients
                && await _service.GetByIdAsync(id) is { Ingredients.Count: > 0 } existing)
            {
                return BadRequest(new
                {
                    code = "IngredientsWouldBeRemoved",
                    message = $"השמירה תמחק את כל {existing.Ingredients.Count} חומרי הגלם של המתכון. השמירה בוטלה – אם זו הכוונה, יש לאשר במפורש.",
                    existingIngredientLines = existing.Ingredients.Count,
                });
            }

            // [2] עדכון זמנים ונתונים
            Console.WriteLine("\n[2] 📦 Updated Fields:");
            Console.WriteLine($"   Name:          {recipe.Name}");
            Console.WriteLine($"   Description:  {recipe.Description ?? "(empty)"}");
            Console.WriteLine($"   Category:      {recipe.Category}");
            Console.WriteLine($"   OutputUnits:   {recipe.OutputUnits}");
            Console.WriteLine($"   PrepTime:      {recipe.PrepTime}min");
            Console.WriteLine($"   BakeTime:      {recipe.BakeTime}min");
            Console.WriteLine($"   Temperature:   {recipe.Temperature}°C");

            // [3] רכיבים
            Console.WriteLine($"\n[3] 🧪 Ingredients ({recipe.Ingredients?.Count ?? 0}):");
            if (recipe.Ingredients?.Count > 0)
            {
                foreach (var ing in recipe.Ingredients)
                    Console.WriteLine($"   • ID={ing.IngredientId}, Qty={ing.Quantity}, Unit={ing.Unit}");
            }
            else
                Console.WriteLine("   ℹ️  No ingredients");

            // [4] שלבים
            Console.WriteLine($"\n[4] 📝 Steps ({recipe.Steps?.Count ?? 0}):");
            if (recipe.Steps?.Count > 0)
            {
                foreach (var step in recipe.Steps)
                    Console.WriteLine($"   {step.Order}. {step.Description}");
            }
            else
                Console.WriteLine("   ℹ️  No steps");

            // [4.5] מתכונים בסיסיים
            Console.WriteLine($"\n[4.5] 🍰 BaseRecipes ({recipe.BaseRecipes?.Count ?? 0}):");
            if (recipe.BaseRecipes?.Count > 0)
            {
                foreach (var br in recipe.BaseRecipes)
                    Console.WriteLine($"   BaseRecipeId={br.BaseRecipeId}, Qty={br.Quantity}, Unit={br.Unit}");
            }
            else
                Console.WriteLine("   ℹ️  No base recipes");

            // [5] תמונה (אם יש)
            Console.WriteLine("\n[5] 📸 Image:");
            if (imageFile != null && imageFile.Length > 0)
            {
                Console.WriteLine($"   FileName:    {imageFile.FileName}");
                Console.WriteLine($"   Size:        {imageFile.Length / 1024}KB");
                var imagesPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "recipes");
                if (!Directory.Exists(imagesPath))
                    Directory.CreateDirectory(imagesPath);
                var fileName = $"recipe_{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
                var filePath = Path.Combine(imagesPath, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(stream);
                }
                recipe.ImageUrl = $"/images/recipes/{fileName}";
                Console.WriteLine($"   ✅ Saved: {recipe.ImageUrl}");
            }
            else
                Console.WriteLine("   ℹ️  No new image");

            // [6] עדכון ב-DB
            Console.WriteLine("\n[6] 💾 Updating database...");
            try
            {
                var ok = await _service.UpdateAsync(id, recipe);
                if (ok)
                {
                    Console.WriteLine("\n╔════════════════════════════════════════════════════╗");
                    Console.WriteLine("║               🎉 SUCCESS 🎉                         ║");
                    Console.WriteLine("╚════════════════════════════════════════════════════╝\n");
                    return NoContent();
                }
                else
                {
                    Console.WriteLine($"\n⚠️  Recipe with ID {id} not found");
                    return NotFound();
                }
            }
            catch (InvalidReferenceException ex)
            {
                return InvalidReferences(ex);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Error: {ex.Message}");
                Console.WriteLine("\n╔════════════════════════════════════════════════════╗");
                Console.WriteLine("║               ❌ ERROR ❌                           ║");
                Console.WriteLine("╚════════════════════════════════════════════════════╝\n");
                return BadRequest(new { message = "Update failed", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        // Same response for a missing row and for another user's row: nothing reveals whether it exists.
        private BadRequestObjectResult InvalidReferences(InvalidReferenceException ex) => BadRequest(new
        {
            message = InvalidReferenceException.UserMessage,
            errors = ex.Fields,
        });

        // "message" is what the recipes page shows in its save-error alert.
        private BadRequestObjectResult InvalidUnits(IReadOnlyList<string> errors) => BadRequest(new
        {
            message = "יש לבחור יחידת מידה תקינה לכל רכיב במתכון",
            errors,
        });

        /// <summary>
        /// Invalid lines (no ingredient / quantity not above 0) always reject the save. Suspicious quantities (e.g.
        /// 500 L) reject it until the user explicitly confirms them; they are never corrected automatically.
        /// </summary>
        private BadRequestObjectResult? LineProblems(Recipe recipe, bool confirmSuspiciousQuantities)
        {
            var invalid = RecipeLineValidator.InvalidLines(recipe);
            if (invalid.Count > 0)
                return BadRequest(new { code = "InvalidLines", message = "יש שורות לא תקינות במתכון – השמירה בוטלה", errors = invalid });

            var suspicious = RecipeLineValidator.SuspiciousLines(recipe);
            if (suspicious.Count > 0 && !confirmSuspiciousQuantities)
                return BadRequest(new
                {
                    code = "SuspiciousQuantities",
                    message = "יש כמויות חריגות במתכון (ייתכן שנבחרה יחידה שגויה, למשל ליטר במקום מ\"ל). השמירה בוטלה עד לאישור מפורש.",
                    lines = suspicious,
                });
            return null;
        }
    }
}
