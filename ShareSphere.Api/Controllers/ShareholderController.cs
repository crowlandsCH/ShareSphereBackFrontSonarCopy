using Microsoft.AspNetCore. Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.ComponentModel. DataAnnotations;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/shareholders")]
    public class ShareholderController : ControllerBase
    {
        private readonly IShareholderService _shareholderService;

        public ShareholderController(IShareholderService shareholderService)
        {
            _shareholderService = shareholderService;
        }

        // DTO for creating/updating shareholders
        public record ShareholderRequest(
            [Required, MinLength(1), MaxLength(100)] string Name,
            [Required, EmailAddress, MaxLength(100)] string Email,
            [Required, Range(0, double.MaxValue, ErrorMessage = "Portfolio value cannot be negative")] decimal PortfolioValue
        );

        /// <summary>
        /// Gibt alle Shareholders zurück
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var shareholders = await _shareholderService.GetAllAsync();
            return Ok(shareholders);
        }

        /// <summary>
        /// Gibt einen spezifischen Shareholder nach ID zurück
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var shareholder = await _shareholderService.GetByIdAsync(id);
            if (shareholder == null)
                return NotFound(new { message = $"Shareholder with ID {id} not found." });

            return Ok(shareholder);
        }

        /// <summary>
        /// Gibt einen Shareholder nach E-Mail-Adresse zurück
        /// </summary>
        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var shareholder = await _shareholderService.GetByEmailAsync(email);
            if (shareholder == null)
                return NotFound(new { message = $"Shareholder with email '{email}' not found." });

            return Ok(shareholder);
        }

        /// <summary>
        /// Erstellt einen neuen Shareholder (für Admins und Users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ShareholderRequest request)
        {
            var shareholder = new Shareholder
            {
                Name = request.Name,
                Email = request.Email,
                PortfolioValue = request.PortfolioValue
            };

            var created = await _shareholderService.CreateAsync(shareholder);
            return CreatedAtAction(nameof(GetById), new { id = created.ShareholderId }, created);
        }

        /// <summary>
        /// Aktualisiert einen bestehenden Shareholder (für Admins und Users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ShareholderRequest request)
        {
            var shareholder = new Shareholder
            {
                Name = request.Name,
                Email = request.Email,
                PortfolioValue = request. PortfolioValue
            };

            var updated = await _shareholderService.UpdateAsync(id, shareholder);
            if (updated == null)
                return NotFound(new { message = $"Shareholder with ID {id} not found." });

            return Ok(updated);
        }

        /// <summary>
        /// Löscht einen Shareholder (nur für Admins)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _shareholderService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Shareholder with ID {id} not found." });

            return NoContent();
        }
    }
}