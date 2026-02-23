using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class OverheadTypeEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
                        migrationBuilder.Sql(@"
ALTER TABLE ""OverheadItems"" ALTER COLUMN ""Type"" DROP DEFAULT;
ALTER TABLE ""OverheadItems"" ALTER COLUMN ""Type"" TYPE integer USING 
    CASE 
        WHEN ""Type"" = 'עקיפה' THEN 0
        WHEN ""Type"" = 'קבועה' THEN 1
        ELSE 0
    END;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "OverheadItems",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
