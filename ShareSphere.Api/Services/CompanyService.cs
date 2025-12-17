using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;
using ShareSphere.Api.Data;

namespace ShareSphere.Api.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly AppDbContext _context;

        public CompanyService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Company>> GetAllAsync()
        {
            return await _context.Companies
                .Include(c => c.StockExchange)
                .Include(c => c.Shares)
                .Include(c => c.Trades)
                .Include(c => c.Portfolios)
                .ToListAsync();
        }

        public async Task<Company?> GetByIdAsync(int companyId)
        {
            return await _context.Companies
                .Include(c => c.StockExchange)
                .Include(c => c.Shares)
                .Include(c => c.Trades)
                .Include(c => c.Portfolios)
                .FirstOrDefaultAsync(c => c.CompanyId == companyId);
        }

        public async Task<Company> CreateAsync(Company company)
        {
            _context. Companies.Add(company);
            await _context.SaveChangesAsync();

                // Lade die StockExchange Navigation Property nach dem Speichern
        await _context.Entry(company)
        .Reference(c => c.StockExchange)
        .LoadAsync();
    

            return company;
        }

        public async Task<Company?> UpdateAsync(int companyId, Company company)
        {
            var existing = await _context.Companies.FindAsync(companyId);
            if (existing == null)
                return null;

            existing.Name = company.Name;
            existing. TickerSymbol = company.TickerSymbol;
            existing. ExchangeId = company.ExchangeId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int companyId)
        {
            var company = await _context.Companies. FindAsync(companyId);
            if (company == null)
                return false;

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}