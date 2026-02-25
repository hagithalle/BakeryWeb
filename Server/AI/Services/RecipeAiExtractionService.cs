// AI/Services/RecipeAiExtractionService.cs
using System.Text.Json;
using System.Text.Json.Serialization;
using BakeryWeb.Server.AI.Client;
using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Prompts;
using BakeryWeb.Server.AI.Tasks;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Services
{
    /// <summary>
    /// לוקח טקסט "נקי" של מתכון ומפעיל את ה-AI כדי להחזיר RecipeDto
    /// </summary>
    public class RecipeAiExtractionService
    {
        private readonly AiTaskRunner _aiTaskRunner;
        private readonly AiTaskDefinition _taskDefinition;
        private readonly LogManager _logManager;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public RecipeAiExtractionService(AiTaskRunner aiTaskRunner, LogManager logManager)
        {
            _aiTaskRunner = aiTaskRunner;
            _logManager = logManager;

            _taskDefinition = new AiTaskDefinition
            {
                Name = "RecipeExtraction",
                Description = "Extracts structured recipe JSON from normalized text",
                Endpoint = "https://api.openai.com/v1/chat/completions"
            };
        }

        public async Task<RecipeDto?> ExtractFromTextAsync(string text, string? sourceLabel = null)
        {
            _logManager.Log(LogType.Info, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), $"Building prompt for AI. Source: {sourceLabel}\nInput: {text.Substring(0, Math.Min(text.Length, 500))}");
            var prompt = RecipeExtractionPrompt.Build(text, sourceLabel);

            _logManager.Log(LogType.Info, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), $"Sending prompt to AI. Prompt: {prompt.Substring(0, Math.Min(prompt.Length, 500))}");
            var responseJson = await _aiTaskRunner.RunTaskAsync(_taskDefinition, prompt);

            if (string.IsNullOrWhiteSpace(responseJson))
            {
                _logManager.Log(LogType.Warning, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), "AI response is empty");
                return null;
            }

            _logManager.Log(LogType.Info, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), $"Received AI response: {responseJson.Substring(0, Math.Min(responseJson.Length, 500))}");
            try
            {
                var dto = JsonSerializer.Deserialize<RecipeDto>(responseJson, JsonOptions);
                _logManager.Log(LogType.Info, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), $"Parsed RecipeDto: {System.Text.Json.JsonSerializer.Serialize(dto, JsonOptions).Substring(0, 500)}");
                return dto;
            }
            catch (JsonException ex)
            {
                _logManager.Log(LogType.Error, nameof(RecipeAiExtractionService), nameof(ExtractFromTextAsync), $"Failed to parse RecipeDto JSON: {ex.Message}\nResponse: {responseJson.Substring(0, Math.Min(responseJson.Length, 500))}");
                return null;
            }
        }
    }
}