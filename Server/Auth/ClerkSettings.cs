namespace Server.Auth
{
    /// <summary>
    /// Configuration for verifying Clerk (Google sign-in) session tokens.
    /// Clerk sign-in is optional: when none of the settings are present it is disabled and
    /// /api/auth/clerk-sync returns 503. A partial configuration is treated as an error.
    /// </summary>
    public sealed class ClerkSettings
    {
        public const string IssuerConfigKey = "CLERK_ISSUER";
        public const string SecretKeyConfigKey = "CLERK_SECRET_KEY";
        public const string AuthorizedPartiesConfigKey = "CLERK_AUTHORIZED_PARTIES";

        public bool Enabled { get; }

        /// <summary>Clerk Frontend API URL, e.g. https://your-app.clerk.accounts.dev (no trailing slash).</summary>
        public string Issuer { get; } = string.Empty;

        /// <summary>Clerk Backend API secret key. Never log this value.</summary>
        public string SecretKey { get; } = string.Empty;

        /// <summary>Frontend origins allowed in the token's "azp" claim.</summary>
        public IReadOnlyCollection<string> AuthorizedParties { get; } = Array.Empty<string>();

        public Uri JwksUri => new($"{Issuer}/.well-known/jwks.json");

        private ClerkSettings() { }

        private ClerkSettings(string issuer, string secretKey, IReadOnlyCollection<string> authorizedParties)
        {
            Enabled = true;
            Issuer = issuer;
            SecretKey = secretKey;
            AuthorizedParties = authorizedParties;
        }

        public static ClerkSettings Disabled() => new();

        public static ClerkSettings FromConfiguration(IConfiguration configuration)
        {
            var issuer = configuration[IssuerConfigKey]?.Trim();
            var secretKey = configuration[SecretKeyConfigKey]?.Trim();
            var parties = configuration[AuthorizedPartiesConfigKey]?.Trim();

            var values = new[] { issuer, secretKey, parties };
            if (values.All(string.IsNullOrEmpty))
                return Disabled();

            var missing = new List<string>();
            if (string.IsNullOrEmpty(issuer)) missing.Add(IssuerConfigKey);
            if (string.IsNullOrEmpty(secretKey)) missing.Add(SecretKeyConfigKey);
            if (string.IsNullOrEmpty(parties)) missing.Add(AuthorizedPartiesConfigKey);
            if (missing.Count > 0)
                throw new InvalidOperationException(
                    $"Clerk sign-in is partially configured. Missing: {string.Join(", ", missing)}.");

            return new ClerkSettings(NormalizeIssuer(issuer!), secretKey!, ParseAuthorizedParties(parties!));
        }

        public bool IsAuthorizedParty(string? azp) =>
            !string.IsNullOrEmpty(azp) && AuthorizedParties.Contains(azp.TrimEnd('/'), StringComparer.OrdinalIgnoreCase);

        private static string NormalizeIssuer(string issuer)
        {
            if (!Uri.TryCreate(issuer, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps
                || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
                throw new InvalidOperationException(
                    $"'{IssuerConfigKey}' must be an https URL such as https://your-app.clerk.accounts.dev.");

            return issuer.TrimEnd('/');
        }

        private static IReadOnlyCollection<string> ParseAuthorizedParties(string raw)
        {
            var origins = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(o => o.TrimEnd('/'))
                .ToList();

            foreach (var origin in origins)
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                    || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)
                    || uri.AbsolutePath != "/")
                    throw new InvalidOperationException(
                        $"'{AuthorizedPartiesConfigKey}' must be a comma-separated list of origins such as https://bakery-web-tawny.vercel.app.");
            }

            if (origins.Count == 0)
                throw new InvalidOperationException($"'{AuthorizedPartiesConfigKey}' must contain at least one origin.");

            return origins;
        }
    }
}
