using Server.Auth;

namespace Server.Tests.Auth
{
    public class JwtSettingsTests
    {
        [Fact]
        public void MissingSecret_Throws_AndNamesTheSetting()
        {
            var ex = Assert.Throws<InvalidOperationException>(() => JwtSettings.FromConfiguration(TestConfig.Build()));
            Assert.Contains(JwtSettings.SecretConfigKey, ex.Message);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void BlankSecret_Throws(string secret)
        {
            Assert.Throws<InvalidOperationException>(() =>
                JwtSettings.FromConfiguration(TestConfig.Build((JwtSettings.SecretConfigKey, secret))));
        }

        [Fact]
        public void ShortSecret_Throws_WithoutEchoingTheValue()
        {
            const string shortSecret = "too-short-secret";
            var ex = Assert.Throws<InvalidOperationException>(() =>
                JwtSettings.FromConfiguration(TestConfig.Build((JwtSettings.SecretConfigKey, shortSecret))));
            Assert.DoesNotContain(shortSecret, ex.Message);
        }

        [Fact]
        public void OldPublicDefaultSecret_IsRejected()
        {
            Assert.Throws<InvalidOperationException>(() => JwtSettings.FromConfiguration(TestConfig.Build(
                (JwtSettings.SecretConfigKey, "bakery-default-secret-change-in-production-32chars!"))));
        }

        [Fact]
        public void ValidSecret_IsAccepted()
        {
            var settings = TestConfig.JwtSettings();
            Assert.NotNull(settings.SigningKey);
        }
    }
}
