using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations
{
    /// <summary>
    /// Phase A2 (pricing and VAT). Additive and schema-only:
    /// - Products.PricingMode: nullable; existing products keep NULL, which means "legacy price, not confirmed"
    ///   and keeps their previous pricing behaviour. Nothing is backfilled.
    /// - BusinessSettings: one row per user (VAT status, default markup), created only when a user saves settings.
    /// No INSERT, UPDATE or DELETE; existing rows (including every stored price) are untouched.
    /// </summary>
    public partial class AddBusinessSettingsAndPricingMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PricingMode",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BusinessSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VatStatus = table.Column<int>(type: "integer", nullable: true),
                    DefaultMarkupPercent = table.Column<decimal>(type: "numeric", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessSettings_UserId",
                table: "BusinessSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverting would delete every user's VAT status and every confirmed pricing mode (turning confirmed
            // prices back into unconfirmed legacy prices). Restore from a backup instead.
            throw new NotSupportedException(
                "AddBusinessSettingsAndPricingMode cannot be reverted automatically because it would delete pricing settings.");
        }
    }
}
