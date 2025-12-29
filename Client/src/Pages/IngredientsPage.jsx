import React, { useState, useMemo } from "react";
import { Typography, Box } from "@mui/material";
import GenericFilter from "../Components/GenericFilter";
import GenericTable from "../Components/GenericTable";
import IngredientDialog from "../Components/IngredientDialog";
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";

const mockCategories = [
  { value: "dairy", label: "מוצרי חלב" },
  { value: "grain", label: "דגנים" },
  { value: "sweetener", label: "ממתיקים" },
  { value: "other", label: "אחר" }
];

const mockColumns = [
  { field: "name", headerName: "שם" },
  { field: "category", headerName: "קטגוריה" },
  { field: "unit", headerName: "יחידה" }
];

const mockRows = [
  { id: 1, name: "קמח", category: "דגנים", unit: "ק\"ג" },
  { id: 2, name: "סוכר", category: "ממתיקים", unit: "ק\"ג" },
  { id: 3, name: "חמאה", category: "מוצרי חלב", unit: "גרם" },
  { id: 4, name: "מלח", category: "אחר", unit: "גרם" },
];

export default function IngredientsPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState(mockRows);

  const handleAddIngredient = (ingredient) => {
    setRows(prev => [...prev, { id: prev.length + 1, ...ingredient }]);
    setDialogOpen(false);
  };

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesName = row.name.includes(search);
      const matchesCategory = !category || row.category === mockCategories.find(c => c.value === category)?.label;
      return matchesName && matchesCategory;
    });
  }, [search, category, rows]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <GenericFilter
          searchValue={search}
          onSearchChange={setSearch}
          categoryValue={category}
          onCategoryChange={setCategory}
          categories={mockCategories}
          searchLabel={strings.filter.search}
          categoryLabel={strings.filter.category}
          strings={strings}
        />
      </Box>
      <GenericTable
        columns={mockColumns}
        rows={filteredRows}
        direction={strings.direction}
        actions={["edit", "delete"]}
        onEdit={(row) => {
          // TODO: Implement edit logic (open dialog pre-filled, etc)
          alert(strings.ingredient.edit + ': ' + row.name);
        }}
        onDelete={(row) => {
          if (window.confirm(strings.ingredient.deleteConfirm + ' ' + row.name + '?')) {
            setRows(rows.filter(r => r.id !== row.id));
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
        onClose={() => setDialogOpen(false)}
        onSave={handleAddIngredient}
        categories={mockCategories}
        strings={strings}
      />
    </Box>
  );
}