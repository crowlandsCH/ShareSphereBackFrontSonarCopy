using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;
using ShareSphere.Api.Data;

namespace ShareSphere.Api.Services
{
    public class TradeService : ITradeService
    {
        private readonly AppDbContext _context;

        public TradeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Trade>> GetAllAsync()
        {
            return await _context.Trades
                .Include(t => t. Company)
                    .ThenInclude(c => c! .StockExchange)
                .Include(t => t.Broker)
                .ToListAsync();
        }

        public async Task<Trade?> GetByIdAsync(int tradeId)
        {
            return await _context.Trades
                .Include(t => t.Company)
                    .ThenInclude(c => c!.StockExchange)
                .Include(t => t.Broker)
                .FirstOrDefaultAsync(t => t.TradeId == tradeId);
        }

        public async Task<IEnumerable<Trade>> GetByCompanyIdAsync(int companyId)
        {
            return await _context.Trades
                .Include(t => t.Company)
                    .ThenInclude(c => c!.StockExchange)
                .Include(t => t.Broker)
                .Where(t => t.CompanyId == companyId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Trade>> GetByBrokerIdAsync(int brokerId)
        {
            return await _context.Trades
                .Include(t => t. Company)
                    .ThenInclude(c => c!. StockExchange)
                .Include(t => t.Broker)
                .Where(t => t.BrokerId == brokerId)
                .ToListAsync();
        }

        public async Task<Trade> CreateAsync(Trade trade)
        {
            _context.Trades.Add(trade);
            await _context.SaveChangesAsync();

            // Load navigation properties after saving
            await _context.Entry(trade)
                .Reference(t => t.Company)
                .LoadAsync();

            await _context.Entry(trade)
                .Reference(t => t. Broker)
                .LoadAsync();

            if (trade.Company != null)
            {
                await _context. Entry(trade.Company)
                    .Reference(c => c. StockExchange)
                    .LoadAsync();
            }

            return trade;
        }

        public async Task<Trade?> UpdateAsync(int tradeId, Trade trade)
        {
            var existing = await _context.Trades. FindAsync(tradeId);
            if (existing == null)
                return null;

            existing.CompanyId = trade.CompanyId;
            existing.BrokerId = trade.BrokerId;
            existing.Quantity = trade. Quantity;
            existing.UnitPrice = trade.UnitPrice;
            existing.Timestamp = trade.Timestamp;
            existing.Type = trade.Type;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int tradeId)
        {
            var trade = await _context.Trades.FindAsync(tradeId);
            if (trade == null)
                return false;

            _context.Trades.Remove(trade);
            await _context.SaveChangesAsync();
            return true;
        }

public async Task<IEnumerable<Trade>> GetByShareholderIdAsync(int shareholderId)
{
    return await _context. Trades
        .AsNoTracking() // Important for performance
        .Where(t => t.ShareholderId == shareholderId)
        .Include(t => t.Company)
        .Include(t => t.Broker)
        .OrderByDescending(t => t. Timestamp)
        .ToListAsync();
}
    }
}