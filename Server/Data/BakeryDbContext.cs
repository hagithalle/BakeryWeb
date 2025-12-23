using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class BakeryDbContext : DbContext
    {
        public BakeryDbContext(DbContextOptions<BakeryDbContext> options) : base(options)
        {
        }

        public DbSet<Ingredient> Ingredients { get; set; }
        public DbSet<Packaging> Packagings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Ingredient table
            modelBuilder.Entity<Ingredient>()
                .HasKey(i => i.Id);

            modelBuilder.Entity<Ingredient>()
                .Property(i => i.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Ingredient>()
                .Property(i => i.Unit)
                .HasMaxLength(50);
        }
    }
}
