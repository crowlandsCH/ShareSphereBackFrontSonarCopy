using System. ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api. Models
{
    public class Company
    {
        [Key]
        public int CompanyId { get; set; }

        [Required]
        public string Name { get; set; } = default! ;

        [Required]
        public string TickerSymbol { get; set; } = default! ;

        [Required]
        public int ExchangeId { get; set; }

        [ForeignKey(nameof(ExchangeId))]
        public StockExchange?  StockExchange { get; set; }
    }
}