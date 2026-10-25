using System.Net;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Server.Auth;

namespace Server.Tests.Auth
{
    internal static class TestConfig
    {
        public const string ClerkIssuer = "https://clerk.test.example";
        public const string AllowedOrigin = "https://bakery.test.example";

        public static IConfiguration Build(params (string Key, string? Value)[] values) =>
            new ConfigurationBuilder()
                .AddInMemoryCollection(values.Select(v => new KeyValuePair<string, string?>(v.Key, v.Value)))
                .Build();

        public static ClerkSettings ValidClerkSettings() => ClerkSettings.FromConfiguration(Build(
            (ClerkSettings.IssuerConfigKey, ClerkIssuer),
            (ClerkSettings.SecretKeyConfigKey, "sk_test_not_a_real_key"),
            (ClerkSettings.AuthorizedPartiesConfigKey, $"{AllowedOrigin},http://localhost:5173")));
    }

    /// <summary>A TimeProvider fixed at a given instant, for deterministic expiry tests.</summary>
    internal sealed class FixedTimeProvider : TimeProvider
    {
        public DateTimeOffset Now { get; set; }
        public FixedTimeProvider(DateTimeOffset now) => Now = now;
        public override DateTimeOffset GetUtcNow() => Now;
    }

    /// <summary>Simulates Clerk: an RSA key pair that signs session tokens like Clerk does.</summary>
    internal sealed class FakeClerkIssuer : IDisposable
    {
        private readonly RSA _rsa = RSA.Create(2048);

        public FakeClerkIssuer(string keyId = "test-key-1")
        {
            SigningKey = new RsaSecurityKey(_rsa) { KeyId = keyId };
            PublicKey = new RsaSecurityKey(_rsa.ExportParameters(includePrivateParameters: false)) { KeyId = keyId };
        }

        public RsaSecurityKey SigningKey { get; }
        public RsaSecurityKey PublicKey { get; }

        public string CreateToken(
            string? subject = "user_123",
            string? issuer = TestConfig.ClerkIssuer,
            string? azp = TestConfig.AllowedOrigin,
            DateTime? expires = null,
            DateTime? notBefore = null)
        {
            var now = DateTime.UtcNow;
            var claims = new Dictionary<string, object>();
            if (subject != null) claims["sub"] = subject;
            if (azp != null) claims["azp"] = azp;
            claims["sid"] = "sess_123";

            return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
            {
                Issuer = issuer,
                Claims = claims,
                IssuedAt = (notBefore ?? now.AddSeconds(-5)),
                NotBefore = notBefore ?? now.AddSeconds(-5),
                Expires = expires ?? now.AddSeconds(60),
                SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256),
            });
        }

        public void Dispose() => _rsa.Dispose();
    }

    /// <summary>Key provider that serves fixed keys and records forced refreshes.</summary>
    internal sealed class StaticKeyProvider : IClerkSigningKeyProvider
    {
        private readonly IReadOnlyList<SecurityKey> _initialKeys;
        private readonly IReadOnlyList<SecurityKey> _refreshedKeys;

        public StaticKeyProvider(IReadOnlyList<SecurityKey> initialKeys, IReadOnlyList<SecurityKey>? refreshedKeys = null)
        {
            _initialKeys = initialKeys;
            _refreshedKeys = refreshedKeys ?? initialKeys;
        }

        public int ForcedRefreshCount { get; private set; }

        public Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(bool forceRefresh, CancellationToken cancellationToken)
        {
            if (!forceRefresh)
                return Task.FromResult(ForcedRefreshCount > 0 ? _refreshedKeys : _initialKeys);

            ForcedRefreshCount++;
            return Task.FromResult(_refreshedKeys);
        }
    }

    /// <summary>HttpMessageHandler returning a canned response and capturing the request.</summary>
    internal sealed class StubHttpHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string _body;

        public StubHttpHandler(HttpStatusCode status, string body)
        {
            _status = status;
            _body = body;
        }

        public HttpRequestMessage? LastRequest { get; private set; }
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            CallCount++;
            return Task.FromResult(new HttpResponseMessage(_status) { Content = new StringContent(_body) });
        }
    }

    internal sealed class StubHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;
        public StubHttpClientFactory(HttpMessageHandler handler) => _handler = handler;
        public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
    }
}
