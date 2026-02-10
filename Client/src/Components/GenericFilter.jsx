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
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select
          value={categoryValue}
          displayEmpty
          onChange={e => onCategoryChange(e.target.value)}
          sx={{
            backgroundColor: '#FEFEFE',
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#D2A5A0'
            }
          }}
        >
          <MenuItem value="">{strings?.filter?.all || "כל הקטגוריות"}</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        placeholder={searchLabel || "חיפוש לפי שם..."}
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ 
          flexGrow: 1,
          minWidth: 250,
          backgroundColor: '#FEFEFE',
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: '#D2A5A0'
            }
          }
        }}
      />
    </Box>
  );
}
