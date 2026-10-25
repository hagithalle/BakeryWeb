using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Server.Models;

namespace Server.Auth
{
    /// <summary>
    /// Issues the server's own session JWTs (used by every API call after login).
    /// </summary>
    public sealed class TokenService
    {
        private readonly JwtSettings _settings;
        private readonly TimeProvider _time;

        public TokenService(JwtSettings settings, TimeProvider time)
        {
            _settings = settings;
            _time = time;
        }

        public string CreateToken(User user)
        {
            var now = _time.GetUtcNow().UtcDateTime;
            var credentials = new SigningCredentials(_settings.SigningKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("name", user.Name),
            };

            var token = new JwtSecurityToken(
                issuer: JwtSettings.Issuer,
                audience: JwtSettings.Audience,
                claims: claims,
                notBefore: now,
                expires: now.Add(JwtSettings.TokenLifetime),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
