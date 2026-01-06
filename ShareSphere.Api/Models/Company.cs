using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations. Schema;

namespace ShareSphere. Api.Models
{
    /// <summary>
    /// Represents a publicly traded company.
    /// </summary>
    public class Company
    {
        [Key]
        public int CompanyId { get; set; }

        [Required(ErrorMessage = "Company name is required.")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Company name must be between 1 and 200 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ticker symbol is required.")]
        [StringLength(10, MinimumLength = 1, ErrorMessage = "Ticker symbol must be between 1 and 10 characters.")]
        [RegularExpression(@"^[A-Z]+$", ErrorMessage = "Ticker symbol must contain only uppercase letters.")]
        public string TickerSymbol { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sector is required.")]
        [StringLength(100, ErrorMessage = "Sector must not exceed 100 characters.")]
        public string Sector { get; set; } = string.Empty;

        [Required]
        public int ExchangeId { get; set; }


        // Navigation properties
        [ForeignKey(nameof(ExchangeId))]
        public StockExchange? StockExchange { get; set; }

        public ICollection<Share> Shares { get; set; } = new List<Share>();
        public ICollection<Trade> Trades { get; set; } = new List<Trade>();
        public ICollection<Portfolio> Portfolios { get; set; } = new List<Portfolio>();
    }
}