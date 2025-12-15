using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    /// <summary>
    /// Represents a stock exchange where companies are listed.
    /// </summary>
    public class StockExchange
    {
        [Key]
        public int ExchangeId { get; set; }

        [Required(ErrorMessage = "Exchange name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Country is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Country must be between 2 and 100 characters.")]
        public string Country { get; set; } = string.Empty;

        [Required(ErrorMessage = "Currency is required.")]
        [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter ISO code.")]
        [RegularExpression(@"^[A-Z]{3}$", ErrorMessage = "Currency must be a valid 3-letter ISO code (e.g., USD, EUR).")]
        public string Currency { get; set; } = string.Empty;

        /// <summary>
        /// Navigation property for companies listed on this exchange. 
        /// </summary>
        public ICollection<Company> Companies { get; set; } = new List<Company>();
    }
}