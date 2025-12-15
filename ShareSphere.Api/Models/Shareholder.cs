using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api. Models
{
    /// <summary>
    /// Represents a shareholder who owns stocks in companies.
    /// </summary>
    public class Shareholder
    {
        [Key]
        public int ShareholderId { get; set; }

        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Portfolio value cannot be negative.")]
        public decimal PortfolioValue { get; set; }

        /// <summary>
        /// Navigation property for portfolios owned by this shareholder. 
        /// </summary>
        public ICollection<Portfolio> Portfolios { get; set; } = new List<Portfolio>();

        /// <summary>
        /// Navigation property for trades made by this shareholder.
        /// </summary>
        public ICollection<Trade> Trades { get; set; } = new List<Trade>();
    }
}