import React, { useState } from "react";
import { Box, Typography, TextField, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

export default function RecipeStepsSection({ steps = [], onStepsChange }) {
  const [newStep, setNewStep] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState("");

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    const updated = [...steps, newStep.trim()];
    console.log('RecipeStepsSection: Adding step, new steps array:', updated);
    onStepsChange?.(updated);
    setNewStep("");
  };

  const handleRemoveStep = (idx) => {
    const updated = steps.filter((_, i) => i !== idx);
    onStepsChange?.(updated);
  };

  const handleStartEdit = (idx) => {
    setEditingIdx(idx);
    setEditingText(steps[idx]);
  };

  const handleSaveEdit = (idx) => {
    const updated = [...steps];
    updated[idx] = editingText.trim();
    onStepsChange?.(updated);
    setEditingIdx(null);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditingText("");
  };

  return (
    <Box sx={{ bgcolor: "#FFF7F2", p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 700, color: "#7B5B4B", mb: 2 }}>
        שלבי הכנה
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="שלב חדש"
          value={newStep}
          onChange={e => setNewStep(e.target.value)}
        />
        <IconButton color="primary" onClick={handleAddStep}>
          <AddIcon />
        </IconButton>
      </Box>
      {steps.map((step, idx) => (
        <Paper key={idx} sx={{ p: 1.5, mb: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          {editingIdx === idx ? (
            <>
              <TextField
                fullWidth
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                size="small"
              />
              <IconButton onClick={() => handleSaveEdit(idx)} sx={{ color: "green" }}>
                <AddIcon />
              </IconButton>
              <IconButton onClick={handleCancelEdit} sx={{ color: "#D32F2F" }}>
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>{idx + 1}. {step}</Typography>
              <IconButton onClick={() => handleStartEdit(idx)} sx={{ color: "#5D4037" }}>
                ✎
              </IconButton>
              <IconButton onClick={() => handleRemoveStep(idx)} sx={{ color: "#D32F2F" }}>
                <CloseIcon />
              </IconButton>
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
}
