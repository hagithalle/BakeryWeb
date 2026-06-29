// src/Components/Recipes/AddRecipeDialog.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
} from "@mui/material";

import RecipeMainInfo from "./Details/RecipeMainInfo";
import RecipeTypeSelector from "./Details/RecipeTypeSelector";
import RecipeBakingInfo from "./Details/RecipeBakingInfo";
import RecipeIngredientsSection from "./Details/RecipeIngredientsSection";
import RecipeStepsSection from "./Details/RecipeStepsSection";
import RecipeBaseRecipesSection from "./Details/RecipeBaseRecipesSection";

import { useLanguage } from "../../context/LanguageContext";
import { RECIPE_TYPES } from "../../constants/categories";
import useRecipeForm from "../../hooks/useRecipeForm.js";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";


import MissingIngredientsDialog from "./MissingIngredientsDialog";
import IngredientDialog from "../IngredientDialog";
import { fetchIngredients, addIngredient } from "../../Services/ingredientsService";
import { useQueryClient } from "@tanstack/react-query";

import { units as defaultUnits } from "../../constants/units";

export default function AddRecipeDialog({
  open,
  onClose,
  onSave,
  onBackToImport, // יכול להיות undefined אם לא הגיע מייבוא
  ingredientsList,
  loadingIngredients,
  onIngredientAdded,
  initialValues,
  availableRecipes = [],
  strings,
}) {

  const { lang } = useLanguage();
  const categories = RECIPE_TYPES;
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

  const [missingDialogOpen, setMissingDialogOpen] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [newIngredientInitial, setNewIngredientInitial] = useState(null);
  const queryClient = useQueryClient();
  // הוספת חומר גלם חדש מתוך דיאלוג החוסרים
  // שמירה של חומר גלם חדש מתוך דיאלוג החוסרים
  const [pendingMissing, setPendingMissing] = useState(null); // שומר את החוסר הנוכחי
  const handleAddNewIngredient = (missingItem, idx) => {
    setNewIngredientInitial({ name: missingItem.rawName });
    setIngredientDialogOpen(true);
    setPendingMissing(missingItem);
  };

  // שמירה של חומר גלם חדש
  const handleSaveNewIngredient = async (ingredient) => {
    // שמירה בשרת
    const saved = await addIngredient(ingredient);
    setIngredientDialogOpen(false);
    setNewIngredientInitial(null);
    // רענון רשימת חומרי הגלם
    await queryClient.invalidateQueries(["ingredients"]);
    if (typeof onIngredientAdded === "function") onIngredientAdded();
    // לא להוסיף לרשימת המרכיבים כאן! ההוספה תתבצע רק דרך handleMissingResolved
    setPendingMissing(null);
  };

  // חישוב חוסרי חומרי גלם – רשימת אובייקטים עם rawName וכו'
  const [handledMissing, setHandledMissing] = useState([]); // ids/names שטופלו
  // פונקציית דמיון בסיסית (Levenshtein)
  function similarity(a, b) {
    if (!a || !b) return 0;
    a = a.trim().toLowerCase();
    b = b.trim().toLowerCase();
    if (a === b) return 1;
    // דמיון פשוט: כמה תווים משותפים / אורך ממוצע
    const minLen = Math.min(a.length, b.length);
    let same = 0;
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) same++;
    }
    return same / Math.max(a.length, b.length);
  }

  const missingDetailed = useMemo(() => {
    if (!ingredientsList?.length || !ingredients?.length) return [];

    const knownNames = new Set(
      ingredientsList
        .map((i) =>
          (i.name || i.ingredientName || "").trim().toLowerCase()
        )
        .filter(Boolean)
    );

    // גם כל מה שכבר קיים ב-ingredients (ולא רק ingredientsList)
    ingredients.forEach((i) => {
      if (i.name) knownNames.add(i.name.trim().toLowerCase());
    });

    const seen = new Set();
    const missing = [];

    for (const ing of ingredients) {
      const rawName = (ing.name || "").trim();
      if (!rawName) continue;

      const key = rawName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      if (!knownNames.has(key)) {
        // חפש התאמה >=80% ברשימת החומרים
        let bestMatch = null;
        let bestScore = 0;
        for (const item of ingredientsList) {
          const score = similarity(rawName, item.name || item.ingredientName);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
          }
        }
        missing.push({
          rawName,
          amount: ing.amount,
          unit: ing.unit,
          selectedIngredientId: ing.ingredientId ?? null,
          suggestedIngredient: bestScore >= 0.8 ? bestMatch : null,
        });
      }
    }

    return missing;
  }, [ingredientsList, ingredients]);

  // אחוז דיוק – כמה רכיבים “מכוסים” ע"י חו"ג קיימים
  const accuracy = useMemo(() => {
    const total = ingredients?.length || 0;
    if (total === 0) return 100;
    const missingCount = missingDetailed.length;
    const known = total - missingCount;
    return Math.round((known / total) * 100);
  }, [ingredients, missingDetailed]);

  const handleSaveClick = () => {
    const recipeData = buildRecipeData();
    if (!recipeData.name || recipeData.name.trim() === "") {
      alert(
        strings?.addRecipeDialog?.errorNoName || "חובה להזין שם למתכון!"
      );
      if (window && window.logEvent)
        window.logEvent("recipe_save_failed", { reason: "no_name" });
      return;
    }
    if (window && window.logEvent)
      window.logEvent("recipe_save", { name: recipeData.name });
    onSave(recipeData);
  };

  const title =
    initialValues && initialValues.id ? "עריכת מתכון" : "מתכון חדש";

  // כשמסיימים את דיאלוג החוסרים – לעדכן את רשימת הרכיבים עם IDs
  const handleMissingResolved = (resolvedList) => {
    if (!resolvedList || resolvedList.length === 0) {
      setMissingDialogOpen(false);
      return;
    }

    // הוספה לרשימת המרכיבים רק של מה שטופל, לא כפול, ולא מה שהתעלמו ממנו
    resolvedList.forEach((r) => {
      if (r.ingredient && r.rawName) {
        setIngredients((prev) => {
          // לא להוסיף אם כבר קיים לפי ingredientId או שם
          const exists = prev.some(
            (ing) =>
              (ing.ingredientId && ing.ingredientId === r.ingredient.id) ||
              (ing.name && ing.name.trim().toLowerCase() === r.ingredient.name.trim().toLowerCase())
          );
          if (exists) return prev;
          return [
            ...prev,
            {
              ingredientId: r.ingredient.id,
              name: r.ingredient.name,
              amount: r.amount,
              unit: r.unit,
            },
          ];
        });
        setHandledMissing((prev) => [...prev, (r.rawName || "").trim().toLowerCase()]);
      }
    });
    setMissingDialogOpen(false);
  };

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

          {/* חיווי חומרי גלם חסרים + אחוז דיוק */}
          {missingDetailed.length > 0 && (
            <Box
              sx={{
                mt: isImported ? 1 : 0,
                mb: 1,
                p: 1.5,
                bgcolor: "#FFF3E0",
                borderRadius: 2,
                border: "1px solid #FFB74D",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#E65100" }}
                >
                  חומרי גלם חסרים ({missingDetailed.length})
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#BF360C", display: "block", mt: 0.5 }}
                >
                  דיוק ניתוח משוער: {accuracy}%
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                onClick={() => setMissingDialogOpen(true)}
                sx={{
                  borderRadius: 999,
                  bgcolor: "#FFB74D",
                  ":hover": { bgcolor: "#FFA726" },
                  fontWeight: 600,
                }}
              >
                טפלי בחוסרים
              </Button>
            </Box>
          )}

          {/* Main Info */}
          <RecipeMainInfo
            name={name}
            description={description}
            category={category}
            categories={categories}
            imageUrl={imagePreview}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategory}
            onImageChange={handleImageChange}
            nameLabel={
              strings?.addRecipeDialog?.nameLabel || "שם מתכון"
            }
            descriptionLabel={
              strings?.addRecipeDialog?.descriptionLabel || "תיאור קצר"
            }
            categoryLabel={
              strings?.addRecipeDialog?.categoryLabel || "קטגוריה"
            }
            uploadLabel={
              strings?.addRecipeDialog?.uploadLabel || "העלאת תמונה"
            }
            detailsTitle={
              strings?.addRecipeDialog?.detailsTitle || "פרטי מתכון"
            }
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
              setIngredients((prev) => {
                if (updatedIngredient === null) {
                  // הסרה של רכיב לא קיים
                  return prev.filter((_, i) => i !== idx);
                }
                return prev.map((ing, i) => (i === idx ? updatedIngredient : ing));
              });
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
                prev.map((item, i) => (i === idx ? updatedItem : item))
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
            if (window && window.logEvent) window.logEvent("recipe_cancel");
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
            ? strings?.addRecipeDialog?.saveChanges || "שמור שינויים"
            : strings?.addRecipeDialog?.createRecipe || "צור מתכון"}
        </Button>
      </DialogActions>

      {/* דיאלוג לטיפול בחומרי גלם חסרים */}
      <MissingIngredientsDialog
        open={missingDialogOpen}
        onClose={() => setMissingDialogOpen(false)}
        missing={missingDetailed}
        ingredientsList={ingredientsList}
        onResolved={handleMissingResolved}
        onAddNewIngredient={handleAddNewIngredient}
      />

      {/* דיאלוג הוספת חומר גלם חדש */}
      <IngredientDialog
        open={ingredientDialogOpen}
        onClose={() => {
          setIngredientDialogOpen(false);
          setNewIngredientInitial(null);
          setPendingMissing(null);
        }}
        onSave={handleSaveNewIngredient}
        categories={categories}
        units={defaultUnits}
        strings={strings}
        initialValues={newIngredientInitial}
        titleBgColor="#7B5B4B"
        titleColor="#fff"
      />
    </Dialog>
  );
}