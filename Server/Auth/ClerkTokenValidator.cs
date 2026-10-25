using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Server.Auth
{
    public sealed record ClerkTokenValidationResult(bool IsValid, string? ClerkUserId, string? FailureReason)
    {
        public static ClerkTokenValidationResult Success(string clerkUserId) => new(true, clerkUserId, null);
        public static ClerkTokenValidationResult Failure(string reason) => new(false, null, reason);
    }

    public interface IClerkTokenValidator
    {
        Task<ClerkTokenValidationResult> ValidateAsync(string token, CancellationToken cancellationToken);
    }

    /// <summary>
    /// Verifies a Clerk session token: RS256 signature against Clerk's published keys, issuer,
    /// expiry / not-before, subject, and that "azp" is one of our own frontend origins.
    /// </summary>
    public sealed class ClerkTokenValidator : IClerkTokenValidator
    {
        // Clerk session tokens are short-lived (about 60 seconds), so keep clock skew small.
        private static readonly TimeSpan ClockSkew = TimeSpan.FromSeconds(30);

        private readonly ClerkSettings _settings;
        private readonly IClerkSigningKeyProvider _keyProvider;
        private readonly JsonWebTokenHandler _handler = new();

        public ClerkTokenValidator(ClerkSettings settings, IClerkSigningKeyProvider keyProvider)
        {
            _settings = settings;
            _keyProvider = keyProvider;
        }

        public async Task<ClerkTokenValidationResult> ValidateAsync(string token, CancellationToken cancellationToken)
        {
            if (!_settings.Enabled)
                return ClerkTokenValidationResult.Failure("Clerk sign-in is not configured");

            if (string.IsNullOrWhiteSpace(token))
                return ClerkTokenValidationResult.Failure("Token is empty");

            var keys = await _keyProvider.GetSigningKeysAsync(forceRefresh: false, cancellationToken);
            var result = await _handler.ValidateTokenAsync(token, CreateParameters(keys));

            // Unknown signing key: Clerk may have rotated keys, so refresh once and retry.
            if (!result.IsValid && result.Exception is SecurityTokenSignatureKeyNotFoundException)
            {
                keys = await _keyProvider.GetSigningKeysAsync(forceRefresh: true, cancellationToken);
                result = await _handler.ValidateTokenAsync(token, CreateParameters(keys));
            }

            if (!result.IsValid)
                return ClerkTokenValidationResult.Failure(result.Exception?.GetType().Name ?? "Invalid token");

            if (result.SecurityToken is not JsonWebToken jwt)
                return ClerkTokenValidationResult.Failure("Unexpected token type");

            if (string.IsNullOrWhiteSpace(jwt.Subject))
                return ClerkTokenValidationResult.Failure("Token has no subject");

            if (!jwt.TryGetPayloadValue<string>("azp", out var authorizedParty) || !_settings.IsAuthorizedParty(authorizedParty))
                return ClerkTokenValidationResult.Failure("Token was not issued for an authorized origin");

            return ClerkTokenValidationResult.Success(jwt.Subject);
        }

        private TokenValidationParameters CreateParameters(IReadOnlyList<SecurityKey> keys) => new()
        {
            ValidateIssuer = true,
            ValidIssuer = _settings.Issuer,
            // Clerk session tokens carry no "aud" claim; the origin check is done with "azp" above.
            ValidateAudience = false,
            ValidateLifetime = true,
            RequireExpirationTime = true,
            RequireSignedTokens = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = keys,
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
            ClockSkew = ClockSkew,
        };
    }
}
