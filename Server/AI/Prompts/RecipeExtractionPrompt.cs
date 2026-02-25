// AI/Prompts/RecipeExtractionPrompt.cs
namespace BakeryWeb.Server.AI.Prompts
{
    public static class RecipeExtractionPrompt
    {
        public static string Build(string normalizedText, string? sourceHint = null)
        {
            var sourceLine = string.IsNullOrWhiteSpace(sourceHint)
                ? ""
                : $"Source: {sourceHint}\n";

            return $@"
You are an assistant that extracts structured recipes.

Return ONLY valid JSON with NO additional commentary.
The JSON MUST match exactly this structure:

{{
  ""name"": """",
  ""description"": """",
  ""category"": ""עוגות"",
  ""recipeType"": 2,
  ""yieldAmount"": 1,
  ""outputUnitType"": 0,
  ""prepTime"": 0,
  ""bakeTime"": 0,
  ""temperature"": 0,
  ""imageUrl"": null,
  ""ingredients"": [
    {{ ""name"": ""קמח"", ""amount"": 300, ""unit"": ""גרם"" }}
  ],
  ""steps"": [
    {{ ""order"": 1, ""description"": ""לערבב את החומרים בקערה..."" }}
  ],
  ""baseRecipes"": []
}}

{sourceLine}
Now extract the recipe from this text (Hebrew allowed):

--------------------------------
{normalizedText}
--------------------------------
";
        }
    }
}