// AI/Services/RecipeImportService.cs
using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Services.TextExtraction;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Services
{
    public class RecipeImportService
    {
        private readonly IDocumentTextExtractor _textExtractor;
        private readonly RecipeAiExtractionService _recipeAi;
        private readonly LogManager _logManager;

        public RecipeImportService(
            IDocumentTextExtractor textExtractor,
            RecipeAiExtractionService recipeAi,
            LogManager logManager)
        {
            _textExtractor = textExtractor;
            _recipeAi = recipeAi;
            _logManager = logManager;
        }

        public async Task<RecipeDto?> ImportFromUrlAsync(string url)
        {
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromUrlAsync), $"Extracting text from URL: {url}");
            var text = await _textExtractor.FromUrlAsync(url);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, nameof(RecipeImportService), nameof(ImportFromUrlAsync), "No text extracted from URL");
                return null;
            }
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromUrlAsync), "Extracting recipe from text");
            return await _recipeAi.ExtractFromTextAsync(text, $"recipe from url {url}");
        }

        public async Task<RecipeDto?> ImportFromFileAsync(IFormFile file)
        {
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromFileAsync), $"Extracting text from file: {file.FileName}");
            var text = await _textExtractor.FromFileAsync(file);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, nameof(RecipeImportService), nameof(ImportFromFileAsync), "No text extracted from file");
                return null;
            }
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromFileAsync), "Extracting recipe from text");
            return await _recipeAi.ExtractFromTextAsync(text, $"recipe from file {file.FileName}");
        }

        public async Task<RecipeDto?> ImportFromTextAsync(string text)
        {
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromTextAsync), "Extracting recipe from manual text");
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, nameof(RecipeImportService), nameof(ImportFromTextAsync), "No text provided");
                return null;
            }
            return await _recipeAi.ExtractFromTextAsync(text, "recipe from manual text");
        }

        public async Task<RecipeDto?> ImportFromImageAsync(IFormFile image)
        {
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromImageAsync), $"Extracting text from image");
            var text = await _textExtractor.FromImageAsync(image);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, nameof(RecipeImportService), nameof(ImportFromImageAsync), "No text extracted from image");
                return null;
            }
            _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromImageAsync), "Extracting recipe from text");
            return await _recipeAi.ExtractFromTextAsync(text, "recipe from image");
        }
    }
}