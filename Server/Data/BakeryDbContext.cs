using Microsoft.EntityFrameworkCore;
using Server.Auth;
using Server.Models;

namespace Server.Data
{
    /// <summary>Thrown when code tries to create, change or delete data it does not own.</summary>
    public sealed class OwnershipViolationException : InvalidOperationException
    {
        public OwnershipViolationException(string message) : base(message) { }
    }

    public class BakeryDbContext : DbContext
    {
        private readonly ICurrentUser _currentUser;

        public BakeryDbContext(DbContextOptions<BakeryDbContext> options, ICurrentUser currentUser) : base(options)
        {
            _currentUser = currentUser;
        }

        // Read by the query filters on every query (EF parameterizes these per context instance).
        private int? CurrentUserId => _currentUser.UserId;
        private bool IsUnscopedContext => _currentUser.IsUnscoped;

        public DbSet<User> Users { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }
        public DbSet<Packaging> Packagings { get; set; }
        public DbSet<LaborSettings> LaborSettings { get; set; }
        public DbSet<OverheadItem> OverheadItems { get; set; }
        public DbSet<Recipe> Recipes { get; set; }
        public DbSet<RecipeStep> RecipeSteps { get; set; }
        public DbSet<RecipeIngredient> RecipeIngredients { get; set; }
        public DbSet<RecipeItem> RecipeItems { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<PackageItem> PackageItems { get; set; }
        public DbSet<ProductAdditionalPackaging> ProductAdditionalPackagings { get; set; }
        public DbSet<BusinessSettings> BusinessSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Users: internal accounts. Credentials live in Clerk; ClerkId links the two.
            modelBuilder.Entity<User>(user =>
            {
                user.HasKey(u => u.Id);
                user.Property(u => u.Email).IsRequired();
                user.Property(u => u.PasswordHash).IsRequired(); // legacy, unused for Clerk accounts
                user.Property(u => u.Name).IsRequired().HasDefaultValue(string.Empty);
                user.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
                user.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");
                user.HasIndex(u => u.ClerkId).IsUnique().HasDatabaseName("IX_Users_ClerkId")
                    .HasFilter("\"ClerkId\" IS NOT NULL");
            });

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

            // RecipeItem configuration (Recipe Composition)
            modelBuilder.Entity<RecipeItem>()
                .HasKey(ri => ri.Id);

            modelBuilder.Entity<RecipeItem>()
                .HasOne(ri => ri.ComposingRecipe)
                .WithMany(r => r.BaseRecipes)
                .HasForeignKey(ri => ri.ComposingRecipeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RecipeItem>()
                .HasOne(ri => ri.BaseRecipe)
                .WithMany()
                .HasForeignKey(ri => ri.BaseRecipeId)
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

            // null = legacy product whose stored price has not been confirmed (never backfilled)
            modelBuilder.Entity<Product>()
                .Property(p => p.PricingMode)
                .HasConversion<int?>();

            // One settings row per user; VatStatus stays empty until the user chooses it
            modelBuilder.Entity<BusinessSettings>(settings =>
            {
                settings.HasKey(b => b.Id);
                settings.Property(b => b.UserId).IsRequired();
                settings.Property(b => b.VatStatus).HasConversion<int?>();
                settings.HasIndex(b => b.UserId).IsUnique().HasDatabaseName("IX_BusinessSettings_UserId");
                settings.HasOne<User>().WithMany().HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.Restrict);
            });

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

            // Ensure OverheadItem.Type is stored as int (not string)
            modelBuilder.Entity<OverheadItem>()
                .Property(o => o.Type)
                .HasConversion<int>();

            ConfigureTenantFilters(modelBuilder);
        }

        /// <summary>
        /// Every query only sees the current user's rows. Rows without an owner (legacy data) match nobody,
        /// so they stay in the database but are hidden until they are explicitly assigned.
        /// Child rows are filtered through their owning parent as a second line of defence.
        /// </summary>
        private void ConfigureTenantFilters(ModelBuilder modelBuilder)
        {
            ApplyOwnerFilter<Ingredient>(modelBuilder);
            ApplyOwnerFilter<Packaging>(modelBuilder);
            ApplyOwnerFilter<OverheadItem>(modelBuilder);
            ApplyOwnerFilter<LaborSettings>(modelBuilder);
            ApplyOwnerFilter<Recipe>(modelBuilder);
            ApplyOwnerFilter<Product>(modelBuilder);
            ApplyOwnerFilter<BusinessSettings>(modelBuilder);

            modelBuilder.Entity<RecipeIngredient>().HasQueryFilter(x =>
                IsUnscopedContext || (x.Recipe!.UserId != null && x.Recipe.UserId == CurrentUserId));
            modelBuilder.Entity<RecipeStep>().HasQueryFilter(x =>
                IsUnscopedContext || (x.Recipe!.UserId != null && x.Recipe.UserId == CurrentUserId));
            modelBuilder.Entity<RecipeItem>().HasQueryFilter(x =>
                IsUnscopedContext || (x.ComposingRecipe!.UserId != null && x.ComposingRecipe.UserId == CurrentUserId));
            modelBuilder.Entity<PackageItem>().HasQueryFilter(x =>
                IsUnscopedContext || (x.Product!.UserId != null && x.Product.UserId == CurrentUserId));
            modelBuilder.Entity<ProductAdditionalPackaging>().HasQueryFilter(x =>
                IsUnscopedContext || (x.Product!.UserId != null && x.Product.UserId == CurrentUserId));
        }

        // "UserId != null" matters: without it, a context with no current user would match ownerless rows.
        private void ApplyOwnerFilter<T>(ModelBuilder modelBuilder) where T : class, IOwnedEntity =>
            modelBuilder.Entity<T>().HasQueryFilter(e =>
                IsUnscopedContext || (e.UserId != null && e.UserId == CurrentUserId));

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            EnforceOwnership();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            EnforceOwnership();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        /// <summary>
        /// New owned rows always belong to the current user (any client-supplied UserId is overwritten);
        /// existing rows can only be changed or deleted by their owner, and their owner can never change.
        /// </summary>
        private void EnforceOwnership()
        {
            if (IsUnscopedContext) return;

            foreach (var entry in ChangeTracker.Entries<IOwnedEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.UserId = CurrentUserId
                            ?? throw new OwnershipViolationException("Owned data can only be created by an authenticated user.");
                        break;

                    case EntityState.Modified:
                    case EntityState.Deleted:
                        var owner = entry.Property(nameof(IOwnedEntity.UserId));
                        var originalOwner = (int?)owner.OriginalValue;
                        if (originalOwner == null || CurrentUserId == null || originalOwner != CurrentUserId)
                            throw new OwnershipViolationException("Only the owner can change or delete this record.");
                        if (entry.State == EntityState.Modified)
                        {
                            if (!Equals(owner.CurrentValue, owner.OriginalValue))
                                throw new OwnershipViolationException("The owner of a record cannot be changed.");
                            owner.IsModified = false;
                        }
                        break;
                }
            }
        }
    }
}
