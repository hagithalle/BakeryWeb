import React from "react";
import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Card
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function FilterBar({
  search,
  onSearchChange,
  filters = [],
  searchLabel = "חפש..."
}) {
  return (
    <Card
      sx={{
        mb: 3,
        p: 2,
        boxShadow: 2,
        borderRadius: 2,
        direction: "rtl",
        background: '#fffbe9',
        border: '2px solid #bfa47a',
        minHeight: 60,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2, // יותר מרווח בין פריטים
        }}
      >
        {/* חיפוש - תופס את כל הרוחב הפנוי */}
        <TextField
          placeholder={searchLabel}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            flexGrow: 1,
            backgroundColor: "#FEFEFE",
            borderRadius: 2,
            "& .MuiInputBase-root": { height: 44 }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ opacity: 0.7 }} />
              </InputAdornment>
            )
          }}
        />

        {/* פילטרים */}
        {filters?.length > 0 &&
          filters.map((filter, idx) => (
            <FormControl
              key={idx}
              size="small"
              sx={{
                minWidth: 160,   // ⬅️⬅️⬅️ כאן הגדלתי!
                maxWidth: 200,
                flexShrink: 0,
              }}
            >
              <Select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                displayEmpty
                sx={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MenuItem value="all">כל {filter.label}</MenuItem>
                {filter.options.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
      </Box>
    </Card>
  );
}