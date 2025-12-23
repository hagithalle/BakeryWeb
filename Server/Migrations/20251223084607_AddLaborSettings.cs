using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLaborSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LaborSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DesiredMonthlySalary = table.Column<decimal>(type: "numeric", nullable: false),
                    PensionPercent = table.Column<decimal>(type: "numeric", nullable: false),
                    KerenHishtalmutPercent = table.Column<decimal>(type: "numeric", nullable: false),
                    OtherEmployerCostsPercent = table.Column<decimal>(type: "numeric", nullable: false),
                    WorkingDaysPerMonth = table.Column<int>(type: "integer", nullable: false),
                    WorkingHoursPerDay = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaborSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LaborSettings");
        }
    }
}
