using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using Xunit;

namespace ShareSphere.Api.Tests.Services
{
    public class ShareServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllShares()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Apple Inc.",
                TickerSymbol = "AAPL",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var share1 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 150.50m,
                AvailableQuantity = 1000
            };
            var share2 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 151.75m,
                AvailableQuantity = 500
            };

            context.Shares.AddRange(share1, share2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result. Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesCompanyAndStockExchange()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NASDAQ",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Microsoft",
                TickerSymbol = "MSFT",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context. SaveChangesAsync();

            var share = new Share
            {
                CompanyId = company.CompanyId,
                Price = 350.00m,
                AvailableQuantity = 2000
            };
            context. Shares.Add(share);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstShare = result.First();

            // Assert
            Assert.NotNull(firstShare. Company);
            Assert.Equal("Microsoft", firstShare.Company.Name);
            Assert.NotNull(firstShare.Company.StockExchange);
            Assert. Equal("NASDAQ", firstShare.Company.StockExchange.Name);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsShareWithRelations()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "LSE",
                Country = "UK",
                Currency = "GBP"
            };
            context.StockExchanges.Add(exchange);
            await context. SaveChangesAsync();

            var company = new Company
            {
                Name = "BP",
                TickerSymbol = "BP",
                ExchangeId = exchange.ExchangeId
            };
            context. Companies.Add(company);
            await context.SaveChangesAsync();

            var share = new Share
            {
                CompanyId = company.CompanyId,
                Price = 5.50m,
                AvailableQuantity = 10000
            };
            context. Shares.Add(share);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(share.ShareId);

            // Assert
            Assert.NotNull(result);
            Assert. Equal(5.50m, result.Price);
            Assert.Equal(10000, result.AvailableQuantity);
            Assert.NotNull(result.Company);
            Assert.Equal("BP", result. Company.Name);
            Assert.NotNull(result.Company.StockExchange);
            Assert.Equal("LSE", result.Company.StockExchange.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByCompanyIdAsync_ReturnsSharesForCompany()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company1 = new Company
            {
                Name = "Tesla",
                TickerSymbol = "TSLA",
                ExchangeId = exchange.ExchangeId
            };
            var company2 = new Company
            {
                Name = "Ford",
                TickerSymbol = "F",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.AddRange(company1, company2);
            await context.SaveChangesAsync();

            var share1 = new Share
            {
                CompanyId = company1.CompanyId,
                Price = 250.00m,
                AvailableQuantity = 500
            };
            var share2 = new Share
            {
                CompanyId = company1.CompanyId,
                Price = 255.00m,
                AvailableQuantity = 300
            };
            var share3 = new Share
            {
                CompanyId = company2.CompanyId,
                Price = 12.00m,
                AvailableQuantity = 1000
            };

            context. Shares.AddRange(share1, share2, share3);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByCompanyIdAsync(company1.CompanyId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, s => Assert.Equal(company1.CompanyId, s. CompanyId));
        }

        [Fact]
        public async Task CreateAsync_ValidShare_CreatesAndReturnsWithRelations()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "TSE",
                Country = "Japan",
                Currency = "JPY"
            };
            context. StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Sony",
                TickerSymbol = "SONY",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies. Add(company);
            await context.SaveChangesAsync();

            var newShare = new Share
            {
                CompanyId = company.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 5000
            };

            // Act
            var result = await service.CreateAsync(newShare);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.ShareId > 0);
            Assert.Equal(100.00m, result.Price);
            Assert.Equal(5000, result.AvailableQuantity);
            Assert.NotNull(result.Company);
            Assert.Equal("Sony", result.Company.Name);
            Assert.NotNull(result.Company.StockExchange);
            Assert.Equal("TSE", result.Company. StockExchange.Name);

            var savedShare = await context.Shares. FindAsync(result.ShareId);
            Assert.NotNull(savedShare);
        }

        [Fact]
        public async Task CreateAsync_MultipleShares_EachGetsUniqueId()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Amazon",
                TickerSymbol = "AMZN",
                ExchangeId = exchange. ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var share1 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 130.00m,
                AvailableQuantity = 100
            };
            var share2 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 132.00m,
                AvailableQuantity = 200
            };

            // Act
            var result1 = await service.CreateAsync(share1);
            var result2 = await service.CreateAsync(share2);

            // Assert
            Assert.NotEqual(result1.ShareId, result2.ShareId);
            Assert.True(result1.ShareId > 0);
            Assert.True(result2.ShareId > 0);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAllFields()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company1 = new Company
            {
                Name = "Company One",
                TickerSymbol = "CONE",
                ExchangeId = exchange.ExchangeId
            };
            var company2 = new Company
            {
                Name = "Company Two",
                TickerSymbol = "CTWO",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies. AddRange(company1, company2);
            await context.SaveChangesAsync();

            var share = new Share
            {
                CompanyId = company1.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 500
            };
            context. Shares.Add(share);
            await context.SaveChangesAsync();

            var updatedShare = new Share
            {
                CompanyId = company2.CompanyId,
                Price = 150.00m,
                AvailableQuantity = 1000
            };

            // Act
            var result = await service.UpdateAsync(share.ShareId, updatedShare);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(company2.CompanyId, result. CompanyId);
            Assert. Equal(150.00m, result.Price);
            Assert.Equal(1000, result.AvailableQuantity);

            // Verify changes are persisted
            var dbShare = await context.Shares. FindAsync(share.ShareId);
            Assert.Equal(company2.CompanyId, dbShare! .CompanyId);
            Assert.Equal(150.00m, dbShare.Price);
            Assert.Equal(1000, dbShare.AvailableQuantity);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Test Company",
                TickerSymbol = "TEST",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var updatedShare = new Share
            {
                CompanyId = company.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 100
            };

            // Act
            var result = await service.UpdateAsync(999, updatedShare);

            // Assert
            Assert. Null(result);
        }

        [Fact]
        public async Task UpdateAsync_OnlyUpdatesSpecifiedShare()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges. Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Test Company",
                TickerSymbol = "TEST",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var share1 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 500
            };
            var share2 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 200.00m,
                AvailableQuantity = 1000
            };
            context.Shares.AddRange(share1, share2);
            await context.SaveChangesAsync();

            var updatedShare = new Share
            {
                CompanyId = company.CompanyId,
                Price = 150.00m,
                AvailableQuantity = 750
            };

            // Act
            await service.UpdateAsync(share1.ShareId, updatedShare);

            // Assert
            var dbShare1 = await context.Shares. FindAsync(share1.ShareId);
            var dbShare2 = await context. Shares.FindAsync(share2.ShareId);

            Assert.Equal(150.00m, dbShare1! .Price);
            Assert.Equal(200.00m, dbShare2! .Price); // Should remain unchanged
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges. Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Test Company",
                TickerSymbol = "TEST",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var share = new Share
            {
                CompanyId = company.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 500
            };
            context.Shares.Add(share);
            await context.SaveChangesAsync();
            var shareId = share.ShareId;

            // Act
            var result = await service.DeleteAsync(shareId);

            // Assert
            Assert.True(result);
            var deletedShare = await context.Shares.FindAsync(shareId);
            Assert.Null(deletedShare);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_DoesNotAffectOtherShares()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new ShareService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context. SaveChangesAsync();

            var company = new Company
            {
                Name = "Test Company",
                TickerSymbol = "TEST",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies. Add(company);
            await context.SaveChangesAsync();

            var share1 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 100.00m,
                AvailableQuantity = 500
            };
            var share2 = new Share
            {
                CompanyId = company.CompanyId,
                Price = 200.00m,
                AvailableQuantity = 1000
            };
            context.Shares.AddRange(share1, share2);
            await context.SaveChangesAsync();

            // Act
            await service.DeleteAsync(share1.ShareId);

            // Assert
            var deletedShare = await context.Shares.FindAsync(share1.ShareId);
            var remainingShare = await context.Shares.FindAsync(share2.ShareId);

            Assert.Null(deletedShare);
            Assert.NotNull(remainingShare);
            Assert.Equal(200.00m, remainingShare. Price);
        }
    }
}