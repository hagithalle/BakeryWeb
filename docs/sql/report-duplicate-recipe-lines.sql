-- Read-only report of recipe lines duplicated by the RecipeService.CreateAsync bug (2026-02-04 .. fix).
--
-- The bug stored every ingredient line, step and base-recipe line of a NEWLY CREATED recipe twice.
-- Editing a recipe replaces all its lines, so recipes edited after creation are clean.
-- A recipe whose lines are ALL present exactly twice is the bug's fingerprint; anything else needs a human look
-- (someone may have entered the same line twice on purpose).
--
-- SELECT statements only. Safe on any database, including a Neon branch of production:
--   psql -h <host> -U <user> -d <database> -v ON_ERROR_STOP=1 -f docs/sql/report-duplicate-recipe-lines.sql

\echo '=== Summary'
SELECT 'RecipeIngredients' AS "table", count(*) AS total_rows,
       count(*) - count(DISTINCT ("RecipeId", "IngredientId", "Quantity", "Unit")) AS extra_copies
FROM "RecipeIngredients"
UNION ALL
SELECT 'RecipeSteps', count(*),
       count(*) - count(DISTINCT ("RecipeId", "Order", "Description", "EstimatedMinutes"))
FROM "RecipeSteps"
UNION ALL
SELECT 'RecipeItems', count(*),
       count(*) - count(DISTINCT ("ComposingRecipeId", "BaseRecipeId", "Quantity", "Unit"))
FROM "RecipeItems";

\echo '=== Per recipe: line groups, duplicated groups, and whether every line is doubled (bug fingerprint)'
WITH ing AS (
    SELECT "RecipeId" AS recipe_id, count(*) AS copies
    FROM "RecipeIngredients" GROUP BY "RecipeId", "IngredientId", "Quantity", "Unit"
), stp AS (
    SELECT "RecipeId" AS recipe_id, count(*) AS copies
    FROM "RecipeSteps" GROUP BY "RecipeId", "Order", "Description", "EstimatedMinutes"
), itm AS (
    SELECT "ComposingRecipeId" AS recipe_id, count(*) AS copies
    FROM "RecipeItems" GROUP BY "ComposingRecipeId", "BaseRecipeId", "Quantity", "Unit"
), all_groups AS (
    SELECT recipe_id, copies, 'ingredient' AS kind FROM ing
    UNION ALL SELECT recipe_id, copies, 'step' FROM stp
    UNION ALL SELECT recipe_id, copies, 'base recipe' FROM itm
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
