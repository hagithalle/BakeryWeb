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
        public DbSet<LaborSettings> LaborSettings { get; set; }
        public DbSet<OverheadItem> OverheadItems { get; set; }
        public DbSet<Recipe> Recipes { get; set; }
        public DbSet<RecipeStep> RecipeSteps { get; set; }
        public DbSet<RecipeIngredient> RecipeIngredients { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<PackageItem> PackageItems { get; set; }
        public DbSet<ProductAdditionalPackaging> ProductAdditionalPackagings { get; set; }

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
                .HasConversion<int>();

            modelBuilder.Entity<Ingredient>()
                .Property(i => i.StockUnit)
                .HasConversion<int>();

            // Recipe configuration
            modelBuilder.Entity<Recipe>()
                .HasKey(r => r.Id);

            modelBuilder.Entity<Recipe>()
                .Property(r => r.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<RecipeStep>()
                .HasKey(rs => rs.Id);

            modelBuilder.Entity<RecipeStep>()
                .HasOne(rs => rs.Recipe)
                .WithMany(r => r.Steps)
                .HasForeignKey(rs => rs.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RecipeIngredient>()
                .HasKey(ri => ri.Id);

            modelBuilder.Entity<RecipeIngredient>()
                .HasOne(ri => ri.Recipe)
                .WithMany(r => r.Ingredients)
                .HasForeignKey(ri => ri.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RecipeIngredient>()
                .HasOne(ri => ri.Ingredient)
                .WithMany()
                .HasForeignKey(ri => ri.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Product configuration
            modelBuilder.Entity<Product>()
                .HasKey(p => p.Id);

            modelBuilder.Entity<Product>()
                .Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder.Entity<Product>()
                .Property(p => p.ProductType)
                .HasConversion<int>();

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Recipe)
                .WithMany()
                .HasForeignKey(p => p.RecipeId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Packaging)
                .WithMany()
                .HasForeignKey(p => p.PackagingId)
                .OnDelete(DeleteBehavior.SetNull);

            // PackageItem configuration
            modelBuilder.Entity<PackageItem>()
                .HasKey(pi => pi.Id);

            modelBuilder.Entity<PackageItem>()
                .HasOne(pi => pi.Product)
                .WithMany(p => p.PackageItems)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PackageItem>()
                .HasOne(pi => pi.Recipe)
                .WithMany()
                .HasForeignKey(pi => pi.RecipeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ProductAdditionalPackaging configuration
            modelBuilder.Entity<ProductAdditionalPackaging>()
                .HasKey(pap => pap.Id);

            modelBuilder.Entity<ProductAdditionalPackaging>()
                .HasOne(pap => pap.Product)
                .WithMany(p => p.AdditionalPackaging)
                .HasForeignKey(pap => pap.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductAdditionalPackaging>()
                .HasOne(pap => pap.Packaging)
                .WithMany()
                .HasForeignKey(pap => pap.PackagingId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
