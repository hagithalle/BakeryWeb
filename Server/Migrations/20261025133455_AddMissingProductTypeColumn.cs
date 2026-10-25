using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <summary>
    /// Reconciles databases built from migrations with the current model: no earlier migration creates
    /// Products.ProductType, although the model (and its snapshot) has it. The column used to be added by raw SQL
    /// at application startup, so existing databases (local, production) already have it - with exactly the
    /// definition used here - while a fresh database built from migrations alone did not.
    ///
    /// Schema-only and idempotent: a no-op where the column exists; never changes existing rows.
    /// The snapshot is intentionally unchanged (EF already models the column), so EF generated an empty migration.
    /// </summary>
    public partial class AddMissingProductTypeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Same definition as the former startup SQL and the existing databases: 0 = ProductType.Single.
            migrationBuilder.Sql("""
                ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "ProductType" integer NOT NULL DEFAULT 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Dropping the column would lose every product's type (single vs. package) on databases that had it
            // long before this migration. Restore from a backup instead.
            throw new NotSupportedException(
                "AddMissingProductTypeColumn cannot be reverted automatically because it would delete product data.");
        }
    }
}
