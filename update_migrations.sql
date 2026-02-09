-- Mark all existing migrations as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES 
('20251215113227_InitialCreate', '10.0.0'),
('20251223080229_UpdateIngredientCategory', '10.0.0'),
('20251223082636_AddPackaging', '10.0.0'),
('20251223084607_AddLaborSettings', '10.0.0'),
('20251223085325_AddOverheadItem', '10.0.0'),
('20251223113711_AddRecipeModels', '10.0.0'),
('20251224080358_AddProduct', '10.0.0'),
('20260101085359_AddRecipeImageUrl', '10.0.0'),
('20260101090143_AddRecipeTypeToRecipe', '10.0.0'),
('20260208065444_ConvertUnitToEnum', '10.0.0'),
('20260208082456_AddStockUnit', '10.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Add recipe metadata fields
ALTER TABLE "Recipes" ADD COLUMN IF NOT EXISTS "Description" text NULL;
ALTER TABLE "Recipes" ADD COLUMN IF NOT EXISTS "Category" text NULL;
ALTER TABLE "Recipes" ADD COLUMN IF NOT EXISTS "PrepTime" integer NULL;
ALTER TABLE "Recipes" ADD COLUMN IF NOT EXISTS "BakeTime" integer NULL;
ALTER TABLE "Recipes" ADD COLUMN IF NOT EXISTS "Temperature" integer NULL;

-- Mark the new migration as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260208084806_AddRecipeMetadataFields', '10.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
