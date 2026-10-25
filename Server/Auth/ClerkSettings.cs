namespace Server.Auth
{
    /// <summary>
    /// Configuration for Clerk, the only authentication provider (Google and email/password).
    /// All three settings are required; the server refuses to start without them.
    /// </summary>
    public sealed class ClerkSettings
    {
        public const string IssuerConfigKey = "CLERK_ISSUER";
        public const string SecretKeyConfigKey = "CLERK_SECRET_KEY";
        public const string AuthorizedPartiesConfigKey = "CLERK_AUTHORIZED_PARTIES";

        /// <summary>Clerk Frontend API URL, e.g. https://your-app.clerk.accounts.dev (no trailing slash).</summary>
        public string Issuer { get; }

        /// <summary>Clerk Backend API secret key. Never log this value.</summary>
        public string SecretKey { get; }

        /// <summary>Frontend origins allowed in the token's "azp" claim.</summary>
        public IReadOnlyCollection<string> AuthorizedParties { get; }

        public Uri JwksUri => new($"{Issuer}/.well-known/jwks.json");

        private ClerkSettings(string issuer, string secretKey, IReadOnlyCollection<string> authorizedParties)
        {
            Issuer = issuer;
            SecretKey = secretKey;
            AuthorizedParties = authorizedParties;
        }

        /// <summary>
        /// Reads and validates the Clerk settings. Error messages name settings but never include their values.
        /// </summary>
        public static ClerkSettings FromConfiguration(IConfiguration configuration)
        {
            var issuer = configuration[IssuerConfigKey]?.Trim();
            var secretKey = configuration[SecretKeyConfigKey]?.Trim();
            var parties = configuration[AuthorizedPartiesConfigKey]?.Trim();

            var missing = new List<string>();
            if (string.IsNullOrEmpty(issuer)) missing.Add(IssuerConfigKey);
            if (string.IsNullOrEmpty(secretKey)) missing.Add(SecretKeyConfigKey);
            if (string.IsNullOrEmpty(parties)) missing.Add(AuthorizedPartiesConfigKey);
            if (missing.Count > 0)
                throw new InvalidOperationException(
                    $"Clerk authentication is not configured. Missing: {string.Join(", ", missing)}.");

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
