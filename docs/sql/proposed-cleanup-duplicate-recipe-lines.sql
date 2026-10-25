-- PROPOSAL - NOT APPROVED, NOT RUN. Removes the extra copies created by the RecipeService.CreateAsync bug.
--
-- Safety design:
--   * Runs in ONE transaction and ends with ROLLBACK, so executing this file as-is changes nothing.
--     After reviewing the dry-run output, an approved run replaces ROLLBACK with COMMIT.
--   * Only touches recipes whose lines are ALL present exactly twice (the bug's fingerprint). Recipes with any
--     other pattern are left alone for a human decision.
--   * Within each duplicate group it keeps the row with the LOWEST id and deletes only the identical copies.
--   * Touches only RecipeIngredients, RecipeSteps and RecipeItems. Recipes, ingredients, products and every other
--     table are never modified.
--
-- Required before an approved run: a fresh backup (pg_dump -Fc), the report script reviewed, a rehearsal on a
-- copy of the database (or a Neon branch for production), and a before/after comparison.

BEGIN;

CREATE TEMP TABLE fingerprint_recipes ON COMMIT DROP AS
WITH all_groups AS (
    SELECT "RecipeId" AS recipe_id, count(*) AS copies FROM "RecipeIngredients" GROUP BY "RecipeId", "IngredientId", "Quantity", "Unit"
    UNION ALL
    SELECT "RecipeId", count(*) FROM "RecipeSteps" GROUP BY "RecipeId", "Order", "Description", "EstimatedMinutes"
    UNION ALL
    SELECT "ComposingRecipeId", count(*) FROM "RecipeItems" GROUP BY "ComposingRecipeId", "BaseRecipeId", "Quantity", "Unit"
)
SELECT recipe_id FROM all_groups GROUP BY recipe_id HAVING bool_and(copies = 2);

\echo '=== Recipes matching the bug fingerprint (will be cleaned)'
SELECT recipe_id FROM fingerprint_recipes ORDER BY recipe_id;

\echo '=== Rows that would be deleted'
DELETE FROM "RecipeIngredients" x
USING "RecipeIngredients" keep
WHERE x."RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."RecipeId" = x."RecipeId" AND keep."IngredientId" = x."IngredientId"
  AND keep."Quantity" = x."Quantity" AND keep."Unit" = x."Unit"
  AND keep."Id" < x."Id";

DELETE FROM "RecipeSteps" x
USING "RecipeSteps" keep
WHERE x."RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."RecipeId" = x."RecipeId" AND keep."Order" = x."Order"
  AND keep."Description" = x."Description"
  AND keep."EstimatedMinutes" IS NOT DISTINCT FROM x."EstimatedMinutes"
  AND keep."Id" < x."Id";

DELETE FROM "RecipeItems" x
USING "RecipeItems" keep
WHERE x."ComposingRecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."ComposingRecipeId" = x."ComposingRecipeId" AND keep."BaseRecipeId" = x."BaseRecipeId"
  AND keep."Quantity" = x."Quantity" AND keep."Unit" = x."Unit"
  AND keep."Id" < x."Id";

\echo '=== After (inside the transaction): remaining extra copies in fingerprint recipes - expected 0'
SELECT
  (SELECT count(*) - count(DISTINCT ("RecipeId","IngredientId","Quantity","Unit")) FROM "RecipeIngredients" WHERE "RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS ingredient_copies,
  (SELECT count(*) - count(DISTINCT ("RecipeId","Order","Description","EstimatedMinutes")) FROM "RecipeSteps" WHERE "RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS step_copies,
  (SELECT count(*) - count(DISTINCT ("ComposingRecipeId","BaseRecipeId","Quantity","Unit")) FROM "RecipeItems" WHERE "ComposingRecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS base_recipe_copies;

ROLLBACK;  -- dry run: nothing above is kept. An approved run would use COMMIT after review.
