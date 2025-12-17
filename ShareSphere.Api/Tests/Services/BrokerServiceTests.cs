using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api. Services;
using Xunit;

namespace ShareSphere.Api.Tests.Services
{
    public class BrokerServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllBrokers()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker1 = new Broker
            {
                Name = "Goldman Sachs",
                LicenseNumber = "GS12345",
                Email = "contact@goldmansachs.com"
            };
            var broker2 = new Broker
            {
                Name = "Morgan Stanley",
                LicenseNumber = "MS67890",
                Email = "contact@morganstanley.com"
            };

            context.Brokers.AddRange(broker1, broker2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert. Equal(2, result.Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesTrades()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB12345",
                Email = "test@broker. com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstBroker = result.First();

            // Assert
            Assert.NotNull(firstBroker. Trades);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsBrokerWithTrades()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker = new Broker
            {
                Name = "Charles Schwab",
                LicenseNumber = "CS11111",
                Email = "info@schwab.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(broker.BrokerId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Charles Schwab", result. Name);
            Assert.Equal("CS11111", result.LicenseNumber);
            Assert.Equal("info@schwab.com", result.Email);
            Assert. NotNull(result.Trades);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByLicenseNumberAsync_ExistingLicense_ReturnsBroker()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker = new Broker
            {
                Name = "E*TRADE",
                LicenseNumber = "ET22222",
                Email = "contact@etrade.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByLicenseNumberAsync("ET22222");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("E*TRADE", result.Name);
            Assert.Equal("ET22222", result.LicenseNumber);
            Assert.NotNull(result.Trades);
        }

        [Fact]
        public async Task GetByLicenseNumberAsync_NonExistingLicense_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            // Act
            var result = await service.GetByLicenseNumberAsync("NONEXISTENT");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_ValidBroker_CreatesAndReturns()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var newBroker = new Broker
            {
                Name = "TD Ameritrade",
                LicenseNumber = "TD33333",
                Email = "support@tdameritrade.com"
            };

            // Act
            var result = await service.CreateAsync(newBroker);

            // Assert
            Assert.NotNull(result);
            Assert. True(result.BrokerId > 0);
            Assert.Equal("TD Ameritrade", result. Name);
            Assert.Equal("TD33333", result.LicenseNumber);
            Assert.Equal("support@tdameritrade.com", result.Email);

            var savedBroker = await context. Brokers.FindAsync(result. BrokerId);
            Assert. NotNull(savedBroker);
        }

        [Fact]
        public async Task CreateAsync_MultipleBrokers_EachGetsUniqueId()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker1 = new Broker
            {
                Name = "Broker One",
                LicenseNumber = "BR00001",
                Email = "one@broker.com"
            };
            var broker2 = new Broker
            {
                Name = "Broker Two",
                LicenseNumber = "BR00002",
                Email = "two@broker.com"
            };

            // Act
            var result1 = await service.CreateAsync(broker1);
            var result2 = await service.CreateAsync(broker2);

            // Assert
            Assert.NotEqual(result1.BrokerId, result2.BrokerId);
            Assert.True(result1.BrokerId > 0);
            Assert.True(result2.BrokerId > 0);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAllFields()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker = new Broker
            {
                Name = "Old Broker Name",
                LicenseNumber = "OLD123",
                Email = "old@email.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            var updatedBroker = new Broker
            {
                Name = "New Broker Name",
                LicenseNumber = "NEW456",
                Email = "new@email.com"
            };

            // Act
            var result = await service.UpdateAsync(broker.BrokerId, updatedBroker);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Broker Name", result.Name);
            Assert.Equal("NEW456", result.LicenseNumber);
            Assert.Equal("new@email.com", result.Email);

            // Verify changes are persisted
            var dbBroker = await context. Brokers.FindAsync(broker. BrokerId);
            Assert. Equal("New Broker Name", dbBroker! .Name);
            Assert.Equal("NEW456", dbBroker.LicenseNumber);
            Assert.Equal("new@email.com", dbBroker.Email);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var updatedBroker = new Broker
            {
                Name = "New Name",
                LicenseNumber = "NEW999",
                Email = "new@test.com"
            };

            // Act
            var result = await service.UpdateAsync(999, updatedBroker);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_OnlyUpdatesSpecifiedBroker()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker1 = new Broker
            {
                Name = "Broker One",
                LicenseNumber = "BR001",
                Email = "one@broker.com"
            };
            var broker2 = new Broker
            {
                Name = "Broker Two",
                LicenseNumber = "BR002",
                Email = "two@broker.com"
            };
            context.Brokers.AddRange(broker1, broker2);
            await context.SaveChangesAsync();

            var updatedBroker = new Broker
            {
                Name = "Updated Broker",
                LicenseNumber = "UPD001",
                Email = "updated@broker.com"
            };

            // Act
            await service.UpdateAsync(broker1.BrokerId, updatedBroker);

            // Assert
            var dbBroker1 = await context.Brokers.FindAsync(broker1.BrokerId);
            var dbBroker2 = await context. Brokers.FindAsync(broker2.BrokerId);

            Assert.Equal("Updated Broker", dbBroker1! .Name);
            Assert.Equal("Broker Two", dbBroker2! .Name); // Should remain unchanged
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker = new Broker
            {
                Name = "Broker to Delete",
                LicenseNumber = "DEL001",
                Email = "delete@broker.com"
            };
            context.Brokers.Add(broker);
            await context. SaveChangesAsync();
            var brokerId = broker.BrokerId;

            // Act
            var result = await service.DeleteAsync(brokerId);

            // Assert
            Assert.True(result);
            var deletedBroker = await context. Brokers.FindAsync(brokerId);
            Assert. Null(deletedBroker);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert. False(result);
        }

        [Fact]
        public async Task DeleteAsync_DoesNotAffectOtherBrokers()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new BrokerService(context);

            var broker1 = new Broker
            {
                Name = "Broker to Delete",
                LicenseNumber = "DEL001",
                Email = "delete@broker.com"
            };
            var broker2 = new Broker
            {
                Name = "Broker to Keep",
                LicenseNumber = "KEEP001",
                Email = "keep@broker.com"
            };
            context.Brokers.AddRange(broker1, broker2);
            await context.SaveChangesAsync();

            // Act
            await service.DeleteAsync(broker1.BrokerId);

            // Assert
            var deletedBroker = await context. Brokers.FindAsync(broker1.BrokerId);
            var remainingBroker = await context.Brokers. FindAsync(broker2.BrokerId);

            Assert. Null(deletedBroker);
            Assert.NotNull(remainingBroker);
            Assert.Equal("Broker to Keep", remainingBroker. Name);
        }
    }
}