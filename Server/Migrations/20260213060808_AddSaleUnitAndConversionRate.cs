using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSaleUnitAndConversionRate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RecipeUnitsQuantity",
                table: "Products",
                newName: "UnitConversionRate");

            migrationBuilder.AddColumn<string>(
                name: "OutputUnitName",
                table: "Recipes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SaleUnitName",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OutputUnitName",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "SaleUnitName",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "UnitConversionRate",
                table: "Products",
                newName: "RecipeUnitsQuantity");
        }
    }
}
