
// File: Data/AppDbContext.cs

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ShareSphere.Api.Models;

namespace ShareSphere.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // DbSets for your models
        public DbSet<StockExchange> StockExchanges { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Shareholder> Shareholders { get; set; }
        public DbSet<Broker> Brokers { get; set; }
        public DbSet<Share> Shares { get; set; }
        public DbSet<Trade> Trades { get; set; }
        public DbSet<Portfolio> Portfolios { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            // Configure Portfolio with ONLY the relationships we want
            builder.Entity<Portfolio>(entity =>
            {
                entity.HasKey(p => p.PortfolioId);

                entity.HasOne(p => p.Shareholder)
                    .WithMany(s => s.Portfolios)
                    .HasForeignKey(p => p.ShareholderId);

                entity.HasOne(p => p.Share)
                    .WithMany() // No reverse navigation!
                    .HasForeignKey(p => p.ShareId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
