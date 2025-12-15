using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations. Schema;

namespace ShareSphere. Api.Models
{
    /// <summary>
    /// Represents available shares of a company for trading.
    /// </summary>
    public class Share
    {
        [Key]
        public int ShareId { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required(ErrorMessage = "Price is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Available quantity is required.")]
        [Range(0, int.MaxValue, ErrorMessage = "Available quantity cannot be negative.")]
        public int AvailableQuantity { get; set; }

        // Navigation property
        [ForeignKey(nameof(CompanyId))]
        public Company?  Company { get; set; }
    }
}