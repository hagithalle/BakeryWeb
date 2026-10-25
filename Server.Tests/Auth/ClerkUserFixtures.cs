using System.Net;

namespace Server.Tests.Auth
{
    /// <summary>
    /// Clerk Backend API user objects as returned for the two supported sign-in flows.
    /// The backend treats both the same way: only the primary email's verification status matters.
    /// </summary>
    internal static class ClerkUserFixtures
    {
        /// <summary>User created via "Continue with Google" (email verified by the OAuth provider).</summary>
        public static string GoogleUser(string email, string firstName = "Dana", string lastName = "Baker") => $$"""
            {
              "id": "user_google",
              "first_name": "{{firstName}}",
              "last_name": "{{lastName}}",
              "password_enabled": false,
              "primary_email_address_id": "idn_google",
              "email_addresses": [
                { "id": "idn_google", "email_address": "{{email}}",
                  "verification": { "status": "verified", "strategy": "from_oauth_google" } }
              ],
              "external_accounts": [ { "provider": "oauth_google", "email_address": "{{email}}" } ]
            }
            """;

        /// <summary>User who signed up with email + password and confirmed the emailed code.</summary>
        public static string PasswordUser(string email, string status = "verified") => $$"""
            {
              "id": "user_password",
              "first_name": null,
              "last_name": null,
              "password_enabled": true,
              "primary_email_address_id": "idn_password",
              "email_addresses": [
                { "id": "idn_password", "email_address": "{{email}}",
                  "verification": { "status": "{{status}}", "strategy": "email_code" } }
              ],
              "external_accounts": []
            }
            """;
    }

    /// <summary>Fake Clerk Backend API: answers GET users/{id} from a per-user table.</summary>
    internal sealed class FakeClerkBackendApi : HttpMessageHandler
    {
        private readonly Dictionary<string, (HttpStatusCode Status, string Body)> _users = new();

        public int RequestCount { get; private set; }

        public FakeClerkBackendApi WithUser(string clerkUserId, string json)
        {
            _users[clerkUserId] = (HttpStatusCode.OK, json);
            return this;
        }

        public FakeClerkBackendApi Failing(string clerkUserId, HttpStatusCode status)
        {
            _users[clerkUserId] = (status, "{}");
            return this;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            var id = Uri.UnescapeDataString(request.RequestUri!.AbsolutePath.Split('/').Last());
            var (status, body) = _users.TryGetValue(id, out var entry) ? entry : (HttpStatusCode.NotFound, "{}");
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
        }
    }
}
