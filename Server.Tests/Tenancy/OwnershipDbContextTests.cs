using Microsoft.EntityFrameworkCore;
using Server.Auth;
using Server.Data;
using Server.Models;

namespace Server.Tests.Tenancy
{
    /// <summary>
    /// Unit tests of BakeryDbContext's tenant rules: per-user query filters and ownership enforcement on save.
    /// </summary>
    public class OwnershipDbContextTests
    {
        private sealed class FixedUser : ICurrentUser
        {
            public FixedUser(int? userId) => UserId = userId;
            public int? UserId { get; }
            public bool IsUnscoped => false;
        }

        private const int UserA = 10;
        private const int UserB = 20;

        private readonly string _db = Guid.NewGuid().ToString();

        private BakeryDbContext As(int? userId) => new(Options(), new FixedUser(userId));
        private BakeryDbContext Unscoped() => new(Options(), UnscopedCurrentUser.Instance);
        private DbContextOptions<BakeryDbContext> Options() =>
            new DbContextOptionsBuilder<BakeryDbContext>().UseInMemoryDatabase(_db).Options;

        private async Task<(int aIngredient, int bIngredient, int ownerlessIngredient, int aRecipe, int bRecipe)> SeedAsync()
        {
            await using var db = Unscoped();
            var aIng = new Ingredient { Name = "A flour", UserId = UserA };
            var bIng = new Ingredient { Name = "B flour", UserId = UserB };
            var noIng = new Ingredient { Name = "Ownerless flour", UserId = null };
            db.Ingredients.AddRange(aIng, bIng, noIng);
            await db.SaveChangesAsync();

            var aRecipe = new Recipe { Name = "A cake", UserId = UserA, Steps = { new RecipeStep { Order = 1, Description = "A step" } } };
            aRecipe.Ingredients.Add(new RecipeIngredient { IngredientId = aIng.Id, Quantity = 1, Unit = 1 });
            var bRecipe = new Recipe { Name = "B cake", UserId = UserB, Steps = { new RecipeStep { Order = 1, Description = "B step" } } };
            bRecipe.Ingredients.Add(new RecipeIngredient { IngredientId = bIng.Id, Quantity = 1, Unit = 1 });
            db.Recipes.AddRange(aRecipe, bRecipe, new Recipe { Name = "Ownerless cake", UserId = null });
            db.LaborSettings.AddRange(new LaborSettings { UserId = UserA, DesiredMonthlySalary = 1 }, new LaborSettings { UserId = null, DesiredMonthlySalary = 99999 });
            await db.SaveChangesAsync();
            return (aIng.Id, bIng.Id, noIng.Id, aRecipe.Id, bRecipe.Id);
        }

        [Fact]
        public async Task Queries_OnlyReturnTheCurrentUsersRows()
        {
            await SeedAsync();

            await using var asA = As(UserA);
            Assert.Equal(new[] { "A flour" }, await asA.Ingredients.Select(i => i.Name).ToListAsync());
            Assert.Equal(new[] { "A cake" }, await asA.Recipes.Select(r => r.Name).ToListAsync());
            Assert.All(await asA.LaborSettings.ToListAsync(), s => Assert.Equal(UserA, s.UserId));

            await using var asB = As(UserB);
            Assert.Equal(new[] { "B flour" }, await asB.Ingredients.Select(i => i.Name).ToListAsync());
            Assert.Empty(await asB.LaborSettings.ToListAsync());
        }

        [Fact]
        public async Task ChildRows_AreFilteredThroughTheirParent()
        {
            await SeedAsync();

            await using var asA = As(UserA);
            Assert.Equal(new[] { "A step" }, await asA.RecipeSteps.Select(s => s.Description).ToListAsync());
            Assert.Single(await asA.RecipeIngredients.ToListAsync());
        }

        [Fact]
        public async Task OwnerlessRows_AreHiddenFromEveryUser_ButStillExist()
        {
            var ids = await SeedAsync();

            await using var asA = As(UserA);
            Assert.Null(await asA.Ingredients.FirstOrDefaultAsync(i => i.Id == ids.ownerlessIngredient));
            Assert.DoesNotContain(await asA.Recipes.ToListAsync(), r => r.Name == "Ownerless cake");

            await using var unscoped = Unscoped();
            Assert.NotNull(await unscoped.Ingredients.FirstOrDefaultAsync(i => i.Id == ids.ownerlessIngredient));
        }

        [Fact]
        public async Task ContextWithoutUser_SeesNothing()
        {
            await SeedAsync();

            await using var anonymous = As(null);
            Assert.Empty(await anonymous.Ingredients.ToListAsync());
            Assert.Empty(await anonymous.Recipes.ToListAsync());
            Assert.Empty(await anonymous.RecipeIngredients.ToListAsync());
            Assert.Empty(await anonymous.LaborSettings.ToListAsync());
        }

        [Fact]
        public async Task NewRows_AreStampedWithTheCurrentUser_EvenIfAnotherOwnerWasSupplied()
        {
            await using (var asA = As(UserA))
            {
                asA.Ingredients.Add(new Ingredient { Name = "Spoofed", UserId = UserB });
                await asA.SaveChangesAsync();
            }

            await using var unscoped = Unscoped();
            Assert.Equal(UserA, (await unscoped.Ingredients.SingleAsync(i => i.Name == "Spoofed")).UserId);
        }

