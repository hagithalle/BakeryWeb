using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Auth;
using Server.Data;
using System.Security.Claims;

namespace Server.Controllers
{
    /// <summary>
    /// Sign-up, sign-in, passwords and Google login are handled by Clerk.
    /// This controller only exposes the internal account behind the current Clerk session.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly BakeryDbContext _context;

        public AuthController(BakeryDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = int.Parse(User.FindFirstValue(ClerkAuthenticationHandler.UserIdClaim)!);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();
            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
            });
        }
    }

    public record UserDto
    {
        public int Id { get; init; }
        public string Email { get; init; } = null!;
        public string Name { get; init; } = null!;
    }
}
