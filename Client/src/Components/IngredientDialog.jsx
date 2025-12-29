import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from "@mui/material";

export default function IngredientDialog({ open, onClose, onSave, categories, strings, initialValues }) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [pricePerKg, setPricePerKg] = React.useState("");
  const [stockQuantity, setStockQuantity] = React.useState("");

  React.useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "");
      setCategory(initialValues.category || "");
      setUnit(initialValues.unit || "");
      setPricePerKg(initialValues.pricePerKg || "");
      setStockQuantity(initialValues.stockQuantity || "");
    } else {
      setName("");
      setCategory("");
      setUnit("");
      setPricePerKg("");
      setStockQuantity("");
    }
  }, [initialValues, open]);

  const handleSave = () => {
    if (name && category && unit) {
      const ingredient = {
        name,
        category,
        unit,
        pricePerKg: parseFloat(pricePerKg) || 0,
        stockQuantity: parseInt(stockQuantity) || 0
      };
      if (initialValues && initialValues.id) {
        onSave({ id: initialValues.id, ...ingredient });
      } else {
        onSave(ingredient);
      }
      setName("");
      setCategory("");
      setUnit("");
      setPricePerKg("");
      setStockQuantity("");
    }
  };

  const handleClose = () => {
    setName("");
    setCategory("");
    setUnit("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{strings.ingredient?.add || "הוסף חומר גלם"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={strings.sidebar?.ingredients || "שם"}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label={strings.filter?.category || "קטגוריה"}
            value={category}
            onChange={e => setCategory(e.target.value)}
            fullWidth
          >
            {categories.map(cat => (
              <MenuItem key={cat.value} value={cat.value}>
                {strings.ingredient?.categoryValues?.[cat.label] || cat.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={strings.product?.unit || "יחידה"}
            value={unit}
            onChange={e => setUnit(e.target.value)}
            fullWidth
          />
          <TextField
            label={strings.ingredient?.pricePerKg || "מחיר לק"}
            value={pricePerKg}
            onChange={e => setPricePerKg(e.target.value)}
            type="number"
            fullWidth
          />
          <TextField
            label={strings.ingredient?.stockQuantity || "כמות במלאי"}
            value={stockQuantity}
            onChange={e => setStockQuantity(e.target.value)}
            type="number"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{strings.product?.cancel || "ביטול"}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {initialValues && initialValues.id ? (strings.ingredient?.edit || "עדכן") : (strings.ingredient?.add || "הוסף")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
