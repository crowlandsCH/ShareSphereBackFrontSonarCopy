using System. ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Models
{
    public class Broker
    {
        [Key]
        public int BrokerId { get; set; }

        [Required]
        public string Name { get; set; } = default!;

        [Required]
        public string LicenseNumber { get; set; } = default!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;
    }
}