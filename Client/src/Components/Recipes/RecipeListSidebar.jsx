import React, { useState } from "react";
import { Box, Typography, IconButton, MenuItem, Select, InputBase, Paper } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddButton from "../AddButton";

export default function RecipeListSidebar({ recipes, selectedId, onSelect, onAdd, onEdit, onDelete, filter, onFilterChange, categories, selectedCategory, onCategoryChange }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(selectedCategory || "all");

  // סינון מתכונים לפי חיפוש וקטגוריה
  const filteredRecipes = (recipes || []).filter(recipe => {
    const matchesSearch = !search || (recipe.name && recipe.name.includes(search));
    const matchesCategory = category === "all" || recipe.categoryId === category || recipe.category === category || recipe.categoryName === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ width: 350, bgcolor: '#F9E3D6', p: 2, borderRadius: 3, minHeight: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontFamily: 'Suez One, serif', color: '#751B13' }}>
          מתכונים
        </Typography>
        <AddButton onClick={onAdd}>
          מתכון חדש
        </AddButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Select
          value={category}
          onChange={e => { setCategory(e.target.value); onCategoryChange && onCategoryChange(e.target.value); }}
          sx={{ bgcolor: '#fff', borderRadius: 2, minWidth: 120, fontFamily: 'inherit', fontSize: 15 }}
        >
          <MenuItem value="all">כל הקטגוריות</MenuItem>
          {(categories || []).map(cat => (
            <MenuItem key={cat.id || cat.name} value={cat.id || cat.name}>{cat.name}</MenuItem>
          ))}
        </Select>
        <Paper component="form" sx={{ p: '2px 6px', display: 'flex', alignItems: 'center', flex: 1, bgcolor: '#fff', borderRadius: 2 }}>
          <InputBase
            sx={{ ml: 1, flex: 1, fontFamily: 'inherit', fontSize: 15 }}
            placeholder="חיפוש מתכון..."
            value={search}
            onChange={e => { setSearch(e.target.value); onFilterChange && onFilterChange(e.target.value); }}
            inputProps={{ 'aria-label': 'search recipes' }}
          />
        </Paper>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 400 }}>
        {filteredRecipes.length === 0 && (
          <Typography sx={{ color: '#888', textAlign: 'center', mt: 4 }}>לא נמצאו מתכונים</Typography>
        )}
        {filteredRecipes.map(recipe => (
          <Box
            key={recipe.id}
            sx={{
              display: 'flex', alignItems: 'center',
              bgcolor: selectedId === recipe.id ? '#FFE5D0' : 'transparent',
              borderRadius: 2, px: 1, py: 0.5, cursor: 'pointer',
              '&:hover': { bgcolor: '#FFE5D0' }
            }}
            onClick={() => onSelect(recipe.id)}
          >
            <Typography sx={{ flex: 1, fontWeight: 500 }}>{recipe.name}</Typography>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onEdit(recipe); }}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(recipe); }}><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
