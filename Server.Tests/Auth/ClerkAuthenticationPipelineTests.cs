using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using Server.Auth;
using Server.Controllers;
using Server.Data;
using Server.Models;

namespace Server.Tests.Auth
{
    /// <summary>
    /// End-to-end tests of the HTTP pipeline: the same AddClerkAuthentication wiring as Program.cs, the real
    /// AuthController, and an in-memory database. Only Clerk itself (signing keys + Backend API) is faked.
    /// </summary>
    public class ClerkAuthenticationPipelineTests : IAsyncLifetime
    {
        private readonly FakeClerkIssuer _clerk = new();
        private readonly FakeClerkBackendApi _clerkApi = new();
        private readonly string _databaseName = Guid.NewGuid().ToString();
        private WebApplication _app = null!;
        private HttpClient _client = null!;

        public async Task InitializeAsync()
        {
            var settings = TestConfig.ValidClerkSettings();
            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseTestServer();

            builder.Services.AddClerkAuthentication(settings);
            builder.Services.Replace(ServiceDescriptor.Singleton<IClerkSigningKeyProvider>(
                new StaticKeyProvider(new[] { _clerk.PublicKey })));
            builder.Services.Replace(ServiceDescriptor.Transient<IClerkUserClient>(_ => new ClerkUserClient(
                new HttpClient(_clerkApi, disposeHandler: false) { BaseAddress = ClerkUserClient.BackendApiBaseAddress },
                settings)));
            builder.Services.AddDbContext<BakeryDbContext>(o => o.UseInMemoryDatabase(_databaseName));
            builder.Services.AddControllers().AddApplicationPart(typeof(AuthController).Assembly);

            _app = builder.Build();
            _app.UseAuthentication();
            _app.UseAuthorization();
            _app.MapControllers();
            // Stand-ins for business endpoints: one protected, one anonymous (as the business endpoints are today).
            _app.MapGet("/test/protected", (ClaimsPrincipal user) => user.FindFirstValue("userId")).RequireAuthorization();
            _app.MapGet("/test/anonymous", (ClaimsPrincipal user) => user.FindFirstValue("userId") ?? "anonymous").AllowAnonymous();

            await _app.StartAsync();
            _client = _app.GetTestClient();
        }

        public async Task DisposeAsync()
        {
            _client.Dispose();
            await _app.DisposeAsync();
            _clerk.Dispose();
        }

