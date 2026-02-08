import React, { useState, useMemo } from "react";
import { Typography, Box } from "@mui/material";
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
  const columns = [
    { field: "name", headerName: strings.sidebar?.ingredients || "שם" },
    { field: "category", headerName: strings.filter?.category || "קטגוריה" },
    { field: "unit", headerName: strings.product?.unit || "יחידה" },
    { field: "pricePerKg", headerName: strings.ingredient?.pricePerKg || "מחיר לק\"ג" },
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
          stockQuantity: stockDisplay
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
      {filteredRows.length === 0 && (
        <Typography variant="body1" sx={{ color: '#751B13', mb: 2 }}>
          אין חומרים להצגה. ניתן להוסיף חומרים חדשים.
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
        <button
          style={{
            background: '#751B13',
            color: 'white',
            fontFamily: 'Suez One, serif',
            fontSize: 18,
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0001',
            transition: 'background 0.2s',
            marginLeft: 0,
            marginRight: 0
          }}
          onClick={() => setDialogOpen(true)}
        >
          {strings.ingredient.add}
        </button>
      </Box>
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