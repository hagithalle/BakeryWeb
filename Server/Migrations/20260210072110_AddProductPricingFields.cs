using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddProductPricingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ManualSellingPrice",
                table: "Products",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfitMarginPercent",
                table: "Products",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ManualSellingPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ProfitMarginPercent",
                table: "Products");
        }
    }
}
