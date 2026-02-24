import React, { useState, useMemo } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import BraImg from '../../assets/images/Bra.jpg';
import RecipeImage from "./RecipeImage";
import RecipeInfoChips from "./RecipeInfoChips";
import RecipeTabs from "./RecipeTabs";
import RecipeIngredientsTable from "./RecipeIngredientsTable";
import RecipeStepsPanel from "./RecipeStepsPanel";
import RecipeCostsPanel from "./RecipeCostsPanel";
import { getUnitDisplayName, calculateIngredientCost } from "../../utils/unitUtils";


export default function RecipeDetailsPanel({ recipe, onEdit, onDelete, tab, onTabChange }) {
  const [currentTab, setCurrentTab] = useState(tab || "ingredients");

  // המרת הנתונים לפורמט המתאים לתצוגה
  const recipeData = useMemo(() => {
    if (!recipe) return null;
    
    return {
      description: recipe.description || recipe.Description || "אין תיאור",
      temperature: recipe.temperature || recipe.Temperature || 0,
      yield: recipe.outputUnits || recipe.OutputUnits || 1,
      prepTime: recipe.prepTime || recipe.PrepTime || 0,
      bakeTime: recipe.bakeTime || recipe.BakeTime || 0,
      totalTime: (recipe.prepTime || recipe.PrepTime || 0) + (recipe.bakeTime || recipe.BakeTime || 0),
      difficulty: recipe.category || recipe.Category || "" // זמנית - בעתיד אפשר להוסיף שדה רמת קושי
    };
  }, [recipe]);

  // המרת רכיבים לפורמט התצוגה
  const ingredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    
    return recipe.ingredients.map(ri => {
      const ing = ri.ingredient || ri.Ingredient;
      return {
        name: ing?.name || ing?.Name || "לא ידוע",
        unit: getUnitDisplayName(ri?.unit ?? ri?.Unit ?? 2), // היחידה לקוחה מה-RecipeIngredient, לא מה-Ingredient
        amount: ri.quantity || ri.Quantity,
        sum: ing?.cost || ing?.Cost || 0
      };
    });
  }, [recipe?.ingredients]);

  // המרת שלבים לפורמט התצוגה (ממוינים לפי Order)
  const steps = useMemo(() => {
    if (!recipe?.steps) return [];
    
    return [...recipe.steps]
      .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
      .map(step => ({
        description: step.description || step.Description
      }));
  }, [recipe?.steps]);

  // חישוב עלויות - משתמשים בערכים שחוזרים מהשרת
  const costBreakdown = useMemo(() => {
    if (!recipe) return null;
    
    console.log('🔍 costBreakdown - recipe.ingredients:', recipe.ingredients);
    
    return {
      ingredients: (recipe.ingredients || recipe.Ingredients || []).map((ri, idx) => {
        const ing = ri.ingredient || ri.Ingredient;
        const qty = ri.quantity || ri.Quantity;
        const unit = ri.unit ?? ri.Unit ?? 2; // יחידת המידה מה-RecipeIngredient, עם ברירת מחדל
        
        // חישוב עלות בקליינט - משתמשים ביחידה של RecipeIngredient
        const calculatedCost = calculateIngredientCost({ ...ing, unit: unit }, qty);
        
        console.log(`🔍 Ingredient[${idx}]:`, {
          name: ing?.name,
          quantity: qty,
          unit: unit,
          unitType: typeof unit,
          pricePerKg: ing?.pricePerKg,
          calculatedCost: calculatedCost
        });
        
        const displayUnit = getUnitDisplayName(unit);
        console.log(`   📍 displayUnit after getUnitDisplayName:`, displayUnit);
        
        return {
          name: ing?.name || ing?.Name || "לא ידוע",
          amount: qty,
          unit: displayUnit, // משתמשים ביחידה של RecipeIngredient
          cost: calculatedCost
        };
      }),
      laborCost: recipe.laborCost || recipe.LaborCost || 0,
      overheadCost: recipe.overheadCost || recipe.OverheadCost || 0,
      packagingCost: recipe.packagingCost || recipe.PackagingCost || 0,
      totalCost: recipe.totalCost || recipe.TotalCost || 0,
      yield: recipe.outputUnits || recipe.OutputUnits || 1,
      costPerUnit: recipe.costPerUnit || recipe.CostPerUnit || 0
    };
  }, [recipe]);

  if (!recipe) {
    return (
      <Box sx={{ flex: 1, bgcolor: '#FFF7F2', p: 3, borderRadius: 3, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          לא נבחר מתכון
        </Typography>
        <Typography variant="body1" color="text.secondary">
          בחרי מתכון מהרשימה או הוסיפי מתכון חדש
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      flex: 1,
      bgcolor: '#FFF7F2',
      p: 3.5,
      borderRadius: '28px',
      minHeight: '100vh',
      height: '100vh',
      boxShadow: '0 6px 32px 0 rgba(80, 50, 20, 0.10)',
      border: '2.5px solid #F7E7C1',
      position: 'relative',
      transition: 'box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>

      {/* אזור עליון: תמונה מימין, כותרת, תיאור, אינפו */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 3, mb: 3 }}>
        {/* תוכן טקסטואלי */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Heebo, Suez One, serif',
                color: '#7B3B1D',
                fontWeight: 900,
                fontSize: 32,
                letterSpacing: 0.7,
                flex: 1,
                textAlign: 'right',
                background: 'none',
                boxShadow: 'none',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                textShadow: '0 1px 0 #fff, 0 2px 4px #e0b08944',
              }}
            >
              {recipe.name}
            </Typography>
            <IconButton color="primary" onClick={onEdit} sx={{ ml: 1 }}>
              <EditIcon />
            </IconButton>
          </Box>
          <Typography variant="body1" sx={{ mb: 2, color: '#5D4037', lineHeight: 1.7 }}>
            {recipeData.description}
          </Typography>
          <RecipeInfoChips
            difficulty={recipeData.difficulty}
            temperature={recipeData.temperature}
            yieldValue={recipeData.yield}
            totalTime={recipeData.totalTime}
          />
        </Box>
        {/* תמונה מימין */}
        <Box sx={{ flexShrink: 0, width: 170, height: 130, borderRadius: '22px', overflow: 'hidden', boxShadow: 2, bgcolor: '#fff', border: '2px solid #F7E7C1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={recipe.imageUrl || recipe.ImageUrl || BraImg}
            alt={recipe.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>






      {/* טאבים */}
      <RecipeTabs tab={currentTab} onTabChange={setCurrentTab} />
      
      {/* תוכן לפי טאב */}
      {currentTab === "ingredients" && (
        <RecipeIngredientsTable ingredients={ingredients} />
      )}
      {currentTab === "steps" && (
        <RecipeStepsPanel steps={steps} />
      )}
      {currentTab === "costs" && (
        <RecipeCostsPanel costBreakdown={costBreakdown} />
      )}
    </Box>
  );
}
