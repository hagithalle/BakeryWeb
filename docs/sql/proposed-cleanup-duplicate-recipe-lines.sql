-- PROPOSAL - review before use. Removes the extra copies created by the RecipeService.CreateAsync bug.
--
-- Safety design:
--   * Rows count as duplicates only if they are identical in EVERY column except "Id" (full-row comparison via
--     to_jsonb(row) - 'Id'). Columns that exist only in some databases (for example a local "Notes" column) are
--     therefore always part of the comparison, so rows that differ in any column are never treated as duplicates.
--   * Only touches recipes whose lines are ALL present exactly twice (the bug's fingerprint). Recipes with any other
--     pattern are left alone for a human decision.
--   * Within each duplicate group it keeps the row with the LOWEST id and deletes only its identical copies.
--   * Touches only RecipeIngredients, RecipeSteps and RecipeItems. Recipes, ingredients, products and every other
--     table are never modified.
--   * Runs in ONE transaction and ends with ROLLBACK, so executing this file as-is changes nothing.
--     After reviewing the dry-run output, an approved run replaces ROLLBACK with COMMIT.
--
-- Required before an approved run: a fresh backup (pg_dump -Fc), the report script reviewed, a rehearsal on a
-- copy of the database (or a Neon branch for production), and a before/after comparison.
-- Applied once on local BakeryDb (2026-10-25, recipe 10) with a recipe-specific script; production not checked yet.

BEGIN;

CREATE TEMP TABLE fingerprint_recipes ON COMMIT DROP AS
WITH all_groups AS (
    SELECT "RecipeId" AS recipe_id, count(*) AS copies
    FROM "RecipeIngredients" x GROUP BY "RecipeId", to_jsonb(x) - 'Id'
    UNION ALL
    SELECT "RecipeId", count(*)
    FROM "RecipeSteps" x GROUP BY "RecipeId", to_jsonb(x) - 'Id'
    UNION ALL
    SELECT "ComposingRecipeId", count(*)
    FROM "RecipeItems" x GROUP BY "ComposingRecipeId", to_jsonb(x) - 'Id'
)
SELECT recipe_id FROM all_groups GROUP BY recipe_id HAVING bool_and(copies = 2);

\echo '=== Recipes matching the bug fingerprint (will be cleaned)'
SELECT recipe_id FROM fingerprint_recipes ORDER BY recipe_id;

\echo '=== Rows that would be deleted (identical in every column except Id to a row with a lower Id)'
DELETE FROM "RecipeIngredients" x
USING "RecipeIngredients" keep
WHERE x."RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."RecipeId" = x."RecipeId"
  AND keep."Id" < x."Id"
  AND (to_jsonb(keep) - 'Id') = (to_jsonb(x) - 'Id');

DELETE FROM "RecipeSteps" x
USING "RecipeSteps" keep
WHERE x."RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."RecipeId" = x."RecipeId"
  AND keep."Id" < x."Id"
  AND (to_jsonb(keep) - 'Id') = (to_jsonb(x) - 'Id');

DELETE FROM "RecipeItems" x
USING "RecipeItems" keep
WHERE x."ComposingRecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)
  AND keep."ComposingRecipeId" = x."ComposingRecipeId"
  AND keep."Id" < x."Id"
  AND (to_jsonb(keep) - 'Id') = (to_jsonb(x) - 'Id');

\echo '=== After (inside the transaction): remaining extra copies in fingerprint recipes - expected 0'
SELECT
  (SELECT count(*) - count(DISTINCT to_jsonb(x) - 'Id') FROM "RecipeIngredients" x WHERE "RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS ingredient_copies,
  (SELECT count(*) - count(DISTINCT to_jsonb(x) - 'Id') FROM "RecipeSteps" x WHERE "RecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS step_copies,
  (SELECT count(*) - count(DISTINCT to_jsonb(x) - 'Id') FROM "RecipeItems" x WHERE "ComposingRecipeId" IN (SELECT recipe_id FROM fingerprint_recipes)) AS base_recipe_copies;

ROLLBACK;  -- dry run: nothing above is kept. An approved run would use COMMIT after review.
