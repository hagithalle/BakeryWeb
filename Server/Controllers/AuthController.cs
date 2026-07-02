using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly BakeryDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(BakeryDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                Token = GenerateToken(user),
                User = ToDto(user),
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("אימייל וסיסמה נדרשים");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("אימייל או סיסמה שגויים");

            return Ok(new AuthResponse
            {
                Token = GenerateToken(user),
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
                if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                    !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                    return BadRequest("סיסמה נוכחית שגויה");

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            await _context.SaveChangesAsync();
            return Ok(ToDto(user));
        }

        private string GenerateToken(User user)
        {
            var secret = _configuration["JWT_SECRET"] ?? "bakery-default-secret-change-in-production-32chars!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("name", user.Name),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(30),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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