        [Fact]
        public async Task NewRows_WithoutAUser_AreRefused()
        {
            await using var anonymous = As(null);
            anonymous.Ingredients.Add(new Ingredient { Name = "Orphan" });

            await Assert.ThrowsAsync<OwnershipViolationException>(() => anonymous.SaveChangesAsync());

            await using var unscoped = Unscoped();
            Assert.Empty(await unscoped.Ingredients.ToListAsync());
        }

        [Fact]
        public async Task Owner_CannotBeChanged()
        {
            var ids = await SeedAsync();
            await using var asA = As(UserA);
            var mine = await asA.Ingredients.SingleAsync(i => i.Id == ids.aIngredient);

            mine.UserId = UserB;

            await Assert.ThrowsAsync<OwnershipViolationException>(() => asA.SaveChangesAsync());
            await using var unscoped = Unscoped();
            Assert.Equal(UserA, (await unscoped.Ingredients.SingleAsync(i => i.Id == ids.aIngredient)).UserId);
        }

        [Fact]
        public async Task OtherUsersRow_AttachedAndModified_IsRefused()
        {
            var ids = await SeedAsync();
            await using var bySource = Unscoped();
            var bRow = await bySource.Ingredients.AsNoTracking().SingleAsync(i => i.Id == ids.bIngredient);

            await using var asA = As(UserA);
            asA.Ingredients.Attach(bRow);
            bRow.Name = "Hijacked";

            await Assert.ThrowsAsync<OwnershipViolationException>(() => asA.SaveChangesAsync());
            await using var unscoped = Unscoped();
            Assert.Equal("B flour", (await unscoped.Ingredients.SingleAsync(i => i.Id == ids.bIngredient)).Name);
        }

        [Fact]
        public async Task OtherUsersRow_AttachedAndDeleted_IsRefused()
        {
            var ids = await SeedAsync();
            await using var asA = As(UserA);
            asA.Ingredients.Remove(new Ingredient { Id = ids.bIngredient, Name = "B flour", UserId = UserB });

            await Assert.ThrowsAsync<OwnershipViolationException>(() => asA.SaveChangesAsync());
            await using var unscoped = Unscoped();
            Assert.NotNull(await unscoped.Ingredients.FirstOrDefaultAsync(i => i.Id == ids.bIngredient));
        }

        [Fact]
        public async Task OwnerlessRow_CannotBeModifiedOrClaimed()
        {
            var ids = await SeedAsync();
            await using var asA = As(UserA);
            var ownerless = new Ingredient { Id = ids.ownerlessIngredient, Name = "Ownerless flour", UserId = null };
            asA.Ingredients.Attach(ownerless);
            ownerless.UserId = UserA;

            await Assert.ThrowsAsync<OwnershipViolationException>(() => asA.SaveChangesAsync());
            await using var unscoped = Unscoped();
            Assert.Null((await unscoped.Ingredients.SingleAsync(i => i.Id == ids.ownerlessIngredient)).UserId);
        }

        [Fact]
        public async Task OwnRows_CanBeUpdatedAndDeleted()
        {
            var ids = await SeedAsync();
            await using (var asA = As(UserA))
            {
                (await asA.Ingredients.SingleAsync(i => i.Id == ids.aIngredient)).Name = "A flour (renamed)";
                await asA.SaveChangesAsync();
            }
            await using (var asA = As(UserA))
            {
                var recipe = await asA.Recipes.Include(r => r.Ingredients).Include(r => r.Steps).SingleAsync(r => r.Id == ids.aRecipe);
                asA.Recipes.Remove(recipe);
                await asA.SaveChangesAsync();
            }

            await using var unscoped = Unscoped();
            Assert.Equal("A flour (renamed)", (await unscoped.Ingredients.SingleAsync(i => i.Id == ids.aIngredient)).Name);
            Assert.Null(await unscoped.Recipes.FirstOrDefaultAsync(r => r.Id == ids.aRecipe));
        }

        [Fact]
        public async Task ReferenceToAnotherUsersIngredient_IsNotReturnedWhenReadingOwnRecipe()
        {
            // P2 behaviour: such a reference can still be stored (explicit 400 validation is planned for P3),
            // but reading it never exposes the other user's ingredient.
            var ids = await SeedAsync();
            await using (var unscoped = Unscoped())
            {
                unscoped.RecipeIngredients.Add(new RecipeIngredient { RecipeId = ids.aRecipe, IngredientId = ids.bIngredient, Quantity = 1, Unit = 1 });
                await unscoped.SaveChangesAsync();
            }

            await using var asA = As(UserA);
            var recipe = await asA.Recipes.Include(r => r.Ingredients).ThenInclude(ri => ri.Ingredient).SingleAsync(r => r.Id == ids.aRecipe);

            Assert.DoesNotContain(recipe.Ingredients, ri => ri.Ingredient?.Name == "B flour");
        }
    }
}
