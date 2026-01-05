using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/trades")]
    public class TradeController : ControllerBase
    {
        private readonly ITradeService _tradeService;

        public TradeController(ITradeService tradeService)
        {
            _tradeService = tradeService;
        }

        // DTO for creating/updating trades
        public record TradeRequest(
            [Required] int CompanyId,
            [Required] int BrokerId,
            [Required, Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than zero")] int Quantity,
            [Required, Range(0.01, double.MaxValue, ErrorMessage = "Price per share must be greater than zero")] decimal PricePerShare,
            [Required] DateTime TradeDate,
            [Required] TradeType Type
        );

        /// <summary>
        /// Returns all trades
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var trades = await _tradeService.GetAllAsync();
            return Ok(trades);
        }

        /// <summary>
        /// Returns a specific trade by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var trade = await _tradeService. GetByIdAsync(id);
            if (trade == null)
                return NotFound(new { message = $"Trade with ID {id} not found." });

            return Ok(trade);
        }

        /// <summary>
        /// Returns all trades for a specific company
        /// </summary>
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetByCompanyId(int companyId)
        {
            var trades = await _tradeService.GetByCompanyIdAsync(companyId);
            return Ok(trades);
        }

        /// <summary>
        /// Returns all trades for a specific broker
        /// </summary>
        [HttpGet("broker/{brokerId}")]
        public async Task<IActionResult> GetByBrokerId(int brokerId)
        {
            var trades = await _tradeService.GetByBrokerIdAsync(brokerId);
            return Ok(trades);
        }

        /// <summary>
        /// Creates a new trade (for admins and users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TradeRequest request)
        {

                // ⭐ ShareholderId aus JWT-Claims holen
    var shareholderIdClaim = User.FindFirst("shareholderId")?.Value;
    
    if (string.IsNullOrEmpty(shareholderIdClaim) || !int.TryParse(shareholderIdClaim, out var shareholderId))
    {
        return BadRequest(new { message = "You must be a registered shareholder to create trades." });
    }

            var trade = new Trade
            {
                ShareholderId = shareholderId,  // ⭐ Automatisch aus Token!
                CompanyId = request.CompanyId,
                BrokerId = request.BrokerId,
                Quantity = request.Quantity,
                UnitPrice = request.PricePerShare,
                Timestamp = request.TradeDate,
                Type = request.Type
            };

            var created = await _tradeService.CreateAsync(trade);
            return CreatedAtAction(nameof(GetById), new { id = created. TradeId }, created);
        }

        /// <summary>
        /// Updates an existing trade (for admins and users)
        /// </summary>
        [Authorize(Roles = "admin,user")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TradeRequest request)
        {
            var trade = new Trade
            {
                CompanyId = request.CompanyId,
                BrokerId = request.BrokerId,
                Quantity = request.Quantity,
                UnitPrice = request.PricePerShare,
                Timestamp = request.TradeDate,
                Type = request.Type
            };

            var updated = await _tradeService.UpdateAsync(id, trade);
            if (updated == null)
                return NotFound(new { message = $"Trade with ID {id} not found." });

            return Ok(updated);
        }

        // ⭐ Neuer Endpoint:  User kann seine eigenen Trades abrufen
        [Authorize(Roles = "user")]
        [HttpGet("my-trades")]
        public async Task<IActionResult> GetMyTrades()
        {
            var shareholderIdClaim = User.FindFirst("shareholderId")?.Value;
            
            if (string.IsNullOrEmpty(shareholderIdClaim) || !int.TryParse(shareholderIdClaim, out var shareholderId))
            {
                return BadRequest(new { message = "Shareholder information not found." });
            }

            var trades = await _tradeService.GetByShareholderIdAsync(shareholderId);
            return Ok(trades);
        }

        /// <summary>
        /// Deletes a trade (admins only)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _tradeService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Trade with ID {id} not found." });

            return NoContent();
        }

        
    }
}