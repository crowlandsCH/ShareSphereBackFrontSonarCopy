using ShareSphere.Api.Models;

namespace ShareSphere.Api.Services
{
    public interface IShareService
    {
        Task<IEnumerable<Share>> GetAllAsync();
        Task<Share? > GetByIdAsync(int shareId);
        Task<IEnumerable<Share>> GetByCompanyIdAsync(int companyId);
        Task<Share> CreateAsync(Share share);
        Task<Share?> UpdateAsync(int shareId, Share share);
        Task<bool> DeleteAsync(int shareId);
    }
}