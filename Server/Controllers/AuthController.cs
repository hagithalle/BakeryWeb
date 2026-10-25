using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Auth;
using Server.Data;
using Server.Models;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        public const string ClerkTokenHeader = "X-Clerk-Token";

        private readonly BakeryDbContext _context;
        private readonly TokenService _tokenService;
        private readonly ClerkSettings _clerkSettings;
        private readonly IClerkTokenValidator _clerkTokenValidator;
        private readonly IClerkUserClient _clerkUserClient;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            BakeryDbContext context,
            TokenService tokenService,
            ClerkSettings clerkSettings,
            IClerkTokenValidator clerkTokenValidator,
            IClerkUserClient clerkUserClient,
            ILogger<AuthController> logger)
        {
            _context = context;
            _tokenService = tokenService;
            _clerkSettings = clerkSettings;
            _clerkTokenValidator = clerkTokenValidator;
            _clerkUserClient = clerkUserClient;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("אימייל וסיסמה נדרשים");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
                return Conflict("משתמש עם אימייל זה כבר קיים");

            var user = new User
            {
                Email = request.Email.ToLower(),
                Name = request.Name ?? request.Email.Split('@')[0],
                PasswordHash = PasswordHashing.Hash(request.Password),
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                Token = _tokenService.CreateToken(user),
                User = ToDto(user),
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("אימייל וסיסמה נדרשים");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

            // Google-only accounts have no password hash. They get the same generic answer as a wrong
            // password, so the response doesn't reveal which emails are registered or how.
            if (user == null || !PasswordHashing.Verify(request.Password, user.PasswordHash))
                return Unauthorized("אימייל או סיסמה שגויים");

            return Ok(new AuthResponse
            {
                Token = _tokenService.CreateToken(user),
                User = ToDto(user),
            });
        }

        /// <summary>
        /// Exchanges a verified Clerk session token (Google sign-in) for this server's own JWT.
        /// An existing account is linked by email only when Clerk reports that email as verified.
        /// </summary>
        [HttpPost("clerk-sync")]
        public async Task<IActionResult> ClerkSync(CancellationToken cancellationToken)
        {
            if (!_clerkSettings.Enabled)
                return StatusCode(StatusCodes.Status503ServiceUnavailable, "כניסה עם Google אינה מוגדרת בשרת");

            var clerkToken = Request.Headers[ClerkTokenHeader].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(clerkToken))
                return BadRequest("Clerk token missing");

            var validation = await _clerkTokenValidator.ValidateAsync(clerkToken, cancellationToken);
            if (!validation.IsValid)
            {
                _logger.LogWarning("Rejected Clerk token: {Reason}", validation.FailureReason);
                return Unauthorized("Invalid Clerk token");
            }

            var clerkId = validation.ClerkUserId!;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId, cancellationToken);

            if (user == null)
            {
                ClerkUserProfile? profile;
                try
                {
                    profile = await _clerkUserClient.GetVerifiedPrimaryEmailAsync(clerkId, cancellationToken);
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogError("Clerk user lookup failed with status {StatusCode}", ex.StatusCode);
                    return StatusCode(StatusCodes.Status502BadGateway, "שירות ההתחברות של Google אינו זמין כרגע");
                }

                if (profile == null)
                    return StatusCode(StatusCodes.Status403Forbidden, "כתובת האימייל בחשבון Google אינה מאומתת");

                var email = profile.Email.Trim().ToLower();
                user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

                if (user != null)
                {
                    // Already linked to a different Clerk identity - never re-link silently.
                    if (!string.IsNullOrEmpty(user.ClerkId))
                        return Conflict("חשבון זה כבר מקושר לחשבון Google אחר");

                    user.ClerkId = clerkId;
                }
                else
                {
                    user = new User
                    {
                        ClerkId = clerkId,
                        Email = email,
                        Name = profile.Name ?? email.Split('@')[0],
                        PasswordHash = string.Empty,
                    };
                    _context.Users.Add(user);
                }

                await _context.SaveChangesAsync(cancellationToken);
            }

            return Ok(new AuthResponse
            {
                Token = _tokenService.CreateToken(user),
                User = ToDto(user),
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = int.Parse(User.FindFirstValue("userId")!);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            return Ok(ToDto(user));
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
        {
            var userId = int.Parse(User.FindFirstValue("userId")!);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(request.Name))
                user.Name = request.Name;

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                if (!PasswordHashing.HasPassword(user.PasswordHash))
                    return BadRequest("לחשבון זה אין סיסמה - הכניסה מתבצעת עם Google");

                if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                    !PasswordHashing.Verify(request.CurrentPassword, user.PasswordHash))
                    return BadRequest("סיסמה נוכחית שגויה");

                user.PasswordHash = PasswordHashing.Hash(request.NewPassword);
            }

            await _context.SaveChangesAsync();
            return Ok(ToDto(user));
        }

        private static UserDto ToDto(User user) => new()
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
        };
    }

    public record AuthRequest(string Email, string Password, string? Name);
    public record UpdateProfileRequest(string? Name, string? CurrentPassword, string? NewPassword);
    public record UserDto
    {
        public int Id { get; init; }
        public string Email { get; init; } = null!;
        public string Name { get; init; } = null!;
    }
    public record AuthResponse
    {
        public string Token { get; init; } = null!;
        public UserDto User { get; init; } = null!;
    }
}
