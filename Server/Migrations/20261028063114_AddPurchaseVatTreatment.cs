using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <summary>
    /// Phase A3 (VAT on purchases). Additive and schema-only: two nullable columns on Ingredients, Packagings and
    /// OverheadItems. Existing rows keep NULL, meaning "not reviewed": their prices are used exactly as entered.
    /// No INSERT, UPDATE or DELETE; every stored price is untouched.
    /// </summary>
    public partial class AddPurchaseVatTreatment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "InputVatDeductible",
                table: "Packagings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PurchaseVatTreatment",
                table: "Packagings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "InputVatDeductible",
                table: "OverheadItems",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PurchaseVatTreatment",
                table: "OverheadItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "InputVatDeductible",
                table: "Ingredients",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PurchaseVatTreatment",
                table: "Ingredients",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverting would delete every reviewed VAT treatment (turning reviewed purchases back into unknown ones).
            // Restore from a backup instead.
            throw new NotSupportedException(
                "AddPurchaseVatTreatment cannot be reverted automatically because it would delete reviewed VAT information.");
        }
    }
}
