-- Read-only report of recipe lines duplicated by the RecipeService.CreateAsync bug (2026-02-04 .. fix).
--
-- The bug stored every ingredient line, step and base-recipe line of a NEWLY CREATED recipe twice.
-- Editing a recipe replaces all its lines, so recipes edited after creation are clean.
-- Rows count as duplicates only if they are identical in EVERY column except "Id" (to_jsonb(row) - 'Id'), so
-- database-specific extra columns (for example a local "Notes" column) are always compared too.
-- A recipe whose lines are ALL present exactly twice is the bug's fingerprint; anything else needs a human look
-- (someone may have entered the same line twice on purpose).
--
-- SELECT statements only. Safe on any database, including a Neon branch of production:
--   psql -h <host> -U <user> -d <database> -v ON_ERROR_STOP=1 -f docs/sql/report-duplicate-recipe-lines.sql

\echo '=== Summary'
SELECT 'RecipeIngredients' AS "table", count(*) AS total_rows, count(*) - count(DISTINCT to_jsonb(x) - 'Id') AS extra_copies
FROM "RecipeIngredients" x
UNION ALL
SELECT 'RecipeSteps', count(*), count(*) - count(DISTINCT to_jsonb(x) - 'Id') FROM "RecipeSteps" x
UNION ALL
SELECT 'RecipeItems', count(*), count(*) - count(DISTINCT to_jsonb(x) - 'Id') FROM "RecipeItems" x;

\echo '=== Per recipe: line groups, duplicated groups, and whether every line is doubled (bug fingerprint)'
WITH all_groups AS (
    SELECT "RecipeId" AS recipe_id, count(*) AS copies FROM "RecipeIngredients" x GROUP BY "RecipeId", to_jsonb(x) - 'Id'
    UNION ALL
    SELECT "RecipeId", count(*) FROM "RecipeSteps" x GROUP BY "RecipeId", to_jsonb(x) - 'Id'
    UNION ALL
    SELECT "ComposingRecipeId", count(*) FROM "RecipeItems" x GROUP BY "ComposingRecipeId", to_jsonb(x) - 'Id'
)
SELECT r."Id" AS recipe_id,
       r."UserId" AS owner_user_id,
       count(*) AS line_groups,
       count(*) FILTER (WHERE g.copies > 1) AS duplicated_groups,
       max(g.copies) AS max_copies,
       bool_and(g.copies = 2) AS every_line_exactly_doubled
FROM all_groups g
JOIN "Recipes" r ON r."Id" = g.recipe_id
GROUP BY r."Id", r."UserId"
HAVING count(*) FILTER (WHERE g.copies > 1) > 0
ORDER BY r."Id";
