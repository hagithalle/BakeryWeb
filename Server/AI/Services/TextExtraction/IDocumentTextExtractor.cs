using Microsoft.AspNetCore.Http;
namespace BakeryWeb.Server.AI.Services.TextExtraction
{
    public interface IDocumentTextExtractor
    {
        Task<string> FromUrlAsync(string url);
        Task<string> FromFileAsync(IFormFile file);
        Task<string> FromImageAsync(IFormFile image);
        Task<string> GetRawHtmlAsync(string url);
    }
}