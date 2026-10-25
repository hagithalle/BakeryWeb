namespace Server.Auth
{
    /// <summary>
    /// The user on whose behalf the current database work happens. Drives per-user query filters and
    /// ownership stamping in <see cref="Data.BakeryDbContext"/>.
    /// </summary>
    public interface ICurrentUser
    {
        /// <summary>Internal user id of the authenticated caller, or null when there is none.</summary>
        int? UserId { get; }

        /// <summary>
        /// True only for tooling that must see every row (EF design-time tools, test seeding, reviewed admin
        /// scripts). Never true for HTTP requests.
        /// </summary>
        bool IsUnscoped { get; }
    }

    /// <summary>Current user taken from the authenticated HTTP request (the "userId" claim set by Clerk auth).</summary>
    public sealed class HttpContextCurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _http;

        public HttpContextCurrentUser(IHttpContextAccessor http)
        {
            _http = http;
        }

        public int? UserId
        {
            get
            {
                var user = _http.HttpContext?.User;
                if (user?.Identity?.IsAuthenticated != true) return null;
                return int.TryParse(user.FindFirst(ClerkAuthenticationHandler.UserIdClaim)?.Value, out var id) ? id : null;
            }
        }

        public bool IsUnscoped => false;
    }

    /// <summary>
    /// Sees and writes all rows regardless of owner. Only for EF design-time tools, test seeding and reviewed
    /// admin scripts - never registered for HTTP requests.
    /// </summary>
    public sealed class UnscopedCurrentUser : ICurrentUser
    {
        public static readonly UnscopedCurrentUser Instance = new();

        private UnscopedCurrentUser() { }

        public int? UserId => null;
        public bool IsUnscoped => true;
    }

    public static class CurrentUserExtensions
    {
        public static int RequireUserId(this ICurrentUser currentUser) =>
            currentUser.UserId ?? throw new InvalidOperationException("This operation requires an authenticated user.");
    }
}
