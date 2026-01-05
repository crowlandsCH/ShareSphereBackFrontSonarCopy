using ShareSphere.Api.Models;

namespace ShareSphere.Api.Services
{
    public interface ISharePurchaseService
    {
        Task<PurchaseResult> PurchaseSharesAsync(int shareholderId, int shareId, int quantity, int brokerId);
        Task<PurchaseResult> SellSharesAsync(int shareholderId, int shareId, int quantity, int brokerId);

    }

    /// <summary>
    /// Result of a share purchase transaction
    /// </summary>
    public class PurchaseResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Trade?  Trade { get; set; }
        public Portfolio? Portfolio { get; set; }
    }
}