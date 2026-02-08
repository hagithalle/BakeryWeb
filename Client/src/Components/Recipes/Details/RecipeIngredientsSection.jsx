import React, { useState, useEffect } from "react";
import { useIngredientsList, useRefreshIngredients } from "../../../context/IngredientsContext";
import { Box, Typography, Button, IconButton, TextField, MenuItem, Autocomplete, Paper } from "@mui/material";
import IngredientDialog from "../../IngredientDialog";
import { fetchCategories } from "../../../Services/ingredientsService";
import { useLanguage } from "../../../context/LanguageContext";
import useLocaleStrings from "../../../hooks/useLocaleStrings";
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

export default function RecipeIngredientsSection({
  ingredients,       // אם לא בשימוש – אפשר למחוק
  onAddIngredient,   // פונקציה מההורה שמקבלת { name, amount, unit }
  addIngredient      // אם לא בשימוש – אפשר למחוק
}) {
  const ingredientsList = useIngredientsList();
  const refreshIngredients = useRefreshIngredients();
  // דיאלוג – אם לא משתמשים, אפשר למחוק הכל
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [pendingIngredient, setPendingIngredient] = useState({});
  const [addIngredientError, setAddIngredientError] = useState("");
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [categories, setCategories] = useState([]);
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);

  // יחידות מידה מוגדרות מראש (תואם ל-UnitOfMeasure enum)
  const units = [
    { value: 1, label: "Kilogram" },
    { value: 2, label: "Gram" },
    { value: 3, label: "Liter" },
    { value: 4, label: "Milliliter" },
    { value: 5, label: "Unit" },
    { value: 6, label: "Dozen" },
    { value: 7, label: "Package" },
    { value: 8, label: "Teaspoon" },
    { value: 9, label: "Tablespoon" },
    { value: 10, label: "Cup" }
  ];

  useEffect(() => {
    fetchCategories().then(data => {
      const mapped = (data || []).map(cat => ({ value: cat.value, label: cat.name }));
      setCategories(mapped);
    });
  }, []);

  // שורות הוספה inline
  const [addRows, setAddRows] = useState([]);

  // פתיחת דיאלוג "חומר גלם חדש"
  const handleOpenDialog = () => {
    setPendingIngredient({});
    setAddIngredientError("");
    setShowAddIngredientDialog(true);
  };

  // הוספת שורת מרכיב חדשה
  const handleOpenAddRow = () => {
    setAddRows(rows => [...rows, { ingredientId: '', amount: '', unit: '' }]);
  };

  // ביטול שורה מסוימת
  const handleCancelAddRow = idx => {
    setAddRows(rows => rows.filter((_, i) => i !== idx));
  };

  // אישור שורה – שולח להורה ומוחק רק אותה
  const handleConfirmAddRow = idx => {
    const row = addRows[idx];
    if (!row.ingredientId || !row.amount || !row.unit) return;

    if (onAddIngredient) {
      // שלח את כל המידע כולל שם החומר גלם
      const ingredient = ingredientsList.find(i => i.id === Number(row.ingredientId));
      onAddIngredient({
        ingredientId: row.ingredientId,
        name: ingredient ? ingredient.name : '',
        amount: row.amount,
        unit: row.unit
      });
    }

    setAddRows(rows => rows.filter((_, i) => i !== idx));
  };

  // הוספת חומר גלם חדש בפועל
  const handleSaveIngredient = async (ingredient) => {
    setAddingIngredient(true);
    setAddIngredientError("");
    try {
      const { addIngredient } = await import("../../../Services/ingredientsService");
      await addIngredient(ingredient);
      setShowAddIngredientDialog(false);
      setPendingIngredient({});
      refreshIngredients(); // רענון הרשימה הגלובלית
    } catch (err) {
      setAddIngredientError("שגיאה בהוספה: " + (err?.message || ""));
      throw err; // זורקים את השגיאה כדי שהדיאלוג יישאר פתוח
    } finally {
      setAddingIngredient(false);
    }
  };

  // אם תרצי באמת דיאלוג – צריך להוסיף JSX של <Dialog> כאן.
  // כרגע זה רק לוגיקה שלא מוצגת במסך, אז אפשר למחוק את כל מה שקשור לזה.

  console.log('ingredientsList', ingredientsList);
  return (
    <Box sx={{ mb: 2 }}>
      {/* כותרת + כפתורים בשורה אחת */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: "#7B5B4B", fontSize: 20 }}>
          מרכיבים
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon sx={{ ml: 1 }} />}
            onClick={handleOpenAddRow}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              bgcolor: "#fff",
              color: "#5D4037",
              borderColor: "#D4A574",
              minWidth: 120
            }}
          >
            הוסף מרכיב
          </Button>

          <Button
            variant="outlined"
            startIcon={<Inventory2OutlinedIcon sx={{ ml: 1 }} />}
            onClick={handleOpenDialog}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              color: "#A97A4C",
              borderColor: "#A97A4C",
              minWidth: 140
            }}
          >
            חומר גלם חדש
          </Button>
          {/* דיאלוג הוספת חומר גלם חדש */}
          <IngredientDialog
            open={showAddIngredientDialog}
            onClose={() => setShowAddIngredientDialog(false)}
            onSave={handleSaveIngredient}
            categories={categories}
            units={units}
            strings={strings}
            showPriceWarning={true}
          />
        </Box>
      </Box>

      {/* שורות הוספה (מופיעות רק אחרי לחיצה על "הוסף מרכיב") */}
      {addRows.map((addRow, idx) => (
        <Paper
          key={idx}
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            mb: 2,
            bgcolor: "#FFF7F2",
            borderRadius: 3
          }}
        >
          {/* כפתור ביטול */}
          <IconButton onClick={() => handleCancelAddRow(idx)} sx={{ color: "#D32F2F", ml: 0.5 }}>
            <CloseIcon />
          </IconButton>

          {/* בחירת חומר גלם */}
          <TextField
            select
            value={addRow.ingredientId || ''}
            onChange={e => {
              setAddRows(rows =>
                rows.map((row, i) => (i === idx ? { ...row, ingredientId: e.target.value } : row))
              );
            }}
            placeholder="בחר חומר גלם"
            sx={{ minWidth: 160, bgcolor: "#FFF7F2", borderRadius: 2 }}
          >
            {(ingredientsList || []).map(i => (
              <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
            ))}
          </TextField>

          {/* כמות */}
          <TextField
            type="number"
            value={addRow.amount}
            onChange={e => {
              setAddRows(rows =>
                rows.map((row, i) => (i === idx ? { ...row, amount: e.target.value } : row))
              );
            }}
            placeholder="0"
            sx={{ minWidth: 80, bgcolor: "#FFF7F2", borderRadius: 2 }}
          />

          {/* יחידה */}
          <TextField
            select
            value={addRow.unit}
            onChange={e => {
              setAddRows(rows =>
                rows.map((row, i) => (i === idx ? { ...row, unit: e.target.value } : row))
              );
            }}
            sx={{ minWidth: 80, bgcolor: "#FFF7F2", borderRadius: 2 }}
          >
            {["גרם", "קילו", "ליטר", 'מ"ל', "יחידה", "אחר"].map(unit => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>

          {/* כפתור אישור השורה */}
          <IconButton
            onClick={() => handleConfirmAddRow(idx)}
            sx={{ ml: 0.5 }}
          >
            <AddIcon />
          </IconButton>
        </Paper>
      ))}
    </Box>
  );
}
