using Microsoft.EntityFrameworkCore;
using ShareSphere.Api. Data;
using ShareSphere. Api.Models;

namespace ShareSphere.Api.Services
{
    public class SharePurchaseService : ISharePurchaseService
    {
        private readonly AppDbContext _context;

        public SharePurchaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PurchaseResult> PurchaseSharesAsync(int shareholderId, int shareId, int quantity, int brokerId)
        {
            // Validation: Quantity must be positive
            if (quantity <= 0)
            {
                return new PurchaseResult
                {
                    Success = false,
                    Message = "The quantity must be greater than 0."
                };
            }

            // Use a transaction for atomic operations
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // 1. Check if shareholder exists
                var shareholder = await _context.Shareholders
                    .Include(s => s. Portfolios)
                    .FirstOrDefaultAsync(s => s.ShareholderId == shareholderId);

                if (shareholder == null)
                {
                    return new PurchaseResult
                    {
                        Success = false,
                        Message = $"Shareholder with ID {shareholderId} was not found."
                    };
                }

                // 2. Check if share exists and load with company data
                var share = await _context.Shares
                    .Include(s => s.Company)
                    .FirstOrDefaultAsync(s => s.ShareId == shareId);

                if (share == null)
                {
                    return new PurchaseResult
                    {
                        Success = false,
                        Message = $"Share with ID {shareId} was not found."
                    };
                }

                // 3. Check if broker exists
                var broker = await _context.Brokers. FindAsync(brokerId);
                if (broker == null)
                {
                    return new PurchaseResult
                    {
                        Success = false,
                        Message = $"Broker with ID {brokerId} was not found."
                    };
                }

                // 4. Check availability
                if (share.AvailableQuantity < quantity)
                {
                    return new PurchaseResult
                    {
                        Success = false,
                        Message = $"Not enough shares available. Available: {share.AvailableQuantity}, Requested: {quantity}."
                    };
                }

                // 5. Reduce available shares
                share. AvailableQuantity -= quantity;

                // 6. Update or create portfolio
                var existingPortfolio = shareholder. Portfolios
                    .FirstOrDefault(p => p.ShareId == shareId);

                Portfolio portfolio;
                if (existingPortfolio != null)
                {
                    // Portfolio already exists - increase quantity
                    existingPortfolio.amount += quantity;
                    portfolio = existingPortfolio;
                }
                else
                {
                    // Create new portfolio
                    portfolio = new Portfolio
                    {
                        ShareholderId = shareholderId,
                        ShareId = shareId,
                        amount = quantity
                    };
                    _context.Portfolios.Add(portfolio);
                    shareholder.Portfolios.Add(portfolio);
                }

                // 7. Create trade entry
                var trade = new Trade
                {
                    BrokerId = brokerId,
                    ShareholderId = shareholderId,
                    CompanyId = share.CompanyId,
                    Quantity = quantity,
                    UnitPrice = share.Price,
                    Type = TradeType.Buy,
                    Timestamp = DateTime.UtcNow
                };
                _context.Trades.Add(trade);

                // 8. Update portfolio value of shareholder
                shareholder. PortfolioValue += quantity * share.Price;

                // 9. Save all changes
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 10. Load complete data for return
                await _context.Entry(portfolio)
                    .Reference(p => p.Share)
                    .LoadAsync();

                await _context.Entry(trade)
                    .Reference(t => t. Broker)
                    .LoadAsync();
                await _context.Entry(trade)
                    .Reference(t => t.Company)
                    .LoadAsync();

                return new PurchaseResult
                {
                    Success = true,
                    Message = $"Successfully bought {quantity} share(s) of {share.Company?. Name ??  "Unknown"}.",
                    Trade = trade,
                    Portfolio = portfolio
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new PurchaseResult
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }

    public async Task<PurchaseResult> SellSharesAsync(int shareholderId, int shareId, int quantity, int brokerId)
{
    // Validation: Quantity must be positive
    if (quantity <= 0)
    {
        return new PurchaseResult
        {
            Success = false,
            Message = "The quantity must be greater than 0."
        };
    }

    // Use a transaction for atomic operations
    using var transaction = await _context. Database.BeginTransactionAsync();
    
    try
    {
        // 1. Check if shareholder exists
        var shareholder = await _context.Shareholders
            .Include(s => s. Portfolios)
            .FirstOrDefaultAsync(s => s. ShareholderId == shareholderId);

        if (shareholder == null)
        {
            return new PurchaseResult
            {
                Success = false,
                Message = $"Shareholder with ID {shareholderId} was not found."
            };
        }

        // 2. Check if share exists and load with company data
        var share = await _context.Shares
            .Include(s => s.Company)
            .FirstOrDefaultAsync(s => s.ShareId == shareId);

        if (share == null)
        {
            return new PurchaseResult
            {
                Success = false,
                Message = $"Share with ID {shareId} was not found."
            };
        }

        // 3. Check if broker exists
        var broker = await _context.Brokers. FindAsync(brokerId);
        if (broker == null)
        {
            return new PurchaseResult
            {
                Success = false,
                Message = $"Broker with ID {brokerId} was not found."
            };
        }

        // 4. Check if portfolio exists
        var existingPortfolio = shareholder.Portfolios
            .FirstOrDefault(p => p.ShareId == shareId);

        if (existingPortfolio == null)
        {
            return new PurchaseResult
            {
                Success = false,
                Message = $"Shareholder does not own any shares of this company."
            };
        }

        // 5. Check if enough shares are available in portfolio
        if (existingPortfolio.amount < quantity)
        {
            return new PurchaseResult
            {
                Success = false,
                Message = $"Not enough shares in portfolio. Available: {existingPortfolio.amount}, Requested: {quantity}."
            };
        }

        // 6. Reduce shares in portfolio or delete portfolio completely
        Portfolio?  portfolio = null;
        if (existingPortfolio.amount == quantity)
        {
            // Sell exactly all shares - delete portfolio
            _context.Portfolios.Remove(existingPortfolio);
            shareholder.Portfolios.Remove(existingPortfolio);
        }
        else
        {
            // Only sell a part - reduce quantity
            existingPortfolio.amount -= quantity;
            portfolio = existingPortfolio;
        }

        // 7. Increase available shares of the company
        share.AvailableQuantity += quantity;

        // 8. Create trade entry for sale
        var trade = new Trade
        {
            BrokerId = brokerId,
            ShareholderId = shareholderId,
            CompanyId = share.CompanyId,
            Quantity = quantity,
            UnitPrice = share.Price,
            Type = TradeType.Sell,
            Timestamp = DateTime. UtcNow
        };
        _context.Trades.Add(trade);

        // 9. Reduce portfolio value of shareholder
        shareholder. PortfolioValue -= quantity * share. Price;

        // 10. Save all changes
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        // 11. Load complete data for return
        if (portfolio != null)
        {
            await _context.Entry(portfolio)
                .Reference(p => p.Share)
                .LoadAsync();
        }

        await _context.Entry(trade)
            .Reference(t => t. Broker)
            .LoadAsync();
        await _context.Entry(trade)
            .Reference(t => t. Company)
            .LoadAsync();

        return new PurchaseResult
        {
            Success = true,
            Message = $"Successfully sold {quantity} share(s) of {share.Company?. Name ??  "Unknown"}.",
            Trade = trade,
            Portfolio = portfolio
        };
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        return new PurchaseResult
        {
            Success = false,
            Message = $"An error occurred: {ex.Message}"
        };
    }
}
}
}