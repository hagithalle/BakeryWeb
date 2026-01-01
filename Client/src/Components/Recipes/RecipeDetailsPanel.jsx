import React from "react";
import { Box, Typography } from "@mui/material";

export default function RecipeDetailsPanel({ recipe, onEdit, onDelete, tab, onTabChange }) {
  return (
    <Box sx={{ flex: 1, bgcolor: '#FFF7F2', p: 3, borderRadius: 3, minHeight: 600 }}>
      <Typography variant="h5" sx={{ fontFamily: 'Suez One, serif', color: '#751B13', mb: 2 }}>
        {recipe ? recipe.name : "בחרי מתכון"}
      </Typography>
      {/* כאן יבואו תמונה, טאבים, טבלאות וכו' */}
    </Box>
  );
}
