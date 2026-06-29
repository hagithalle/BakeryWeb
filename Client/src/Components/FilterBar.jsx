import React from "react";
import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import searchIconSvg from "../assets/icons/actions/search-icon.svg";

/**
 * filters: [{ value, onChange, options: [{value, label}], label }]
 * toggles: [{ value, onChange, label }]  — rendered as Switch chips
 */
export default function FilterBar({
  search,
  onSearchChange,
  filters = [],
  searchLabel = "חפש...",
  toggles = [],
}) {
  return (
    <Card
      sx={{
        mb: 3,
        p: 2,
        borderRadius: "18px",
        boxShadow: "0 4px 20px rgba(166, 61, 64, 0.07)",
        direction: "rtl",
        background: "#FEFEFE",
        border: "1px solid #F0E4DB",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <TextField
          placeholder={searchLabel}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            flexGrow: 1,
            minWidth: 180,
            backgroundColor: "#F9F5F1",
            borderRadius: "12px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              height: 42,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box component="img" src={searchIconSvg} alt="" sx={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.45 }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Dropdown filters */}
        {filters.map((filter, idx) => (
          <FormControl
            key={idx}
            size="small"
            sx={{ minWidth: 160, maxWidth: 200, flexShrink: 0 }}
          >
            <Select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              displayEmpty
              sx={{
                height: 42,
                borderRadius: "12px",
                backgroundColor: "#F9F5F1",
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

        {/* Toggle switches */}
        {toggles.map((toggle, idx) => (
          <FormControlLabel
            key={idx}
            control={
              <Switch
                checked={toggle.value}
                onChange={(e) => toggle.onChange(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "#9B5A25", fontWeight: 500 }}>
                {toggle.label}
              </Typography>
            }
            sx={{ ml: 0, mr: 0 }}
          />
        ))}
      </Box>
    </Card>
  );
}
