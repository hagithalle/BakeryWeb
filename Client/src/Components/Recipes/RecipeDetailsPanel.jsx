import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import RecipeTabs from "./RecipeTabs";
import RecipeIngredientsTable from "./RecipeIngredientsTable";

// MOCK DATA (להחליף בנתוני אמת בהמשך)
const mockDescription = "עוגה ליום הולדת ושוקולדה עם נגיעות שוקולד עשיר בציפוי";
const mockIngredients = [
  { name: "קמח", unit: "Kg", amount: 250, sum: 1.8 },
  { name: "סוכר", unit: "Kg", amount: 200, sum: 2 },
  { name: "חמאה", unit: "Kg", amount: 100, sum: 17.5 },
  { name: "שמנת 38%", unit: "Kg", amount: 150, sum: 1.5 },
  { name: "שוקולד מריר", unit: "Kg", amount: 100, sum: 4 },
  { name: "אבקת קקאו", unit: "Kg", amount: 75, sum: 0.9 }
];

export default function RecipeDetailsPanel({ recipe, onEdit, onDelete, tab, onTabChange }) {
  const [currentTab, setCurrentTab] = useState(tab || "ingredients");

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ fontFamily: 'Suez One, serif', color: '#751B13', flex: 1 }}>
          {recipe.name}
        </Typography>
        <IconButton color="primary" onClick={onEdit} sx={{ ml: 1 }}>
          <EditIcon />
        </IconButton>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 2, color: '#7B5B4B' }}>
        {mockDescription}
      </Typography>
      <RecipeTabs tab={currentTab} onTabChange={setCurrentTab} />
      {currentTab === "ingredients" && (
        <RecipeIngredientsTable ingredients={mockIngredients} />
      )}
      {currentTab === "steps" && (
        <Box sx={{ mt: 2 }}>
          <Typography>כאן יופיעו שלבי ההכנה</Typography>
        </Box>
      )}
      {currentTab === "costs" && (
        <Box sx={{ mt: 2 }}>
          <Typography>כאן יופיעו עלויות</Typography>
        </Box>
      )}
    </Box>
  );
}
