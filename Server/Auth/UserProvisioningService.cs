using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Auth
{
    public enum ProvisioningStatus
    {
        Success,

        /// <summary>Clerk reports no verified primary email for this user.</summary>
        EmailNotVerified,

        /// <summary>
        /// A legacy (pre-Clerk) account already uses this email. Legacy emails were never verified,
        /// so the accounts are NOT linked automatically - linking needs an explicit, reviewed flow.
        /// </summary>
        LegacyAccountLinkRequired,

        /// <summary>The email already belongs to a different Clerk identity.</summary>
        IdentityConflict,

        /// <summary>The Clerk Backend API could not be reached.</summary>
        ClerkUnavailable,
    }

    public sealed record ProvisioningResult(ProvisioningStatus Status, int? UserId)
    {
        public static ProvisioningResult Success(int userId) => new(ProvisioningStatus.Success, userId);
        public static ProvisioningResult Failure(ProvisioningStatus status) => new(status, null);
    }

    public interface IUserProvisioningService
    {
        /// <summary>Maps a verified Clerk user id to the internal user id, creating the user on first sign-in.</summary>
        Task<ProvisioningResult> ResolveAsync(string clerkUserId, CancellationToken cancellationToken);
    }

    public sealed class UserProvisioningService : IUserProvisioningService
    {
        private readonly BakeryDbContext _db;
        private readonly IClerkUserClient _clerkUsers;
        private readonly ILogger<UserProvisioningService> _logger;

        public UserProvisioningService(BakeryDbContext db, IClerkUserClient clerkUsers, ILogger<UserProvisioningService> logger)
        {
            _db = db;
            _clerkUsers = clerkUsers;
            _logger = logger;
        }

        public async Task<ProvisioningResult> ResolveAsync(string clerkUserId, CancellationToken cancellationToken)
        {
            var existingId = await FindByClerkIdAsync(clerkUserId, cancellationToken);
            if (existingId != null)
                return ProvisioningResult.Success(existingId.Value);

            // First sign-in for this Clerk identity: only a Clerk-verified primary email is trusted.
            ClerkUserProfile? profile;
            try
            {
                profile = await _clerkUsers.GetVerifiedPrimaryEmailAsync(clerkUserId, cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError("Clerk user lookup failed with status {StatusCode}", ex.StatusCode);
                return ProvisioningResult.Failure(ProvisioningStatus.ClerkUnavailable);
            }

            if (profile == null)
                return ProvisioningResult.Failure(ProvisioningStatus.EmailNotVerified);

            var email = profile.Email.Trim().ToLower();
            var emailOwner = await _db.Users
                .Where(u => u.Email == email)
                .Select(u => new { u.Id, u.ClerkId })
                .FirstOrDefaultAsync(cancellationToken);

            if (emailOwner != null)
            {
                _logger.LogWarning(
                    "Clerk sign-in blocked: email belongs to internal user {UserId} ({Reason})",
                    emailOwner.Id,
                    emailOwner.ClerkId == null ? "legacy account, link required" : "linked to another Clerk identity");

                return ProvisioningResult.Failure(emailOwner.ClerkId == null
                    ? ProvisioningStatus.LegacyAccountLinkRequired
                    : ProvisioningStatus.IdentityConflict);
            }

            var user = new User
            {
                ClerkId = clerkUserId,
                Email = email,
                Name = profile.Name ?? email.Split('@')[0],
                // Clerk owns credentials; the legacy column is kept (NOT NULL) but unused for new users.
                PasswordHash = string.Empty,
            };
            _db.Users.Add(user);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Two first requests raced; the other one created the user.
                _db.Entry(user).State = EntityState.Detached;
                var racedId = await FindByClerkIdAsync(clerkUserId, cancellationToken);
                return racedId != null
                    ? ProvisioningResult.Success(racedId.Value)
                    : ProvisioningResult.Failure(ProvisioningStatus.IdentityConflict);
            }

            _logger.LogInformation("Provisioned internal user {UserId} for a new Clerk identity", user.Id);
            return ProvisioningResult.Success(user.Id);
        }

        private Task<int?> FindByClerkIdAsync(string clerkUserId, CancellationToken cancellationToken) =>
            _db.Users
                .Where(u => u.ClerkId == clerkUserId)
                .Select(u => (int?)u.Id)
                .FirstOrDefaultAsync(cancellationToken);
    }
}
