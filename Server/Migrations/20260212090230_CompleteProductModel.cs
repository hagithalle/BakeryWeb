using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class CompleteProductModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Recipes_RecipeId",
                table: "Products");

            migrationBuilder.AddColumn<int>(
                name: "BakeTime",
                table: "Recipes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Recipes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Recipes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrepTime",
                table: "Recipes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecipeType",
                table: "Recipes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Temperature",
                table: "Recipes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Unit",
                table: "RecipeIngredients",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "RecipeId",
                table: "Products",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

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

            // ProductType already exists in the database, skip adding it
            
            migrationBuilder.AddColumn<decimal>(
                name: "ProfitMarginPercent",
                table: "Products",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RecipeUnitsQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Rename old Unit column
            migrationBuilder.RenameColumn(
                name: "Unit",
                table: "Ingredients",
                newName: "Unit_old");

            // Add new Unit column as integer
            migrationBuilder.AddColumn<int>(
                name: "Unit",
                table: "Ingredients",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Drop the old column
            migrationBuilder.DropColumn(
                name: "Unit_old",
                table: "Ingredients");

            migrationBuilder.AddColumn<int>(
                name: "StockUnit",
                table: "Ingredients",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "PackageItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    ItemProductId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageItems_Products_ItemProductId",
                        column: x => x.ItemProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PackageItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductAdditionalPackagings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    PackagingId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductAdditionalPackagings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductAdditionalPackagings_Packagings_PackagingId",
                        column: x => x.PackagingId,
                        principalTable: "Packagings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductAdditionalPackagings_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_PackagingId",
                table: "Products",
                column: "PackagingId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageItems_ItemProductId",
                table: "PackageItems",
                column: "ItemProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageItems_ProductId",
                table: "PackageItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAdditionalPackagings_PackagingId",
                table: "ProductAdditionalPackagings",
                column: "PackagingId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAdditionalPackagings_ProductId",
                table: "ProductAdditionalPackagings",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Packagings_PackagingId",
                table: "Products",
                column: "PackagingId",
                principalTable: "Packagings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Recipes_RecipeId",
                table: "Products",
                column: "RecipeId",
                principalTable: "Recipes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Packagings_PackagingId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Recipes_RecipeId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "PackageItems");

            migrationBuilder.DropTable(
                name: "ProductAdditionalPackagings");

            migrationBuilder.DropIndex(
                name: "IX_Products_PackagingId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BakeTime",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "PrepTime",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "RecipeType",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Temperature",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "RecipeIngredients");

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
                name: "PackagingId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackagingTimeMinutes",
                table: "Products");

            // ProductType already exists, don't try to drop it
            
            migrationBuilder.DropColumn(
                name: "ProfitMarginPercent",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RecipeUnitsQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StockUnit",
                table: "Ingredients");

            migrationBuilder.AlterColumn<int>(
                name: "RecipeId",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.RenameColumn(
                name: "Unit",
                table: "Ingredients",
                newName: "Unit_old");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "Ingredients",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.DropColumn(
                name: "Unit_old",
                table: "Ingredients");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Recipes_RecipeId",
                table: "Products",
                column: "RecipeId",
                principalTable: "Recipes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
