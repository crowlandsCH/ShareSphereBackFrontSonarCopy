using System. ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api. Models
{
    public class Share
    {
        [Key]
        public int ShareId { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        public int AvailableQuantity { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public Company?  Company { get; set; }
    }
}