using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Server.Data
{
    /// <summary>
    /// Used only by the dotnet-ef tools (migrations add / script / database update), so they never run Program.cs.
    /// The connection string comes from the EF_CONNECTION environment variable; when it is not set the tools
    /// fall back to appsettings.json (the local development database). Production is never the default.
    /// </summary>
    public sealed class BakeryDbContextDesignTimeFactory : IDesignTimeDbContextFactory<BakeryDbContext>
    {
        public const string ConnectionEnvironmentVariable = "EF_CONNECTION";

        public BakeryDbContext CreateDbContext(string[] args)
        {
            var connectionString = Environment.GetEnvironmentVariable(ConnectionEnvironmentVariable);

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: true)
                    .Build();
                connectionString = configuration.GetConnectionString("DefaultConnection");
            }

            var options = new DbContextOptionsBuilder<BakeryDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            return new BakeryDbContext(options);
        }
    }
}
