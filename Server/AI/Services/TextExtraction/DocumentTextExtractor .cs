// AI/Services/TextExtraction/DocumentTextExtractor.cs
using HtmlAgilityPack;
using System.Text;
using BakeryWeb.Server.Services;
using BakeryWeb.Server.AI.Services.TextExtraction;

namespace BakeryWeb.Server.AI.Services.TextExtraction
{
    public class DocumentTextExtractor : IDocumentTextExtractor
    {
        private readonly HttpClient _httpClient;
        private readonly LogManager _logManager;

        public DocumentTextExtractor(HttpClient httpClient, LogManager logManager)
        {
            _httpClient = httpClient;
            _logManager = logManager;
        }

        public async Task<string> FromUrlAsync(string url)
        {
            try
            {
                _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromUrlAsync),
                    $"Fetching HTML from URL: {url}");

                var html = await _httpClient.GetStringAsync(url);
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                var sb = new StringBuilder();
                foreach (var node in doc.DocumentNode.SelectNodes("//body//text()") ?? Enumerable.Empty<HtmlNode>())
                {
                    var t = node.InnerText.Trim();
                    if (!string.IsNullOrEmpty(t))
                        sb.AppendLine(t);
                }

                var result = sb.ToString();
                _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromUrlAsync), $"Extracted text from URL: {url}\nOutput: {result.Substring(0, Math.Min(result.Length, 500))}");
                return result;
            }
            catch (Exception ex)
            {
                _logManager.Log(LogType.Error, nameof(DocumentTextExtractor), nameof(FromUrlAsync),
                    $"Error extracting text from URL: {ex.Message}");
                return string.Empty;
            }
        }

        public async Task<string> FromFileAsync(IFormFile file)
        {
            try
            {
                _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromFileAsync),
                    $"Extracting text from file: {file.FileName}");

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                // TODO: אם זה PDF / DOCX – כאן בהמשך תכניסי קריאה ל־PDF parser
                var result = Encoding.UTF8.GetString(ms.ToArray());
                _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromFileAsync), $"Extracted text from file: {file.FileName}\nOutput: {result.Substring(0, Math.Min(result.Length, 500))}");
                return result;
            }
            catch (Exception ex)
            {
                _logManager.Log(LogType.Error, nameof(DocumentTextExtractor), nameof(FromFileAsync),
                    $"Error extracting text from file: {ex.Message}");
                return string.Empty;
            }
        }

        public async Task<string> FromImageAsync(IFormFile image)
        {
            _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromImageAsync),
                $"Extracting text from image: {image.FileName}");
            try
            {
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                ms.Position = 0;

                // שימוש ב-Tesseract (דורש התקנת חבילה)
                using var engine = new Tesseract.TesseractEngine(@"./tessdata", "heb+eng", Tesseract.EngineMode.Default);
                ms.Position = 0;
                using var pix = Tesseract.Pix.LoadFromMemory(ms.ToArray());
                using var page = engine.Process(pix);
                var text = page.GetText();
                var output = text ?? string.Empty;
                _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(FromImageAsync), $"Extracted text from image: {image.FileName}\nOutput: {output.Substring(0, Math.Min(output.Length, 500))}");
                return output;
            }
            catch (Exception ex)
            {
                _logManager.Log(LogType.Error, nameof(DocumentTextExtractor), nameof(FromImageAsync),
                    $"Error extracting text from image: {ex.Message}");
                return string.Empty;
            }
        }
        public async Task<string> GetRawHtmlAsync(string url)
{
    try
    {
        _logManager.Log(LogType.Info, nameof(DocumentTextExtractor), nameof(GetRawHtmlAsync),
            $"Fetching raw HTML from URL: {url}");
        return await _httpClient.GetStringAsync(url);
    }
    catch (Exception ex)
    {
        _logManager.Log(LogType.Error, nameof(DocumentTextExtractor), nameof(GetRawHtmlAsync),
            $"Error fetching HTML: {ex.Message}");
        return string.Empty;
    }
}

    }
}