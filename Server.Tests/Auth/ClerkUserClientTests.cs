using System.Net;
using Server.Auth;

namespace Server.Tests.Auth
{
    public class ClerkUserClientTests
    {
        private static string UserJson(string primaryStatus, string? secondaryStatus = null) => $$"""
            {
              "id": "user_123",
              "first_name": "Dana",
              "last_name": "Baker",
              "primary_email_address_id": "idn_primary",
              "email_addresses": [
                { "id": "idn_secondary", "email_address": "other@example.com",
                  "verification": { "status": "{{secondaryStatus ?? "verified"}}" } },
                { "id": "idn_primary", "email_address": "Dana@Example.com",
                  "verification": { "status": "{{primaryStatus}}" } }
              ]
            }
            """;

        [Fact]
        public void VerifiedPrimaryEmail_IsReturned()
        {
            var profile = ClerkUserClient.ParseVerifiedPrimaryEmail(UserJson("verified"));

            Assert.NotNull(profile);
            Assert.Equal("Dana@Example.com", profile!.Email);
            Assert.Equal("Dana Baker", profile.Name);
        }

        [Theory]
        [InlineData("unverified")]
        [InlineData("expired")]
        [InlineData("transferable")]
        public void UnverifiedPrimaryEmail_ReturnsNull_EvenIfAnotherEmailIsVerified(string status)
        {
            Assert.Null(ClerkUserClient.ParseVerifiedPrimaryEmail(UserJson(status, secondaryStatus: "verified")));
        }

        [Fact]
        public void MissingPrimaryEmail_ReturnsNull()
        {
            const string json = """{ "id": "user_1", "primary_email_address_id": null, "email_addresses": [] }""";
            Assert.Null(ClerkUserClient.ParseVerifiedPrimaryEmail(json));
        }

        [Fact]
        public void PrimaryEmailWithoutVerificationObject_ReturnsNull()
        {
            const string json = """
                { "primary_email_address_id": "idn_1",
                  "email_addresses": [ { "id": "idn_1", "email_address": "a@example.com", "verification": null } ] }
                """;
            Assert.Null(ClerkUserClient.ParseVerifiedPrimaryEmail(json));
        }

        [Fact]
        public async Task Request_UsesBearerSecret_AndEscapesUserId()
        {
            var handler = new StubHttpHandler(HttpStatusCode.OK, UserJson("verified"));
            var client = new ClerkUserClient(
                new HttpClient(handler) { BaseAddress = ClerkUserClient.BackendApiBaseAddress },
                TestConfig.EnabledClerkSettings());

            var profile = await client.GetVerifiedPrimaryEmailAsync("user_1/../admin", default);

            Assert.NotNull(profile);
            Assert.Equal("Bearer", handler.LastRequest!.Headers.Authorization!.Scheme);
            Assert.Equal("https://api.clerk.com/v1/users/user_1%2F..%2Fadmin", handler.LastRequest.RequestUri!.AbsoluteUri);
        }

        [Fact]
        public async Task ClerkApiError_ThrowsHttpRequestException()
        {
            var handler = new StubHttpHandler(HttpStatusCode.InternalServerError, "{}");
            var client = new ClerkUserClient(
                new HttpClient(handler) { BaseAddress = ClerkUserClient.BackendApiBaseAddress },
                TestConfig.EnabledClerkSettings());

            await Assert.ThrowsAsync<HttpRequestException>(() => client.GetVerifiedPrimaryEmailAsync("user_1", default));
        }
    }
}
