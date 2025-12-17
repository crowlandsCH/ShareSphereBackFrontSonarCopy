using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using Xunit;

namespace ShareSphere.Api.Tests.Services
{
    public class TradeServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllTrades()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test.com"
            };
            context. Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade1 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 150.50m,
                Timestamp = DateTime. UtcNow,
                Type = TradeType.Buy
            };
            var trade2 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 50,
                UnitPrice = 155.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Sell
            };

            context.Trades.AddRange(trade1, trade2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result. Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesCompanyBrokerAndStockExchange()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Goldman Sachs",
                LicenseNumber = "GS123",
                Email = "gs@broker.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 200,
                UnitPrice = 350.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Sell
            };
            context.Trades.Add(trade);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstTrade = result.First();

            // Assert
            Assert.NotNull(firstTrade. Company);
            Assert.Equal("Microsoft", firstTrade.Company. Name);
            Assert.NotNull(firstTrade.Company. StockExchange);
            Assert.Equal("NASDAQ", firstTrade.Company.StockExchange.Name);
            Assert.NotNull(firstTrade. Broker);
            Assert.Equal("Goldman Sachs", firstTrade.Broker.Name);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsTradeWithRelations()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Barclays",
                LicenseNumber = "BC123",
                Email = "barclays@broker.com"
            };
            context.Brokers. Add(broker);
            await context.SaveChangesAsync();

            var trade = new Trade
            {
                CompanyId = company. CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 500,
                UnitPrice = 5.50m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };
            context. Trades.Add(trade);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(trade.TradeId);

            // Assert
            Assert. NotNull(result);
            Assert.Equal(500, result.Quantity);
            Assert.Equal(5.50m, result.UnitPrice);
            Assert.Equal(TradeType.Buy, result.Type);
            Assert.NotNull(result.Company);
            Assert.Equal("BP", result.Company.Name);
            Assert.NotNull(result. Broker);
            Assert.Equal("Barclays", result. Broker.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByCompanyIdAsync_ReturnsTradesForCompany()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test.com"
            };
            context. Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade1 = new Trade
            {
                CompanyId = company1.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 250.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };
            var trade2 = new Trade
            {
                CompanyId = company1.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 50,
                UnitPrice = 255.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Sell
            };
            var trade3 = new Trade
            {
                CompanyId = company2.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 200,
                UnitPrice = 12.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };

            context. Trades.AddRange(trade1, trade2, trade3);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByCompanyIdAsync(company1.CompanyId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, t => Assert.Equal(company1.CompanyId, t. CompanyId));
        }

        [Fact]
        public async Task GetByBrokerIdAsync_ReturnsTradesForBroker()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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
                Name = "Apple",
                TickerSymbol = "AAPL",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var broker1 = new Broker
            {
                Name = "Broker One",
                LicenseNumber = "BR001",
                Email = "broker1@test.com"
            };
            var broker2 = new Broker
            {
                Name = "Broker Two",
                LicenseNumber = "BR002",
                Email = "broker2@test.com"
            };
            context.Brokers.AddRange(broker1, broker2);
            await context.SaveChangesAsync();

            var trade1 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker1.BrokerId,
                Quantity = 100,
                UnitPrice = 150.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };
            var trade2 = new Trade
            {
                CompanyId = company. CompanyId,
                BrokerId = broker1.BrokerId,
                Quantity = 50,
                UnitPrice = 155.00m,
                Timestamp = DateTime. UtcNow,
                Type = TradeType.Sell
            };
            var trade3 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker2.BrokerId,
                Quantity = 200,
                UnitPrice = 160.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };

            context.Trades.AddRange(trade1, trade2, trade3);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByBrokerIdAsync(broker1.BrokerId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.All(result, t => Assert.Equal(broker1.BrokerId, t.BrokerId));
        }

        [Fact]
        public async Task CreateAsync_ValidTrade_CreatesAndReturnsWithRelations()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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
            context.Companies.Add(company);
            await context. SaveChangesAsync();

            var broker = new Broker
            {
                Name = "Nomura",
                LicenseNumber = "NM123",
                Email = "nomura@broker.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            var newTrade = new Trade
            {
                CompanyId = company. CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 300,
                UnitPrice = 100.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };

            // Act
            var result = await service.CreateAsync(newTrade);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.TradeId > 0);
            Assert.Equal(300, result.Quantity);
            Assert.Equal(100.00m, result.UnitPrice);
            Assert.Equal(TradeType.Buy, result.Type);
            Assert.NotNull(result.Company);
            Assert.Equal("Sony", result. Company.Name);
            Assert. NotNull(result.Broker);
            Assert.Equal("Nomura", result.Broker.Name);

            var savedTrade = await context.Trades.FindAsync(result.TradeId);
            Assert.NotNull(savedTrade);
        }

        [Fact]
        public async Task CreateAsync_MultipleTrades_EachGetsUniqueId()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test.com"
            };
            context. Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade1 = new Trade
            {
                CompanyId = company. CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 130.00m,
                Timestamp = DateTime.UtcNow,
                Type = TradeType.Buy
            };
            var trade2 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 50,
                UnitPrice = 132.00m,
                Timestamp = DateTime.UtcNow,
               Type = TradeType.Sell
            };

            // Act
            var result1 = await service.CreateAsync(trade1);
            var result2 = await service.CreateAsync(trade2);

            // Assert
            Assert.NotEqual(result1.TradeId, result2.TradeId);
            Assert.True(result1.TradeId > 0);
            Assert.True(result2.TradeId > 0);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAllFields()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker1 = new Broker
            {
                Name = "Broker One",
                LicenseNumber = "BR001",
                Email = "broker1@test.com"
            };
            var broker2 = new Broker
            {
                Name = "Broker Two",
                LicenseNumber = "BR002",
                Email = "broker2@test.com"
            };
            context. Brokers.AddRange(broker1, broker2);
            await context.SaveChangesAsync();

            var trade = new Trade
            {
                CompanyId = company1.CompanyId,
                BrokerId = broker1.BrokerId,
                Quantity = 100,
                UnitPrice = 100.00m,
                Timestamp = DateTime.UtcNow. AddDays(-1),
                Type = TradeType.Buy
            };
            context.Trades.Add(trade);
            await context.SaveChangesAsync();

            var newTradeDate = DateTime.UtcNow;
            var updatedTrade = new Trade
            {
                CompanyId = company2.CompanyId,
                BrokerId = broker2.BrokerId,
                Quantity = 200,
                UnitPrice = 150.00m,
                Timestamp = newTradeDate,
                Type = TradeType.Sell
            };

            // Act
            var result = await service.UpdateAsync(trade.TradeId, updatedTrade);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(company2.CompanyId, result. CompanyId);
            Assert. Equal(broker2.BrokerId, result.BrokerId);
            Assert.Equal(200, result.Quantity);
            Assert. Equal(150.00m, result.UnitPrice);
            Assert.Equal(TradeType.Sell, result.Type);

            // Verify changes are persisted
            var dbTrade = await context.Trades. FindAsync(trade.TradeId);
            Assert.Equal(company2.CompanyId, dbTrade! .CompanyId);
            Assert.Equal(200, dbTrade.Quantity);
         Assert.Equal(TradeType.Sell, result.Type);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test.com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            var updatedTrade = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 100.00m,
                Timestamp = DateTime. UtcNow,
                          Type = TradeType.Buy
            };

            // Act
            var result = await service.UpdateAsync(999, updatedTrade);

            // Assert
            Assert. Null(result);
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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
            context. Companies.Add(company);
            await context.SaveChangesAsync();

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test. com"
            };
            context.Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 100.00m,
                Timestamp = DateTime.UtcNow,
                           Type = TradeType.Buy
            };
            context.Trades.Add(trade);
            await context.SaveChangesAsync();
            var tradeId = trade.TradeId;

            // Act
            var result = await service.DeleteAsync(tradeId);

            // Assert
            Assert.True(result);
            var deletedTrade = await context. Trades.FindAsync(tradeId);
            Assert.Null(deletedTrade);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_DoesNotAffectOtherTrades()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new TradeService(context);

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

            var broker = new Broker
            {
                Name = "Test Broker",
                LicenseNumber = "TB123",
                Email = "broker@test.com"
            };
            context. Brokers.Add(broker);
            await context.SaveChangesAsync();

            var trade1 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 100,
                UnitPrice = 100.00m,
                Timestamp = DateTime.UtcNow,
            Type = TradeType.Buy
            };
            var trade2 = new Trade
            {
                CompanyId = company.CompanyId,
                BrokerId = broker.BrokerId,
                Quantity = 200,
                UnitPrice = 150.00m,
                Timestamp = DateTime. UtcNow,
                Type = TradeType.Sell
            };
            context.Trades.AddRange(trade1, trade2);
            await context.SaveChangesAsync();

            // Act
            await service.DeleteAsync(trade1.TradeId);

            // Assert
            var deletedTrade = await context.Trades.FindAsync(trade1.TradeId);
            var remainingTrade = await context.Trades.FindAsync(trade2.TradeId);

            Assert.Null(deletedTrade);
            Assert.NotNull(remainingTrade);
            Assert.Equal(200, remainingTrade.Quantity);
        }
    }
}