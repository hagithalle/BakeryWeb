import React, { useState } from "react";
import { Box, Typography, IconButton, Chip, Tooltip, MenuItem } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import AddButton from "../AddButton";
import BraImg from "../../assets/images/Bra.jpg";
import FilterBar from "../FilterBar";

export default function RecipeListSidebar({ recipes, selectedId, onSelect, onAdd, onEdit, onDelete, filter, onFilterChange, onBack }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  // הפקת רשימת קטגוריות ייחודיות
  const categories = Array.from(new Set((recipes || []).map(r => r.category).filter(Boolean)));
  // סינון מתכונים לפי חיפוש וקטגוריה
  const filteredRecipes = (recipes || []).filter(recipe => {
    const matchesSearch = !search || (recipe.name && recipe.name.includes(search));
    const matchesCategory = category === "all" || recipe.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ width: 320, bgcolor: '#F9E3D6', p: 2, borderRadius: 3, minHeight: 600, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Suez One, serif', color: '#751B13', flex: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          מתכונים
          {onBack && (
            <Tooltip title="חזור לכל המתכונים">
              <IconButton onClick={onBack} sx={{ color: '#7B5B4B', ml: 1 }}>
                <ArrowForwardIcon />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
        {/* כפתור הוספת מתכון חדש - רק אם לא פתוח מתכון */}
        {!selectedId && (
          <AddButton onClick={onAdd}>
            מתכון חדש
          </AddButton>
        )}
      </Box>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "קטגוריה",
            value: category,
            onChange: setCategory,
            options: [
              { value: "all", label: "כל הקטגוריות" },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]
          }
        ]}
        searchLabel="חפש מתכון..."
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 400 }}>
        {filteredRecipes.length === 0 && (
          <Typography sx={{ color: '#888', textAlign: 'center', mt: 4 }}>לא נמצאו מתכונים</Typography>
        )}
        {filteredRecipes.map(recipe => {
          // דוגמה: הצגת תמונה לבראוניז בלבד
          const image = recipe.imageUrl || (recipe.name && recipe.name.includes("בראוניז") ? BraImg : null);
          return (
            <Box
              key={recipe.id}
              sx={{
                display: 'flex', alignItems: 'center',
                bgcolor: selectedId === recipe.id ? '#FFE5D0' : 'transparent',
                borderRadius: 2, px: 1, py: 1, cursor: 'pointer',
                boxShadow: selectedId === recipe.id ? 2 : 0,
                border: selectedId === recipe.id ? '2px solid #E0B089' : '2px solid transparent',
                transition: 'all 0.15s',
                '&:hover': { bgcolor: '#FFE5D0' }
              }}
              onClick={() => onSelect(recipe.id)}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: selectedId === recipe.id ? '#751B13' : '#7B5B4B', fontSize: 17, mb: 0.5, lineHeight: 1 }}>{recipe.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {recipe.category && (
                    <Chip label={recipe.category} size="small" sx={{ bgcolor: '#F7E7C1', color: '#7c5c3b', fontWeight: 500, px: 1, fontSize: 13 }} />
                  )}
                  {recipe.type && (
                    <Chip label={recipe.type} size="small" sx={{ bgcolor: '#F7E7C1', color: '#7c5c3b', fontWeight: 500, px: 1, fontSize: 13 }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 18, color: '#B77B4B' }} />
                  <Typography sx={{ fontSize: 14, color: '#B77B4B', fontWeight: 500 }}>{recipe.time || recipe.prepTime || recipe.bakeTime ? `${recipe.prepTime || 0}${recipe.bakeTime ? `+${recipe.bakeTime}` : ''} דק׳` : ''}</Typography>
                  {recipe.yield && (
                    <>
                      <BakeryDiningIcon sx={{ fontSize: 18, color: '#B77B4B', ml: 1 }} />
                      <Typography sx={{ fontSize: 14, color: '#B77B4B', fontWeight: 500 }}>{recipe.yield} יח׳</Typography>
                    </>
                  )}
                </Box>
              </Box>
              {image && (
                <Box sx={{ width: 56, height: 56, borderRadius: 2, overflow: 'hidden', ml: 2, boxShadow: 1, border: '1.5px solid #E0B089', bgcolor: '#fff' }}>
                  <img src={image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
