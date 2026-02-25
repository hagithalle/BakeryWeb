using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;

namespace BakeryWeb.Server.AI.Client
{
    public class AiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public AiClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = Environment.GetEnvironmentVariable("AI_API_KEY")
                ?? configuration["AI:ApiKey"]
                ?? throw new InvalidOperationException("AI API key not found in environment or configuration.");
        }

        public void AddApiKeyHeader()
        {
            if (!_httpClient.DefaultRequestHeaders.Contains("Authorization"))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            }
        }

        // Example for sending a prompt to an AI endpoint
        public async Task<string> SendPromptAsync(string endpoint, string prompt)
        {
            AddApiKeyHeader();
            var content = new StringContent(prompt);
            var response = await _httpClient.PostAsync(endpoint, content);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}
