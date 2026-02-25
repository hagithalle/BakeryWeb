// AI/Services/RecipeAiExtractionService.cs
using System.Text.Json;
using System.Text.Json.Serialization;
using BakeryWeb.Server.AI.Client;
using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Prompts;
using BakeryWeb.Server.AI.Tasks;

namespace BakeryWeb.Server.AI.Services
{
    /// <summary>
    /// לוקח טקסט "נקי" של מתכון ומפעיל את ה-AI כדי להחזיר RecipeDto
    /// </summary>
    public class RecipeAiExtractionService
    {
        private readonly AiTaskRunner _aiTaskRunner;
        private readonly AiTaskDefinition _taskDefinition;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public RecipeAiExtractionService(AiTaskRunner aiTaskRunner)
        {
            _aiTaskRunner = aiTaskRunner;

            _taskDefinition = new AiTaskDefinition
            {
                Name = "RecipeExtraction",
                Description = "Extracts structured recipe JSON from normalized text",
                Endpoint = "https://api.openai.com/v1/chat/completions" // או מה שהגדרת ב-AiTaskRunner
            };
        }

        public async Task<RecipeDto?> ExtractFromTextAsync(string text, string? sourceLabel = null)
        {
            // בונים את הפרומפט עם המחלקה הסטטית
            var prompt = RecipeExtractionPrompt.Build(text, sourceLabel);

            // מפעילים את ה-AI דרך ה-runner שלך
            var responseJson = await _aiTaskRunner.RunTaskAsync(_taskDefinition, prompt);

            if (string.IsNullOrWhiteSpace(responseJson))
                return null;

            try
            {
                return JsonSerializer.Deserialize<RecipeDto>(responseJson, JsonOptions);
            }
            catch (JsonException ex)
            {
                // פה אפשר לשים לוג אם תרצי
                Console.WriteLine($"❌ Failed to parse RecipeDto JSON: {ex.Message}");
                Console.WriteLine(responseJson);
                return null;
            }
        }
    }
}