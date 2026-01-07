using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace ShareSphere.Api.Controllers
{
    [ApiController]
    [Route("api/companies")]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompanyController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        // DTO for creating/updating companies
        public record CompanyRequest(
            [Required, MinLength(1), MaxLength(200)] string Name,
            [Required, StringLength(10, MinimumLength = 1)]
            [RegularExpression(@"^[A-Z]+$", ErrorMessage = "Ticker symbol must contain only uppercase letters")]
            string TickerSymbol,
            [Required, MaxLength(100)] string Sector,
            [Required] int ExchangeId
        );

        public record CompanyResponse(
    int CompanyId,
    string Name,
    string TickerSymbol,
    string Sector,
    int ExchangeId,
    StockExchangeSimpleResponse?  StockExchange
);

public record StockExchangeSimpleResponse(
    int ExchangeId,
    string Name,
    string Country,
    string Currency
);


        /// <summary>
        /// Returns all companies
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var companies = await _companyService.GetAllAsync();
            return Ok(companies);
        }

        /// <summary>
        /// Returns a specific company by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var company = await _companyService. GetByIdAsync(id);
            if (company == null)
                return NotFound(new { message = $"Company with ID {id} not found." });

            return Ok(company);
        }

        /// <summary>
        /// Creates a new company (admins only)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CompanyRequest request)
        {
            var company = new Company
            {
                Name = request.Name,
                TickerSymbol = request.TickerSymbol,
                Sector = request.Sector,
                ExchangeId = request.ExchangeId
            };

            var created = await _companyService.CreateAsync(company);
            return CreatedAtAction(nameof(GetById), new { id = created.CompanyId }, created);
        }

        /// <summary>
        /// Updates an existing company (admins only)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CompanyRequest request)
        {
            var company = new Company
            {
                Name = request.Name,
                TickerSymbol = request. TickerSymbol,
                Sector = request.Sector,
                ExchangeId = request.ExchangeId
            };

            var updated = await _companyService. UpdateAsync(id, company);
            if (updated == null)
                return NotFound(new { message = $"Company with ID {id} not found." });

            return Ok(updated);
        }

        /// <summary>
        /// Deletes a company (admins only)
        /// </summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _companyService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Company with ID {id} not found." });

            return NoContent();
        }
    }
}