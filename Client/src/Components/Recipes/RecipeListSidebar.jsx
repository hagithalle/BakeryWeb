import React from "react";
import { Box, Typography } from "@mui/material";

export default function RecipeListSidebar({ recipes, selectedId, onSelect, onAdd, filter, onFilterChange }) {
  return (
    <Box sx={{ width: 320, bgcolor: '#F9E3D6', p: 2, borderRadius: 3, minHeight: 600 }}>
      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Suez One, serif', color: '#751B13' }}>
        מתכונים
      </Typography>
      {/* כאן יבואו חיפוש, פילטרים, רשימת מתכונים, כפתור הוספה */}
    </Box>
  );
}
