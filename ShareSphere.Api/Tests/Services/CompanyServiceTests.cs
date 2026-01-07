using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Data;
using ShareSphere.Api.Models;
using ShareSphere.Api.Services;
using Xunit;

namespace ShareSphere.Api.Tests.Services
{
    public class CompanyServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName:  Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllCompanies()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
                Name = "Apple Inc.",
                TickerSymbol = "AAPL",
                ExchangeId = exchange.ExchangeId
            };
            var company2 = new Company
            {
                Name = "Microsoft Corporation",
                TickerSymbol = "MSFT",
                ExchangeId = exchange.ExchangeId
            };

            context.Companies.AddRange(company1, company2);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetAllAsync_IncludesRelatedEntities()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
                Name = "Tesla Inc.",
                TickerSymbol = "TSLA",
                ExchangeId = exchange. ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var share = new Share
            {
                CompanyId = company.CompanyId,
                Price = 250.50m,
                AvailableQuantity = 1000
            };
            context.Shares.Add(share);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetAllAsync();
            var firstCompany = result.First();

            // Assert
            Assert.NotNull(firstCompany. StockExchange);
            Assert.Equal("NASDAQ", firstCompany.StockExchange.Name);
            Assert.NotNull(firstCompany.Shares);
            Assert.Single(firstCompany.Shares);
            Assert.NotNull(firstCompany.Trades);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsCompanyWithRelations()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
                Name = "British Petroleum",
                TickerSymbol = "BP",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetByIdAsync(company.CompanyId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("British Petroleum", result.Name);
            Assert.Equal("BP", result.TickerSymbol);
            Assert.NotNull(result.StockExchange);
            Assert.Equal("LSE", result.StockExchange.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

            // Act
            var result = await service.GetByIdAsync(999);

            // Assert
            Assert. Null(result);
        }

        [Fact]
        public async Task CreateAsync_ValidCompany_CreatesAndReturnsWithStockExchange()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

            var exchange = new StockExchange
            {
                Name = "TSE",
                Country = "Japan",
                Currency = "JPY"
            };
            context. StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var newCompany = new Company
            {
                Name = "Sony Corporation",
                TickerSymbol = "SONY",
                ExchangeId = exchange.ExchangeId
            };

            // Act
            var result = await service.CreateAsync(newCompany);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.CompanyId > 0);
            Assert.Equal("Sony Corporation", result.Name);
            Assert.Equal("SONY", result.TickerSymbol);
            Assert.NotNull(result.StockExchange);
            Assert.Equal("TSE", result.StockExchange.Name);

            var savedCompany = await context.Companies. FindAsync(result.CompanyId);
            Assert.NotNull(savedCompany);
        }

        [Fact]
        public async Task CreateAsync_MultipleCompanies_EachGetsUniqueId()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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

            // Act
            var result1 = await service.CreateAsync(company1);
            var result2 = await service.CreateAsync(company2);

            // Assert
            Assert.NotEqual(result1.CompanyId, result2.CompanyId);
            Assert.True(result1.CompanyId > 0);
            Assert.True(result2.CompanyId > 0);
        }

        [Fact]
        public async Task UpdateAsync_ExistingId_UpdatesAllFields()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

            var exchange1 = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            var exchange2 = new StockExchange
            {
                Name = "NASDAQ",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.AddRange(exchange1, exchange2);
            await context.SaveChangesAsync();

            var company = new Company
            {
                Name = "Old Company Name",
                TickerSymbol = "OLD",
                ExchangeId = exchange1.ExchangeId
            };
            context.Companies.Add(company);
            await context.SaveChangesAsync();

            var updatedCompany = new Company
            {
                Name = "New Company Name",
                TickerSymbol = "NEW",
                ExchangeId = exchange2.ExchangeId
            };

            // Act
            var result = await service.UpdateAsync(company.CompanyId, updatedCompany);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Company Name", result.Name);
            Assert.Equal("NEW", result. TickerSymbol);
            Assert.Equal(exchange2.ExchangeId, result.ExchangeId);

            // Verify changes are persisted
            var dbCompany = await context.Companies. FindAsync(company.CompanyId);
            Assert.Equal("New Company Name", dbCompany! .Name);
            Assert.Equal("NEW", dbCompany. TickerSymbol);
            Assert.Equal(exchange2.ExchangeId, dbCompany.ExchangeId);
        }

        [Fact]
        public async Task UpdateAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

            var exchange = new StockExchange
            {
                Name = "NYSE",
                Country = "USA",
                Currency = "USD"
            };
            context.StockExchanges.Add(exchange);
            await context.SaveChangesAsync();

            var updatedCompany = new Company
            {
                Name = "New Name",
                TickerSymbol = "NEW",
                ExchangeId = exchange.ExchangeId
            };

            // Act
            var result = await service. UpdateAsync(999, updatedCompany);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_OnlyUpdatesSpecifiedCompany()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
            context.Companies.AddRange(company1, company2);
            await context.SaveChangesAsync();

            var updatedCompany = new Company
            {
                Name = "Updated Name",
                TickerSymbol = "UPD",
                ExchangeId = exchange.ExchangeId
            };

            // Act
            await service.UpdateAsync(company1.CompanyId, updatedCompany);

            // Assert
            var dbCompany1 = await context.Companies.FindAsync(company1.CompanyId);
            var dbCompany2 = await context.Companies.FindAsync(company2.CompanyId);

            Assert.Equal("Updated Name", dbCompany1!.Name);
            Assert. Equal("Company Two", dbCompany2! .Name); // Should remain unchanged
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_DeletesAndReturnsTrue()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
                Name = "Company to Delete",
                TickerSymbol = "DEL",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies. Add(company);
            await context.SaveChangesAsync();
            var companyId = company.CompanyId;

            // Act
            var result = await service.DeleteAsync(companyId);

            // Assert
            Assert.True(result);
            var deletedCompany = await context.Companies.FindAsync(companyId);
            Assert.Null(deletedCompany);
        }

        [Fact]
        public async Task DeleteAsync_NonExistingId_ReturnsFalse()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

            // Act
            var result = await service.DeleteAsync(999);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_DoesNotAffectOtherCompanies()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var service = new CompanyService(context);

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
                Name = "Company to Delete",
                TickerSymbol = "DEL",
                ExchangeId = exchange.ExchangeId
            };
            var company2 = new Company
            {
                Name = "Company to Keep",
                TickerSymbol = "KEEP",
                ExchangeId = exchange.ExchangeId
            };
            context.Companies. AddRange(company1, company2);
            await context.SaveChangesAsync();

            // Act
            await service.DeleteAsync(company1.CompanyId);

            // Assert
            var deletedCompany = await context.Companies.FindAsync(company1.CompanyId);
            var remainingCompany = await context.Companies.FindAsync(company2.CompanyId);

            Assert. Null(deletedCompany);
            Assert.NotNull(remainingCompany);
            Assert.Equal("Company to Keep", remainingCompany. Name);
        }
    }
}