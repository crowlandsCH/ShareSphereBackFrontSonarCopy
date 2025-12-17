using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;
using ShareSphere.Api.Data;

namespace ShareSphere.Api.Services
{
    public class BrokerService : IBrokerService
    {
        private readonly AppDbContext _context;

        public BrokerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Broker>> GetAllAsync()
        {
            return await _context.Brokers
                .Include(b => b. Trades)
                .ToListAsync();
        }

        public async Task<Broker?> GetByIdAsync(int brokerId)
        {
            return await _context.Brokers
                .Include(b => b. Trades)
                .FirstOrDefaultAsync(b => b. BrokerId == brokerId);
        }

        public async Task<Broker?> GetByLicenseNumberAsync(string licenseNumber)
        {
            return await _context.Brokers
                .Include(b => b. Trades)
                .FirstOrDefaultAsync(b => b.LicenseNumber == licenseNumber);
        }

        public async Task<Broker> CreateAsync(Broker broker)
        {
            _context.Brokers.Add(broker);
            await _context.SaveChangesAsync();
            return broker;
        }

        public async Task<Broker?> UpdateAsync(int brokerId, Broker broker)
        {
            var existing = await _context.Brokers.FindAsync(brokerId);
            if (existing == null)
                return null;

            existing.Name = broker.Name;
            existing.LicenseNumber = broker.LicenseNumber;
            existing.Email = broker.Email;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int brokerId)
        {
            var broker = await _context.Brokers. FindAsync(brokerId);
            if (broker == null)
                return false;

            _context.Brokers.Remove(broker);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}