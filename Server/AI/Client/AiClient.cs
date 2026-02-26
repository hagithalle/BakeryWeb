using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Client
{
    public class AiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly LogManager _logManager;

        public AiClient(HttpClient httpClient, IConfiguration configuration, LogManager logManager)
        {
            _httpClient = httpClient;
            _logManager = logManager;

            _apiKey = Environment.GetEnvironmentVariable("AI_API_KEY")
                      ?? configuration["AI:ApiKey"];

            if (string.IsNullOrWhiteSpace(_apiKey))
                throw new BakeryWeb.Server.AI.Exceptions.AiApiKeyMissingException();

            _model = Environment.GetEnvironmentVariable("OPENAI_MODEL")
                     ?? configuration["AI:Model"]
                     ?? "gpt-3.5-turbo";
        }

        public void AddApiKeyHeader()
        {
            if (!_httpClient.DefaultRequestHeaders.Contains("Authorization"))
            {
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", _apiKey);
            }
        }

        /// <summary>
        /// שולח Prompt ל־AI עם מנגנון הגנה מפני בקשות ענקיות (Token Limit)
        /// </summary>
        public async Task<string> SendPromptAsync(string endpoint, string prompt)
        {
            const string source = nameof(AiClient);
            const string function = nameof(SendPromptAsync);

            _logManager.Log(LogType.Info, source, function, $"Sending prompt to endpoint: {endpoint}");

            AddApiKeyHeader();

            // ✂️ צמצום אוטומטי של ה־prompt כדי לא לעבור את מגבלת ה־tokens
            var originalLength = prompt?.Length ?? 0;
            prompt = TrimPrompt(prompt ?? string.Empty);

            if (prompt.Length < originalLength)
            {
                _logManager.Log(
                    LogType.Warning,
                    source,
                    function,
                    $"Prompt was trimmed from {originalLength} chars to {prompt.Length} chars to avoid token overflow."
                );
            }

            // Build OpenAI chat/completions request body
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logManager.Log(LogType.Error, source, function,
                    $"OpenAI error ({response.StatusCode}): {responseBody}");
                throw new Exception($"OpenAI error ({response.StatusCode}): {responseBody}");
            }

            _logManager.Log(LogType.Info, source, function, "Received response from AI endpoint");
            return responseBody;
        }

        /// <summary>
        /// מגביל את אורך ה־prompt לפי הערכת tokens (בערך 4 תווים לטוקן אחד)
        /// </summary>
        private string TrimPrompt(string prompt, int maxTokens = 8000)
        {
            // הערכה: ~4 תווים לטוקן אחד
            int maxChars = maxTokens * 4;

            if (string.IsNullOrEmpty(prompt))
                return string.Empty;

            if (prompt.Length <= maxChars)
                return prompt;

            return prompt.Substring(0, maxChars);
        }
    }
}