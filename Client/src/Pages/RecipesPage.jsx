import React, { useState, useMemo } from "react";
import { Box } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AddRecipeDialog from "../Components/Recipes/AddRecipeDialog";
import RecipeListSidebar from "../Components/Recipes/RecipeListSidebar";
import RecipeDetailsPanel from "../Components/Recipes/RecipeDetailsPanel";

import { useLanguage } from "../context/LanguageContext";
import useLocaleStrings from "../hooks/useLocaleStrings";

import { fetchIngredients, addIngredient } from "../Services/ingredientsService";
import {
  getAllRecipes,
  createRecipeWithImage,
  deleteRecipe,
  updateRecipeWithImage,
} from "../Services/RecipeService";

export default function RecipesPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);

  // Fetch recipes
  const {
    data: rows = [],
    isLoading: recipesLoading,
  } = useQuery({
    queryKey: ["recipes"],
    queryFn: getAllRecipes,
  });

  // Fetch ingredients
  const {
    data: ingredientsList = [],
    isLoading: ingredientsLoading,
  } = useQuery({
    queryKey: ["ingredients"],
    queryFn: fetchIngredients,
  });

  const selectedRecipe = rows.find((r) => r.id === selectedId) || null;

  // מתכון מלא לתצוגה בפאנל הימני
  const fullSelectedRecipe = useMemo(() => {
    if (!selectedRecipe) return null;

    const result = {
      ...selectedRecipe,
      ingredients:
        selectedRecipe.ingredients || selectedRecipe.Ingredients || []
          .map((ri) => {
            const ingId =
              ri.ingredient?.id ||
              ri.Ingredient?.id ||
              ri.ingredientId ||
              ri.IngredientId;
            const fullIngredient = ingredientsList.find((i) => i.id === ingId);

            return {
              ingredient: fullIngredient || ri.ingredient || ri.Ingredient,
              quantity: ri.quantity || ri.Quantity || 0,
              unit: ri.unit ?? ri.Unit ?? 2,
            };
          }),
      steps:
        selectedRecipe.steps || selectedRecipe.Steps || []
          .sort(
            (a, b) =>
              (a.order || a.Order || 0) - (b.order || b.Order || 0)
          )
          .map((s, idx) => ({
            order: s.order || s.Order || idx,
            description: s.description || s.Description || "",
          })),
    };

    return result;
  }, [selectedRecipe, ingredientsList]);

  // שמירה (חדש / עדכון)
  const handleSave = async (recipe) => {
    try {
      console.log(
        "=============== RecipesPage.onSave START ==============="
      );

      // 1. ולידציה בסיסית
      if (!recipe.name || recipe.name.trim() === "") {
        console.warn("❌ שם מתכון ריק!");
        alert("חובה להזין שם למתכון!");
        return;
      }
      console.log("✅ שם מתכון:", recipe.name);

      // 2. רכיבים
      console.log("▶️ עיבוד רכיבים:");
      console.log("   מתכון קיבל", recipe.ingredients.length, "רכיבים:");

      const ensuredIngredients = [];

      for (const ing of recipe.ingredients || []) {
        console.log(`\n   🔍 מעבד רכיב: "${ing.name}"`);
        console.log(
          `     קלט: {id: ${ing.ingredientId}, name: "${ing.name}", amount: ${ing.amount}, unit: ${ing.unit}}`
        );

        let found;

        // חיפוש לפי ID
        if (ing.ingredientId) {
          found = (ingredientsList || []).find(
            (i) => i.id === ing.ingredientId
          );
          if (found) {
            console.log(`     ✅ נמצא ב-DB לפי ID: ${found.id}`);
          }
        }

        // אם לא נמצא – חיפוש לפי שם / יצירה
        if (!found) {
          found = (ingredientsList || []).find(
            (i) => i.name === ing.name || i.ingredientName === ing.name
          );

          if (!found) {
            console.log(`     ⚠️ רכיב לא נמצא ב-DB, מוסיף חדש...`);
            found = await addIngredient({
              name: ing.name,
              unit: 1,
              category: 7,
              pricePerKg: 0,
              stockQuantity: 0,
              stockUnit: 1,
            });
            await queryClient.invalidateQueries(["ingredients"]);
            console.log(`     ✅ נוסף ב-DB עם ID: ${found.id}`);
          } else {
            console.log(`     ✅ נמצא ב-DB לפי שם עם ID: ${found.id}`);
          }
        }

        // ולידציה לכמות
        if (
          !ing.amount ||
          isNaN(Number(ing.amount)) ||
          Number(ing.amount) <= 0
        ) {
          console.warn(`     ❌ כמות לא תקינה: "${ing.amount}"`);
          alert(`חומר הגלם "${ing.name}" חייב כמות מספרית גדולה מ-0!`);
          continue;
        }

        const finalIngredient = {
          IngredientId: found.id,
          Quantity: Number(ing.amount),
          Unit: Number(ing.unit) || 2, // ברירת מחדל: גרם
        };
        ensuredIngredients.push(finalIngredient);
        console.log(
          `     ➡️ שלח לשרת: {IngredientId: ${finalIngredient.IngredientId}, Quantity: ${finalIngredient.Quantity}, Unit: ${finalIngredient.Unit}}`
        );
      }

      console.log(
        `\n   📦 סה"כ רכיבים שישלחו: ${ensuredIngredients.length}`
      );
      console.log("   ", JSON.stringify(ensuredIngredients, null, 4));

      // 3. שלבים
      console.log("\n▶️ עיבוד שלבים:");
      console.log("   מתכון קיבל", recipe.steps.length, "שלבים:");

      const mappedSteps = (recipe.steps || []).map((step, idx) => {
        console.log(`   [${idx}] קלט:`, {
          value: step,
          type: typeof step,
        });

        const description =
          typeof step === "string"
            ? step
            : step.description || step.Description || "";
        const output = {
          Description: description,
          Order: idx + 1,
        };
        console.log(`   [${idx}] פלט:`, output);
        return output;
      });

      console.log(
        `\n   📦 סה"כ שלבים שישלחו: ${mappedSteps.length}`
      );
      console.log("   ", JSON.stringify(mappedSteps, null, 4));

      // 3.5 מתכונים בסיסיים
      console.log("\n▶️ מתכונים בסיסיים:");
      console.log(
        "   baseRecipes count:",
        recipe.baseRecipes?.length ?? 0
      );
      if (recipe.baseRecipes && recipe.baseRecipes.length > 0) {
        recipe.baseRecipes.forEach((br, idx) => {
          console.log(
            `   [${idx}] BaseRecipeId=${br.baseRecipeId}, Name="${br.name}", Qty=${br.quantity}, Unit=${br.unit}`
          );
        });
      }

      // 4. payload סופי
      console.log("\n▶️ בניית payload סופי:");
      const recipeToSend = {
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        outputUnits: Number(recipe.yieldAmount) || 0,
        outputUnitType: Number(recipe.outputUnitType) ?? 0,
        prepTime: Number(recipe.prepTime) || 0,
        bakeTime: Number(recipe.bakeTime) || 0,
        temperature: Number(recipe.temperature) || 0,
        recipeType: recipe.recipeType ?? 2,
        ingredients: ensuredIngredients,
        steps: mappedSteps,
        baseRecipes: recipe.baseRecipes || [],
      };

      console.log("   📤 שלח לשרת:");
      console.log(JSON.stringify(recipeToSend, null, 4));

      console.log("\n▶️ קריאה ל-createRecipeWithImage...");
      console.log(
        "   תמונה?",
        recipe.imageFile ? `כן (${recipe.imageFile.name})` : "לא"
      );

      // 5. יצירה / עדכון
      if (editRecipe) {
        console.log("   מצב: עדכון מתכון קיים (ID:", editRecipe.id, ")");
        await updateRecipeWithImage(
          editRecipe.id,
          recipeToSend,
          recipe.imageFile
        );
        console.log("✅ שמור בהצלחה!");

        await queryClient.invalidateQueries(["recipes"]);
        await queryClient.invalidateQueries(["ingredients"]);

        setAddDialogOpen(false);
        setEditRecipe(null);
        alert("✅ המתכון עודכן בהצלחה!");
      } else {
        console.log("   מצב: יצירת מתכון חדש");
        await createRecipeWithImage(recipeToSend, recipe.imageFile);
        console.log("✅ שמור בהצלחה!");

        await queryClient.invalidateQueries(["recipes"]);
        await queryClient.invalidateQueries(["ingredients"]);

        setAddDialogOpen(false);
        setEditRecipe(null);
        alert("✅ המתכון נוצר בהצלחה!");
      }

      console.log(
        "=============== RecipesPage.onSave END ===============\n"
      );
    } catch (err) {
      console.error(
        "=============== RecipesPage.onSave ERROR ==============="
      );
      console.error("❌ שגיאה:", err);
      console.error("   status:", err?.response?.status);
      console.error("   statusText:", err?.response?.statusText);
      console.error("   data:", err?.response?.data);
      console.error("   message:", err?.message);
      console.error("=============== END ERROR ===============\n");

      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "שגיאה לא ידועה";
      alert("שגיאה בשמירת מתכון: " + errorMsg);
    }
  };

  // מיפוי מתכון לעריכה בדיאלוג
  const handleEdit = (recipe) => {
    if (!recipe) return;

    const mappedRecipe = {
      ...recipe,
      yieldAmount: recipe.outputUnits || recipe.OutputUnits || 1,
      outputUnitType: recipe.outputUnitType ?? recipe.OutputUnitType ?? 0,
      baseRecipes: (recipe.baseRecipes || recipe.BaseRecipes || []).map(
        (br) => ({
          baseRecipeId: br.baseRecipeId || br.BaseRecipeId,
          name: br.baseRecipe?.name || br.BaseRecipe?.name || "",
          quantity: br.quantity || br.Quantity || 1,
          unit: br.unit ?? br.Unit ?? 5,
        })
      ),
      ingredients:
        recipe.ingredients || recipe.Ingredients || []
          // מניעת כפילויות
          .filter((ri, idx, arr) => {
            const currentId =
              ri.ingredient?.id ||
              ri.Ingredient?.id ||
              ri.ingredientId ||
              ri.IngredientId;
            const firstIndex = arr.findIndex((x) => {
              const xId =
                x.ingredient?.id ||
                x.Ingredient?.id ||
                x.ingredientId ||
                x.IngredientId;
              return xId === currentId;
            });
            return firstIndex === idx;
          })
          .map((ri) => {
            const ingId =
              ri.ingredient?.id ||
              ri.Ingredient?.id ||
              ri.ingredientId ||
              ri.IngredientId;
            const fullIngredient =
              ingredientsList.find((i) => i.id === ingId) || {};

            return {
              ingredientId: ingId,
              name:
                fullIngredient.name ||
                fullIngredient.ingredientName ||
                ri.ingredient?.name ||
                ri.Ingredient?.name ||
                "",
              amount: ri.quantity || ri.Quantity || 0,
              unit: ri.unit ?? ri.Unit ?? 2,
            };
          }),
      steps:
        recipe.steps || recipe.Steps || []
          .sort(
            (a, b) =>
              (a.order || a.Order || 0) - (b.order || b.Order || 0)
          )
          .map((s) => ({
            description: s.description || s.Description || "",
          })),
    };

    setEditRecipe(mappedRecipe);
    setAddDialogOpen(true);
  };

  // מחיקה
  const handleDelete = async (recipe) => {
    if (!recipe) return;

    if (window.confirm(`האם למחוק את המתכון "${recipe.name}"?`)) {
      await deleteRecipe(recipe.id);
      await queryClient.invalidateQueries(["recipes"]);
      setSelectedId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <RecipeListSidebar
            recipes={rows}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => {
              setEditRecipe(null);
              setAddDialogOpen(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={recipesLoading}
            filter=""
            onFilterChange={() => {}}
            strings={strings}
          />
        </Box>

        <Box sx={{ flex: 2, minWidth: 0 }}>
          <RecipeDetailsPanel
            recipe={fullSelectedRecipe}
            onEdit={() => {
              if (fullSelectedRecipe) handleEdit(fullSelectedRecipe);
            }}
            onDelete={() => {
              if (fullSelectedRecipe) handleDelete(fullSelectedRecipe);
            }}
            tab="ingredients"
            onTabChange={() => {}}
            strings={strings}
          />
        </Box>
      </Box>

      <AddRecipeDialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditRecipe(null);
        }}
        onSave={handleSave}
        ingredientsList={ingredientsList}
        loadingIngredients={ingredientsLoading}
        onIngredientAdded={() =>
          queryClient.invalidateQueries(["ingredients"])
        }
        initialValues={editRecipe}
        availableRecipes={rows || []}
        strings={strings}
      />
    </Box>
  );
}