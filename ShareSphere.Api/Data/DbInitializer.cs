using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;

namespace ShareSphere.Api.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAdminUser(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // 1) Create roles if they don't exist yet
            string[] roleNames = { "admin", "user"};
            
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // 2) Create admin user if they don't exist yet
            const string adminUserName = "admin";
            const string adminEmail = "admin@sharesphere.com";
            const string adminPassword = "Admin123!"; // ⚠️ Change this in production!

            var adminUser = await userManager.FindByNameAsync(adminUserName);
            
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminUserName,
                    Email = adminEmail,
                    DisplayName = "System Administrator",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "admin");
                    Console.WriteLine($"✓ Admin user '{adminUserName}' created successfully");
                }
                else
                {
                    Console.WriteLine($"✗ Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
            else
            {
                Console.WriteLine($"ℹ Admin user '{adminUserName}' already exists");
            }
        }

        public static async Task SeedStockExchanges(AppDbContext context)
        {
            // Check if stock exchanges already exist
            if (await context.StockExchanges.AnyAsync())
            {
                Console.WriteLine("ℹ Stock exchanges already seeded");
                return;
            }

            var stockExchanges = new List<StockExchange>
            {
                new StockExchange { Name = "New York Stock Exchange", Country = "United States", Currency = "USD" },
                new StockExchange { Name = "NASDAQ", Country = "United States", Currency = "USD" },
                new StockExchange { Name = "London Stock Exchange", Country = "United Kingdom", Currency = "GBP" },
                new StockExchange { Name = "Tokyo Stock Exchange", Country = "Japan", Currency = "JPY" },
                new StockExchange { Name = "Shanghai Stock Exchange", Country = "China", Currency = "CNY" },
                new StockExchange { Name = "Hong Kong Stock Exchange", Country = "Hong Kong", Currency = "HKD" },
                new StockExchange { Name = "Euronext", Country = "European Union", Currency = "EUR" },
                new StockExchange { Name = "Frankfurt Stock Exchange", Country = "Germany", Currency = "EUR" },
                new StockExchange { Name = "Toronto Stock Exchange", Country = "Canada", Currency = "CAD" }
            };

            context.StockExchanges.AddRange(stockExchanges);
            await context.SaveChangesAsync();
            Console.WriteLine($"✓ Seeded {stockExchanges.Count} stock exchanges");
        }

        public static async Task SeedCompanies(AppDbContext context)
        {
            // Check if companies already exist
            if (await context.Companies.AnyAsync())
            {
                Console.WriteLine("ℹ Companies already seeded");
                return;
            }

            // Ensure stock exchanges exist first
            if (!await context.StockExchanges.AnyAsync())
            {
                Console.WriteLine("⚠ Stock exchanges must be seeded before companies");
                return;
            }

            // Use AsNoTracking for read-only queries and select only needed fields
            var exchanges = await context.StockExchanges
                .AsNoTracking()
                .Select(e => new { e.ExchangeId, e.Name })
                .ToDictionaryAsync(e => e.Name, e => e.ExchangeId);

            var companies = new List<Company>(40); // Pre-allocate capacity

            // Helper method to add companies if exchange exists
            void AddCompaniesForExchange(string exchangeName, params (string Name, string Ticker)[] companyData)
            {
                if (exchanges.TryGetValue(exchangeName, out var exchangeId))
                {
                    companies.AddRange(companyData.Select(c => new Company 
                    { 
                        Name = c.Name, 
                        TickerSymbol = c.Ticker, 
                        ExchangeId = exchangeId 
                    }));
                }
            }

            // Add companies for each exchange
            AddCompaniesForExchange("New York Stock Exchange",
                ("JPMorgan Chase & Co.", "JPM"),
                ("Johnson & Johnson", "JNJ"),
                ("Exxon Mobil Corporation", "XOM"),
                ("Procter & Gamble Co.", "PG"),
                ("Visa Inc.", "V"),
                ("Walmart Inc.", "WMT"),
                ("Coca-Cola Company", "KO")
            );

            AddCompaniesForExchange("NASDAQ",
                ("Apple Inc.", "AAPL"),
                ("Microsoft Corporation", "MSFT"),
                ("Amazon.com Inc.", "AMZN"),
                ("Alphabet Inc.", "GOOGL"),
                ("Meta Platforms Inc.", "META"),
                ("Tesla Inc.", "TSLA"),
                ("NVIDIA Corporation", "NVDA"),
                ("Netflix Inc.", "NFLX"),
                ("Adobe Inc.", "ADBE"),
                ("Intel Corporation", "INTC")
            );

            AddCompaniesForExchange("London Stock Exchange",
                ("HSBC Holdings plc", "HSBA"),
                ("BP plc", "BP"),
                ("Shell plc", "SHEL"),
                ("AstraZeneca plc", "AZN"),
                ("Unilever plc", "ULVR")
            );

            AddCompaniesForExchange("Tokyo Stock Exchange",
                ("Toyota Motor Corporation", "TM"),
                ("Sony Group Corporation", "SONY"),
                ("SoftBank Group Corp.", "SFTBY"),
                ("Nintendo Co., Ltd.", "NTDOY")
            );

            AddCompaniesForExchange("Hong Kong Stock Exchange",
                ("Tencent Holdings Limited", "TCEHY"),
                ("Alibaba Group Holding Limited", "BABA"),
                ("China Mobile Limited", "CHL")
            );

            AddCompaniesForExchange("Euronext",
                ("LVMH Moët Hennessy Louis Vuitton", "LVMH"),
                ("TotalEnergies SE", "TTE"),
                ("Airbus SE", "AIR"),
                ("SAP SE", "SAP")
            );

            if (companies.Count != 0)
            {
                context.Companies.AddRange(companies);
                await context.SaveChangesAsync();
                Console.WriteLine($"✓ Seeded {companies.Count} companies");
            }
        }

        public static async Task SeedShares(AppDbContext context)
        {
            // Check if shares already exist
            if (await context.Shares.AnyAsync())
            {
                Console.WriteLine("ℹ Shares already seeded");
                return;
            }

            // Ensure companies exist first
            if (!await context.Companies.AnyAsync())
            {
                Console.WriteLine("⚠ Companies must be seeded before shares");
                return;
            }

            var random = new Random(12345); // Fixed seed for reproducibility
            
            // Stream companies and process in batches to avoid loading all into memory
            const int batchSize = 100;
            var companyIds = await context.Companies
                .AsNoTracking()
                .Select(c => c.CompanyId)
                .ToListAsync();

            var totalShares = 0;
            
            for (int i = 0; i < companyIds.Count; i += batchSize)
            {
                var batch = companyIds.Skip(i).Take(batchSize);
                var shares = batch.Select(companyId => new Share
                {
                    CompanyId = companyId,
                    Price = Math.Round(random.Next(10, 500) + (decimal)random.NextDouble(), 2),
                    AvailableQuantity = random.Next(10000, 1000000)
                }).ToList();

                context.Shares.AddRange(shares);
                await context.SaveChangesAsync();
                totalShares += shares.Count;
                
                // Clear change tracker to free memory
                context.ChangeTracker.Clear();
            }

            Console.WriteLine($"✓ Seeded {totalShares} shares");
        }

        public static async Task SeedShareholders(AppDbContext context)
        {
            // Check if shareholders already exist
            if (await context.Shareholders.AnyAsync())
            {
                Console.WriteLine("ℹ Shareholders already seeded");
                return;
            }

            var shareholders = new List<Shareholder>(15) // Pre-allocate capacity
            {
                new() { Name = "John Smith", Email = "john.smith@example.com", PortfolioValue = 250000.00m },
                new() { Name = "Emma Johnson", Email = "emma.johnson@example.com", PortfolioValue = 450000.00m },
                new() { Name = "Michael Chen", Email = "michael.chen@example.com", PortfolioValue = 1200000.00m },
                new() { Name = "Sarah Williams", Email = "sarah.williams@example.com", PortfolioValue = 780000.00m },
                new() { Name = "David Brown", Email = "david.brown@example.com", PortfolioValue = 320000.00m },
                new() { Name = "Jennifer Davis", Email = "jennifer.davis@example.com", PortfolioValue = 560000.00m },
                new() { Name = "Robert Martinez", Email = "robert.martinez@example.com", PortfolioValue = 925000.00m },
                new() { Name = "Lisa Anderson", Email = "lisa.anderson@example.com", PortfolioValue = 410000.00m },
                new() { Name = "James Wilson", Email = "james.wilson@example.com", PortfolioValue = 670000.00m },
                new() { Name = "Maria Garcia", Email = "maria.garcia@example.com", PortfolioValue = 1500000.00m },
                new() { Name = "Thomas Taylor", Email = "thomas.taylor@example.com", PortfolioValue = 340000.00m },
                new() { Name = "Patricia Lee", Email = "patricia.lee@example.com", PortfolioValue = 890000.00m },
                new() { Name = "Christopher White", Email = "christopher.white@example.com", PortfolioValue = 520000.00m },
                new() { Name = "Barbara Harris", Email = "barbara.harris@example.com", PortfolioValue = 750000.00m },
                new() { Name = "Daniel Clark", Email = "daniel.clark@example.com", PortfolioValue = 1100000.00m }
            };

            context.Shareholders.AddRange(shareholders);
            await context.SaveChangesAsync();
            Console.WriteLine($"✓ Seeded {shareholders.Count} shareholders");
        }

        public static async Task SeedBrokers(AppDbContext context)
        {
            // Check if brokers already exist
            if (await context.Brokers.AnyAsync())
            {
                Console.WriteLine("ℹ Brokers already seeded");
                return;
            }

            var brokers = new List<Broker>(10) // Pre-allocate capacity
            {
                new() { Name = "Morgan Stanley Securities", LicenseNumber = "MS-2024-001", Email = "contact@morganstanley.com" },
                new() { Name = "Goldman Sachs Trading", LicenseNumber = "GS-2024-002", Email = "trading@goldmansachs.com" },
                new() { Name = "Charles Schwab Brokerage", LicenseNumber = "CS-2024-003", Email = "broker@schwab.com" },
                new() { Name = "Fidelity Investments", LicenseNumber = "FI-2024-004", Email = "trades@fidelity.com" },
                new() { Name = "E*TRADE Securities", LicenseNumber = "ET-2024-005", Email = "support@etrade.com" },
                new() { Name = "TD Ameritrade", LicenseNumber = "TDA-2024-006", Email = "broker@tdameritrade.com" },
                new() { Name = "Interactive Brokers", LicenseNumber = "IB-2024-007", Email = "trading@interactivebrokers.com" },
                new() { Name = "Merrill Lynch", LicenseNumber = "ML-2024-008", Email = "broker@ml.com" },
                new() { Name = "JP Morgan Securities", LicenseNumber = "JPM-2024-009", Email = "securities@jpmorgan.com" },
                new() { Name = "UBS Financial Services", LicenseNumber = "UBS-2024-010", Email = "trading@ubs.com" }
            };

            context.Brokers.AddRange(brokers);
            await context.SaveChangesAsync();
            Console.WriteLine($"✓ Seeded {brokers.Count} brokers");
        }

        public static async Task SeedApplicationUsers(
            AppDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            // Check if users already exist (excluding admin)
            var existingUsersCount = await userManager.Users.CountAsync();
            if (existingUsersCount > 1) // More than just admin
            {
                Console.WriteLine("ℹ Application users already seeded");
                return;
            }

            // Ensure shareholders exist to link users
            if (!await context.Shareholders.AnyAsync())
            {
                Console.WriteLine("⚠ Shareholders must be seeded before application users");
                return;
            }

            // Get shareholder IDs to link with users
            var shareholderIds = await context.Shareholders
                .AsNoTracking()
                .Select(s => s.ShareholderId)
                .Take(5) // Link first 5 users to shareholders
                .ToListAsync();

            var usersData = new[]
            {
                (UserName: "jsmith", Email: "john.smith@example.com", DisplayName: "John Smith", Password: "User123!", ShareholderId: shareholderIds.ElementAtOrDefault(0)),
                (UserName: "ejohnson", Email: "emma.johnson@example.com", DisplayName: "Emma Johnson", Password: "User123!", ShareholderId: shareholderIds.ElementAtOrDefault(1)),
                (UserName: "mchen", Email: "michael.chen@example.com", DisplayName: "Michael Chen", Password: "User123!", ShareholderId: shareholderIds.ElementAtOrDefault(2)),
                (UserName: "swilliams", Email: "sarah.williams@example.com", DisplayName: "Sarah Williams", Password: "User123!", ShareholderId: shareholderIds.ElementAtOrDefault(3)),
                (UserName: "dbrown", Email: "david.brown@example.com", DisplayName: "David Brown", Password: "User123!", ShareholderId: shareholderIds.ElementAtOrDefault(4))
            };

            var successCount = 0;
            foreach (var userData in usersData)
            {
                var existingUser = await userManager.FindByNameAsync(userData.UserName);
                if (existingUser == null)
                {
                    var user = new ApplicationUser
                    {
                        UserName = userData.UserName,
                        Email = userData.Email,
                        DisplayName = userData.DisplayName,
                        EmailConfirmed = true,
                        IsActive = true,
                        ShareholderId = userData.ShareholderId != 0 ? userData.ShareholderId : null
                    };

                    var result = await userManager.CreateAsync(user, userData.Password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, "user");
                        successCount++;
                    }
                }
            }

            Console.WriteLine($"✓ Seeded {successCount} application users");
        }

        public static async Task SeedTrades(AppDbContext context)
        {
            // Check if trades already exist
            if (await context.Trades.AnyAsync())
            {
                Console.WriteLine("ℹ Trades already seeded");
                return;
            }

            // Ensure required entities exist
            if (!await context.Brokers.AnyAsync() || 
                !await context.Shareholders.AnyAsync() || 
                !await context.Companies.AnyAsync())
            {
                Console.WriteLine("⚠ Brokers, Shareholders, and Companies must be seeded before trades");
                return;
            }

            // Get IDs for foreign keys using AsNoTracking
            var brokerIds = await context.Brokers.AsNoTracking().Select(b => b.BrokerId).ToListAsync();
            var shareholderIds = await context.Shareholders.AsNoTracking().Select(s => s.ShareholderId).ToListAsync();
            var companyIds = await context.Companies.AsNoTracking().Select(c => c.CompanyId).Take(20).ToListAsync();

            var random = new Random(54321); // Fixed seed for reproducibility
            var trades = new List<Trade>(10); // Pre-allocate capacity

            // Generate 10 random trades over the past 30 days
            for (int i = 0; i < 10; i++)
            {
                var tradeType = random.Next(2) == 0 ? TradeType.Buy : TradeType.Sell;
                var daysAgo = random.Next(0, 30);
                var hoursAgo = random.Next(0, 24);
                
                trades.Add(new Trade
                {
                    BrokerId = brokerIds[random.Next(brokerIds.Count)],
                    ShareholderId = shareholderIds[random.Next(shareholderIds.Count)],
                    CompanyId = companyIds[random.Next(companyIds.Count)],
                    Timestamp = DateTime.UtcNow.AddDays(-daysAgo).AddHours(-hoursAgo),
                    Quantity = random.Next(10, 1000),
                    UnitPrice = Math.Round(random.Next(50, 500) + (decimal)random.NextDouble(), 2),
                    Type = tradeType
                });
            }

            // Sort by timestamp for logical order
            trades = trades.OrderBy(t => t.Timestamp).ToList();

            context.Trades.AddRange(trades);
            await context.SaveChangesAsync();
            Console.WriteLine($"✓ Seeded {trades.Count} trades");
        }
        
    }
}