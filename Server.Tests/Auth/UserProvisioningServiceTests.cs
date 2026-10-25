using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Server.Auth;
using Server.Data;
using Server.Models;

namespace Server.Tests.Auth
{
    public class UserProvisioningServiceTests
    {
        private readonly BakeryDbContext _db = new(new DbContextOptionsBuilder<BakeryDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options, UnscopedCurrentUser.Instance);

        private readonly FakeClerkBackendApi _clerkApi = new();

        private UserProvisioningService CreateService() => new(
            _db,
            new ClerkUserClient(
                new HttpClient(_clerkApi) { BaseAddress = ClerkUserClient.BackendApiBaseAddress },
                TestConfig.ValidClerkSettings()),
            NullLogger<UserProvisioningService>.Instance);

        private async Task<User> AddUserAsync(string email, string passwordHash, string? clerkId)
        {
            var user = new User { Email = email, Name = "Existing", PasswordHash = passwordHash, ClerkId = clerkId };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            _db.ChangeTracker.Clear();
            return user;
        }

        [Fact]
        public async Task KnownClerkIdentity_ResolvesToExistingUser_WithoutCallingClerk()
        {
            var existing = await AddUserAsync("dana@example.com", string.Empty, "user_1");

            var result = await CreateService().ResolveAsync("user_1", default);

            Assert.Equal(ProvisioningStatus.Success, result.Status);
            Assert.Equal(existing.Id, result.UserId);
            Assert.Equal(0, _clerkApi.RequestCount);
        }

        [Fact]
        public async Task NewGoogleUser_IsCreated_WithClerkIdAndNoPassword()
        {
            _clerkApi.WithUser("user_g", ClerkUserFixtures.GoogleUser("Dana@Gmail.com"));

            var result = await CreateService().ResolveAsync("user_g", default);

            Assert.Equal(ProvisioningStatus.Success, result.Status);
            var user = await _db.Users.SingleAsync();
            Assert.Equal(result.UserId, user.Id);
            Assert.Equal("dana@gmail.com", user.Email);
            Assert.Equal("Dana Baker", user.Name);
            Assert.Equal("user_g", user.ClerkId);
            Assert.Equal(string.Empty, user.PasswordHash);
        }

        [Fact]
        public async Task NewEmailPasswordUser_IsCreated_NameDefaultsToEmailPrefix()
        {
            _clerkApi.WithUser("user_p", ClerkUserFixtures.PasswordUser("baker@example.com"));

            var result = await CreateService().ResolveAsync("user_p", default);

            Assert.Equal(ProvisioningStatus.Success, result.Status);
            var user = await _db.Users.SingleAsync();
            Assert.Equal("baker", user.Name);
            Assert.Equal("user_p", user.ClerkId);
        }

        [Fact]
        public async Task SameIdentityTwice_CreatesOneUser_AndCallsClerkOnce()
        {
            _clerkApi.WithUser("user_p", ClerkUserFixtures.PasswordUser("baker@example.com"));
            var service = CreateService();

            var first = await service.ResolveAsync("user_p", default);
            var second = await service.ResolveAsync("user_p", default);

            Assert.Equal(first.UserId, second.UserId);
            Assert.Equal(1, await _db.Users.CountAsync());
            Assert.Equal(1, _clerkApi.RequestCount);
        }

        [Fact]
        public async Task DifferentIdentities_GetDifferentInternalUsers()
        {
            _clerkApi.WithUser("user_a", ClerkUserFixtures.GoogleUser("a@example.com"))
                     .WithUser("user_b", ClerkUserFixtures.PasswordUser("b@example.com"));
            var service = CreateService();

            var a = await service.ResolveAsync("user_a", default);
            var b = await service.ResolveAsync("user_b", default);

            Assert.NotEqual(a.UserId, b.UserId);
            Assert.Equal("user_a", (await _db.Users.FindAsync(a.UserId))!.ClerkId);
            Assert.Equal("user_b", (await _db.Users.FindAsync(b.UserId))!.ClerkId);
        }

        [Fact]
        public async Task LegacyAccountWithSameEmail_IsNotLinked_AndNothingChanges()
        {
            var legacy = await AddUserAsync("dana@example.com", "$2a$11$legacyhashlegacyhashlegacyhashlegacyhashlegacyhashleg", clerkId: null);
            _clerkApi.WithUser("user_new", ClerkUserFixtures.GoogleUser("Dana@Example.com"));

            var result = await CreateService().ResolveAsync("user_new", default);

            Assert.Equal(ProvisioningStatus.LegacyAccountLinkRequired, result.Status);
            Assert.Null(result.UserId);
            var stored = await _db.Users.SingleAsync();
            Assert.Equal(legacy.Id, stored.Id);
            Assert.Null(stored.ClerkId);
            Assert.Equal(legacy.PasswordHash, stored.PasswordHash);
        }

        [Fact]
        public async Task EmailLinkedToAnotherClerkIdentity_IsConflict_AndNothingChanges()
        {
            await AddUserAsync("dana@example.com", string.Empty, clerkId: "user_original");
            _clerkApi.WithUser("user_other", ClerkUserFixtures.PasswordUser("dana@example.com"));

            var result = await CreateService().ResolveAsync("user_other", default);

            Assert.Equal(ProvisioningStatus.IdentityConflict, result.Status);
            Assert.Equal("user_original", (await _db.Users.SingleAsync()).ClerkId);
        }

        [Fact]
        public async Task UnverifiedEmail_IsRejected_AndNoUserCreated()
        {
            _clerkApi.WithUser("user_p", ClerkUserFixtures.PasswordUser("baker@example.com", status: "unverified"));

            var result = await CreateService().ResolveAsync("user_p", default);

            Assert.Equal(ProvisioningStatus.EmailNotVerified, result.Status);
            Assert.Empty(_db.Users);
        }

        [Fact]
        public async Task ClerkApiFailure_IsReported_AndNoUserCreated()
        {
            _clerkApi.Failing("user_p", HttpStatusCode.ServiceUnavailable);

            var result = await CreateService().ResolveAsync("user_p", default);

            Assert.Equal(ProvisioningStatus.ClerkUnavailable, result.Status);
            Assert.Empty(_db.Users);
        }
    }
}
