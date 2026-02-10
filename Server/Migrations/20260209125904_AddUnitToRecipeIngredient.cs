using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitToRecipeIngredient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Unit",
                table: "RecipeIngredients",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PackagingId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PackagingTimeMinutes",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecipeUnitsQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Products_PackagingId",
                table: "Products",
                column: "PackagingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Packagings_PackagingId",
                table: "Products",
                column: "PackagingId",
                principalTable: "Packagings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Packagings_PackagingId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_PackagingId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "RecipeIngredients");

            migrationBuilder.DropColumn(
                name: "PackagingId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackagingTimeMinutes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RecipeUnitsQuantity",
                table: "Products");
        }
    }
}
