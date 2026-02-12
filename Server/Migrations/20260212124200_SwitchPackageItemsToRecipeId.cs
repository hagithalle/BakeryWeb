using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class SwitchPackageItemsToRecipeId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PackageItems_Products_ItemProductId",
                table: "PackageItems");

            migrationBuilder.RenameColumn(
                name: "ItemProductId",
                table: "PackageItems",
                newName: "RecipeId");

            migrationBuilder.RenameIndex(
                name: "IX_PackageItems_ItemProductId",
                table: "PackageItems",
                newName: "IX_PackageItems_RecipeId");

            migrationBuilder.AddForeignKey(
                name: "FK_PackageItems_Recipes_RecipeId",
                table: "PackageItems",
                column: "RecipeId",
                principalTable: "Recipes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PackageItems_Recipes_RecipeId",
                table: "PackageItems");

            migrationBuilder.RenameColumn(
                name: "RecipeId",
                table: "PackageItems",
                newName: "ItemProductId");

            migrationBuilder.RenameIndex(
                name: "IX_PackageItems_RecipeId",
                table: "PackageItems",
                newName: "IX_PackageItems_ItemProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_PackageItems_Products_ItemProductId",
                table: "PackageItems",
                column: "ItemProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
