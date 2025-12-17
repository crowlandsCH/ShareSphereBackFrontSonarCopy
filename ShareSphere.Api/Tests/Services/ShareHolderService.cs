using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api. Services;
using Xunit;

namespace ShareSphere. Api.Tests.Services
{
    public class ShareholderServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllShareholders()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder1 = new Shareholder
            {
                Name = "John Doe",
                Email = "john. doe@example.com",
                PortfolioValue = 50000.00m
            };
            var shareholder2 = new Shareholder
            {
                Name = "Jane Smith",
                Email = "jane.smith@example.com",
                PortfolioValue = 75000.00m
            };

            context.Shareholders.AddRange(shareholder1, shareholder2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesPortfolios()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Test Shareholder",
                Email = "test@example.com",
                PortfolioValue = 10000.00m
            };
            context.Shareholders.Add(shareholder);
            await context. SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstShareholder = result.First();

            // Assert
            Assert.NotNull(firstShareholder. Portfolios);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsShareholderWithPortfolios()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Warren Buffett",
                Email = "warren@berkshire.com",
                PortfolioValue = 1000000.00m
            };
            context.Shareholders.Add(shareholder);
            await context.SaveChangesAsync();

            // Act
            var result = await service. GetByIdAsync(shareholder. ShareholderId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Warren Buffett", result.Name);
            Assert.Equal("warren@berkshire.com", result. Email);
            Assert.Equal(1000000.00m, result.PortfolioValue);
            Assert.NotNull(result. Portfolios);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByEmailAsync_ExistingEmail_ReturnsShareholder()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Peter Lynch",
                Email = "peter@fidelity.com",
                PortfolioValue = 500000.00m
            };
            context.Shareholders.Add(shareholder);
            await context. SaveChangesAsync();

            // Act
            var result = await service.GetByEmailAsync("peter@fidelity.com");

            // Assert
            Assert. NotNull(result);
            Assert.Equal("Peter Lynch", result. Name);
            Assert.Equal("peter@fidelity.com", result.Email);
            Assert. NotNull(result.Portfolios);
        }

        [Fact]
        public async Task GetByEmailAsync_NonExistingEmail_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            // Act
            var result = await service.GetByEmailAsync("nonexistent@example.com");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_ValidShareholder_CreatesAndReturns()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var newShareholder = new Shareholder
            {
                Name = "George Soros",
                Email = "george@soros.com",
                PortfolioValue = 2000000.00m
            };

            // Act
            var result = await service.CreateAsync(newShareholder);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.ShareholderId > 0);
            Assert.Equal("George Soros", result.Name);
            Assert.Equal("george@soros.com", result.Email);
            Assert.Equal(2000000.00m, result.PortfolioValue);

            var savedShareholder = await context. Shareholders.FindAsync(result.ShareholderId);
            Assert.NotNull(savedShareholder);
        }

        [Fact]
        public async Task CreateAsync_MultipleShareholders_EachGetsUniqueId()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder1 = new Shareholder
            {
                Name = "Shareholder One",
                Email = "one@example.com",
                PortfolioValue = 10000.00m
            };
            var shareholder2 = new Shareholder
            {
                Name = "Shareholder Two",
                Email = "two@example.com",
                PortfolioValue = 20000.00m
            };

            // Act
            var result1 = await service.CreateAsync(shareholder1);
            var result2 = await service.CreateAsync(shareholder2);

            // Assert
            Assert.NotEqual(result1.ShareholderId, result2.ShareholderId);
            Assert.True(result1.ShareholderId > 0);
            Assert. True(result2.ShareholderId > 0);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAllFields()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Old Name",
                Email = "old@email.com",
                PortfolioValue = 10000.00m
            };
            context.Shareholders.Add(shareholder);
            await context. SaveChangesAsync();

            var updatedShareholder = new Shareholder
            {
                Name = "New Name",
                Email = "new@email.com",
                PortfolioValue = 25000.00m
            };

            // Act
            var result = await service.UpdateAsync(shareholder.ShareholderId, updatedShareholder);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            Assert.Equal("new@email.com", result.Email);
            Assert.Equal(25000.00m, result.PortfolioValue);

            // Verify changes are persisted
            var dbShareholder = await context. Shareholders.FindAsync(shareholder. ShareholderId);
            Assert.Equal("New Name", dbShareholder!.Name);
            Assert. Equal("new@email.com", dbShareholder.Email);
            Assert.Equal(25000.00m, dbShareholder. PortfolioValue);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var updatedShareholder = new Shareholder
            {
                Name = "New Name",
                Email = "new@email.com",
                PortfolioValue = 15000.00m
            };

            // Act
            var result = await service.UpdateAsync(999, updatedShareholder);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_OnlyUpdatesSpecifiedShareholder()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder1 = new Shareholder
            {
                Name = "Shareholder One",
                Email = "one@example.com",
                PortfolioValue = 10000.00m
            };
            var shareholder2 = new Shareholder
            {
                Name = "Shareholder Two",
                Email = "two@example.com",
                PortfolioValue = 20000.00m
            };
            context.Shareholders.AddRange(shareholder1, shareholder2);
            await context.SaveChangesAsync();

            var updatedShareholder = new Shareholder
            {
                Name = "Updated Shareholder",
                Email = "updated@example.com",
                PortfolioValue = 30000.00m
            };

            // Act
            await service.UpdateAsync(shareholder1.ShareholderId, updatedShareholder);

            // Assert
            var dbShareholder1 = await context.Shareholders. FindAsync(shareholder1.ShareholderId);
            var dbShareholder2 = await context.Shareholders.FindAsync(shareholder2.ShareholderId);

            Assert.Equal("Updated Shareholder", dbShareholder1!.Name);
            Assert.Equal("Shareholder Two", dbShareholder2!.Name); // Should remain unchanged
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Shareholder to Delete",
                Email = "delete@example.com",
                PortfolioValue = 5000.00m
            };
            context.Shareholders.Add(shareholder);
            await context. SaveChangesAsync();
            var shareholderId = shareholder.ShareholderId;

            // Act
            var result = await service.DeleteAsync(shareholderId);

            // Assert
            Assert.True(result);
            var deletedShareholder = await context. Shareholders.FindAsync(shareholderId);
            Assert.Null(deletedShareholder);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert. False(result);
        }

        [Fact]
        public async Task DeleteAsync_DoesNotAffectOtherShareholders()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder1 = new Shareholder
            {
                Name = "Shareholder to Delete",
                Email = "delete@example.com",
                PortfolioValue = 5000.00m
            };
            var shareholder2 = new Shareholder
            {
                Name = "Shareholder to Keep",
                Email = "keep@example.com",
                PortfolioValue = 10000.00m
            };
            context.Shareholders.AddRange(shareholder1, shareholder2);
            await context.SaveChangesAsync();

            // Act
            await service.DeleteAsync(shareholder1.ShareholderId);

            // Assert
            var deletedShareholder = await context. Shareholders.FindAsync(shareholder1.ShareholderId);
            var remainingShareholder = await context.Shareholders.FindAsync(shareholder2.ShareholderId);

            Assert. Null(deletedShareholder);
            Assert.NotNull(remainingShareholder);
            Assert.Equal("Shareholder to Keep", remainingShareholder. Name);
        }

        [Fact]
        public async Task UpdateAsync_CanUpdatePortfolioValueToZero()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareholderService(context);

            var shareholder = new Shareholder
            {
                Name = "Test Shareholder",
                Email = "test@example.com",
                PortfolioValue = 50000.00m
            };
            context.Shareholders.Add(shareholder);
            await context. SaveChangesAsync();

            var updatedShareholder = new Shareholder
            {
                Name = "Test Shareholder",
                Email = "test@example.com",
                PortfolioValue = 0.00m
            };

            // Act
            var result = await service.UpdateAsync(shareholder.ShareholderId, updatedShareholder);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0.00m, result. PortfolioValue);
        }
    }
}