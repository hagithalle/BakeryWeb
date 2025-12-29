import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from "@mui/material";

export default function IngredientDialog({ open, onClose, onSave, categories, strings }) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [unit, setUnit] = React.useState("");

  const handleSave = () => {
    if (name && category && unit) {
      onSave({ name, category, unit });
      setName("");
      setCategory("");
      setUnit("");
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
              <MenuItem key={cat.value} value={cat.label}>{cat.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={strings.product?.unit || "יחידה"}
            value={unit}
            onChange={e => setUnit(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{strings.product?.cancel || "ביטול"}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {strings.ingredient?.add || "הוסף"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
