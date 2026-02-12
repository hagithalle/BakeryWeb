import React, { useState, useMemo } from "react";
import { Typography, Box, Chip } from "@mui/material";
import AddButton from "../Components/AddButton";
import GenericFilter from "../Components/GenericFilter";
import GenericTable from "../Components/GenericTable";
import IngredientDialog from "../Components/IngredientDialog";
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIngredients, addIngredient, deleteIngredient, editIngredient, fetchCategories, addCategory } from '../Services/ingredientsService';




const mockCategories = [
  { value: "dairy", label: "מוצרי חלב" },
  { value: "grain", label: "דגנים" },
  { value: "sweetener", label: "ממתיקים" },
  { value: "other", label: "אחר" }
];


export default function IngredientsPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  
  // צבעים לקטגוריות
  const categoryColors = {
    "מוצרי חלב": { bg: "#F5E6E0", text: "#971936" },
    "דגנים": { bg: "#FFF8F3", text: "#9B5A25" },
    "ממתיקים": { bg: "#FFF3E6", text: "#C98929" },
    "אחר": { bg: "#F0E8E4", text: "#9B5A25" }
  };
  
  const columns = [
    { field: "name", headerName: strings.sidebar?.ingredients || "שם" },
    { 
      field: "category", 
      headerName: strings.filter?.category || "קטגוריה",
      renderCell: (row) => {
        const colors = categoryColors[row.category] || { bg: "#F5E6E0", text: "#971936" };
        return (
          <Chip 
            label={row.category} 
            size="small"
            sx={{ 
              backgroundColor: colors.bg,
              color: colors.text,
              fontWeight: 500,
              borderRadius: 2
            }}
          />
        );
      }
    },
    { field: "unit", headerName: strings.product?.unit || "יחידה" },
    { field: "pricePerKg", headerName: strings.ingredient?.pricePerKg || "מחיר ליחידה" },
    { field: "supplier", headerName: "ספק" },
    { field: "stockQuantity", headerName: strings.ingredient?.stockQuantity || "כמות במלאי" }
  ];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
    // קבלת קטגוריות מהשרת
    const { data: rawCategories = [], isLoading: catLoading, error: catError } = useQuery({
      queryKey: ['categories'],
      queryFn: fetchCategories
    });
    // הפוך את הקטגוריות לפורמט value/label
    const categories = rawCategories.map(cat => ({ value: cat.value, label: cat.name }));
  
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
  
  const queryClient = useQueryClient();
  const editMutation = useMutation({
    mutationFn: editIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
    }
  });

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: fetchIngredients
  });
  const mutation = useMutation({
    mutationFn: addIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries(['ingredients']);
    }
  });

  const handleAddIngredient = (ingredient) => {
    // בדיקת כפילויות - רק בעת הוספה חדשה (לא בעריכה)
    if (!selectedIngredient) {
      const existingIngredient = rows.find(
        row => row.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
      );
      if (existingIngredient) {
        const errorMsg = strings.ingredient?.duplicateError?.replace('{name}', ingredient.name) 
          || `חומר גלם "${ingredient.name}" כבר קיים במערכת!`;
        alert(errorMsg);
        return;
      }
    }
    
    // ingredient כבר מגיע עם הערכים הנכונים (מספרים) מה-dialog
    const ingredientToSave = {
      name: ingredient.name,
      unit: ingredient.unit,
      category: ingredient.category,
      pricePerKg: ingredient.pricePerKg || 0,
      stockQuantity: ingredient.stockQuantity || 0,
      stockUnit: ingredient.stockUnit || ingredient.unit
    };
    if (selectedIngredient) {
      editMutation.mutate({ ...selectedIngredient, ...ingredientToSave });
    } else {
      mutation.mutate(ingredientToSave);
    }
    setDialogOpen(false);
    setSelectedIngredient(null);
  };

  const categoryLabels = strings.ingredient?.categoryValues || {};
  const unitLabels = strings.ingredient?.unitValues || {};
  const filteredRows = useMemo(() => {
    return rows
      .map(row => {
        const unitObj = units.find(u => u.value === row.unit);
        const unitLabel = unitObj ? unitLabels[unitObj.label] || unitObj.label : row.unit;

        const stockUnitValue = row.stockUnit || row.unit;
        const stockUnitObj = units.find(u => u.value === stockUnitValue);
        const stockUnitLabel = stockUnitObj ? unitLabels[stockUnitObj.label] || stockUnitObj.label : stockUnitValue;
        const stockDisplay = `${row.stockQuantity} ${stockUnitLabel}`;
        
        // המרת category ממספר לשם ואז לתרגום
        const categoryObj = categories.find(c => c.value === row.category);
        const categoryLabel = categoryObj ? categoryLabels[categoryObj.label] || categoryObj.label : row.category;
        
        return {
          ...row,
          originalCategory: row.category,  // שמירת הערכים המקוריים
          originalUnit: row.unit,
          originalStockQuantity: row.stockQuantity,
          originalStockUnit: stockUnitValue,
          category: categoryLabel,
          unit: unitLabel,
          stockQuantity: stockDisplay,
          supplier: "-" // ספק - לא ממומש כרגע
        };
      })
      .filter(row => {
        const matchesName = row.name.includes(search);
        const matchesCategory = !category || row.category === categoryLabels[category] || row.category === category;
        return matchesName && matchesCategory;
      });
  }, [search, category, rows, strings, units, categories]);

  if (isLoading || catLoading) return <div>טוען...</div>;
  if (error || catError) return <div>שגיאה בטעינת נתונים</div>;

  

  return (
    <Box>
      {/* Header with Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <AddButton onClick={() => setDialogOpen(true)}>
          {strings.ingredient?.add || "הוסף חומר גלם"}
        </AddButton>
      </Box>

      {filteredRows.length === 0 && (
        <Typography variant="body1" sx={{ color: '#971936', mb: 2 }}>
          אין חומרים להצגה. ניתן להוסיף חומרים חדשים.
        </Typography>
      )}
      
      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <GenericFilter
          searchValue={search}
          onSearchChange={setSearch}
          categoryValue={category}
          onCategoryChange={setCategory}
          categories={categories.map(cat => ({ ...cat, label: strings.ingredient?.categoryValues?.[cat.label] || cat.label }))}
          searchLabel={strings.filter.search}
          categoryLabel={strings.filter.category}
          strings={strings}
        />
      </Box>
      
      {/* Table */}
      <GenericTable
        columns={columns}
        rows={filteredRows}
        direction={strings.direction}
        actions={["edit", "delete"]}
        onEdit={(row) => {
          // שליחת הערכים המקוריים ל-dialog
          setSelectedIngredient({
            ...row,
            category: row.originalCategory,
            unit: row.originalUnit,
            stockQuantity: row.originalStockQuantity,
            stockUnit: row.originalStockUnit
          });
          setDialogOpen(true);
        }}
        onDelete={(row) => {
          if (window.confirm(strings.ingredient.deleteConfirm + ' ' + row.name + '?')) {
            deleteMutation.mutate(row.id);
          }
        }}
      />
      <IngredientDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedIngredient(null);
        }}
        onSave={handleAddIngredient}
        categories={categories}
        units={units}
        strings={strings}
        initialValues={selectedIngredient}
      />
    </Box>
  );
}