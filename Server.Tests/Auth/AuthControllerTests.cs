using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Server.Auth;
using Server.Controllers;
using Server.Data;
using Server.Models;

namespace Server.Tests.Auth
{
    /// <summary>
    /// Controller-level tests with an in-memory database and fake Clerk services.
    /// No real database, network or Clerk account is used.
    /// </summary>
    public class AuthControllerTests
    {
        private const string ClerkId = "user_clerk_1";

        private readonly BakeryDbContext _db = new(new DbContextOptionsBuilder<BakeryDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

        private readonly FakeTokenValidator _validator = new();
        private readonly FakeUserClient _userClient = new();

        private AuthController CreateController(ClerkSettings? clerkSettings = null, string? clerkToken = "clerk-token")
        {
            var controller = new AuthController(
                _db,
                new TokenService(TestConfig.JwtSettings(), TimeProvider.System),
                clerkSettings ?? TestConfig.EnabledClerkSettings(),
                _validator,
                _userClient,
                NullLogger<AuthController>.Instance);

            var httpContext = new DefaultHttpContext();
            if (clerkToken != null)
                httpContext.Request.Headers[AuthController.ClerkTokenHeader] = clerkToken;
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return controller;
        }

        private async Task<User> AddUserAsync(string email, string passwordHash, string? clerkId = null)
        {
            var user = new User { Email = email, Name = "Existing", PasswordHash = passwordHash, ClerkId = clerkId };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        private static int StatusOf(IActionResult result) => result switch
        {
            ObjectResult o => o.StatusCode ?? 200,
            StatusCodeResult s => s.StatusCode,
            _ => throw new InvalidOperationException(result.GetType().Name),
        };

        // ---------- Clerk sync ----------

        [Fact]
        public async Task ClerkSync_WhenClerkNotConfigured_Returns503()
        {
            var result = await CreateController(ClerkSettings.Disabled()).ClerkSync(default);
            Assert.Equal(503, StatusOf(result));
        }

        [Fact]
        public async Task ClerkSync_WithoutToken_Returns400()
        {
            var result = await CreateController(clerkToken: null).ClerkSync(default);
            Assert.Equal(400, StatusOf(result));
        }

        [Fact]
        public async Task ClerkSync_InvalidToken_Returns401_AndCreatesNothing()
        {
            _validator.Result = ClerkTokenValidationResult.Failure("bad signature");

            var result = await CreateController().ClerkSync(default);

            Assert.Equal(401, StatusOf(result));
            Assert.Empty(_db.Users);
            Assert.Equal(0, _userClient.CallCount);
        }

        [Fact]
        public async Task ClerkSync_AlreadyLinkedUser_LogsIn_WithoutEmailLookup()
        {
            await AddUserAsync("dana@example.com", string.Empty, ClerkId);

            var result = await CreateController().ClerkSync(default);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("dana@example.com", Assert.IsType<AuthResponse>(ok.Value).User.Email);
            Assert.Equal(0, _userClient.CallCount);
        }

        [Fact]
        public async Task ClerkSync_NewUserWithVerifiedEmail_CreatesGoogleOnlyAccount()
        {
            _userClient.Profile = new ClerkUserProfile("New.Baker@Example.com", "New Baker");

            var result = await CreateController().ClerkSync(default);

            Assert.IsType<OkObjectResult>(result);
            var user = Assert.Single(_db.Users);
            Assert.Equal("new.baker@example.com", user.Email);
            Assert.Equal(ClerkId, user.ClerkId);
            Assert.Equal(string.Empty, user.PasswordHash);
        }

        [Fact]
        public async Task ClerkSync_UnverifiedEmail_Returns403_AndDoesNotLinkExistingAccount()
        {
            var existing = await AddUserAsync("victim@example.com", PasswordHashing.Hash("secret-password"));
            _userClient.Profile = null; // Clerk reports no verified primary email

            var result = await CreateController().ClerkSync(default);

            Assert.Equal(403, StatusOf(result));
            Assert.Null((await _db.Users.FindAsync(existing.Id))!.ClerkId);
            Assert.Single(_db.Users);
        }

        [Fact]
        public async Task ClerkSync_VerifiedEmailOfPasswordAccount_LinksAndKeepsPassword()
        {
            var hash = PasswordHashing.Hash("secret-password");
            var existing = await AddUserAsync("dana@example.com", hash);
            _userClient.Profile = new ClerkUserProfile("Dana@example.com", null);

            var result = await CreateController().ClerkSync(default);

            Assert.IsType<OkObjectResult>(result);
            var user = await _db.Users.FindAsync(existing.Id);
            Assert.Equal(ClerkId, user!.ClerkId);
            Assert.Equal(hash, user.PasswordHash);
            Assert.Single(_db.Users);
        }

        [Fact]
        public async Task ClerkSync_EmailAlreadyLinkedToAnotherClerkIdentity_Returns409()
        {
            var existing = await AddUserAsync("dana@example.com", string.Empty, clerkId: "user_other");
            _userClient.Profile = new ClerkUserProfile("dana@example.com", null);

            var result = await CreateController().ClerkSync(default);

            Assert.Equal(409, StatusOf(result));
            Assert.Equal("user_other", (await _db.Users.FindAsync(existing.Id))!.ClerkId);
        }

        [Fact]
        public async Task ClerkSync_ClerkApiUnavailable_Returns502()
        {
            _userClient.Exception = new HttpRequestException("down", null, HttpStatusCode.ServiceUnavailable);

            var result = await CreateController().ClerkSync(default);

            Assert.Equal(502, StatusOf(result));
            Assert.Empty(_db.Users);
        }

        // ---------- Password login ----------

        [Fact]
        public async Task Login_CorrectPassword_ReturnsToken()
        {
            await AddUserAsync("dana@example.com", PasswordHashing.Hash("secret-password"));

            var result = await CreateController().Login(new AuthRequest("Dana@Example.com", "secret-password", null));

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.False(string.IsNullOrEmpty(Assert.IsType<AuthResponse>(ok.Value).Token));
        }

        [Fact]
        public async Task Login_WrongPassword_Returns401()
        {
            await AddUserAsync("dana@example.com", PasswordHashing.Hash("secret-password"));

            var result = await CreateController().Login(new AuthRequest("dana@example.com", "wrong", null));

            Assert.Equal(401, StatusOf(result));
        }

        [Fact]
        public async Task Login_GoogleOnlyAccount_Returns401_NotServerError()
        {
            await AddUserAsync("google@example.com", string.Empty, ClerkId);

            var result = await CreateController().Login(new AuthRequest("google@example.com", "anything", null));

            Assert.Equal(401, StatusOf(result));
        }

        [Fact]
        public async Task Login_MalformedStoredHash_Returns401_NotServerError()
        {
            await AddUserAsync("broken@example.com", "not-a-bcrypt-hash");

            var result = await CreateController().Login(new AuthRequest("broken@example.com", "anything", null));

            Assert.Equal(401, StatusOf(result));
        }

        [Fact]
        public async Task Register_ThenLogin_StillWorks()
        {
            var controller = CreateController();
            Assert.IsType<OkObjectResult>(await controller.Register(new AuthRequest("New@Example.com", "pw-123456", "New")));

            var result = await controller.Login(new AuthRequest("new@example.com", "pw-123456", null));

            Assert.IsType<OkObjectResult>(result);
        }

        // ---------- Profile ----------

        [Fact]
        public async Task UpdateMe_PasswordChangeOnGoogleOnlyAccount_Returns400_NotServerError()
        {
            var user = await AddUserAsync("google@example.com", string.Empty, ClerkId);
            var controller = CreateController();
            controller.ControllerContext.HttpContext.User =
                new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim("userId", user.Id.ToString()) }, "test"));

            var result = await controller.UpdateMe(new UpdateProfileRequest(null, "anything", "new-password"));

            Assert.Equal(400, StatusOf(result));
            Assert.Equal(string.Empty, (await _db.Users.FindAsync(user.Id))!.PasswordHash);
        }

        private sealed class FakeTokenValidator : IClerkTokenValidator
        {
            public ClerkTokenValidationResult Result { get; set; } = ClerkTokenValidationResult.Success(ClerkId);

            public Task<ClerkTokenValidationResult> ValidateAsync(string token, CancellationToken cancellationToken) =>
                Task.FromResult(Result);
        }

        private sealed class FakeUserClient : IClerkUserClient
        {
            public ClerkUserProfile? Profile { get; set; }
            public Exception? Exception { get; set; }
            public int CallCount { get; private set; }

            public Task<ClerkUserProfile?> GetVerifiedPrimaryEmailAsync(string clerkUserId, CancellationToken cancellationToken)
            {
                CallCount++;
                return Exception != null ? Task.FromException<ClerkUserProfile?>(Exception) : Task.FromResult(Profile);
            }
        }
    }
}
