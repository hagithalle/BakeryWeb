import React from "react";
import { Box, Typography, TextField } from "@mui/material";

export default function RecipeBakingInfo({
  bakingTime,
  temperature,
  prepTime,
  servings,
  yieldAmount,
  onBakingTimeChange,
  onTemperatureChange,
  onPrepTimeChange,
  onServingsChange,
  onYieldAmountChange
}) {
  return (
    <Box sx={{ bgcolor: "#FFF7F2", p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 700, color: "#7B5B4B", mb: 2 }}>
        פרטי אפייה
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="זמן אפייה (דקות)"
          type="number"
          value={bakingTime}
          onChange={e => onBakingTimeChange?.(parseInt(e.target.value) || 0)}
        />
        <TextField
          label="זמן הכנה (דקות)"
          type="number"
          value={prepTime}
          onChange={e => onPrepTimeChange?.(parseInt(e.target.value) || 0)}
        />
        <TextField
          label="טמפרטורה"
          type="number"
          value={temperature}
          onChange={e => onTemperatureChange?.(parseInt(e.target.value) || 0)}
        />
        <TextField
          label="כמות יחידות"
          type="number"
          value={yieldAmount}
          onChange={e => onYieldAmountChange?.(parseInt(e.target.value) || 0)}
        />
        <TextField
          label="יחידת הגשה"
          value={servings}
          onChange={e => onServingsChange?.(e.target.value)}
        />
      </Box>
    </Box>
  );
}
