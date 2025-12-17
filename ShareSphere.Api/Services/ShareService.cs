using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;
using ShareSphere.Api.Data;

namespace ShareSphere.Api.Services
{
    public class ShareService : IShareService
    {
        private readonly AppDbContext _context;

        public ShareService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Share>> GetAllAsync()
        {
            return await _context. Shares
                .Include(s => s. Company)
                    .ThenInclude(c => c! .StockExchange)
                .ToListAsync();
        }

        public async Task<Share?> GetByIdAsync(int shareId)
        {
            return await _context.Shares
                .Include(s => s.Company)
                    .ThenInclude(c => c!.StockExchange)
                .FirstOrDefaultAsync(s => s.ShareId == shareId);
        }

        public async Task<IEnumerable<Share>> GetByCompanyIdAsync(int companyId)
        {
            return await _context.Shares
                . Include(s => s.Company)
                    .ThenInclude(c => c!.StockExchange)
                .Where(s => s.CompanyId == companyId)
                .ToListAsync();
        }

        public async Task<Share> CreateAsync(Share share)
        {
            _context.Shares.Add(share);
            await _context.SaveChangesAsync();

            // Lade die Company und StockExchange Navigation Properties nach dem Speichern
            await _context.Entry(share)
                .Reference(s => s.Company)
                .LoadAsync();

            if (share.Company != null)
            {
                await _context.Entry(share.Company)
                    .Reference(c => c.StockExchange)
                    .LoadAsync();
            }

            return share;
        }

        public async Task<Share?> UpdateAsync(int shareId, Share share)
        {
            var existing = await _context.Shares. FindAsync(shareId);
            if (existing == null)
                return null;

            existing.CompanyId = share.CompanyId;
            existing.Price = share.Price;
            existing. AvailableQuantity = share. AvailableQuantity;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int shareId)
        {
            var share = await _context.Shares.FindAsync(shareId);
            if (share == null)
                return false;

            _context.Shares. Remove(share);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}