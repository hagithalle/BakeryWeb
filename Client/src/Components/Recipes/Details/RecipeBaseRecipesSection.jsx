import React from "react";
import { Box, Typography, TextField, MenuItem, IconButton, Button, Collapse, Alert } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CalculateIcon from '@mui/icons-material/Calculate';
import { UnitTypeOptions } from "../../../utils/unitEnums";

/**
 * רכיב להוספת מתכונים בסיסיים למתכון מורכב
 * לדוגמה: סנדוויץ שמכיל לחמנייה + סלט טונה
 * 
 * @param {Array} baseRecipes - רשימת מתכונים בסיסיים נוכחיים
 * @param {Array} availableRecipes - רשימת כל המתכונים הקיימים
 * @param {Function} onAddBaseRecipe - callback להוספת מתכון בסיסי
 * @param {Function} onRemoveBaseRecipe - callback להסרת מתכון בסיסי
 * @param {Function} onUpdateBaseRecipe - callback לעדכון מתכון בסיסי
 */
export default function RecipeBaseRecipesSection({
  baseRecipes = [],
  availableRecipes = [],
  onAddBaseRecipe,
  onRemoveBaseRecipe,
  onUpdateBaseRecipe
}) {
  const [selectedRecipeId, setSelectedRecipeId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [showCalculator, setShowCalculator] = React.useState(false);
  const [baseRecipeYields, setBaseRecipeYields] = React.useState("");
  const [baseRecipeUnit, setBaseRecipeUnit] = React.useState(0); // UnitType enum value
  const [currentRecipeNeeds, setCurrentRecipeNeeds] = React.useState("");
  const [currentRecipeUnit, setCurrentRecipeUnit] = React.useState(0); // UnitType enum value

  // Map UnitType (recipe output) to UnitOfMeasure enum value for RecipeItem
  const mapUnitTypeToEnum = (unitType) => {
    const mapping = {
      0: 5,  // Piece → Unit
      1: 5,  // Whole → Unit
      2: 5,  // Portion → Unit
      3: 7,  // Box → Package
      4: 6,  // Dozen → Dozen
      5: 1,  // Kilogram → Kilogram
      6: 2,  // Gram → Gram
      7: 3   // Liter → Liter
    };
    return mapping[unitType] ?? 5; // Default to Unit
  };

  // Get selected recipe data
  const selectedRecipe = React.useMemo(() => {
    if (!selectedRecipeId) return null;
    return availableRecipes.find(r => (r.id || r.Id) === parseInt(selectedRecipeId));
  }, [selectedRecipeId, availableRecipes]);

  // Auto-fill base recipe yields when selecting a recipe or when recipe data changes
  React.useEffect(() => {
    if (selectedRecipe) {
      const outputUnits = selectedRecipe.outputUnits || selectedRecipe.OutputUnits || 1;
      const outputUnitType = selectedRecipe.outputUnitType || selectedRecipe.OutputUnitType || 0;
      setBaseRecipeYields(outputUnits.toString());
      setBaseRecipeUnit(outputUnitType); // Use UnitType directly
    } else {
      setBaseRecipeYields("");
      setBaseRecipeUnit(0); // Reset to Piece
    }
  }, [selectedRecipe]);

  const handleAdd = () => {
    if (!selectedRecipeId || !selectedRecipe) return;

    onAddBaseRecipe?.({
      baseRecipeId: parseInt(selectedRecipeId),
      name: selectedRecipe.name || selectedRecipe.Name,
      quantity: quantity,
      unit: mapUnitTypeToEnum(baseRecipeUnit) // Convert UnitType to UnitOfMeasure
    });

    // Reset
    setSelectedRecipeId("");
    setQuantity(1);
    setShowCalculator(false);
    setBaseRecipeYields("");
    setBaseRecipeUnit(0); // Reset to Piece
    setCurrentRecipeNeeds("");
    setCurrentRecipeUnit(0); // Reset to Piece
  };

  // Convert UnitType to a common base for calculation
  const convertToBase = (value, unitType) => {
    const conversions = {
      0: 1,       // Piece (base)
      1: 1,       // Whole (base)
      2: 1,       // Portion (base)
      3: 1,       // Box (base)
      4: 12,      // Dozen = 12 units
      5: 1000,    // Kilogram = 1000 g
      6: 1,       // Gram (base)
      7: 1000     // Liter = 1000 mL
    };
    return value * (conversions[unitType] || 1);
  };

  const handleCalculate = () => {
    const yields = parseFloat(baseRecipeYields) || 0;
    const needs = parseFloat(currentRecipeNeeds) || 0;
    
    if (yields > 0 && needs > 0) {
      // Convert both to same base unit
      const baseInCommon = convertToBase(yields, baseRecipeUnit);
      const needsInCommon = convertToBase(needs, currentRecipeUnit);
      
      const calculated = needsInCommon / baseInCommon;
      setQuantity(parseFloat(calculated.toFixed(3)));
    }
  };

  const getRecipeName = (recipeId) => {
    const recipe = availableRecipes.find(r => (r.id || r.Id) === recipeId);
    return recipe ? (recipe.name || recipe.Name) : "לא ידוע";
  };

  const getUnitLabel = (unit) => {
    const labels = {
      Unit: "יח'",
      Kilogram: "ק\"ג",
      Gram: "גרם",
      Liter: "ליטר",
      Milliliter: "מ\"ל",
      Dozen: "תריסר",
      Package: "חבילה",
      Teaspoon: "כפית",
      Tablespoon: "כף",
      Cup: "כוס"
    };
    return labels[unit] || unit;
  };

  const getUnitEnumLabel = (unitEnum) => {
    const labels = {
      1: "ק\"ג",      // Kilogram
      2: "גרם",     // Gram
      3: "ליטר",   // Liter
      4: "מ\"ל",     // Milliliter
      5: "יח'",      // Unit
      6: "תריסר", // Dozen
      7: "חבילה",  // Package
      8: "כפית",   // Teaspoon
      9: "כף",      // Tablespoon
      10: "כוס"    // Cup
    };
    return labels[unitEnum] || "יח'";
  };

  const getUnitTypeLabel = (unitType) => {
    const labels = {
      0: "חתיכה",
      1: "עוגה שלמה",
      2: "מנה",
      3: "קופסה",
      4: "תריסר",
      5: "ק\"ג",
      6: "גרם",
      7: "ליטר",
      Piece: "חתיכה",
      Whole: "עוגה שלמה",
      Portion: "מנה",
      Box: "קופסה",
      Dozen: "תריסר",
      Kilogram: "ק\"ג",
      Gram: "גרם",
      Liter: "ליטר"
    };
    return labels[unitType] || "יחידה";
  };

  const getRecipeOutputInfo = (recipe) => {
    if (!recipe) return "";
    const outputUnits = recipe.outputUnits || recipe.OutputUnits || 1;
    const outputUnitType = recipe.outputUnitType || recipe.OutputUnitType || 0;
    const unitLabel = getUnitTypeLabel(outputUnitType);
    return ` (מייצר ${outputUnits} ${unitLabel})`;
  };

  return (
    <Box sx={{ bgcolor: "#FFF7F2", p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 700, color: "#7B5B4B", mb: 2 }}>
        מתכונים בסיסיים (אופציונלי)
      </Typography>
      
      <Typography variant="body2" sx={{ color: "#5D4037", mb: 2, fontStyle: "italic" }}>
        אם המתכון הזה מורכב ממתכונים אחרים (לדוגמה: סנדוויץ = לחמנייה + סלט טונה), הוסף אותם כאן
      </Typography>

      {/* רשימת מתכונים בסיסיים קיימים */}
      {baseRecipes && baseRecipes.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {baseRecipes.map((br, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
                p: 1.5,
                bgcolor: "#FFFFFF",
                borderRadius: 2,
                border: "1px solid #D7CCC8"
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#5D4037" }}>
                  {br.name || getRecipeName(br.baseRecipeId)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#8D6E63", display: "block", mt: 0.5 }}>
                  {(() => {
                    const recipe = availableRecipes.find(r => (r.id || r.Id) === br.baseRecipeId);
                    return recipe ? getRecipeOutputInfo(recipe) : "";
                  })()}
                </Typography>
                <Typography variant="caption" sx={{ color: "#1976D2", display: "block", mt: 0.5, fontWeight: 500 }}>
                  כמות: {br.quantity} {getUnitEnumLabel(br.unit)}
                </Typography>
              </Box>
              
              <TextField
                type="number"
                label="כמות"
                value={br.quantity}
                onChange={e => onUpdateBaseRecipe?.(idx, { ...br, quantity: parseFloat(e.target.value) || 1 })}
                sx={{ width: 120, bgcolor: "#FFFFFF" }}
                size="small"
                inputProps={{ min: 0.01, step: 0.01 }}
                helperText="ניתן לעריכה"
              />
              
              <IconButton
                onClick={() => onRemoveBaseRecipe?.(idx)}
                size="small"
                sx={{ 
                  color: "#D84315",
                  bgcolor: "#FFEBEE",
                  "&:hover": { bgcolor: "#FFCDD2" }
                }}
                title="הסר מתכון"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* הוספת מתכון בסיסי חדש */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
          <TextField
            select
            label="בחר מתכון"
            value={selectedRecipeId}
            onChange={e => setSelectedRecipeId(e.target.value)}
            sx={{ flexGrow: 1, bgcolor: "#FFFFFF" }}
            size="small"
          >
            <MenuItem value="">
              <em>בחר מתכון...</em>
            </MenuItem>
            {availableRecipes.map(recipe => (
                <MenuItem key={recipe.id || recipe.Id} value={recipe.id || recipe.Id}>
                  {recipe.name || recipe.Name}{getRecipeOutputInfo(recipe)}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            type="number"
            label="כמות (מכפיל)"
            value={quantity}
            onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
            sx={{ width: 120, bgcolor: "#FFFFFF" }}
            size="small"
            inputProps={{ min: 0.01, step: 0.01 }}
            helperText="כמה פעמים המתכון"
          />

          <IconButton
            onClick={() => setShowCalculator(!showCalculator)}
            sx={{ 
              bgcolor: "#E3F2FD", 
              "&:hover": { bgcolor: "#BBDEFB" },
              color: "#1976D2"
            }}
            size="small"
          >
            <CalculateIcon />
          </IconButton>

          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!selectedRecipeId}
            sx={{
              bgcolor: "#7B5B4B",
              "&:hover": { bgcolor: "#5D4037" },
              minWidth: 100
            }}
          >
            <AddIcon sx={{ mr: 0.5 }} /> הוסף
          </Button>
        </Box>

        {/* מחשבון עזר */}
        <Collapse in={showCalculator}>
          <Box sx={{ 
            p: 2, 
            bgcolor: "#E3F2FD", 
            borderRadius: 2,
            border: "1px solid #90CAF9"
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1565C0", mb: 1.5 }}>
              🧮 מחשבון כמות
            </Typography>
            
            {selectedRecipeId && (
              <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: "#0D47A1", fontWeight: 500 }}>
                {(() => {
                  const recipe = availableRecipes.find(r => (r.id || r.Id) === parseInt(selectedRecipeId));
                  return recipe ? `${recipe.name || recipe.Name}${getRecipeOutputInfo(recipe)}` : "";
                })()}
              </Typography>
            )}
            
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
              <Box sx={{ 
                display: "flex", 
                flexDirection: "column",
                flexGrow: 1, 
                minWidth: "250px",
                p: 1.5,
                bgcolor: "#F5F5F5",
                borderRadius: 2
              }}>
                <Typography variant="caption" sx={{ color: "#757575", mb: 0.5 }}>
                  המתכון הבסיסי מספיק ל:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: "#5D4037" }}>
                  {baseRecipeYields} {getUnitTypeLabel(baseRecipeUnit)}
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", gap: 1, flexGrow: 1, minWidth: "250px" }}>
                <TextField
                  type="number"
                  label="אני צריך/ה..."
                  placeholder="1"
                  value={currentRecipeNeeds}
                  onChange={e => setCurrentRecipeNeeds(e.target.value)}
                  sx={{ flexGrow: 1, bgcolor: "#FFFFFF" }}
                  size="small"
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
                <TextField
                  select
                  label="סוג יחידה"
                  value={currentRecipeUnit}
                  onChange={e => setCurrentRecipeUnit(parseInt(e.target.value))}
                  sx={{ minWidth: 150, bgcolor: "#FFFFFF" }}
                  size="small"
                >
                  {UnitTypeOptions.map(unit => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleCalculate}
                disabled={!baseRecipeYields || !currentRecipeNeeds}
                sx={{ 
                  bgcolor: "#1976D2",
                  "&:hover": { bgcolor: "#1565C0" }
                }}
              >
                חשב
              </Button>
            </Box>

            {quantity > 0 && baseRecipeYields && currentRecipeNeeds && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>תוצאה:</strong> צריך <strong>{quantity}</strong> פעמים את המתכון
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  חישוב: {currentRecipeNeeds} {getUnitTypeLabel(currentRecipeUnit)} ÷ {baseRecipeYields} {getUnitTypeLabel(baseRecipeUnit)} = {quantity}
                </Typography>
                {baseRecipeUnit !== currentRecipeUnit && (
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontStyle: "italic", color: "#1565C0" }}>
                    * המערכת מבצעת המרה אוטומטית בין היחידות
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}
