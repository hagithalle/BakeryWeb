// Components/Recipes/MissingIngredientsDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  TextField,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function MissingIngredientsDialog({
  open,
  onClose,
  missing = [],
  ingredientsList = [],
  onResolved,
  onAddNewIngredient, // אופציונלי – לפתיחת דיאלוג יצירה חיצוני
}) {
  const [index, setIndex] = useState(0);
  const [localState, setLocalState] = useState(
    missing.map(m => ({
      ...m,
      selectedIngredientId: m.selectedIngredientId ?? null,
    }))
  );
  const [ignored, setIgnored] = useState([]); // indices of ignored items

  // Only show dialog if there are unhandled items
  const unhandled = localState.filter((_, i) => !ignored.includes(i) && !localState[i].selectedIngredientId);
  const currentUnhandledIdx = unhandled.length > 0 ? localState.findIndex((item, i) => !ignored.includes(i) && !item.selectedIngredientId && i >= index) : -1;
  const current = currentUnhandledIdx !== -1 ? localState[currentUnhandledIdx] : null;

  // If all handled or ignored, close dialog and call onResolved with handled items
  React.useEffect(() => {
    if (open && (!current)) {
      // Gather all resolved (selectedIngredientId) and ignored (null)
      const resolved = localState
        .map((m, i) => ignored.includes(i) ? null : (m.selectedIngredientId ? {
          ingredient: ingredientsList.find(ii => ii.id === m.selectedIngredientId),
          amount: m.amount,
          unit: m.unit,
          rawName: m.rawName,
        } : null))
        .filter(Boolean);
      onResolved?.(resolved);
      onClose();
    }
  }, [current, open]);

  if (!open || !current) return null;

  const handleSelect = (ingredient) => {
    setLocalState(prev =>
      prev.map((m, i) =>
        i === currentUnhandledIdx ? { ...m, selectedIngredientId: ingredient?.id || null } : m
      )
    );
  };

  const handlePrev = () => {
    // Find previous unignored and unhandled index
    let prevIdx = currentUnhandledIdx;
    do {
      prevIdx--;
    } while (prevIdx >= 0 && (ignored.includes(prevIdx) || localState[prevIdx].selectedIngredientId));
    if (prevIdx >= 0) setIndex(prevIdx);
  };

  // שמירה של חוסר (הוספה לרשימת המרכיבים)
  const handleSaveMissing = () => {
    const m = localState[currentUnhandledIdx];
    if (!m.selectedIngredientId) return;
    // Mark this as handled by moving to next
    setIndex(i => {
      // Find next unignored and unhandled index
      let nextIdx = currentUnhandledIdx + 1;
      while (nextIdx < localState.length && (ignored.includes(nextIdx) || localState[nextIdx].selectedIngredientId)) nextIdx++;
      return nextIdx < localState.length ? nextIdx : 0;
    });
    // No need to call onResolved here; handled in useEffect when all done
  };

  // Ignore this missing ingredient
  const handleIgnore = () => {
    setIgnored(prev => [...prev, currentUnhandledIdx]);
    // Move to next unignored and unhandled
    setIndex(i => {
      let nextIdx = currentUnhandledIdx + 1;
      while (nextIdx < localState.length && (ignored.includes(nextIdx) || localState[nextIdx].selectedIngredientId)) nextIdx++;
      return nextIdx < localState.length ? nextIdx : 0;
    });
  };

  const handleNext = () => {
    // Find next unignored and unhandled index
    let nextIdx = currentUnhandledIdx + 1;
    while (nextIdx < localState.length && (ignored.includes(nextIdx) || localState[nextIdx].selectedIngredientId)) nextIdx++;
    if (nextIdx < localState.length) setIndex(nextIdx);
  };

  const progressLabel = `חומר גלם ${currentUnhandledIdx + 1} מתוך ${localState.length}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      {/* TITLE */}
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Typography sx={{ fontWeight: 700 }}>חומרי גלם חסרים</Typography>

        <Typography
          sx={{ ml: "auto", fontSize: 14, color: "text.secondary" }}
        >
          {progressLabel}
        </Typography>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ bgcolor: "#FFF8F3" }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            חומר גלם שמצאנו בטקסט:
          </Typography>

          <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
            {current.rawName}
          </Typography>

          {current.amount && (
            <Typography
              sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}
            >
              כמות משוערת: {current.amount} (קלט מה-AI)
            </Typography>
          )}
        </Box>

        {/* AUTOCOMPLETE */}
        <Autocomplete
          options={ingredientsList}
          getOptionLabel={(opt) => opt.name || opt.ingredientName || ""}
          value={
            ingredientsList.find(i => i.id === current.selectedIngredientId) ||
            null
          }
          onChange={(_, value) => handleSelect(value)}
          renderInput={(params) => (
            <TextField {...params} label="בחר חומר גלם קיים" />
          )}
          sx={{ mb: 2 }}
        />

        {/* AUTO-SUGGEST (אם יש) */}
        {current.suggestedIngredient && (
          <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>
            הצעה אוטומטית:{" "}
            <strong>
              {current.suggestedIngredient.name ||
                current.suggestedIngredient.ingredientName}
            </strong>
          </Typography>
        )}

        {/* יצירת חו"ג חדש (אופציונלי או מובנה) */}
        <Button
          variant="outlined"
          size="small"
          onClick={() =>
            onAddNewIngredient
              ? onAddNewIngredient(current, index) // מפעיל דיאלוג חיצוני
              : alert("לא מוגדר דיאלוג ליצירת חומר גלם") // בטיחות
          }
        >
          + צור חומר גלם חדש
        </Button>
      </DialogContent>

      {/* FOOTER ACTIONS */}
      <DialogActions sx={{ bgcolor: "#F9E3D6", justifyContent: "space-between" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={currentUnhandledIdx === 0}
          onClick={handlePrev}
        >
          הקודם
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveMissing}
            disabled={!current.selectedIngredientId}
          >
            שמור
          </Button>
          <Button
            color="warning"
            onClick={handleIgnore}
          >
            התעלם
          </Button>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={currentUnhandledIdx === localState.length - 1}
          >
            הבא
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}