using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class ConvertUnitToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert Unit from string to integer enum
            // Set default value of 1 (Kilogram) for existing records
            migrationBuilder.Sql(@"
                ALTER TABLE ""Ingredients"" 
                ALTER COLUMN ""Unit"" TYPE integer 
                USING CASE 
                    WHEN ""Unit"" ~* 'kg|kilogram|קילו' THEN 1
                    WHEN ""Unit"" ~* 'g|gram|גרם' THEN 2
                    WHEN ""Unit"" ~* 'l|liter|ליטר' THEN 3
                    WHEN ""Unit"" ~* 'ml|milliliter|מיליליטר' THEN 4
                    WHEN ""Unit"" ~* 'unit|יחידה|pieces' THEN 5
                    WHEN ""Unit"" ~* 'dozen|תריסר' THEN 6
                    WHEN ""Unit"" ~* 'package|חבילה' THEN 7
                    WHEN ""Unit"" ~* 'teaspoon|כפית' THEN 8
                    WHEN ""Unit"" ~* 'tablespoon|כף' THEN 9
                    WHEN ""Unit"" ~* 'cup|כוס' THEN 10
                    ELSE 1
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "Ingredients",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
