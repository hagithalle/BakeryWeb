// AI/Services/RecipeImportService.cs
using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Services.Structured;
using BakeryWeb.Server.AI.Services.TextExtraction;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Services
{
    public class RecipeImportService
    {
        private readonly IDocumentTextExtractor _textExtractor;
        private readonly RecipeAiExtractionService _recipeAi;
        private readonly RecipeStructuredParser _structuredParser;
        private readonly LogManager _logManager;

         public RecipeImportService(
        IDocumentTextExtractor textExtractor,
        RecipeAiExtractionService recipeAi,
        RecipeStructuredParser structuredParser,
        LogManager logManager)
    {
        _textExtractor = textExtractor;
        _recipeAi = recipeAi;
        _structuredParser = structuredParser;
        _logManager = logManager;
    }


       public async Task<RecipeDto?> ImportFromUrlAsync(string url)
    {
        _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromUrlAsync),
            $"Fetching HTML for URL: {url}");

        // 1) קודם להביא HTML מלא (נוסיף מתודה ב-TextExtractor)
        string html = null;
        try
        {
            html = await _textExtractor.GetRawHtmlAsync(url);
            if (string.IsNullOrWhiteSpace(html))
            {
                _logManager.LogWarning(nameof(RecipeImportService), nameof(ImportFromUrlAsync), "No HTML extracted from URL");
            }
            else
            {
                _logManager.LogSuccess(nameof(RecipeImportService), nameof(ImportFromUrlAsync), "HTML extracted successfully from URL");
                var structured = _structuredParser.TryFromHtml(html);
                if (structured != null)
                {
                    _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromUrlAsync),
                        "Found structured recipe in HTML (JSON-LD), skipping AI.");
                    return structured;
                }
            }
        }
        catch (Exception ex)
        {
            _logManager.LogError(nameof(RecipeImportService), nameof(ImportFromUrlAsync), $"Error extracting HTML: {ex.Message}");
        }

        // 2) אם לא מצאנו מבנה, נלך לזרימה הרגילה: HTML → טקסט → AI
        var text = await _textExtractor.FromUrlAsync(url);
        if (string.IsNullOrWhiteSpace(text))
        {
            _logManager.Log(LogType.Warning, nameof(RecipeImportService), nameof(ImportFromUrlAsync),
                "No text extracted from URL");
            return null;
        }

        _logManager.Log(LogType.Info, nameof(RecipeImportService), nameof(ImportFromUrlAsync),
            "Extracting recipe from text via AI");

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