using System;
using System.Text.RegularExpressions;
using BakeryWeb.Server.AI.Dtos;
using BakeryWeb.Server.AI.Services.Structured;
using BakeryWeb.Server.AI.Services.TextExtraction;
using BakeryWeb.Server.Services;
using Microsoft.AspNetCore.Http;

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

        /// <summary>
        /// ייבוא מתכון מ-URL:
        /// 1) HTML → ניסיון JSON-LD
        /// 2) אם לא הצליח → טקסט → AI
        /// </summary>
        public async Task<RecipeDto?> ImportFromUrlAsync(string url)
        {
            const string source = nameof(RecipeImportService);
            const string function = nameof(ImportFromUrlAsync);

            _logManager.Log(LogType.Info, source, function, $"Fetching HTML for URL: {url}");

            // 1) קודם HTML מלא (לצורך JSON-LD בלבד)
            string? html = null;
            try
            {
                html = await _textExtractor.GetRawHtmlAsync(url);
                if (string.IsNullOrWhiteSpace(html))
                {
                    _logManager.LogWarning(source, function, "No HTML extracted from URL");
                }
                else
                {
                    _logManager.LogSuccess(source, function, "HTML extracted successfully from URL");

                    // ⚠️ חשוב: לא מנקים HTML לפני JSON-LD, כדי לא למחוק <script type='application/ld+json'>
                    var structured = _structuredParser.TryFromHtml(html);
                    if (structured != null)
                    {
                        _logManager.Log(
                            LogType.Info,
                            source,
                            function,
                            "Found structured recipe in HTML (JSON-LD), skipping AI."
                        );
                        return structured;
                    }
                }
            }
            catch (Exception ex)
            {
                _logManager.LogError(source, function, $"Error extracting HTML: {ex.Message}");
            }

            // 2) אם לא מצאנו מבנה, נלך לזרימה הרגילה: HTML → טקסט → AI
            var text = await _textExtractor.FromUrlAsync(url);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, source, function, "No text extracted from URL");
                return null;
            }

            text = ExtractRelevantRecipeText(text);

            // ✂️ צמצום טקסט לפני שליחה ל-AI
            text = TrimTextForAi(text, function);

            _logManager.Log(LogType.Info, source, function,
                "Extracting recipe from text via AI");

            return await _recipeAi.ExtractFromTextAsync(text, $"recipe from url {url}");
        }

        /// <summary>
        /// ייבוא מתכון מקובץ (PDF / DOCX / TXT וכו')
        /// </summary>
        public async Task<RecipeDto?> ImportFromFileAsync(IFormFile file)
        {
            const string source = nameof(RecipeImportService);
            const string function = nameof(ImportFromFileAsync);

            _logManager.Log(LogType.Info, source, function,
                $"Extracting text from file: {file.FileName}");

            var text = await _textExtractor.FromFileAsync(file);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, source, function, "No text extracted from file");
                return null;
            }
  text = ExtractRelevantRecipeText(text);
            // ✂️ צמצום טקסט
            text = TrimTextForAi(text, function);

            _logManager.Log(LogType.Info, source, function,
                "Extracting recipe from text");
            return await _recipeAi.ExtractFromTextAsync(text, $"recipe from file {file.FileName}");
        }

        /// <summary>
        /// ייבוא מתכון מטקסט חופשי (טקסט שהמשתמש הדביק ידנית)
        /// </summary>
        public async Task<RecipeDto?> ImportFromTextAsync(string text)
        {
            const string source = nameof(RecipeImportService);
            const string function = nameof(ImportFromTextAsync);

            _logManager.Log(LogType.Info, source, function,
                "Extracting recipe from manual text");

            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, source, function,
                    "No text provided");
                return null;
            }

            var trimmed = text.Trim();

            // 1) אם זה JSON של RecipeDto – ננסה לפרסר בלי AI
            if (trimmed.StartsWith("{"))
            {
                try
                {
                    var dto = System.Text.Json.JsonSerializer.Deserialize<RecipeDto>(trimmed);
                    if (dto != null)
                    {
                        _logManager.Log(LogType.Info, source, function,
                            "Text looked like JSON, parsed directly without AI.");
                        return dto;
                    }
                }
                catch
                {
                    // נתעלם – ניפול ל-AI
                }
            }
  text = ExtractRelevantRecipeText(text);
            // 2) צמצום טקסט לפני AI
            text = TrimTextForAi(text, function);

            // 3) TODO: בעתיד – Regex על "Ingredients:" / "אופן ההכנה:" וכו'
            return await _recipeAi.ExtractFromTextAsync(text, "recipe from manual text");
        }

        /// <summary>
        /// ייבוא מתכון מתמונה (צילום מתכון / מסך)
        /// </summary>
        public async Task<RecipeDto?> ImportFromImageAsync(IFormFile image)
        {
            const string source = nameof(RecipeImportService);
            const string function = nameof(ImportFromImageAsync);

            _logManager.Log(LogType.Info, source, function,
                "Extracting text from image");

            var text = await _textExtractor.FromImageAsync(image);
            if (string.IsNullOrWhiteSpace(text))
            {
                _logManager.Log(LogType.Warning, source, function,
                    "No text extracted from image");
                return null;
            }
  text = ExtractRelevantRecipeText(text);
            // ✂️ צמצום טקסט
            text = TrimTextForAi(text, function);

            _logManager.Log(LogType.Info, source, function,
                "Extracting recipe from text");
            return await _recipeAi.ExtractFromTextAsync(text, "recipe from image");
        }

        /// <summary>
        /// ניקוי HTML גולמי – לשימוש עתידי אם תרצי לשלוח HTML עצמו ל-AI.
        /// כרגע לא בשימוש, כי אנחנו עובדים עם טקסט שכבר יוצא מה-TextExtractor.
        /// </summary>
        private string CleanHtml(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            // הורדת תגי script
            html = Regex.Replace(html, "<script[\\s\\S]*?</script>", "", RegexOptions.IgnoreCase);

            // הורדת תגי style
            html = Regex.Replace(html, "<style[\\s\\S]*?</style>", "", RegexOptions.IgnoreCase);

            // הורדת HTML comments
            html = Regex.Replace(html, "<!--.*?-->", "", RegexOptions.Singleline);

            // הורדת רווחים מיותרים
            html = Regex.Replace(html, "\\s{2,}", " ");

            return html.Trim();
        }

        /// <summary>
        /// צמצום טקסט לפני שליחה ל-AI כדי לא לעבור מגבלת Tokens (TPM)
        /// </summary>
        private string TrimTextForAi(string text, string functionName, int maxChars = 20000)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            if (text.Length <= maxChars)
                return text;

            _logManager.LogWarning(nameof(RecipeImportService), functionName,
                $"Text length {text.Length} chars – trimming to {maxChars} chars before sending to AI.");

            return text.Substring(0, maxChars);
        }
        private string ExtractRelevantRecipeText(string text)
{
    if (string.IsNullOrWhiteSpace(text))
        return string.Empty;

    // ניקוי ראשוני
    text = Regex.Replace(text, @"\s{2,}", " ");
    text = text.Replace("\r", "").Replace("\n\n", "\n");

    // חיפוש נקודות מפתח בעברית/אנגלית
    string[] ingredientsKeywords = { "מצרכים", "מרכיבים", "Ingredients", "ingredients" };
    string[] instructionsKeywords = { "אופן ההכנה", "הכנה", "הוראות", "Instructions", "instructions", "Method" };

    int ingIndex = FindFirstKeyword(text, ingredientsKeywords);
    int instIndex = FindFirstKeyword(text, instructionsKeywords);

    // אם לא מצאנו כלום – נחזיר רק את 15,000 התווים הראשונים
    if (ingIndex == -1 && instIndex == -1)
        return text;

    // נבנה חלון טקסט סביב החלקים שמצאנו (3k–6k תווים)
    int start = Math.Max(0, Math.Min(ingIndex, instIndex) - 1500);
    int end = Math.Min(text.Length, Math.Max(ingIndex, instIndex) + 4500);

    string result = text.Substring(start, end - start);

    // ניקוי סופי
    result = Regex.Replace(result, @"\s{2,}", " ").Trim();

    return result;
}

private int FindFirstKeyword(string text, string[] keywords)
{
    foreach (var key in keywords)
    {
        int index = text.IndexOf(key, StringComparison.OrdinalIgnoreCase);
        if (index != -1)
            return index;
    }
    return -1;
}
    }
}