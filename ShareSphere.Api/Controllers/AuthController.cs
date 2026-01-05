
// File: Controllers/AuthController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        public AuthController(IAuthService auth) => _auth = auth;

        // DTOs with validation
        public record RegisterRequest(
            [Required, MinLength(3)] string UserName,
            [Required, MinLength(3), MaxLength(64)] string DisplayName,
            [Required, MinLength(6)] string Password,
            [Required, EmailAddress] string Email
        );

        public record LoginRequest(
            [Required] string UserName,
            [Required] string Password
        );

        /// <summary>
        /// Registers a user and assigns (optional) roles.
        /// Returns a JWT that contains the roles as claims, among other things.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            // If no roles were passed, set default role "user"

            var result = await _auth.RegisterAsync(req.UserName, req.DisplayName, req.Password, req.Email, new[] {"user"});
            if (!result.Succeeded)
            {
                // Unified error format (Identity errors, duplicate usernames, wrong roles)
                return BadRequest(new { errors = result.Errors });
            }



            return Ok(new { token = result.Token });
        }

        /// <summary>
        /// Login, returns JWT.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var token = await _auth.LoginAsync(req.UserName, req.Password);
            if (token is null) return Unauthorized();
            return Ok(new { token });
        }

        // Example: protected endpoint for any authenticated user

            [Authorize]
            [HttpGet("me")]
            public IActionResult Me()
            {
                var roles = User.Claims
                    .Where(c => c.Type == ClaimTypes.Role 
                            || c.Type == "role" 
                            || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                    .Select(c => c.Value)
                    .ToArray(); 

                return Ok(new {
                    name = User.Identity?.Name,
                    displayName = User.Claims.FirstOrDefault(c => c.Type == "displayName")?.Value,
                    roles
                });
            }


        // Example: admins only
        [Authorize(Roles = "admin")]
        [HttpGet("admin-only")]
        public IActionResult AdminOnly() => Ok("Only admins see this.");
    }
}
