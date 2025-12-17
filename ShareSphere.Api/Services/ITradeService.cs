using ShareSphere.Api.Models;

namespace ShareSphere.Api.Services
{
    public interface ITradeService
    {
        Task<IEnumerable<Trade>> GetAllAsync();
        Task<Trade? > GetByIdAsync(int tradeId);
        Task<IEnumerable<Trade>> GetByCompanyIdAsync(int companyId);
        Task<IEnumerable<Trade>> GetByBrokerIdAsync(int brokerId);
        Task<Trade> CreateAsync(Trade trade);
        Task<Trade?> UpdateAsync(int tradeId, Trade trade);
        Task<bool> DeleteAsync(int tradeId);
    }
}