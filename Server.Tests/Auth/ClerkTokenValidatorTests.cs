using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Server.Auth;

namespace Server.Tests.Auth
{
    public class ClerkTokenValidatorTests : IDisposable
    {
        private readonly FakeClerkIssuer _clerk = new();

        private ClerkTokenValidator CreateValidator(IClerkSigningKeyProvider? keys = null) =>
            new(TestConfig.ValidClerkSettings(), keys ?? new StaticKeyProvider(new[] { _clerk.PublicKey }));

        [Fact]
        public async Task ValidToken_IsAccepted_AndReturnsClerkUserId()
        {
            var result = await CreateValidator().ValidateAsync(_clerk.CreateToken(subject: "user_abc"), default);

            Assert.True(result.IsValid, result.FailureReason);
            Assert.Equal("user_abc", result.ClerkUserId);
        }

        [Fact]
        public async Task ExpiredToken_IsRejected()
        {
            var now = DateTime.UtcNow;
            var token = _clerk.CreateToken(notBefore: now.AddMinutes(-10), expires: now.AddMinutes(-5));

            var result = await CreateValidator().ValidateAsync(token, default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task NotYetValidToken_IsRejected()
        {
            var now = DateTime.UtcNow;
            var token = _clerk.CreateToken(notBefore: now.AddMinutes(5), expires: now.AddMinutes(10));

            var result = await CreateValidator().ValidateAsync(token, default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task WrongIssuer_IsRejected()
        {
            var token = _clerk.CreateToken(issuer: "https://attacker.clerk.accounts.dev");

            var result = await CreateValidator().ValidateAsync(token, default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task TokenSignedByUnknownKey_IsRejected_AfterOneKeyRefresh()
        {
            using var attacker = new FakeClerkIssuer(keyId: "attacker-key");
            var keys = new StaticKeyProvider(new[] { _clerk.PublicKey });

            var result = await CreateValidator(keys).ValidateAsync(attacker.CreateToken(), default);

            Assert.False(result.IsValid);
            Assert.Equal(1, keys.ForcedRefreshCount);
        }

        [Fact]
        public async Task TokenSignedWithRotatedKey_IsAccepted_AfterRefresh()
        {
            using var rotated = new FakeClerkIssuer(keyId: "rotated-key");
            var keys = new StaticKeyProvider(
                initialKeys: new[] { _clerk.PublicKey },
                refreshedKeys: new[] { _clerk.PublicKey, rotated.PublicKey });

            var result = await CreateValidator(keys).ValidateAsync(rotated.CreateToken(), default);

            Assert.True(result.IsValid, result.FailureReason);
            Assert.Equal(1, keys.ForcedRefreshCount);
        }

        [Fact]
        public async Task UnsignedToken_IsRejected()
        {
            // alg "none" with a payload that would otherwise pass every check.
            var exp = DateTimeOffset.UtcNow.AddMinutes(1).ToUnixTimeSeconds();
            var token = $"{B64("{\"alg\":\"none\",\"typ\":\"JWT\"}")}." +
                        $"{B64($"{{\"sub\":\"user_123\",\"iss\":\"{TestConfig.ClerkIssuer}\",\"azp\":\"{TestConfig.AllowedOrigin}\",\"exp\":{exp}}}")}.";

            var result = await CreateValidator().ValidateAsync(token, default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task SymmetricHs256Token_IsRejected()
        {
            // Algorithm-confusion attempt: HS256 instead of Clerk's RS256.
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("attacker-chosen-secret-0123456789abcdef"));
            var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
            {
                Issuer = TestConfig.ClerkIssuer,
                Claims = new Dictionary<string, object> { ["sub"] = "user_123", ["azp"] = TestConfig.AllowedOrigin },
                Expires = DateTime.UtcNow.AddMinutes(1),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
            });
            var keys = new StaticKeyProvider(new SecurityKey[] { _clerk.PublicKey, key });

            var result = await CreateValidator(keys).ValidateAsync(token, default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task TamperedPayload_IsRejected()
        {
            var parts = _clerk.CreateToken(subject: "user_123").Split('.');
            var payload = Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(parts[1])).Replace("user_123", "user_999");

            var result = await CreateValidator().ValidateAsync($"{parts[0]}.{B64(payload)}.{parts[2]}", default);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task MissingAzp_IsRejected()
        {
            var result = await CreateValidator().ValidateAsync(_clerk.CreateToken(azp: null), default);
            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task UnauthorizedAzp_IsRejected()
        {
            var result = await CreateValidator().ValidateAsync(_clerk.CreateToken(azp: "https://evil.example"), default);
            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task MissingSubject_IsRejected()
        {
            var result = await CreateValidator().ValidateAsync(_clerk.CreateToken(subject: null), default);
            Assert.False(result.IsValid);
        }

        [Theory]
        [InlineData("")]
        [InlineData("not-a-jwt")]
        [InlineData("a.b.c")]
        public async Task Garbage_IsRejected(string token)
        {
            var result = await CreateValidator().ValidateAsync(token, default);
            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task KeysUnavailable_IsReportedAsUnavailable_NotAsCrash()
        {
            var result = await CreateValidator(new FailingKeyProvider()).ValidateAsync(_clerk.CreateToken(), default);

            Assert.False(result.IsValid);
            Assert.True(result.KeysUnavailable);
        }

        [Fact]
        public async Task InvalidToken_IsNotReportedAsUnavailable()
        {
            var result = await CreateValidator().ValidateAsync(_clerk.CreateToken(azp: "https://evil.example"), default);

            Assert.False(result.IsValid);
            Assert.False(result.KeysUnavailable);
        }

        private sealed class FailingKeyProvider : IClerkSigningKeyProvider
        {
            public Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(bool forceRefresh, CancellationToken cancellationToken) =>
                throw new HttpRequestException("Clerk JWKS endpoint unreachable");
        }

        private static string B64(string json) => Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(json));

        public void Dispose() => _clerk.Dispose();
    }
}
