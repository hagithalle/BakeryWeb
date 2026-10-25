# Database migrations

The server **no longer changes the database schema at startup**. Until `feat/clerk-only-auth`, `Program.cs` ran raw
`ALTER TABLE` / `CREATE TABLE` SQL, marked migrations as applied without running them, called `MigrateAsync()` and
swallowed any error. Every deploy could silently change production. Now:

- The schema changes only through EF Core migrations in `Server/Migrations`.
- At startup the server only **reports** pending migrations (`WARNING: N pending database migration(s)`).
- Migrations are applied explicitly, using the procedures below, after review.

## Tooling

- `dotnet-ef` (installed globally, version 10.x).
- `Server/Data/BakeryDbContextDesignTimeFactory.cs` lets the tools run without starting the app. It uses the
  connection string in the `EF_CONNECTION` environment variable, or falls back to `appsettings.json`
  (the local development database). **Production is never the default.**

Generating a migration or script does not connect to any database:

```bash
cd Server
EF_CONNECTION="Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none" \
  dotnet ef migrations add <Name>
```

## Migration `AddUsersAndOwnership` (feat/clerk-only-auth)

Brings objects that used to be created by the startup SQL under migrations:

- `Users` table (with `ClerkId`), unique indexes `IX_Users_Email` and `IX_Users_ClerkId` (filtered, non-null).
- Nullable `UserId` column on `Ingredients`, `Packagings`, `OverheadItems`, `LaborSettings`, `Recipes`, `Products`.
- Renames the startup-SQL constraint `Users_pkey` to `PK_Users` and replaces `Users_Email_key` with `IX_Users_Email`
  (same uniqueness rule).

Every statement is idempotent (`IF NOT EXISTS` or guarded), so it works on a fresh database **and** on databases the
startup SQL already modified. It is **schema-only**: no `INSERT`, `UPDATE` or `DELETE` on any table except EF's own
`__EFMigrationsHistory` row. `Down()` deliberately throws: reverting would delete accounts and ownership links, so
restore from a backup instead.

## Invalid unit values (not fixed by any migration)

`UnitOfMeasure` has always started at `Kilogram = 1`; **0 has never been a valid unit**. It appears because:

- `CompleteProductModel` (2026-02-12) added `RecipeIngredients.Unit`, `Ingredients.Unit` and `Ingredients.StockUnit`
  with `defaultValue: 0`.
- Before 2026-02-10 the recipe form showed a unit picker but the server had no field to store it, so the unit the user
  picked was lost. **The original unit of those rows cannot be recovered**; converting them all to grams would be a guess.
- Requests that omit the unit bind to 0 (C# `int` default).

The old startup code rewrote `RecipeIngredients.Unit` 0 to 2 (gram) on every start. That has been removed and is not
replaced by a migration. Instead:

- **Prevention:** recipe create/update now rejects units outside `UnitOfMeasure` with HTTP 400
  (`Server/Validation/RecipeUnitValidator.cs`), for ingredient lines and sub-recipe lines. The recipes page no longer
  turns 0 into gram when saving; it asks the user to pick a unit.
- **Inspection:** `docs/sql/report-invalid-units.sql` (SELECT-only) lists every invalid value, with the ingredient's own
  unit as a suggestion.
- **Repair:** a later, reviewed data fix decided row by row (planned with the costing work). Until then, note that the
  cost calculator treats an unknown unit as a quantity in kilograms.

Verified locally on temporary databases (dropped afterwards):

| Scenario | Result |
|---|---|
| Fresh empty database, all migrations via `dotnet ef database update` | All applied; second run is a no-op |
| Copy of the local dev database (startup-SQL schema) via `dotnet ef database update` | Applied; row counts unchanged |
| Copy of the local dev database via the reviewed idempotent SQL script | Applied; second run is a no-op |

The fresh and upgraded databases end with the same `Users` indexes and the same `UserId` columns.

## Known issues to resolve before applying to production

1. **Production migration history is unknown.** The old startup code marked some migrations as applied and swallowed
   migration errors. Commit `9ddcc1e5` ("add missing columns to Neon DB via startup SQL") suggests some migrations
   failed in production and the columns were patched in by hand. Compare the actual schema before trusting the history.
2. **The local dev database's history contains migrations from other branches** (for example `Baseline_20260209`,
   `AddProductTypeAndBundleSupport`, `AddNotesToRecipeIngredient`) and extra tables (`ProductBundleItems`,
   `ProductPackagingItems`). EF ignores unknown history rows, so this doesn't block updates, but the database isn't a
   clean reference.
3. **`Server/Migrations/20260210134405_RemoveUnitColumn.cs` has no `.Designer.cs`**, so EF never discovers or runs it.
   It would drop `RecipeIngredients.Unit`, which the model still uses. Do not restore its Designer. Delete the file in
   a reviewed cleanup.

## Procedure: local development database

```bash
# 1. Back up (PostgreSQL client tools are in C:\Program Files\PostgreSQL\18\bin)
pg_dump -h localhost -U postgres -d BakeryDb -Fc -f BakeryDb-backup.dump

# 2. Apply pending migrations to the local database (appsettings.json connection)
cd Server
dotnet ef database update
```

## Procedure: production (requires explicit approval — not done yet)

Apply the migration **before** deploying the app version that needs it: the new server no longer creates columns
at startup.

1. **Rehearse on a copy.** Create a Neon branch from production and point `EF_CONNECTION` at the branch only.
2. **Compare schemas.** `pg_dump --schema-only` of the branch versus a fresh database built from all migrations.
   Review every difference.
3. **Reconcile history if needed.** For repository migrations whose changes are already present in production but
   missing from `__EFMigrationsHistory`, insert the history rows. Only do this after step 2 proves the changes exist.
4. **Generate the reviewed script** (offline):
   ```bash
   cd Server
   EF_CONNECTION="Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none" \
     dotnet ef migrations script --idempotent -o migrate.sql
   ```
   Read `migrate.sql` in full.
5. **Apply the script to the Neon branch**, run the new app version against the branch, and smoke-test sign-in and
   the main pages. Run `docs/sql/report-invalid-units.sql` on the branch and review any invalid unit values.
6. **Back up production** (Neon restore point or `pg_dump`), then apply the same `migrate.sql` to production with
   `psql -v ON_ERROR_STOP=1 -f migrate.sql`.
7. **Then deploy** the new app version. Check the startup log for `Database schema is up to date`.

Rules: never apply migrations from application startup; never run `dotnet ef database update` against production
from a laptop; always use `EF_CONNECTION` explicitly for anything other than the local database.
