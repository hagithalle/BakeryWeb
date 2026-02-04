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
    console.log("Categories:", categories);
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
  console.log("Ingredients:", rows);
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
    // התאמה למבנה Ingredient.cs
    const categoryObj = categories.find(c => c.label === ingredient.category || c.value === ingredient.category);
    const categoryValue = categoryObj ? categoryObj.value : ingredient.category;
    const ingredientToSave = {
      name: ingredient.name,
      unit: ingredient.unit,
      category: categoryValue,
      pricePerKg: ingredient.pricePerKg || 0,
      stockQuantity: ingredient.stockQuantity || 0
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
  const filteredRows = useMemo(() => {
    return rows
      .map(row => ({
        ...row,
        category: categoryLabels[row.category] || row.category
      }))
      .filter(row => {
        const matchesName = row.name.includes(search);
        const matchesCategory = !category || row.category === categoryLabels[category] || row.category === category;
        return matchesName && matchesCategory;
      });
  }, [search, category, rows, strings]);

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
          setSelectedIngredient(row);
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
        strings={strings}
        initialValues={selectedIngredient}
      />
    </Box>
  );
}