using ShareSphere.Api.Models;

namespace ShareSphere.Api.Services
{
    public interface IBrokerService
    {
        Task<IEnumerable<Broker>> GetAllAsync();
        Task<Broker? > GetByIdAsync(int brokerId);
        Task<Broker?> GetByLicenseNumberAsync(string licenseNumber);
        Task<Broker> CreateAsync(Broker broker);
        Task<Broker? > UpdateAsync(int brokerId, Broker broker);
        Task<bool> DeleteAsync(int brokerId);
    }
}