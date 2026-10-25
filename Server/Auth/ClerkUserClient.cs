using System.Net.Http.Headers;
using System.Text.Json;

namespace Server.Auth
{
    public sealed record ClerkUserProfile(string Email, string? Name);

    public interface IClerkUserClient
    {
        /// <summary>
        /// Returns the user's primary email from Clerk, or null if it is missing or not verified.
        /// Throws <see cref="HttpRequestException"/> if Clerk cannot be reached.
        /// </summary>
        Task<ClerkUserProfile?> GetVerifiedPrimaryEmailAsync(string clerkUserId, CancellationToken cancellationToken);
    }

    /// <summary>
    /// Reads user details from the Clerk Backend API. Session tokens don't contain the email by default,
    /// and even when they do we need Clerk's verification status before linking accounts by email.
    /// </summary>
    public sealed class ClerkUserClient : IClerkUserClient
    {
        public static readonly Uri BackendApiBaseAddress = new("https://api.clerk.com/v1/");

        private readonly HttpClient _http;
        private readonly ClerkSettings _settings;

        public ClerkUserClient(HttpClient http, ClerkSettings settings)
        {
            _http = http;
            _settings = settings;
        }

        public async Task<ClerkUserProfile?> GetVerifiedPrimaryEmailAsync(string clerkUserId, CancellationToken cancellationToken)
        {
            if (!_settings.Enabled)
                throw new InvalidOperationException("Clerk sign-in is not configured.");

            using var request = new HttpRequestMessage(HttpMethod.Get, $"users/{Uri.EscapeDataString(clerkUserId)}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

            using var response = await _http.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            return ParseVerifiedPrimaryEmail(json);
        }

        /// <summary>
        /// Picks the primary email address from a Clerk user object, only if Clerk marks it as verified.
        /// </summary>
        public static ClerkUserProfile? ParseVerifiedPrimaryEmail(string userJson)
        {
            using var doc = JsonDocument.Parse(userJson);
            var root = doc.RootElement;

            var primaryId = GetString(root, "primary_email_address_id");
            if (string.IsNullOrEmpty(primaryId)
                || !root.TryGetProperty("email_addresses", out var addresses)
                || addresses.ValueKind != JsonValueKind.Array)
                return null;

            foreach (var address in addresses.EnumerateArray())
            {
                if (GetString(address, "id") != primaryId)
                    continue;

                var email = GetString(address, "email_address");
                var status = address.TryGetProperty("verification", out var verification)
                    ? GetString(verification, "status")
                    : null;

                if (string.IsNullOrWhiteSpace(email) || status != "verified")
                    return null;

                var name = $"{GetString(root, "first_name")} {GetString(root, "last_name")}".Trim();
                return new ClerkUserProfile(email, string.IsNullOrEmpty(name) ? null : name);
            }

            return null;
        }

        private static string? GetString(JsonElement element, string property) =>
            element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(property, out var value)
            && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
    }
}
