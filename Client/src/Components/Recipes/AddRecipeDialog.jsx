// src/Components/Recipes/AddRecipeDialog.jsx
import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
} from "@mui/material";

import RecipeMainInfo from "./Details/RecipeMainInfo";
import RecipeTypeSelector from "./Details/RecipeTypeSelector";
import RecipeBakingInfo from "./Details/RecipeBakingInfo";
import RecipeIngredientsSection from "./Details/RecipeIngredientsSection";
import RecipeStepsSection from "./Details/RecipeStepsSection";
import RecipeBaseRecipesSection from "./Details/RecipeBaseRecipesSection";
import IngredientDialog from "../IngredientDialog";

import { useLanguage } from "../../context/LanguageContext";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import { units } from "../../constants/units";
import useRecipeCategories from "../../hooks/useRecipeCategories";

import useRecipeForm from "../../hooks/useRecipeForm.js";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function AddRecipeDialog({
  open,
  onClose,
  onSave,
  onBackToImport,        // יכול להיות undefined אם לא הגיע מייבוא
  ingredientsList,
  loadingIngredients,
  onIngredientAdded,
  initialValues,
  availableRecipes = [],
  strings,
}) {
  const { lang } = useLanguage();
  const categories = useRecipeCategories();

  const isImported = !!initialValues && initialValues.source === "import";

  const form = useRecipeForm(initialValues, open);

  const {
    name,
    description,
    category,
    recipeType,
    imageFile,
    imagePreview,
    yieldAmount,
    outputUnitType,
    bakeTime,
    prepTime,
    temperature,
    ingredients,
    steps,
    baseRecipes,

    setName,
    setDescription,
    setCategory,
    setRecipeType,
    setYieldAmount,
    setOutputUnitType,
    setBakeTime,
    setPrepTime,
    setTemperature,
    setIngredients,
    setSteps,
    setBaseRecipes,

    handleImageChange,
    buildRecipeData,
  } = form;

  // חישוב חוסרי חומרי גלם – לפי השמות ברשימת הרכיבים מול ה-ingredientsList
  const missingIngredients = useMemo(() => {
    if (!ingredientsList?.length || !ingredients?.length) return [];

    const knownNames = new Set(
      ingredientsList
        .map(
          (i) =>
            (i.name || i.ingredientName || "")
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    );

    const seen = new Set();
    const missing = [];

    for (const ing of ingredients) {
      const rawName = (ing.name || "").trim();
      if (!rawName) continue;
      const key = rawName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!knownNames.has(key)) {
        missing.push(rawName);
      }
    }

    return missing;
  }, [ingredientsList, ingredients]);

  const handleSaveClick = () => {
    const recipeData = buildRecipeData();
    if (!recipeData.name || recipeData.name.trim() === "") {
      alert(strings?.addRecipeDialog?.errorNoName || "חובה להזין שם למתכון!");
      if (window && window.logEvent) window.logEvent('recipe_save_failed', { reason: 'no_name' });
      return;
    }
    if (window && window.logEvent) window.logEvent('recipe_save', { name: recipeData.name });
    onSave(recipeData);
  };

  const title =
    initialValues && initialValues.id ? "עריכת מתכון" : "מתכון חדש";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 700, color: "#5D4037", pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {strings?.addRecipeDialog?.dialogTitle || title}
          </Typography>

          {isImported && !!onBackToImport && (
            <Button
              variant="text"
              onClick={onBackToImport}
              sx={{ color: "#971936", fontWeight: 600 }}
            >
              ← חזרה לייבוא
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: "#FFF7F2",
          borderRadius: 3,
          p: 4,
          minWidth: 600,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {isImported && (
            <Chip
              icon={<CloudUploadIcon />}
              label="המתכון יובא אוטומטית - עברי על כל השדות לפני שמירה"
              color="secondary"
              size="small"
              sx={{ alignSelf: "flex-start" }}
            />
          )}

          {missingIngredients.length > 0 && (
            <Alert
              severity="warning"
              sx={{ mt: isImported ? 1 : 0, mb: 1 }}
            >
              <Typography variant="body2">
                נמצאו חומרי גלם שלא קיימים כרגע במערכת:
              </Typography>
              <ul style={{ marginTop: 4, paddingInlineStart: 20 }}>
                {missingIngredients.map((name) => (
                  <li key={name}>
                    <Typography
                      variant="body2"
                      component="span"
                    >
                      {name}
                    </Typography>
                  </li>
                ))}
              </ul>
              <Typography variant="body2">
                ניתן להוסיף אותם דרך כפתור "הוסף חומר גלם" ברשימת הרכיבים.
              </Typography>
            </Alert>
          )}

          {/* Main Info */}
          <RecipeMainInfo
            name={name}
            description={description}
            category={category}
            categories={Array.isArray(categories) && categories.length > 0 && categories[0].label ? categories.map(c => c.label) : categories}
            imageUrl={imagePreview}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategory}
            onImageChange={handleImageChange}
            nameLabel={strings?.addRecipeDialog?.nameLabel || "שם מתכון"}
            descriptionLabel={strings?.addRecipeDialog?.descriptionLabel || "תיאור קצר"}
            categoryLabel={strings?.addRecipeDialog?.categoryLabel || "קטגוריה"}
            uploadLabel={strings?.addRecipeDialog?.uploadLabel || "העלאת תמונה"}
            detailsTitle={strings?.addRecipeDialog?.detailsTitle || "פרטי מתכון"}
          />

          {/* Recipe Type Selector */}
          <RecipeTypeSelector
            recipeType={recipeType}
            onChange={setRecipeType}
          />

          {/* Baking Info */}
          <RecipeBakingInfo
            bakingTime={bakeTime}
            temperature={temperature}
            prepTime={prepTime}
            yieldAmount={yieldAmount}
            outputUnitType={outputUnitType}
            onBakingTimeChange={setBakeTime}
            onTemperatureChange={setTemperature}
            onPrepTimeChange={setPrepTime}
            onYieldAmountChange={setYieldAmount}
            onOutputUnitTypeChange={setOutputUnitType}
          />

          {/* Ingredients Section */}
          <RecipeIngredientsSection
            ingredients={ingredients}
            ingredientsList={ingredientsList}
            onAddIngredient={(item) => {
              setIngredients((prev) => [
                ...prev,
                {
                  ingredientId: item.ingredientId,
                  name: item.name,
                  amount: item.amount,
                  unit: item.unit,
                },
              ]);
            }}
            onRemoveIngredient={(idx) => {
              setIngredients((prev) =>
                prev.filter((_, i) => i !== idx)
              );
            }}
            onUpdateIngredient={(idx, updatedIngredient) => {
              setIngredients((prev) =>
                prev.map((ing, i) => (i === idx ? updatedIngredient : ing))
              );
            }}
            onIngredientAdded={onIngredientAdded}
          />

          {/* Base Recipes Section */}
          <RecipeBaseRecipesSection
            baseRecipes={baseRecipes}
            availableRecipes={availableRecipes}
            onAddBaseRecipe={(item) => {
              setBaseRecipes((prev) => [...prev, item]);
            }}
            onRemoveBaseRecipe={(idx) => {
              setBaseRecipes((prev) =>
                prev.filter((_, i) => i !== idx)
              );
            }}
            onUpdateBaseRecipe={(idx, updatedItem) => {
              setBaseRecipes((prev) =>
                prev.map((item, i) =>
                  i === idx ? updatedItem : item
                )
              );
            }}
          />

          {/* Steps Section */}
          <RecipeStepsSection
            steps={steps}
            onStepsChange={setSteps}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "#F9E3D6",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          p: 2,
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={() => {
            if (window && window.logEvent) window.logEvent('recipe_cancel');
            onClose();
          }}
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            color: "#5D4037",
            borderColor: "#D4A574",
          }}
        >
          {strings?.addRecipeDialog?.cancel || "ביטול"}
        </Button>
        <Button
          onClick={handleSaveClick}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            bgcolor: "#5D4037",
            ":hover": { bgcolor: "#4E342E" },
          }}
        >
          {initialValues && initialValues.id
            ? (strings?.addRecipeDialog?.saveChanges || "שמור שינויים")
            : (strings?.addRecipeDialog?.createRecipe || "צור מתכון")}
        </Button>
      </DialogActions>

      {/* דיאלוג להוספת חומר גלם חדש – נשאר כמו שהיה אצלך, אם את רוצה אפשר גם להוציא להוק */}
      {/* ... */}
    </Dialog>
  );
}