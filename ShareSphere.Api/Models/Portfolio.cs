using System. ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace ShareSphere.Api.Models
{
public class Portfolio
{
    [Key]
    public int PortfolioId { get; set; }
    
    [Required]
    public int ShareholderId { get; set; }
    
    [Required]
    public int CompanyId { get; set; }
    
    [Required]
    public int CurrentQuantity { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal AverageBuyPrice { get; set; }
    
    [ForeignKey(nameof(ShareholderId))]
    public Shareholder? Shareholder { get; set; }
    
    [ForeignKey(nameof(CompanyId))]
    public Company? Company { get; set; }
}
}