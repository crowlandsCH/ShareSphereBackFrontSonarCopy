
// File: Models/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required, StringLength(64, MinimumLength = 3)]
        public string DisplayName { get; set; } = default!;
    }
}
