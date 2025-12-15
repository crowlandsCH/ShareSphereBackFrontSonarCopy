using System. ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    public class StockExchange
    {
        [Key]
        public int ExchangeId { get; set; }

        [Required]
        public string Name { get; set; } = default!;

        [Required]
        public string Country { get; set; } = default!;

        [Required]
        public string Currency { get; set; } = default!;
    }
}