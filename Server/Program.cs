using BakeryWeb.Server.AI.Services.TextExtraction;

using Server.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Server.Services;
using BakeryWeb.Server.AI;
using BakeryWeb.Server.AI.Tasks;
using BakeryWeb.Server.AI.Prompts;
using BakeryWeb.Server.AI.Services;
using BakeryWeb.Server.AI.Services.Structured;
using Server.Auth;


// Load .env file for environment variables
BakeryWeb.Server.AI.Client.EnvLoader.LoadEnv(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
Console.WriteLine("AI API key configured: " + (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AI_API_KEY")) ? "no" : "yes"));

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add PostgreSQL DbContext
builder.Services.AddDbContext<BakeryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Controllers
builder.Services.AddControllers(options =>
        options.Filters.Add<Server.Services.Pricing.PricingValidationExceptionFilter>())
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // No enum converter needed: default is int
    });

// Authentication: Clerk session tokens only (Google and email/password are both handled by Clerk).
// Fails fast (before the server starts) if any CLERK_* setting is missing.
var clerkSettings = ClerkSettings.FromConfiguration(builder.Configuration);
builder.Services.AddClerkAuthentication(clerkSettings);
builder.Services.AddHttpContextAccessor();

// Add CORS - allow frontend (localhost dev + Vercel production)
var corsOrigins = builder.Configuration["CORS_ORIGINS"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        List<string> origins =
        [
            "http://localhost:5173",
            "https://bakery-web-tawny.vercel.app",
            ..corsOrigins,
        ];

        policy.WithOrigins(origins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register application services
builder.Services.AddScoped<IDocumentTextExtractor, DocumentTextExtractor>();
builder.Services.AddSingleton<BakeryWeb.Server.Services.LogManager>(sp =>
    new BakeryWeb.Server.Services.LogManager(sp.GetRequiredService<IConfiguration>()));
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<IPackagingService, PackagingService>();
builder.Services.AddScoped<IOverheadItemService, OverheadItemService>();
builder.Services.AddScoped<ILaborSettingsService, LaborSettingsService>();
builder.Services.AddScoped<CostCalculatorService>();
// Pricing: VAT rates by effective date from configuration (checked at startup), the user's business settings
builder.Services.AddSingleton(Server.Services.Pricing.VatRateTable.FromConfiguration(builder.Configuration));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<Server.Services.Pricing.BusinessSettingsService>();
builder.Services.AddScoped<Server.Services.Pricing.PricingService>();
builder.Services.AddScoped<Server.Services.Pricing.PurchaseVatService>();
builder.Services.AddScoped<Server.Validation.ReferenceValidator>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<RecipeAiExtractionService>();

// AI
builder.Services.AddHttpClient<BakeryWeb.Server.AI.Client.AiClient>();
builder.Services.AddScoped<AiTaskRunner>();
builder.Services.AddScoped<RecipeAiExtractionService>();

builder.Services.AddScoped<TextRecipeImportService>();
builder.Services.AddScoped<UrlRecipeImportService>();
builder.Services.AddScoped<FileRecipeImportService>();
builder.Services.AddScoped<ImageRecipeImportService>();
builder.Services.AddScoped<RecipeStructuredParser>();
builder.Services.AddScoped<RecipeImportService>();
//end AI

var app = builder.Build();

// Database schema is managed only through reviewed EF Core migrations (see docs/database-migrations.md).
// The app never changes the schema at startup; it only reports pending migrations.
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<BakeryDbContext>();
    var pending = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();
    if (pending.Count > 0)
        Console.WriteLine($"WARNING: {pending.Count} pending database migration(s): {string.Join(", ", pending)}. " +
                          "Apply them with the reviewed migration procedure before using the app.");
    else
        Console.WriteLine("Database schema is up to date");
}
catch (Exception dbEx)
{
    Console.WriteLine($"Database check failed: {dbEx.GetType().Name}");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS policy
app.UseCors("AllowFrontend");

// Serve uploaded images from the Uploads folder. Deliberately BEFORE authentication/authorization:
// <img> tags cannot send a bearer token, and the fallback "authenticated user" policy would otherwise
// apply to these files. Access relies on unguessable file names for now (private storage is planned).
app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check: the only endpoint that does not require authentication.
app.MapGet("/", () => "Server is running").AllowAnonymous();

app.Run();

internal class UrlRecipeImportService
{
}

internal class ImageRecipeImportService
{
}

internal class FileRecipeImportService
{
}

internal class TextRecipeImportService
{
}

// Lets integration tests start the real application (WebApplicationFactory<Program>).
public partial class Program { }
