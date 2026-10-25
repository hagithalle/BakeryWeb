using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Server.Auth;
using Server.Models;

namespace Server.Tests.Auth
{
    /// <summary>
    /// Tests for the server's own session JWTs, validated with the same parameters JwtBearer uses.
    /// </summary>
    public class TokenServiceTests
    {
        private static readonly User TestUser = new() { Id = 42, Email = "baker@example.com", Name = "Baker" };

        private static Task<TokenValidationResult> ValidateAsync(string token, JwtSettings settings) =>
            new JsonWebTokenHandler().ValidateTokenAsync(token, settings.CreateValidationParameters());

        [Fact]
        public async Task IssuedToken_IsValid_AndCarriesUserId()
        {
            var settings = TestConfig.JwtSettings();
            var token = new TokenService(settings, TimeProvider.System).CreateToken(TestUser);

            var result = await ValidateAsync(token, settings);

            Assert.True(result.IsValid, result.Exception?.Message);
            Assert.Equal("42", result.Claims["userId"]);
        }

        [Fact]
        public async Task TokenSignedWithDifferentSecret_IsRejected()
        {
            var otherSettings = JwtSettings.FromConfiguration(TestConfig.Build(
                (JwtSettings.SecretConfigKey, "a-completely-different-secret-0123456789abcdef")));
            var token = new TokenService(otherSettings, TimeProvider.System).CreateToken(TestUser);

            var result = await ValidateAsync(token, TestConfig.JwtSettings());

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task ExpiredToken_IsRejected()
        {
            var settings = TestConfig.JwtSettings();
            var issuedLongAgo = new FixedTimeProvider(DateTimeOffset.UtcNow - JwtSettings.TokenLifetime - TimeSpan.FromHours(1));
            var token = new TokenService(settings, issuedLongAgo).CreateToken(TestUser);

            var result = await ValidateAsync(token, settings);

            Assert.False(result.IsValid);
            Assert.IsType<SecurityTokenExpiredException>(result.Exception);
        }

        [Fact]
        public async Task LegacyTokenWithoutIssuerOrAudience_IsRejected()
        {
            // Shape of tokens issued before this change: same key, but no iss/aud.
            var settings = TestConfig.JwtSettings();
            var legacy = new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
                claims: new[] { new System.Security.Claims.Claim("userId", "42") },
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: new SigningCredentials(settings.SigningKey, SecurityAlgorithms.HmacSha256)));

            var result = await ValidateAsync(legacy, settings);

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task UnsignedToken_IsRejected()
        {
            var header = Base64Url("{\"alg\":\"none\",\"typ\":\"JWT\"}");
            var exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
            var payload = Base64Url(
                $"{{\"userId\":\"42\",\"iss\":\"{JwtSettings.Issuer}\",\"aud\":\"{JwtSettings.Audience}\",\"exp\":{exp}}}");

            var result = await ValidateAsync($"{header}.{payload}.", TestConfig.JwtSettings());

            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task TamperedPayload_IsRejected()
        {
            var settings = TestConfig.JwtSettings();
            var token = new TokenService(settings, TimeProvider.System).CreateToken(TestUser);
            var parts = token.Split('.');
            var tamperedPayload = Base64Url(Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(parts[1]))
                .Replace("\"42\"", "\"1\""));

            var result = await ValidateAsync($"{parts[0]}.{tamperedPayload}.{parts[2]}", settings);

            Assert.False(result.IsValid);
        }

        private static string Base64Url(string json) => Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(json));
    }
}
