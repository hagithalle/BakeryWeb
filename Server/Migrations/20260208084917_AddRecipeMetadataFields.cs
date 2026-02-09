using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeMetadataFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop columns from Packagings if they exist
            migrationBuilder.Sql(@"
                ALTER TABLE ""Packagings"" DROP COLUMN IF EXISTS ""DateCreated"";
                ALTER TABLE ""Packagings"" DROP COLUMN IF EXISTS ""DateUpdated"";
                ALTER TABLE ""Packagings"" DROP COLUMN IF EXISTS ""IsActive"";
            ");

            // Drop columns from Ingredients if they exist
            migrationBuilder.Sql(@"
                ALTER TABLE ""Ingredients"" DROP COLUMN IF EXISTS ""DateCreated"";
                ALTER TABLE ""Ingredients"" DROP COLUMN IF EXISTS ""DateUpdated"";
                ALTER TABLE ""Ingredients"" DROP COLUMN IF EXISTS ""IsActive"";
            ");

            // Add recipe metadata columns if they don't exist
            migrationBuilder.Sql(@"
                ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""BakeTime"" integer NULL;
                ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Category"" text NULL;
                ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Description"" text NULL;
                ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""PrepTime"" integer NULL;
                ALTER TABLE ""Recipes"" ADD COLUMN IF NOT EXISTS ""Temperature"" integer NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop recipe metadata columns if they exist
            migrationBuilder.Sql(@"
                ALTER TABLE ""Recipes"" DROP COLUMN IF EXISTS ""BakeTime"";
                ALTER TABLE ""Recipes"" DROP COLUMN IF EXISTS ""Category"";
                ALTER TABLE ""Recipes"" DROP COLUMN IF EXISTS ""Description"";
                ALTER TABLE ""Recipes"" DROP COLUMN IF EXISTS ""PrepTime"";
                ALTER TABLE ""Recipes"" DROP COLUMN IF EXISTS ""Temperature"";
            ");

            // Restore columns in Packagings (note: data will be lost)
            migrationBuilder.Sql(@"
                ALTER TABLE ""Packagings"" ADD COLUMN IF NOT EXISTS ""DateCreated"" timestamp with time zone NOT NULL DEFAULT (now());
                ALTER TABLE ""Packagings"" ADD COLUMN IF NOT EXISTS ""DateUpdated"" timestamp with time zone NOT NULL DEFAULT (now());
                ALTER TABLE ""Packagings"" ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT false;
            ");

            // Restore columns in Ingredients (note: data will be lost)
            migrationBuilder.Sql(@"
                ALTER TABLE ""Ingredients"" ADD COLUMN IF NOT EXISTS ""DateCreated"" timestamp with time zone NOT NULL DEFAULT (now());
                ALTER TABLE ""Ingredients"" ADD COLUMN IF NOT EXISTS ""DateUpdated"" timestamp with time zone NOT NULL DEFAULT (now());
                ALTER TABLE ""Ingredients"" ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT false;
            ");
        }
    }
}