        private Task<HttpResponseMessage> GetAsync(string path, string? bearerToken)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, path);
            if (bearerToken != null)
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            return _client.SendAsync(request);
        }

        private async Task<int> AddLegacyUserAsync(string email)
        {
            using var scope = _app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BakeryDbContext>();
            var user = new User { Email = email, Name = "Legacy", PasswordHash = "$2a$11$legacy" };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return user.Id;
        }

        private async Task<List<User>> UsersAsync()
        {
            using var scope = _app.Services.CreateScope();
            return await scope.ServiceProvider.GetRequiredService<BakeryDbContext>().Users.AsNoTracking().ToListAsync();
        }

        // ---------- Invalid tokens ----------

        [Fact]
        public async Task NoToken_Returns401()
        {
            var response = await GetAsync("/api/auth/me", null);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Equal("Bearer", response.Headers.WwwAuthenticate.Single().Scheme);
        }

        [Fact]
        public async Task NonBearerScheme_Returns401()
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", "dXNlcjpwYXNz");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        public static TheoryData<string> InvalidTokenKinds => new()
        {
            "garbage", "expired", "not-yet-valid", "wrong-issuer", "wrong-origin", "no-origin",
            "unknown-key", "unsigned", "hs256", "tampered", "old-app-token",
        };

        [Theory]
        [MemberData(nameof(InvalidTokenKinds))]
        public async Task InvalidToken_Returns401_AndProvisionsNothing(string kind)
        {
            using var attacker = new FakeClerkIssuer("attacker-key");
            var now = DateTime.UtcNow;
            var token = kind switch
            {
                "garbage" => "not.a.token",
                "expired" => _clerk.CreateToken(notBefore: now.AddMinutes(-10), expires: now.AddMinutes(-5)),
                "not-yet-valid" => _clerk.CreateToken(notBefore: now.AddMinutes(5), expires: now.AddMinutes(10)),
                "wrong-issuer" => _clerk.CreateToken(issuer: "https://attacker.clerk.accounts.dev"),
                "wrong-origin" => _clerk.CreateToken(azp: "https://evil.example"),
                "no-origin" => _clerk.CreateToken(azp: null),
                "unknown-key" => attacker.CreateToken(),
                "unsigned" => Unsigned(),
                "hs256" => Hs256(),
                "tampered" => Tamper(_clerk.CreateToken(subject: "user_a")),
                "old-app-token" => Hs256(issuer: "BakeryWeb"), // shape of tokens from the removed password login
                _ => throw new ArgumentOutOfRangeException(nameof(kind)),
            };
            _clerkApi.WithUser("user_123", ClerkUserFixtures.GoogleUser("victim@example.com"));

            var protectedResponse = await GetAsync("/test/protected", token);
            var meResponse = await GetAsync("/api/auth/me", token);
            var anonymousBody = await (await GetAsync("/test/anonymous", token)).Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.Unauthorized, protectedResponse.StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
            Assert.Equal("anonymous", anonymousBody); // an invalid token never yields a user id
            Assert.Empty(await UsersAsync());
            Assert.Equal(0, _clerkApi.RequestCount);
        }

        // ---------- Both sign-in flows + provisioning ----------

        [Fact]
        public async Task GoogleSignIn_FirstRequest_ProvisionsUser_AndMeReturnsIt()
        {
            _clerkApi.WithUser("user_google", ClerkUserFixtures.GoogleUser("Dana@Gmail.com"));

            var response = await GetAsync("/api/auth/me", _clerk.CreateToken(subject: "user_google"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var me = await response.Content.ReadFromJsonAsync<UserDto>();
            var stored = Assert.Single(await UsersAsync());
            Assert.Equal(stored.Id, me!.Id);
            Assert.Equal("dana@gmail.com", me.Email);
            Assert.Equal("user_google", stored.ClerkId);
        }

        [Fact]
        public async Task EmailPasswordSignIn_FirstRequest_ProvisionsUser_AndMeReturnsIt()
        {
            _clerkApi.WithUser("user_password", ClerkUserFixtures.PasswordUser("baker@example.com"));

            var response = await GetAsync("/api/auth/me", _clerk.CreateToken(subject: "user_password"));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var me = await response.Content.ReadFromJsonAsync<UserDto>();
            Assert.Equal("baker@example.com", me!.Email);
            Assert.Equal("user_password", Assert.Single(await UsersAsync()).ClerkId);
        }

        [Fact]
        public async Task ValidToken_OnAnonymousEndpoint_StillResolvesUserId()
        {
            _clerkApi.WithUser("user_a", ClerkUserFixtures.GoogleUser("a@example.com"));

            var body = await (await GetAsync("/test/anonymous", _clerk.CreateToken(subject: "user_a"))).Content.ReadAsStringAsync();

            Assert.Equal(Assert.Single(await UsersAsync()).Id.ToString(), body);
        }

        // ---------- Account ownership ----------

        [Fact]
        public async Task EachToken_ResolvesToItsOwnInternalUser_EvenAfterMoreSignUps()
        {
            _clerkApi.WithUser("user_a", ClerkUserFixtures.GoogleUser("a@example.com"))
                     .WithUser("user_b", ClerkUserFixtures.PasswordUser("b@example.com"));
            var tokenA = _clerk.CreateToken(subject: "user_a");
            var tokenB = _clerk.CreateToken(subject: "user_b");

            var idA = await (await GetAsync("/test/protected", tokenA)).Content.ReadAsStringAsync();
            var idB = await (await GetAsync("/test/protected", tokenB)).Content.ReadAsStringAsync();
            var idAAgain = await (await GetAsync("/test/protected", _clerk.CreateToken(subject: "user_a"))).Content.ReadAsStringAsync();

            Assert.NotEqual(idA, idB);
            Assert.Equal(idA, idAAgain);
            Assert.Equal(2, (await UsersAsync()).Count);
            Assert.Equal(2, _clerkApi.RequestCount); // Clerk is asked only on each identity's first request
        }

        [Fact]
        public async Task TamperedSubject_CannotImpersonateAnotherUser()
        {
            _clerkApi.WithUser("user_a", ClerkUserFixtures.GoogleUser("a@example.com"))
                     .WithUser("user_b", ClerkUserFixtures.PasswordUser("b@example.com"));
            await GetAsync("/test/protected", _clerk.CreateToken(subject: "user_b")); // B exists

            // A's valid token with its subject rewritten to B's.
            var forged = Tamper(_clerk.CreateToken(subject: "user_a"), "user_a", "user_b");

            Assert.Equal(HttpStatusCode.Unauthorized, (await GetAsync("/test/protected", forged)).StatusCode);
        }

        // ---------- Provisioning failures are explicit, not silent ----------

        [Fact]
        public async Task LegacyAccountEmail_Returns403WithCode_AndDoesNotLink()
        {
            var legacyId = await AddLegacyUserAsync("dana@example.com");
            _clerkApi.WithUser("user_new", ClerkUserFixtures.GoogleUser("dana@example.com"));

            var response = await GetAsync("/api/auth/me", _clerk.CreateToken(subject: "user_new"));

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            var error = await response.Content.ReadFromJsonAsync<AuthErrorResponse>();
            Assert.Equal(nameof(ProvisioningStatus.LegacyAccountLinkRequired), error!.Code);
            var stored = Assert.Single(await UsersAsync());
            Assert.Equal(legacyId, stored.Id);
            Assert.Null(stored.ClerkId);
            Assert.Equal("$2a$11$legacy", stored.PasswordHash);
        }

        [Fact]
        public async Task UnverifiedEmail_Returns403WithCode()
        {
            _clerkApi.WithUser("user_p", ClerkUserFixtures.PasswordUser("baker@example.com", status: "unverified"));

            var response = await GetAsync("/api/auth/me", _clerk.CreateToken(subject: "user_p"));

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            Assert.Equal(nameof(ProvisioningStatus.EmailNotVerified),
                (await response.Content.ReadFromJsonAsync<AuthErrorResponse>())!.Code);
            Assert.Empty(await UsersAsync());
        }

        [Fact]
        public async Task ClerkApiDown_Returns503WithCode()
        {
            _clerkApi.Failing("user_p", HttpStatusCode.BadGateway);

            var response = await GetAsync("/api/auth/me", _clerk.CreateToken(subject: "user_p"));

            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
            Assert.Equal(nameof(ProvisioningStatus.ClerkUnavailable),
                (await response.Content.ReadFromJsonAsync<AuthErrorResponse>())!.Code);
        }

        [Fact]
        public async Task RemovedPasswordEndpoints_AreGone()
        {
            // No endpoint exists for these routes any more...
            var routes = _app.Services.GetRequiredService<Microsoft.AspNetCore.Routing.EndpointDataSource>().Endpoints
                .OfType<Microsoft.AspNetCore.Routing.RouteEndpoint>()
                .Select(e => e.RoutePattern.RawText?.Trim('/').ToLowerInvariant())
                .ToList();
            Assert.DoesNotContain("api/auth/login", routes);
            Assert.DoesNotContain("api/auth/register", routes);
            Assert.DoesNotContain("api/auth/clerk-sync", routes);

            // ...and requests to them are refused (401 from the secure-by-default policy, before any routing detail leaks).
            Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsJsonAsync("/api/auth/login", new { email = "a@b.c", password = "x" })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsJsonAsync("/api/auth/register", new { email = "a@b.c", password = "x" })).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsync("/api/auth/clerk-sync", null)).StatusCode);
        }

        // ---------- helpers ----------

        private static string Unsigned()
        {
            var exp = DateTimeOffset.UtcNow.AddMinutes(1).ToUnixTimeSeconds();
            return $"{B64("{\"alg\":\"none\",\"typ\":\"JWT\"}")}." +
                   $"{B64($"{{\"sub\":\"user_123\",\"iss\":\"{TestConfig.ClerkIssuer}\",\"azp\":\"{TestConfig.AllowedOrigin}\",\"exp\":{exp}}}")}.";
        }

        private static string Hs256(string issuer = TestConfig.ClerkIssuer)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("bakery-default-secret-change-in-production-32chars!"));
            return new Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
            {
                Issuer = issuer,
                Claims = new Dictionary<string, object> { ["sub"] = "user_123", ["azp"] = TestConfig.AllowedOrigin, ["userId"] = "1" },
                Expires = DateTime.UtcNow.AddMinutes(1),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
            });
        }

        private static string Tamper(string token, string from = "user_a", string to = "user_123")
        {
            var parts = token.Split('.');
            var payload = Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(parts[1])).Replace(from, to);
            return $"{parts[0]}.{B64(payload)}.{parts[2]}";
        }

        private static string B64(string json) => Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(json));
    }
}
