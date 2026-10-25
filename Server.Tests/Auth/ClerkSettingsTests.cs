using Server.Auth;

namespace Server.Tests.Auth
{
    public class ClerkSettingsTests
    {
        [Fact]
        public void NoSettings_Throw_BecauseClerkIsRequired()
        {
            var ex = Assert.Throws<InvalidOperationException>(() => ClerkSettings.FromConfiguration(TestConfig.Build()));

            Assert.Contains(ClerkSettings.IssuerConfigKey, ex.Message);
            Assert.Contains(ClerkSettings.SecretKeyConfigKey, ex.Message);
            Assert.Contains(ClerkSettings.AuthorizedPartiesConfigKey, ex.Message);
        }

        [Fact]
        public void PartialSettings_Throw_ListingOnlyMissingNames()
        {
            var ex = Assert.Throws<InvalidOperationException>(() => ClerkSettings.FromConfiguration(TestConfig.Build(
                (ClerkSettings.IssuerConfigKey, TestConfig.ClerkIssuer))));

            Assert.Contains(ClerkSettings.SecretKeyConfigKey, ex.Message);
            Assert.Contains(ClerkSettings.AuthorizedPartiesConfigKey, ex.Message);
            Assert.DoesNotContain(ClerkSettings.IssuerConfigKey, ex.Message);
        }

        [Theory]
        [InlineData("http://clerk.test.example")]
        [InlineData("not-a-url")]
        [InlineData("https://clerk.test.example?x=1")]
        public void NonHttpsIssuer_Throws(string issuer)
        {
            Assert.Throws<InvalidOperationException>(() => ClerkSettings.FromConfiguration(TestConfig.Build(
                (ClerkSettings.IssuerConfigKey, issuer),
                (ClerkSettings.SecretKeyConfigKey, "sk_test_x"),
                (ClerkSettings.AuthorizedPartiesConfigKey, TestConfig.AllowedOrigin))));
        }

        [Fact]
        public void AuthorizedPartyWithPath_Throws()
        {
            Assert.Throws<InvalidOperationException>(() => ClerkSettings.FromConfiguration(TestConfig.Build(
                (ClerkSettings.IssuerConfigKey, TestConfig.ClerkIssuer),
                (ClerkSettings.SecretKeyConfigKey, "sk_test_x"),
                (ClerkSettings.AuthorizedPartiesConfigKey, "https://bakery.test.example/login"))));
        }

        [Fact]
        public void ValidSettings_AreNormalized()
        {
            var settings = ClerkSettings.FromConfiguration(TestConfig.Build(
                (ClerkSettings.IssuerConfigKey, TestConfig.ClerkIssuer + "/"),
                (ClerkSettings.SecretKeyConfigKey, "sk_test_x"),
                (ClerkSettings.AuthorizedPartiesConfigKey, " https://bakery.test.example/ , http://localhost:5173 ")));

            Assert.Equal(TestConfig.ClerkIssuer, settings.Issuer);
            Assert.Equal(new Uri(TestConfig.ClerkIssuer + "/.well-known/jwks.json"), settings.JwksUri);
            Assert.True(settings.IsAuthorizedParty("https://bakery.test.example"));
            Assert.True(settings.IsAuthorizedParty("http://localhost:5173"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("https://evil.example")]
        [InlineData("https://bakery.test.example.evil.example")]
        public void UnknownAuthorizedParty_IsRejected(string? azp)
        {
            Assert.False(TestConfig.ValidClerkSettings().IsAuthorizedParty(azp));
        }
    }
}
