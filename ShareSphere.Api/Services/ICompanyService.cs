using ShareSphere.Api.Models;

namespace ShareSphere.Api.Services
{
    public interface ICompanyService
    {
        Task<IEnumerable<Company>> GetAllAsync();
        Task<Company?> GetByIdAsync(int companyId);
        Task<Company> CreateAsync(Company company);
        Task<Company?> UpdateAsync(int companyId, Company company);
        Task<bool> DeleteAsync(int companyId);
    }
}