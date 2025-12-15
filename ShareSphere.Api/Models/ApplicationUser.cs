using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    /// <summary>
    /// Represents an application user with extended profile information.
    /// </summary>
    public class ApplicationUser : IdentityUser
    {
        /// <summary>
        /// The display name of the user (3-64 characters).
        /// </summary>
        [Required]
        [StringLength(64, MinimumLength = 3, ErrorMessage = "Display name must be between 3 and 64 characters.")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Date when the user registered.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Date when the user profile was last updated.
        /// </summary>
        public DateTime?  UpdatedAt { get; set; }

        /// <summary>
        /// Indicates if the user account is active.
        /// </summary>
        public bool IsActive { get; set; } = true;
    }
}