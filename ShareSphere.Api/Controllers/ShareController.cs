using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/shares")]
    public class ShareController : ControllerBase
    {
        private readonly IShareService _shareService;

        public ShareController(IShareService shareService)
        {
            _shareService = shareService;
        }

        // DTO for creating/updating shares
        public record ShareRequest(
            [Required] int CompanyId,
            [Required, Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero")] decimal Price,
            [Required, Range(0, int. MaxValue, ErrorMessage = "Available quantity cannot be negative")] int AvailableQuantity
        );

        /// <summary>
        /// Gibt alle Shares zurück
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var shares = await _shareService.GetAllAsync();
            return Ok(shares);
        }

        /// <summary>
        /// Gibt einen spezifischen Share nach ID zurück
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var share = await _shareService.GetByIdAsync(id);
            if (share == null)
                return NotFound(new { message = $"Share with ID {id} not found." });

            return Ok(share);
        }

        /// <summary>
        /// Gibt alle Shares für ein bestimmtes Unternehmen zurück
        /// </summary>
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetByCompanyId(int companyId)
        {
            var shares = await _shareService.GetByCompanyIdAsync(companyId);
            return Ok(shares);
        }

        /// <summary>
        /// Erstellt einen neuen Share (für Admins und Users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ShareRequest request)
        {
            var share = new Share
            {
                CompanyId = request.CompanyId,
                Price = request.Price,
                AvailableQuantity = request.AvailableQuantity
            };

            var created = await _shareService.CreateAsync(share);
            return CreatedAtAction(nameof(GetById), new { id = created.ShareId }, created);
        }

        /// <summary>
        /// Aktualisiert einen bestehenden Share (für Admins und Users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ShareRequest request)
        {
            var share = new Share
            {
                CompanyId = request.CompanyId,
                Price = request.Price,
                AvailableQuantity = request.AvailableQuantity
            };

            var updated = await _shareService.UpdateAsync(id, share);
            if (updated == null)
                return NotFound(new { message = $"Share with ID {id} not found." });

            return Ok(updated);
        }

        /// <summary>
        /// Löscht einen Share (nur für Admins)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _shareService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Share with ID {id} not found." });

            return NoContent();
        }
    }
}