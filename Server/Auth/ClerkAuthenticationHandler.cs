using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Server.Auth
{
    /// <summary>
    /// Authenticates every API request with a Clerk session token ("Authorization: Bearer ...")
    /// and maps it to the internal user id. Services keep reading the "userId" claim as before.
    /// </summary>
    public sealed class ClerkAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "Clerk";
        public const string UserIdClaim = "userId";
        public const string ClerkUserIdClaim = "clerkUserId";

        private const string BearerPrefix = "Bearer ";
        private const string ProvisioningFailureKey = "Clerk.ProvisioningFailure";

        private readonly IClerkTokenValidator _tokenValidator;
        private readonly IUserProvisioningService _provisioning;

        public ClerkAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            IClerkTokenValidator tokenValidator,
            IUserProvisioningService provisioning)
            : base(options, logger, encoder)
        {
            _tokenValidator = tokenValidator;
            _provisioning = provisioning;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            string? header = Request.Headers.Authorization;
            if (string.IsNullOrEmpty(header) || !header.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
                return AuthenticateResult.NoResult();

            var token = header[BearerPrefix.Length..].Trim();
            var validation = await _tokenValidator.ValidateAsync(token, Context.RequestAborted);
            if (!validation.IsValid)
            {
                if (validation.KeysUnavailable)
                {
                    Logger.LogError("Could not verify Clerk token: {Reason}", validation.FailureReason);
                    Context.Items[ProvisioningFailureKey] = ProvisioningStatus.ClerkUnavailable;
                    return AuthenticateResult.Fail("Clerk signing keys unavailable");
                }

                Logger.LogInformation("Rejected Clerk token: {Reason}", validation.FailureReason);
                return AuthenticateResult.Fail("Invalid Clerk session token");
            }

            var clerkUserId = validation.ClerkUserId!;
            var provisioning = await _provisioning.ResolveAsync(clerkUserId, Context.RequestAborted);
            if (provisioning.Status != ProvisioningStatus.Success)
            {
                Context.Items[ProvisioningFailureKey] = provisioning.Status;
                return AuthenticateResult.Fail($"Account provisioning failed: {provisioning.Status}");
            }

            var identity = new ClaimsIdentity(new[]
            {
                new Claim(UserIdClaim, provisioning.UserId!.Value.ToString()),
                new Claim(ClerkUserIdClaim, clerkUserId),
            }, SchemeName);

            return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName));
        }

        /// <summary>
        /// 401 for missing/invalid tokens. A valid token whose account can't be provisioned gets a
        /// specific status and code so the frontend can explain what happened.
        /// </summary>
        protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
        {
            if (Context.Items.TryGetValue(ProvisioningFailureKey, out var value) && value is ProvisioningStatus status)
            {
                var (statusCode, message) = Describe(status);
                Response.StatusCode = statusCode;
                await Response.WriteAsJsonAsync(new AuthErrorResponse(status.ToString(), message));
                return;
            }

            Response.StatusCode = StatusCodes.Status401Unauthorized;
            Response.Headers.WWWAuthenticate = "Bearer";
        }

        private static (int StatusCode, string Message) Describe(ProvisioningStatus status) => status switch
        {
            ProvisioningStatus.EmailNotVerified =>
                (StatusCodes.Status403Forbidden, "כתובת האימייל בחשבון אינה מאומתת"),
            ProvisioningStatus.LegacyAccountLinkRequired =>
                (StatusCodes.Status403Forbidden, "קיים חשבון ישן עם כתובת אימייל זו. יש לקשר אותו לפני הכניסה"),
            ProvisioningStatus.IdentityConflict =>
                (StatusCodes.Status403Forbidden, "כתובת האימייל כבר מקושרת לחשבון אחר"),
            ProvisioningStatus.ClerkUnavailable =>
                (StatusCodes.Status503ServiceUnavailable, "שירות ההתחברות אינו זמין כרגע. נסו שוב בעוד רגע"),
            _ => (StatusCodes.Status401Unauthorized, "ההתחברות נכשלה"),
        };
    }

    public sealed record AuthErrorResponse(string Code, string Message);
}
