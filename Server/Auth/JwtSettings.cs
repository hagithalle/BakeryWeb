using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Server.Auth
{
    /// <summary>
    /// Settings for the JWTs this server issues to the client.
    /// The signing secret must come from configuration (JWT_SECRET) - there is deliberately no fallback.
    /// </summary>
    public sealed class JwtSettings
    {
        public const string SecretConfigKey = "JWT_SECRET";
        public const string Issuer = "BakeryWeb";
        public const string Audience = "BakeryWeb.Client";
        public const int MinimumSecretBytes = 32;
        public static readonly TimeSpan TokenLifetime = TimeSpan.FromDays(30);

        // The old hard-coded fallback is public in Git history, so it must never be accepted as a secret.
        private const string LegacyPublicSecret = "bakery-default-secret-change-in-production-32chars!";

        public SymmetricSecurityKey SigningKey { get; }

        private JwtSettings(SymmetricSecurityKey signingKey)
        {
            SigningKey = signingKey;
        }

        /// <summary>
        /// Reads and validates JWT_SECRET. Error messages name the setting but never include its value.
        /// </summary>
        public static JwtSettings FromConfiguration(IConfiguration configuration)
        {
            var secret = configuration[SecretConfigKey];

            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException(
                    $"Missing required configuration '{SecretConfigKey}'. Set it to a random value of at least {MinimumSecretBytes} bytes.");

            if (secret == LegacyPublicSecret)
                throw new InvalidOperationException(
                    $"'{SecretConfigKey}' is set to the old publicly known default. Generate a new random secret.");

            var bytes = Encoding.UTF8.GetBytes(secret);
            if (bytes.Length < MinimumSecretBytes)
                throw new InvalidOperationException(
                    $"'{SecretConfigKey}' is too short. It must be at least {MinimumSecretBytes} bytes.");

            return new JwtSettings(new SymmetricSecurityKey(bytes));
        }

        public TokenValidationParameters CreateValidationParameters() => new()
        {
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            RequireExpirationTime = true,
            RequireSignedTokens = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = SigningKey,
            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    }
}
