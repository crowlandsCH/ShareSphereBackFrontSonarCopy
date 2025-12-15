using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api. Models
{
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
        public DateTime Timestamp { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [ForeignKey(nameof(BrokerId))]
        public Broker?  Broker { get; set; }

        [ForeignKey(nameof(ShareholderId))]
        public Shareholder?  Shareholder { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public Company? Company { get; set; }
    }
}