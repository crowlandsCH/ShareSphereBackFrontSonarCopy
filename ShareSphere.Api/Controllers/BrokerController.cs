using Microsoft.AspNetCore. Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/brokers")]
    public class BrokerController : ControllerBase
    {
        private readonly IBrokerService _brokerService;

        public BrokerController(IBrokerService brokerService)
        {
            _brokerService = brokerService;
        }

        // DTO for creating/updating brokers
        public record BrokerRequest(
            [Required, MinLength(1), MaxLength(100)] string Name,
            [Required, MinLength(1), MaxLength(50)] string LicenseNumber,
            [Required, EmailAddress, MaxLength(100)] string Email
        );

        /// <summary>
        /// Returns all brokers
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var brokers = await _brokerService. GetAllAsync();
            return Ok(brokers);
        }

        /// <summary>
        /// Returns a specific broker by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var broker = await _brokerService. GetByIdAsync(id);
            if (broker == null)
                return NotFound(new { message = $"Broker with ID {id} not found." });

            return Ok(broker);
        }

        /// <summary>
        /// Returns a broker by license number
        /// </summary>
        [HttpGet("license/{licenseNumber}")]
        public async Task<IActionResult> GetByLicenseNumber(string licenseNumber)
        {
            var broker = await _brokerService.GetByLicenseNumberAsync(licenseNumber);
            if (broker == null)
                return NotFound(new { message = $"Broker with license number '{licenseNumber}' not found." });

            return Ok(broker);
        }

        /// <summary>
        /// Creates a new broker (for admins and users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BrokerRequest request)
        {
            var broker = new Broker
            {
                Name = request.Name,
                LicenseNumber = request.LicenseNumber,
                Email = request.Email
            };

            var created = await _brokerService.CreateAsync(broker);
            return CreatedAtAction(nameof(GetById), new { id = created. BrokerId }, created);
        }

        /// <summary>
        /// Updates an existing broker (for admins and users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BrokerRequest request)
        {
            var broker = new Broker
            {
                Name = request.Name,
                LicenseNumber = request.LicenseNumber,
                Email = request.Email
            };

            var updated = await _brokerService. UpdateAsync(id, broker);
            if (updated == null)
                return NotFound(new { message = $"Broker with ID {id} not found." });

            return Ok(updated);
        }

        /// <summary>
        /// Deletes a broker (admins only)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _brokerService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Broker with ID {id} not found." });

            return NoContent();
        }
    }
}