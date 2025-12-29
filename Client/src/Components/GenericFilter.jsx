import React from "react";
import { Box, TextField, MenuItem, InputLabel, FormControl, Select } from "@mui/material";


export default function GenericFilter({
  searchValue = "",
  onSearchChange,
  categoryValue = "",
  onCategoryChange,
  categories = [],
  searchLabel,
  categoryLabel,
  strings
}) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        label={searchLabel}
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ minWidth: 180 }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{categoryLabel}</InputLabel>
        <Select
          value={categoryValue}
          label={categoryLabel}
          onChange={e => onCategoryChange(e.target.value)}
        >
          <MenuItem value="">{strings?.filter?.all || categoryLabel}</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
