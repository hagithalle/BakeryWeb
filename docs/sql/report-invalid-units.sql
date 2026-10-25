-- Read-only report of unit values that are not defined in the UnitOfMeasure enum (valid values: 1..10).
--
-- Value 0 means "unit unknown": it is the column default, and rows created before 2026-02-10 lost the
-- unit the user picked because the server had no field to store it. These rows are intentionally NOT
-- rewritten by any migration - choosing the right unit is a business decision, made per row.
--
-- Contains only SELECT statements. Safe to run on any database, including a Neon branch of production:
--   psql -h <host> -U <user> -d <database> -v ON_ERROR_STOP=1 -f docs/sql/report-invalid-units.sql

\echo '=== Summary: rows with invalid unit values'
SELECT 'RecipeIngredients.Unit' AS "column", count(*) AS invalid_rows
FROM "RecipeIngredients" WHERE "Unit" NOT BETWEEN 1 AND 10
UNION ALL
SELECT 'RecipeItems.Unit (sub-recipes)', count(*)
FROM "RecipeItems" WHERE "Unit" NOT BETWEEN 1 AND 10
UNION ALL
SELECT 'Ingredients.Unit', count(*)
FROM "Ingredients" WHERE "Unit" NOT BETWEEN 1 AND 10
UNION ALL
SELECT 'Ingredients.StockUnit', count(*)
FROM "Ingredients" WHERE "StockUnit" NOT BETWEEN 1 AND 10;

\echo '=== Recipe ingredient lines with an invalid unit (these affect recipe costs)'
-- The suggested unit is only a hint for the person fixing the row: the ingredient's own unit when valid.
SELECT r."Id"            AS recipe_id,
       r."Name"          AS recipe,
       ri."Id"           AS line_id,
       i."Name"          AS ingredient,
       ri."Quantity"     AS quantity,
       ri."Unit"         AS stored_unit,
       CASE WHEN i."Unit" BETWEEN 1 AND 10 THEN i."Unit" END AS suggested_unit_from_ingredient
FROM "RecipeIngredients" ri
JOIN "Recipes" r          ON r."Id" = ri."RecipeId"
LEFT JOIN "Ingredients" i ON i."Id" = ri."IngredientId"
WHERE ri."Unit" NOT BETWEEN 1 AND 10
ORDER BY r."Id", ri."Id";

\echo '=== Sub-recipe lines with an invalid unit'
SELECT ci."ComposingRecipeId" AS recipe_id,
       ci."Id"                AS line_id,
       ci."BaseRecipeId"      AS base_recipe_id,
       ci."Quantity"          AS quantity,
       ci."Unit"              AS stored_unit
FROM "RecipeItems" ci
WHERE ci."Unit" NOT BETWEEN 1 AND 10
ORDER BY ci."ComposingRecipeId", ci."Id";

\echo '=== Ingredients with an invalid unit or stock unit (shown as "unit" in the UI; not used in costing)'
SELECT "Id", "Name", "Unit", "StockUnit"
FROM "Ingredients"
WHERE "Unit" NOT BETWEEN 1 AND 10 OR "StockUnit" NOT BETWEEN 1 AND 10
ORDER BY "Id";
