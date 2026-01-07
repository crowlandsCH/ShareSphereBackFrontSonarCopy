using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShareSphere.Api.Models
{
    /// <summary>
    /// Represents a shareholder's holdings in a specific company.
    /// </summary>
    public class Portfolio
    {
        [Key]
        public int PortfolioId { get; set; }

        [Required] public int ShareholderId { get; set; }

        [Required]
        public int ShareId { get; set; }

        [Required]
        public int amount { get; set; }

        // Navigation properties - NO [ForeignKey] attributes!
        public Shareholder? Shareholder { get; set; }
        public Share? Share { get; set; }
    }
}