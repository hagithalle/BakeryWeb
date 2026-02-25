import React from "react";
import { Box, Typography, TextField, MenuItem, Button } from "@mui/material";

export default function RecipeMainInfo({
  name,
  description,
  category,
  categories = [],
  imageUrl,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onImageChange,
  nameLabel = "שם מתכון",
  descriptionLabel = "תיאור קצר",
  categoryLabel = "קטגוריה",
  uploadLabel = "העלאת תמונה",
  detailsTitle = "פרטי מתכון"
}) {
  return (
    <Box sx={{ bgcolor: "#FFF7F2", p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 700, color: "#7B5B4B", mb: 2 }}>
        {detailsTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label={nameLabel}
          value={name}
          onChange={e => onNameChange?.(e.target.value)}
          fullWidth
        />
        <TextField
          label={descriptionLabel}
          value={description}
          onChange={e => onDescriptionChange?.(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          select
          label={categoryLabel}
          value={category}
          onChange={e => onCategoryChange?.(e.target.value)}
          fullWidth
        >
          {categories.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" component="label">
            {uploadLabel}
            <input type="file" hidden accept="image/*" onChange={onImageChange} />
          </Button>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="recipe"
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
