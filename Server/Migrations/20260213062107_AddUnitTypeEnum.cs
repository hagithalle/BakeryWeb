using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitTypeEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OutputUnitName",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "SaleUnitName",
                table: "Products");

            migrationBuilder.AddColumn<int>(
                name: "OutputUnitType",
                table: "Recipes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SaleUnitType",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OutputUnitType",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "SaleUnitType",
                table: "Products");

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
    }
}
