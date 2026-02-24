import React, { useState } from "react";
import { Box, Typography, IconButton, Chip, Tooltip, MenuItem } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import AddButton from "../AddButton";
import BraImg from "../../assets/images/Bra.jpg";
import RecipesFilterBar from "./RecipesFilterBar";
import { MAIN_RECIPE_CATEGORIES, getSubCategoryOptions, RECIPE_TYPES, KOSHER_TYPES } from "../../constants/categories";
import useLocaleStrings from "../../hooks/useLocaleStrings";

export default function RecipeListSidebar({ recipes, selectedId, onSelect, onAdd, onEdit, onDelete, filter, onFilterChange, onBack, strings: stringsProp }) {
  const strings = stringsProp || useLocaleStrings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  // Handler to reset type when main category changes
  const handleMainCategoryChange = (newCategory) => {
    setCategory(newCategory);
    // Reset type if not 'kosher' or 'type'
    if (newCategory !== "kosher" && newCategory !== "type") {
      setType("all");
    }
  };

  // קטגוריות ראשיות וסוגים דינמיים - הכל בקובץ חיצוני
  const mainCategoryOptions = MAIN_RECIPE_CATEGORIES;
  const subCategoryOptions = getSubCategoryOptions(category);
  // סינון מתכונים לפי חיפוש, קטגוריה וסוג
  // עוזר למציאת label לפי value
 // עוזר למציאת label לפי value
function getTypeLabel(value) {
  const allTypes = [...RECIPE_TYPES, ...KOSHER_TYPES];
  const found = allTypes.find(opt => opt.value === value);
  return found ? found.label : value;
}

const filteredRecipes = (recipes || []).filter((recipe) => {
  // חיפוש חופשי בשם
  const name = recipe.name || "";
  const matchesSearch =
    !search || name.toLowerCase().includes(search.toLowerCase());

  // ברירת מחדל – לא מסננים לפי recipe.category
  let matchesCategory = true;

  // אם בעתיד יהיו קטגוריות אמיתיות (לא "type"/"kosher") אפשר לסנן כאן:
  if (category !== "all" && category !== "type" && category !== "kosher") {
    matchesCategory = recipe.category === category;
  }

  // סינון לפי סוג / כשרות
  let matchesType = true;

  if (category === "type") {
    // סינון לפי סוג מתכון (עוגות/עוגיות/לחמים...) מתוך RECIPE_TYPES
    if (type !== "all") {
      // כאן אני מניח ש־recipe.category מחזיק את סוג המתכון (עוגות/עוגיות/לחמים)
      matchesType =
        recipe.category === type ||
        getTypeLabel(recipe.category) === getTypeLabel(type);
    }
  } else if (category === "kosher") {
    // סינון לפי כשרות (חלבי/בשרי/פרווה) מתוך KOSHER_TYPES
    if (type !== "all") {
      const kosherValue = recipe.kosherType ?? recipe.recipeType; // תעדכני לפי השדה האמיתי שלך
      matchesType =
        kosherValue === type ||
        String(kosherValue) === String(type) ||
        getTypeLabel(kosherValue) === getTypeLabel(type);
    }
  }

  return matchesSearch && matchesCategory && matchesType;
});

  return (
    <Box sx={{ width: 320, bgcolor: '#F9E3D6', p: 2, borderRadius: 3, minHeight: '100vh', boxShadow: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Heebo, Suez One, serif',
            color: '#7B3B1D',
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: 0.7,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textAlign: 'right',
            background: 'none',
            boxShadow: 'none',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            textShadow: '0 1px 0 #fff, 0 2px 4px #e0b08944',
          }}
        >
          {strings.sidebar?.recipes || "מתכונים"}
          {onBack && (
            <Tooltip title={strings.sidebar?.backToAllRecipes || "חזור לכל המתכונים"}>
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
      <RecipesFilterBar
        search={search}
        onSearchChange={setSearch}
        mainCategory={category}
        onMainCategoryChange={handleMainCategoryChange}
        mainCategoryOptions={mainCategoryOptions}
        subCategory={type}
        onSubCategoryChange={setType}
        subCategoryOptions={subCategoryOptions}
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
                  {typeof recipe.recipeType !== 'undefined' && (
                    <Chip label={recipe.recipeType === 0 ? 'חלבי' : recipe.recipeType === 1 ? 'בשרי' : 'פרווה'} size="small" sx={{ bgcolor: '#E3F7D6', color: '#4B7B5B', fontWeight: 500, px: 1, fontSize: 13 }} />
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
