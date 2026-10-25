using System.Net;
using Microsoft.IdentityModel.Tokens;
using Server.Auth;

namespace Server.Tests.Auth
{
    public class ClerkJwksKeyProviderTests : IDisposable
    {
        private readonly FakeClerkIssuer _clerk = new();

        private string JwksJson()
        {
            var jwk = JsonWebKeyConverter.ConvertFromRSASecurityKey(_clerk.PublicKey);
            jwk.Use = "sig";
            jwk.Alg = SecurityAlgorithms.RsaSha256;
            return $$"""{"keys":[{"kty":"RSA","kid":"{{jwk.Kid}}","use":"sig","alg":"RS256","n":"{{jwk.N}}","e":"{{jwk.E}}"}]}""";
        }

        [Fact]
        public async Task FetchesPublicKeys_FromIssuerJwksUrl()
        {
            var handler = new StubHttpHandler(HttpStatusCode.OK, JwksJson());
            var provider = new ClerkJwksKeyProvider(
                new StubHttpClientFactory(handler), TestConfig.EnabledClerkSettings(), TimeProvider.System);

            var keys = await provider.GetSigningKeysAsync(false, default);

            Assert.Single(keys);
            Assert.Equal("test-key-1", keys[0].KeyId);
            Assert.Equal($"{TestConfig.ClerkIssuer}/.well-known/jwks.json", handler.LastRequest!.RequestUri!.ToString());
        }

        [Fact]
        public async Task CachesKeys_AndRateLimitsForcedRefresh()
        {
            var handler = new StubHttpHandler(HttpStatusCode.OK, JwksJson());
            var time = new FixedTimeProvider(DateTimeOffset.UtcNow);
            var provider = new ClerkJwksKeyProvider(new StubHttpClientFactory(handler), TestConfig.EnabledClerkSettings(), time);

            await provider.GetSigningKeysAsync(false, default);
            await provider.GetSigningKeysAsync(false, default);
            await provider.GetSigningKeysAsync(true, default); // too soon after the last fetch
            Assert.Equal(1, handler.CallCount);

            time.Now += TimeSpan.FromMinutes(6);
            await provider.GetSigningKeysAsync(true, default);
            Assert.Equal(2, handler.CallCount);

            time.Now += TimeSpan.FromHours(2); // cache expired
            await provider.GetSigningKeysAsync(false, default);
            Assert.Equal(3, handler.CallCount);
        }

        public void Dispose() => _clerk.Dispose();
    }
}
