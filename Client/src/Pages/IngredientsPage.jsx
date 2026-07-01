import React, { useState, useMemo } from "react";
import { Box, useMediaQuery } from "@mui/material";
import PageHeader from '../Components/Common/PageHeader';
import PageContainer from '../Components/Common/PageContainer';
import IngredientDialog from "../Components/IngredientDialog";

import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";

import IngredientsSummary from '../Components/Ingredients/IngredientsSummary.jsx';
import IngredientsFilters from "../Components/Ingredients/IngredientsFilters.jsx";
import IngredientsMobileList from "../Components/Ingredients/IngredientsMobileList.jsx";
import IngredientsSummary from "../Components/Ingredients/IngredientsSummary.jsx";
import IngredientsTable from "../Components/Ingredients/IngredientsTable.jsx";
import IngredientsEmptyState from "../Components/Ingredients/IngredientsEmptyState.jsx";

import ingredientsHeaderIcon from '../assets/decor/page-headers/ingredients-header-icon.svg';
import addIntegrationIcon from '../assets/icons/actions/add-integration.svg';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchIngredients,
  addIngredient,
  deleteIngredient,
  editIngredient,
  fetchCategories,
} from '../Services/ingredientsService';

import { LOW_STOCK_THRESHOLD } from '../utils/getStockStatus';

// Category colour palette
const categoryColors = {
  "מוצרי חלב": { bg: "#F5E6E0", text: "#971936" },
  "דגנים": { bg: "#FFF8F3", text: "#9B5A25" },
  "ממתיקים": { bg: "#FFF3E6", text: "#C98929" },
  "אחר": { bg: "#F0E8E4", text: "#9B5A25" },
};

export default function IngredientsPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const isMobile = useMediaQuery('(max-width:768px)');

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const { data: rawCategories = [], isLoading: catLoading, error: catError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const categories = rawCategories.map(cat => ({ value: cat.value, label: cat.name }));

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
    { value: 10, label: "Cup" },
  ];

  const queryClient = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: fetchIngredients,
  });

  const mutation = useMutation({
    mutationFn: addIngredient,
    onSuccess: () => queryClient.invalidateQueries(['ingredients']),
  });

  const editMutation = useMutation({
    mutationFn: editIngredient,
    onSuccess: () => queryClient.invalidateQueries(['ingredients']),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => queryClient.invalidateQueries(['ingredients']),
  });

  // Summary card stats derived from full (unfiltered) ingredient list
  const summaryStats = useMemo(() => {
    const total = rows.length;
    const available = rows.filter(r => r.stockQuantity > LOW_STOCK_THRESHOLD).length;
    const low = rows.filter(r => r.stockQuantity > 0 && r.stockQuantity <= LOW_STOCK_THRESHOLD).length;
    const outOfStock = rows.filter(r => r.stockQuantity === 0).length;
    return { total, available, low, outOfStock };
  }, [rows]);

  const handleAddIngredient = (ingredient) => {
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
    const ingredientToSave = {
      name: ingredient.name,
      unit: ingredient.unit,
      category: ingredient.category,
      pricePerKg: ingredient.pricePerKg || 0,
      stockQuantity: ingredient.stockQuantity || 0,
      stockUnit: ingredient.stockUnit || ingredient.unit,
    };
    if (selectedIngredient) {
      editMutation.mutate({ ...selectedIngredient, ...ingredientToSave });
    } else {
      mutation.mutate(ingredientToSave);
    }
    setDialogOpen(false);
    setSelectedIngredient(null);
  };

  const handleEdit = (row) => {
    if (!row.name || row.name.trim() === "") {
      alert("שגיאה: לרכיב אין שם. לא ניתן לערוך רכיב ללא שם.");
      return;
    }
    setSelectedIngredient({
      ...row,
      category: row.originalCategory,
      unit: row.originalUnit,
      stockQuantity: row.originalStockQuantity,
      stockUnit: row.originalStockUnit,
    });
    setDialogOpen(true);
  };

  const handleDelete = (row) => {
    if (window.confirm(strings.ingredient.deleteConfirm + ' ' + row.name + '?')) {
      deleteMutation.mutate(row.id);
    }
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
        const stockUnitLabel = stockUnitObj
          ? unitLabels[stockUnitObj.label] || stockUnitObj.label
          : stockUnitValue;
        const stockDisplay = `${row.stockQuantity} ${stockUnitLabel}`;

        const categoryObj = categories.find(c => c.value === row.category);
        const categoryLabel = categoryObj
          ? categoryLabels[categoryObj.label] || categoryObj.label
          : row.category;

        return {
          ...row,
          originalCategory: row.category,
          originalUnit: row.unit,
          originalStockQuantity: row.stockQuantity,
          originalStockUnit: stockUnitValue,
          category: categoryLabel,
          unit: unitLabel,
          stockQuantity: stockDisplay,
          supplier: "-",
        };
      })
      .filter(row => {
        const matchesName = row.name.includes(search);
        const matchesCategory =
          !category || row.category === categoryLabels[category] || row.category === category;
        const matchesLowStock =
          !lowStockOnly || (row.originalStockQuantity ?? 0) <= LOW_STOCK_THRESHOLD;
        return matchesName && matchesCategory && matchesLowStock;
      });
  }, [search, category, lowStockOnly, rows, strings, units, categories]);

  if (isLoading || catLoading) return <div>טוען...</div>;
  if (error || catError) return <div>שגיאה בטעינת נתונים</div>;

  return (
    <Box sx={{ position: "relative" }}>
      {/* Subtle decorative background blobs */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -40,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,137,41,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 80,
          right: -80,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(166,61,64,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Page content sits above decorative blobs */}
      <PageContainer sx={{ position: "relative", zIndex: 1 }}>

<PageHeader
  title="חומרי גלם"
  subtitle="כל מה שנמצא כרגע במטבח שלך"
  illustration={ingredientsHeaderIcon}
  actionLabel="הוסף חומר גלם"
  actionIcon={addIntegrationIcon}
  onActionClick={() => {
    setSelectedIngredient(null);
    setDialogOpen(true);
  }}
/>
        

        <IngredientsSummary stats={summaryStats} />

        <IngredientsFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          lowStockOnly={lowStockOnly}
          onLowStockToggle={setLowStockOnly}
          categories={categories}
          strings={strings}
        />

        {filteredRows.length === 0
          ? (
            <IngredientsEmptyState
              onAdd={() => {
                setSelectedIngredient(null);
                setDialogOpen(true);
              }}
            />
          )
          : isMobile
            ? (
              <IngredientsMobileList
                rows={filteredRows}
                onEdit={handleEdit}
                onDelete={handleDelete}
                categoryColors={categoryColors}
              />
            )
            : (
              <IngredientsTable
                rows={filteredRows}
                onEdit={handleEdit}
                onDelete={handleDelete}
                strings={strings}
                categoryColors={categoryColors}
              />
            )
        }

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
      </PageContainer>
    </Box>
  );
}
