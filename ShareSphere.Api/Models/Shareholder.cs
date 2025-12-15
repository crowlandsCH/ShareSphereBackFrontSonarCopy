using System. ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api.Models
{
    public class Shareholder
    {
        [Key]
        public int ShareholderId { get; set; }

        [Required]
        public string Name { get; set; } = default! ;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PortfolioValue { get; set; }
    }
}