using System.Text.Json;
using BakeryWeb.Server.AI.Dtos;
using HtmlAgilityPack;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Services.Structured
{
    /// <summary>
    /// מנסה לחלץ מתכון ישירות מ-HTML (JSON-LD, microdata וכו') בלי AI
    /// </summary>
    public class RecipeStructuredParser
    {
        private readonly LogManager _logManager;

        public RecipeStructuredParser(LogManager logManager)
        {
            _logManager = logManager;
        }

        public RecipeDto? TryFromHtml(string html)
        {
            const string source = nameof(RecipeStructuredParser);
            const string function = nameof(TryFromHtml);

            if (string.IsNullOrWhiteSpace(html))
            {
                _logManager.LogWarning(source, function, "קלט HTML ריק או null");
                return null;
            }

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var scriptNodes = doc.DocumentNode.SelectNodes("//script[@type='application/ld+json']");
            if (scriptNodes != null)
            {
                foreach (var script in scriptNodes)
                {
                    var json = script.InnerText.Trim();
                    try
                    {
                        using var docJson = JsonDocument.Parse(json);
                        var root = docJson.RootElement;

                        RecipeDto? dto = null;
                        if (root.ValueKind == JsonValueKind.Object)
                        {
                            dto = TryMapJsonLdRecipe(root);
                        }
                        else if (root.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var item in root.EnumerateArray())
                            {
                                dto = TryMapJsonLdRecipe(item);
                                if (dto != null) break;
                            }
                        }
                        if (dto != null)
                        {
                            _logManager.LogSuccess(source, function, "Recipe JSON-LD זוהה בהצלחה");
                            return dto;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logManager.LogDebug(source, function, $"JSON-LD לא תקין: {ex.Message}");
                    }
                }
            }

            _logManager.LogWarning(source, function, "לא זוהה Recipe JSON-LD במבנה HTML");
            // TODO: בהמשך אפשר להוסיף microdata / OpenGraph וכו'
            return null;
        }

        private RecipeDto? TryMapJsonLdRecipe(JsonElement element)
        {
            if (!element.TryGetProperty("@type", out var typeProp))
                return null;

            var type = typeProp.ValueKind == JsonValueKind.Array
                ? string.Join(",", typeProp.EnumerateArray().Select(x => x.GetString()))
                : typeProp.GetString();

            if (type == null || !type.Contains("Recipe", StringComparison.OrdinalIgnoreCase))
                return null;

            var dto = new RecipeDto
            {
                Name = element.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "" : "",
                Description = element.TryGetProperty("description", out var descProp) ? descProp.GetString() ?? "" : "",
                ImageUrl = element.TryGetProperty("image", out var imgProp)
                    ? imgProp.ValueKind == JsonValueKind.String ? imgProp.GetString() : null
                    : null,
            };

            // Ingredients: יכול להיות "recipeIngredient" או "ingredients"
            if (element.TryGetProperty("recipeIngredient", out var ingArr) ||
                element.TryGetProperty("ingredients", out ingArr))
            {
                if (ingArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var ing in ingArr.EnumerateArray())
                    {
                        var text = ing.GetString() ?? "";
                        if (string.IsNullOrWhiteSpace(text)) continue;

                        dto.Ingredients.Add(new RecipeIngredientDto
                        {
                            Name = text,
                            Amount = 0,
                            Unit = ""
                        });
                    }
                }
            }
            // Instructions
            if (element.TryGetProperty("recipeInstructions", out var instProp))
            {
                if (instProp.ValueKind == JsonValueKind.String)
                {
                    var desc = instProp.GetString() ?? "";
                    if (!string.IsNullOrWhiteSpace(desc))
                        dto.Steps.Add(new RecipeStepDto { Description = desc });
                }
                else if (instProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var (x, idx) in instProp.EnumerateArray().Select((v, i) => (v, i)))
                    {
                        string? desc = null;
                        if (x.ValueKind == JsonValueKind.String)
                            desc = x.GetString();
                        else if (x.TryGetProperty("text", out var t))
                            desc = t.GetString();
                        if (!string.IsNullOrWhiteSpace(desc))
                            dto.Steps.Add(new RecipeStepDto { Description = desc });
                    }
                }
            }

            return dto;
        }
    }
}