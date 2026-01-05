
// File: Services/AuthService.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShareSphere.Api.Models;
using ShareSphere.Api.Data; 
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ShareSphere.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _config;

        private readonly AppDbContext _context;


    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration config,
        AppDbContext context)  // ← ADD THIS
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _config = config;
        _context = context;    // ← ADD THIS
    }

        public async Task<RegisterResult> RegisterAsync(string userName, string displayName, string password, string email, string[] roles)
        {
            // 1) Does the user already exist?
            var existing = await _userManager.FindByNameAsync(userName);
            if (existing is not null)
            {
                return new RegisterResult { Succeeded = false, Errors = new[] { "UserNameAlreadyExists" } };
            }

            // 2) Benutzer anlegen
            var user = new ApplicationUser
            {
                UserName = userName,
                DisplayName = displayName,
                Email = email
            };

            var create = await _userManager.CreateAsync(user, password);
            if (!create.Succeeded)
            {
                return new RegisterResult
                {
                    Succeeded = false,
                    Errors = create.Errors.Select(e => e.Description).ToArray()
                };
            }

            // 3) Normalize and check roles
            var normalizedRoles = (roles ?? Array.Empty<string>())
                                  .Select(r => r.Trim().ToLowerInvariant())
                                  .Where(r => !string.IsNullOrWhiteSpace(r))
                                  .DefaultIfEmpty("user") // Default role if nothing is passed
                                  .ToArray();

            System.Console.WriteLine(normalizedRoles);

            foreach (var role in normalizedRoles)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    // If you want to auto-create missing roles, you could do here:
                    // await _roleManager.CreateAsync(new IdentityRole(role));
                    // I recommend for clear control: return error.
                    return new RegisterResult { Succeeded = false, Errors = new[] { $"RoleNotFound:{role}" } };
                }
            }

            var addRoles = await _userManager.AddToRolesAsync(user, normalizedRoles);
            if (!addRoles.Succeeded)
            {
                return new RegisterResult
                {
                    Succeeded = false,
                    Errors = addRoles.Errors.Select(e => e.Description).ToArray()
                };
            }

    // ⭐ 4) Create shareholder ONLY for "user" role
    if (normalizedRoles.Contains("user"))
    {
        var shareholder = new Shareholder
        {
            Name = displayName,
            Email = email,
            PortfolioValue = 0
        };

        _context.Shareholders.Add(shareholder);
        await _context.SaveChangesAsync();

        // Save link
        user.ShareholderId = shareholder.ShareholderId;
        await _userManager.UpdateAsync(user);
    }
    // Admin gets NO shareholder profile (ShareholderId remains null)

            // 5) Create JWT
            var token = await CreateTokenAsync(user);
            return new RegisterResult { Succeeded = true, Token = token };
        }

        public async Task<string?> LoginAsync(string userName, string password)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user is null) return null;

            var valid = await _userManager.CheckPasswordAsync(user, password);
            if (!valid) return null;

            return await CreateTokenAsync(user);
        }

        private async Task<string> CreateTokenAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),               // User-ID
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName), // Username
                new Claim("displayName", user.DisplayName)                     // custom claim
            };

                        // ⭐ Only add ShareholderId if present (user role)
            if (user.ShareholderId.HasValue)
            {
                claims. Add(new Claim("shareholderId", user.ShareholderId.Value.ToString()));
            }

            foreach (var r in roles)
                claims.Add(new Claim("role", r)); // important for [Authorize(Roles="…")]

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer: "ShareSphere",
                audience: "ShareSphereClient",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
    }
}
