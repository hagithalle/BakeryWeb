using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using Server.Auth;
using Server.Data;
using Server.Models;
using Server.Tests.Auth;

namespace Server.Tests.Tenancy
{
    public enum TestDatabase { InMemory, Postgres }

    /// <summary>
    /// Starts the real application (Program.cs: middleware order, authorization policy, controllers, services)
    /// with Clerk faked and the database replaced by either EF in-memory or a temporary PostgreSQL database.
    /// The temporary database is created, migrated and dropped automatically; it is never BakeryDb.
    /// </summary>
    public sealed class TenantTestApp : WebApplicationFactory<Program>
    {
        /// <summary>
        /// Opt-in: a connection string to a local PostgreSQL server WITHOUT a database name, e.g.
        /// "Host=localhost;Port=5432;Username=postgres;Password=...". When unset, PostgreSQL tests are skipped.
        /// </summary>
        public const string PostgresEnvironmentVariable = "BAKERY_TEST_POSTGRES";

        private static readonly object EnvironmentLock = new();

        public TestDatabase Database { get; }
        public FakeClerkIssuer Clerk { get; } = new();
        public FakeClerkBackendApi ClerkApi { get; } = new();
        public string? PostgresDatabaseName { get; }

        private readonly string? _postgresConnection;
        private readonly string _inMemoryName = "tenant-tests-" + Guid.NewGuid();
        private readonly InMemoryDatabaseRoot _inMemoryRoot = new();

        public TenantTestApp(TestDatabase database)
        {
            Database = database;

            // Program.cs reads these before the host is built; process-wide values identical for every instance.
            lock (EnvironmentLock)
            {
                Environment.SetEnvironmentVariable(ClerkSettings.IssuerConfigKey, TestConfig.ClerkIssuer);
                Environment.SetEnvironmentVariable(ClerkSettings.SecretKeyConfigKey, "sk_test_not_a_real_key");
                Environment.SetEnvironmentVariable(ClerkSettings.AuthorizedPartiesConfigKey, TestConfig.AllowedOrigin);
            }

            // Program serves /uploads from <current directory>/Uploads and needs the folder to exist.
            Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "Uploads"));

            if (database == TestDatabase.Postgres)
            {
                var server = Environment.GetEnvironmentVariable(PostgresEnvironmentVariable)
                    ?? throw new InvalidOperationException($"{PostgresEnvironmentVariable} is not set.");
                PostgresDatabaseName = "bakery_tenant_test_" + Guid.NewGuid().ToString("N")[..12];
                _postgresConnection = new NpgsqlConnectionStringBuilder(server) { Database = PostgresDatabaseName }.ConnectionString;
            }
        }

        public static bool PostgresConfigured =>
            !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(PostgresEnvironmentVariable));

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                // Replace the app's PostgreSQL (BakeryDb) registration entirely.
                services.RemoveAll<DbContextOptions<BakeryDbContext>>();
                services.RemoveAll<DbContextOptions>();
                var optionConfigurations = services
                    .Where(d => d.ServiceType.IsGenericType
                                && d.ServiceType.GetGenericArguments().Contains(typeof(BakeryDbContext))
                                && d.ServiceType.Name.StartsWith("IDbContextOptionsConfiguration", StringComparison.Ordinal))
                    .ToList();
                foreach (var descriptor in optionConfigurations) services.Remove(descriptor);

                if (Database == TestDatabase.InMemory)
                    services.AddDbContext<BakeryDbContext>(o => o.UseInMemoryDatabase(_inMemoryName, _inMemoryRoot));
                else
                    services.AddDbContext<BakeryDbContext>(o => o.UseNpgsql(_postgresConnection));

                services.Replace(ServiceDescriptor.Singleton<IClerkSigningKeyProvider>(new StaticKeyProvider(new[] { Clerk.PublicKey })));
                services.Replace(ServiceDescriptor.Transient<IClerkUserClient>(sp => new ClerkUserClient(
                    new HttpClient(ClerkApi, disposeHandler: false) { BaseAddress = ClerkUserClient.BackendApiBaseAddress },
                    sp.GetRequiredService<ClerkSettings>())));
            });
        }

        /// <summary>
        /// Creates the temporary PostgreSQL database by applying the real EF migrations, exactly like a new
        /// environment would (SchemaDriftTests guarantees the result equals the current model).
        /// </summary>
        public async Task InitializeDatabaseAsync()
        {
            if (Database == TestDatabase.Postgres)
            {
                await using var migrate = CreateUnscopedContext();
                await migrate.Database.MigrateAsync();
            }
        }

        /// <summary>A context that sees and writes every row: for seeding and assertions only.</summary>
        public BakeryDbContext CreateUnscopedContext()
        {
            var options = new DbContextOptionsBuilder<BakeryDbContext>();
            if (Database == TestDatabase.InMemory) options.UseInMemoryDatabase(_inMemoryName, _inMemoryRoot);
            else options.UseNpgsql(_postgresConnection);
            return new BakeryDbContext(options.Options, UnscopedCurrentUser.Instance);
        }

        /// <summary>Registers a new Clerk identity and returns a client that signs every request as that user.</summary>
        public async Task<TestUser> CreateUserAsync(string label)
        {
            var clerkId = $"user_{label}_{Guid.NewGuid():N}"[..30];
            var email = $"{label}.{Guid.NewGuid():N}@example.com";
            ClerkApi.WithUser(clerkId, ClerkUserFixtures.GoogleUser(email, firstName: label, lastName: "Tester"));

            var client = CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
            var user = new TestUser(label, clerkId, client, this);

            var me = await user.GetJsonAsync("/api/auth/me");
            user.InternalId = me.GetProperty("id").GetInt32();
            return user;
        }

        public HttpClient CreateAnonymousClient() =>
            CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        public override async ValueTask DisposeAsync()
        {
            await base.DisposeAsync();
            if (Database == TestDatabase.Postgres && PostgresDatabaseName != null)
            {
                NpgsqlConnection.ClearAllPools();
                await using var admin = new NpgsqlConnection(new NpgsqlConnectionStringBuilder(_postgresConnection) { Database = "postgres" }.ConnectionString);
                await admin.OpenAsync();
                await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{PostgresDatabaseName}\" WITH (FORCE)", admin);
                await drop.ExecuteNonQueryAsync();
            }
            Clerk.Dispose();
        }
    }

    /// <summary>An authenticated test user: every request carries a fresh Clerk session token for this identity.</summary>
    public sealed class TestUser
    {
        private readonly TenantTestApp _app;

        public TestUser(string label, string clerkId, HttpClient client, TenantTestApp app)
        {
            Label = label;
            ClerkId = clerkId;
            Client = client;
            _app = app;
        }

        public string Label { get; }
        public string ClerkId { get; }
        public HttpClient Client { get; }
        public int InternalId { get; set; }

        public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, HttpContent? content = null)
        {
            var request = new HttpRequestMessage(method, path) { Content = content };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _app.Clerk.CreateToken(subject: ClerkId));
            return Client.SendAsync(request);
        }

        public async Task<System.Text.Json.JsonElement> GetJsonAsync(string path)
        {
            var response = await SendAsync(HttpMethod.Get, path);
            response.EnsureSuccessStatusCode();
            return System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
        }
    }
}
