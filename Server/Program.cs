using Server.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add PostgreSQL DbContext
builder.Services.AddDbContext<BakeryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // No enum converter needed: default is int
    });

// Add CORS - allow frontend on 5173
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register application services
builder.Services.AddSingleton<BakeryWeb.Server.Services.LogManager>();
builder.Services.AddScoped<IIngredientService, IngredientService>();
builder.Services.AddScoped<IPackagingService, PackagingService>();
builder.Services.AddScoped<IOverheadItemService, OverheadItemService>();
builder.Services.AddScoped<ILaborSettingsService, LaborSettingsService>();
builder.Services.AddScoped<CostCalculatorService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IProductService, ProductService>();

var app = builder.Build();

// Initialize database
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<BakeryDbContext>();
        var dbConnection = dbContext.Database.GetDbConnection();
        
        await dbConnection.OpenAsync();
        
        // Manually add missing recipe columns if they don't exist
        var ensureColumnsSQL = @"
            ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""BakeTime"" integer NULL;
            ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Category"" text NULL;
            ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Description"" text NULL;
            ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""PrepTime"" integer NULL;
            ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Temperature"" integer NULL;
        ";
        
        using (var command = dbConnection.CreateCommand())
        {
            command.CommandText = ensureColumnsSQL;
            await command.ExecuteNonQueryAsync();
            Console.WriteLine("Recipe metadata columns ensured");
        }
        
        // Ensure migrations history table exists
        var ensureMigrationsTable = @"
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL,
                ""ProductVersion"" character varying(32) NOT NULL,
                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
            );
        ";
        
        using (var command = dbConnection.CreateCommand())
        {
            command.CommandText = ensureMigrationsTable;
            await command.ExecuteNonQueryAsync();
            Console.WriteLine("Migrations table ensured");
        }
        
        // Mark all existing migrations as applied (skip duplicates)
        var markMigrationsSQL = @"
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES 
            ('20251215113227_InitialCreate', '10.0.0'),
            ('20251223080229_UpdateIngredientCategory', '10.0.0'),
            ('20251223082636_AddPackaging', '10.0.0'),
            ('20251223084607_AddLaborSettings', '10.0.0'),
            ('20251223085325_AddOverheadItem', '10.0.0'),
            ('20251223113711_AddRecipeModels', '10.0.0'),
            ('20251224080358_AddProduct', '10.0.0'),
            ('20260101085359_AddRecipeImageUrl', '10.0.0'),
            ('20260101090143_AddRecipeTypeToRecipe', '10.0.0'),
            ('20260208065444_ConvertUnitToEnum', '10.0.0'),
            ('20260208082456_AddStockUnit', '10.0.0')
            ON CONFLICT (""MigrationId"") DO NOTHING;
        ";
        
        using (var command = dbConnection.CreateCommand())
        {
            command.CommandText = markMigrationsSQL;
            await command.ExecuteNonQueryAsync();
            Console.WriteLine("Migrations history updated");
        }
        
        dbConnection.Close();
        
        // Try to apply pending migrations
        try
        {
            var migrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();
            if (migrations.Any())
            {
                Console.WriteLine($"Applying {migrations.Count} pending migration(s)");
                await dbContext.Database.MigrateAsync();
            }
            else
            {
                Console.WriteLine("No pending migrations");
            }
        }
        catch (Exception migrationEx)
        {
            Console.WriteLine($"Migration error (continuing): {migrationEx.Message}");
        }
        
        // תיקון רשומות קיימות: עדכון Unit=0 ל-Unit=2 (גרם)
        try
        {
            var updatedCount = await dbContext.Database.ExecuteSqlRawAsync(
                "UPDATE \"RecipeIngredients\" SET \"Unit\" = 2 WHERE \"Unit\" = 0"
            );
            Console.WriteLine($"Fixed {updatedCount} RecipeIngredients with invalid Unit (0 -> 2 Gram)");
        }
        catch (Exception fixEx)
        {
            Console.WriteLine($"Error fixing RecipeIngredients Unit: {fixEx.Message}");
        }
    }
}
catch (Exception dbEx)
{
    Console.WriteLine($"Database initialization error: {dbEx.Message}");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Use CORS policy
app.UseCors("AllowFrontend");

// Serve static files from Uploads folder
app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/uploads"
});

app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");
app.MapGet("/", () => "Server is running");

app.Run();


record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
