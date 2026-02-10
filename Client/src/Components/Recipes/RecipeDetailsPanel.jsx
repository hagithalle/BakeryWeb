import React, { useState, useMemo } from "react";
import { Box, Typography, IconButton, Chip, Grid } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TimerIcon from '@mui/icons-material/Timer';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
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
    <Box sx={{ flex: 1, bgcolor: '#FFF7F2', p: 3, borderRadius: 3, minHeight: 600 }}>
      {/* כותרת ופעולות */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: 'Suez One, serif', color: '#751B13', flex: 1 }}>
          {recipe.name}
        </Typography>
        <IconButton color="primary" onClick={onEdit} sx={{ ml: 1 }}>
          <EditIcon />
        </IconButton>
      </Box>

      {/* תמונת המתכון */}
      {(recipe.imageUrl || recipe.ImageUrl) && (
        <Box
          sx={{
            width: '100%',
            height: 250,
            mb: 3,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px dashed #D7CCC8'
          }}
        >
          <img
            src={recipe.imageUrl || recipe.ImageUrl}
            alt={recipe.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
      )}

      {/* תיאור */}
      <Typography variant="body1" sx={{ mb: 3, color: '#5D4037', lineHeight: 1.7 }}>
        {recipeData.description}
      </Typography>

      {/* מידע מהיר */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {recipeData.difficulty && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 1
            }}>
              <SignalCellularAltIcon sx={{ color: '#D84315' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">קטגוריה</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {recipeData.difficulty}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        {recipeData.temperature > 0 && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 1
            }}>
              <ThermostatIcon sx={{ color: '#D84315' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">טמפרטורה</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {recipeData.temperature}°C
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 1
          }}>
            <BakeryDiningIcon sx={{ color: '#D84315' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">תפוקה</Typography>
              <Typography variant="body2" fontWeight="bold">
                {recipeData.yield} יחידות
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        {recipeData.totalTime > 0 && (
          <Grid item xs={6} sm={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: 1,
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <TimerIcon sx={{ color: '#D84315' }} />
                <Typography variant="caption" color="text.secondary">זמן הכנה</Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 4 }}>
                {recipeData.prepTime > 0 && `הכנה: ${recipeData.prepTime} דק׳${recipeData.bakeTime > 0 ? ' • ' : ''}`}
                {recipeData.bakeTime > 0 && `אפייה: ${recipeData.bakeTime} דק׳`}
              </Typography>
              <Typography variant="caption" sx={{ ml: 4, color: '#D84315', fontWeight: 'bold' }}>
                סה״כ: {recipeData.totalTime} דקות
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

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
