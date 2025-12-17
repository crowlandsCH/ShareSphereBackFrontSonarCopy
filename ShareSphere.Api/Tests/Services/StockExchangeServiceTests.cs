using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using Xunit;

namespace ShareSphere.Api.Tests.Services
{
    public class StockExchangeServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllStockExchanges()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var exchange1 = new StockExchange
            {
                Name = "New York Stock Exchange",
                Country = "United States",
                Currency = "USD"
            };
            var exchange2 = new StockExchange
            {
                Name = "London Stock Exchange",
                Country = "United Kingdom",
                Currency = "GBP"
            };

            context.StockExchanges.AddRange(exchange1, exchange2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert. NotNull(result);
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesCompanies()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var exchange = new StockExchange
            {
                Name = "NASDAQ",
                Country = "United States",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Tech Corp",
                TickerSymbol = "TECH",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context. SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstExchange = result.First();

            // Assert
            Assert.NotNull(firstExchange. Companies);
            Assert.Single(firstExchange.Companies);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsStockExchange()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var exchange = new StockExchange
            {
                Name = "Tokyo Stock Exchange",
                Country = "Japan",
                Currency = "JPY"
            };
            context.StockExchanges.Add(exchange);
            await context. SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(exchange. ExchangeId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Tokyo Stock Exchange", result.Name);
            Assert.Equal("Japan", result. Country);
            Assert.Equal("JPY", result.Currency);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_ValidStockExchange_CreatesAndReturns()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var newExchange = new StockExchange
            {
                Name = "Deutsche Börse",
                Country = "Germany",
                Currency = "EUR"
            };

            // Act
            var result = await service.CreateAsync(newExchange);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.ExchangeId > 0);
            Assert.Equal("Deutsche Börse", result. Name);

            var savedExchange = await context.StockExchanges.FindAsync(result.ExchangeId);
            Assert.NotNull(savedExchange);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAndReturns()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var exchange = new StockExchange
            {
                Name = "Old Name",
                Country = "Old Country",
                Currency = "USD"
            };
            context. StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var updatedExchange = new StockExchange
            {
                Name = "New Name",
                Country = "New Country",
                Currency = "EUR"
            };

            // Act
            var result = await service. UpdateAsync(exchange.ExchangeId, updatedExchange);

            // Assert
            Assert.NotNull(result);
            Assert. Equal("New Name", result.Name);
            Assert.Equal("New Country", result.Country);
            Assert.Equal("EUR", result. Currency);

            var dbExchange = await context.StockExchanges.FindAsync(exchange.ExchangeId);
            Assert.Equal("New Name", dbExchange! .Name);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var updatedExchange = new StockExchange
            {
                Name = "New Name",
                Country = "New Country",
                Currency = "EUR"
            };

            // Act
            var result = await service. UpdateAsync(999, updatedExchange);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            var exchange = new StockExchange
            {
                Name = "Exchange to Delete",
                Country = "Some Country",
                Currency = "USD"
            };
            context. StockExchanges.Add(exchange);
            await context.SaveChangesAsync();
            var exchangeId = exchange.ExchangeId;

            // Act
            var result = await service.DeleteAsync(exchangeId);

            // Assert
            Assert.True(result);
            var deletedExchange = await context. StockExchanges.FindAsync(exchangeId);
            Assert.Null(deletedExchange);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new StockExchangeService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert.False(result);
        }
    }
}