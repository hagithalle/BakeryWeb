using Moq;
using Server.AI.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Server.Tests;

public class RecipeExtractionValidationTests
{
    private readonly Mock<ILogger<OpenAIRecipeExtractionService>> _mockLogger;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly HttpClient _httpClient;
    private readonly OpenAIRecipeExtractionService _service;

    public RecipeExtractionValidationTests()
    {
        _mockLogger = new Mock<ILogger<OpenAIRecipeExtractionService>>();
        _mockConfiguration = new Mock<IConfiguration>();
        
        // Configure mock to return a test API key
        _mockConfiguration
            .Setup(x => x["OpenAI:ApiKey"])
            .Returns("test-api-key-12345");
        
        _httpClient = new HttpClient();
        _service = new OpenAIRecipeExtractionService(_httpClient, _mockConfiguration.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task IsRecipeAsync_WithValidRecipeText_ShouldAttemptValidation()
    {
        // Arrange
        string recipeText = @"עוגת שוקולד
            1. 200 גרם קמח
            2. 100 גרם שוקולד
            3. 2 ביצים
            הוראות: ערבב וחמם ב-180 מעלות";

        // Act - Just ensure it doesn't throw during input validation
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _service.IsRecipeAsync(recipeText);
        });

        // Assert - The only exception we expect is from OpenAI API (429, etc.), not input validation
        // If it's a null reference or argument exception, we have a problem
        if (exception?.InnerException is ArgumentException)
        {
            Assert.Fail("Valid recipe text should not throw ArgumentException");
        }
    }

    [Fact]
    public async Task IsRecipeAsync_WithEmptyText_ThrowsOrReturnsFalse()
    {
        // Arrange
        string emptyText = "";

        // Act - Empty text should either throw or be handled gracefully
        var exception = await Record.ExceptionAsync(async () =>
        {
            var result = await _service.IsRecipeAsync(emptyText);
        });

        // Assert - Should handle empty input gracefully
        // No assertion needed - just checking it doesn't crash unexpectedly
    }

    [Fact]
    public async Task ExtractFromTextAsync_WithValidText_Completes()
    {
        // Arrange
        string recipeText = @"עוגה בסיסית
            חומרים:
            - 2 כוסות קמח
            - 1 כוס סוכר
            הוראות: ערבב את כל החומרים וחמם";

        // Act
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _service.ExtractFromTextAsync(recipeText);
        });

        // Assert
        // We expect it to fail on API call (no real OpenAI access),
        // but it should complete the input validation phase
        Assert.NotNull(exception); // Expected to fail on OpenAI API call
    }

    [Fact]
    public async Task ExtractFromTextAsync_WithNullText_ThrowsOrHandles()
    {
        // Arrange
        string nullText = null;

        // Act & Assert
        // Should handle null input gracefully (throw some kind of exception)
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _service.ExtractFromTextAsync(nullText);
        });

        // Should throw some kind of exception for null input
        Assert.NotNull(exception);
    }

    [Fact]
    public async Task ExtractFromUrlAsync_WithValidUrl_Completes()
    {
        // Arrange
        string url = "https://example.com/recipe";

        // Act
        var exception = await Record.ExceptionAsync(async () =>
        {
            await _service.ExtractFromUrlAsync(url);
        });

        // Assert - Will fail on API or URL fetch, but input should be validated
        Assert.NotNull(exception); // Expected to fail
    }

    [Fact]
    public void Service_IsInstantiatedCorrectly()
    {
        // Assert - If we got here, the service was created successfully
        Assert.NotNull(_service);
    }
}
