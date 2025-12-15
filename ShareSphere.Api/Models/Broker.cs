using System. ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    /// <summary>
    /// Represents a licensed broker who can execute trades.
    /// </summary>
    public class Broker
    {
        [Key]
        public int BrokerId { get; set; }

        [Required(ErrorMessage = "Broker name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "License number is required.")]
        [StringLength(50, ErrorMessage = "License number cannot exceed 50 characters.")]
        [RegularExpression(@"^[A-Z0-9\-]+$", ErrorMessage = "License number must contain only uppercase letters, numbers, and hyphens.")]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters. ")]
        public string Email { get; set; } = string.Empty;


        /// <summary>
        /// Navigation property for trades executed by this broker.
        /// </summary>
        public ICollection<Trade> Trades { get; set; } = new List<Trade>();
    }
}