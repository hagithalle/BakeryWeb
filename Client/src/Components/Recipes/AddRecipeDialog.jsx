import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, IconButton } from "@mui/material";

export default function AddRecipeDialog({ open, onClose, onSave, ingredientsList, loadingIngredients }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]); // [{name, amount, unit}]
  const [steps, setSteps] = useState([]); // [string]
  const [newStep, setNewStep] = useState("");
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");

  const handleAddIngredient = () => {
    if (!ingredientName || !ingredientAmount) return;
    setIngredients([...ingredients, { name: ingredientName, amount: ingredientAmount, unit: ingredientUnit }]);
    setIngredientName("");
    setIngredientAmount("");
    setIngredientUnit("");
  };

  const handleAddStep = () => {
    if (!newStep) return;
    setSteps([...steps, newStep]);
    setNewStep("");
  };

  const handleSave = () => {
    if (!name) return;
    onSave({ name, description, ingredients, steps });
    setName("");
    setDescription("");
    setIngredients([]);
    setSteps([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>הוספת מתכון חדש</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="שם מתכון" value={name} onChange={e => setName(e.target.value)} fullWidth required />
          <TextField label="תיאור" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={2} />
          <Typography sx={{ mt: 2, fontWeight: 700 }}>חומרים</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="חומר גלם"
              value={ingredientName}
              onChange={e => setIngredientName(e.target.value)}
              select={!!ingredientsList && ingredientsList.length > 0}
              SelectProps={{ native: true }}
              sx={{ minWidth: 120 }}
              disabled={loadingIngredients}
            >
              <option value=""></option>
              {loadingIngredients ? (
                <option value="">טוען...</option>
              ) : (
                ingredientsList && ingredientsList.map((ing, idx) => (
                  <option key={idx} value={ing.name || ing.ingredientName}>{ing.name || ing.ingredientName}</option>
                ))
              )}
            </TextField>
            <TextField label="כמות" value={ingredientAmount} onChange={e => setIngredientAmount(e.target.value)} sx={{ minWidth: 80 }} />
            <TextField label="יחידה" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} sx={{ minWidth: 80 }} />
            <Button onClick={handleAddIngredient} variant="outlined">הוסף</Button>
          </Box>
          <Box>
            {ingredients.map((ing, idx) => (
              <Typography key={idx}>{ing.name} - {ing.amount} {ing.unit}</Typography>
            ))}
          </Box>
          <Typography sx={{ mt: 2, fontWeight: 700 }}>שלבי הכנה</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField label="שלב חדש" value={newStep} onChange={e => setNewStep(e.target.value)} fullWidth />
            <Button onClick={handleAddStep} variant="outlined">הוסף שלב</Button>
          </Box>
          <Box>
            {steps.map((step, idx) => (
              <Typography key={idx}>{idx + 1}. {step}</Typography>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" color="primary">הוסף מתכון</Button>
      </DialogActions>
    </Dialog>
  );
}
