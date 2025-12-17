using Microsoft.EntityFrameworkCore;
using ShareSphere.Api. Models;
using ShareSphere.Api.Data;

namespace ShareSphere.Api.Services
{
    public class ShareholderService : IShareholderService
    {
        private readonly AppDbContext _context;

        public ShareholderService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Shareholder>> GetAllAsync()
        {
            return await _context.Shareholders
                .Include(s => s. Portfolios)
                    .ThenInclude(p => p.Share)
                        .ThenInclude(sh => sh! .Company)
                .Include(s => s.Portfolios)
                    .ThenInclude(p => p.Share)
                        .ThenInclude(sh => sh!.Company)
                            .ThenInclude(c => c! .StockExchange)
                .ToListAsync();
        }

        public async Task<Shareholder? > GetByIdAsync(int shareholderId)
        {
            return await _context.Shareholders
                .Include(s => s. Portfolios)
                    . ThenInclude(p => p.Share)
                        .ThenInclude(sh => sh! .Company)
                .Include(s => s.Portfolios)
                    .ThenInclude(p => p.Share)
                        .ThenInclude(sh => sh!.Company)
                            .ThenInclude(c => c!.StockExchange)
                .FirstOrDefaultAsync(s => s.ShareholderId == shareholderId);
        }

        public async Task<Shareholder?> GetByEmailAsync(string email)
        {
            return await _context. Shareholders
                .Include(s => s.Portfolios)
                    .ThenInclude(p => p.Share)
                        .ThenInclude(sh => sh!.Company)
                .FirstOrDefaultAsync(s => s. Email == email);
        }

        public async Task<Shareholder> CreateAsync(Shareholder shareholder)
        {
            _context.Shareholders.Add(shareholder);
            await _context. SaveChangesAsync();
            return shareholder;
        }

        public async Task<Shareholder? > UpdateAsync(int shareholderId, Shareholder shareholder)
        {
            var existing = await _context.Shareholders. FindAsync(shareholderId);
            if (existing == null)
                return null;

            existing.Name = shareholder.Name;
            existing.Email = shareholder.Email;
            existing. PortfolioValue = shareholder.PortfolioValue;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int shareholderId)
        {
            var shareholder = await _context.Shareholders. FindAsync(shareholderId);
            if (shareholder == null)
                return false;

            _context.Shareholders.Remove(shareholder);
            await _context. SaveChangesAsync();
            return true;
        }
    }
}