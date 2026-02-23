import React from "react";
import { Card, CardActionArea, CardContent, Typography, Box, Chip, Avatar } from "@mui/material";

export default function RecipeCard({ recipe, onClick }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px #e9d8c3', bgcolor: '#fff', minHeight: 180 }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        {/* תמונה */}
        {recipe.imageUrl && (
          <Box sx={{ width: '100%', height: 120, overflow: 'hidden', mb: 1, borderRadius: 2, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={recipe.imageUrl} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        )}
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="h6" sx={{ color: '#7c5c3b', fontWeight: 700, mb: 0.5, fontSize: 20 }} noWrap>{recipe.name}</Typography>
          {recipe.category && (
            <Chip label={recipe.category} size="small" sx={{ bgcolor: '#f7e7c1', color: '#7c5c3b', fontWeight: 500, mb: 1 }} />
          )}
          <Typography variant="body2" sx={{ color: '#7c5c3b', opacity: 0.7, minHeight: 36 }} noWrap>
            {recipe.description}
          </Typography>
          {/* פרטי מתכון נוספים */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {recipe.ingredients && (
              <Chip label={`רכיבים: ${recipe.ingredients.length}`} size="small" />
            )}
            {recipe.outputUnits && (
              <Chip label={`תפוקה: ${recipe.outputUnits}`} size="small" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
