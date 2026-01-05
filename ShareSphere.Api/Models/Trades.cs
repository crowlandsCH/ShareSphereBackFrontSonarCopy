using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api. Models
{
    /// <summary>
    /// Represents a trade transaction (buy or sell).
    /// </summary>
    public class Trade
    {
        [Key]
        public int TradeId { get; set; }

        [Required]
        public int BrokerId { get; set; }

        [Required]
        public int ShareholderId { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Unit price is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.01, double. MaxValue, ErrorMessage = "Unit price must be greater than zero.")]
        public decimal UnitPrice { get; set; }

        [Required]
        public TradeType Type { get; set; }

        // Navigation properties
        [ForeignKey(nameof(BrokerId))]
        public Broker? Broker { get; set; }

        [ForeignKey(nameof(ShareholderId))]
        public Shareholder? Shareholder { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public Company? Company { get; set; }
    }

    /// <summary>
    /// Type of trade transaction.
    /// </summary>
    public enum TradeType
    {
        Buy,    // Purchase
        Sell    // Sale
    }
}