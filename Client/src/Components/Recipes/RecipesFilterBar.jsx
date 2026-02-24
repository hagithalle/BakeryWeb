import React from "react";
import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Card,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const RecipesFilterBar = ({
  search,
  onSearchChange,
  mainCategory,
  onMainCategoryChange,
  mainCategoryOptions,
  subCategory,
  onSubCategoryChange,
  subCategoryOptions,
  searchLabel,
}) => {
  return (
    <Card
      sx={{
        p: 2,
        mb: 2,
        boxShadow: 1,
        borderRadius: 3,
        background: "#FFF7F2",
      }}
    >
      {/* שורת חיפוש */}
      <Box sx={{ width: "100%", mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          variant="outlined"
          size="small"
          placeholder={searchLabel || "חפש מתכון..."}
          fullWidth
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            "& .MuiInputBase-root": { height: 40, borderRadius: 2 },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ opacity: 0.7 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* שורת הפילטרים — קטגוריה מימין, סוג משמאל */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row-reverse", // הצבת הקטגוריה מימין
          gap: 0,
        }}
      >
        {/* קטגוריה – מימין */}
        <FormControl
          size="small"
          sx={{
            flex: 1,
            background: "#FEFEFE",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            px: 1,
          }}
        >
          <label
            style={{
              fontSize: 13,
              marginBottom: 4,
              color: "#7B5B4B",
              textAlign: "right",
            }}
          >
            בחר קטגוריה
          </label>
          <Select
            value={mainCategory}
            onChange={(e) => onMainCategoryChange(e.target.value)}
            displayEmpty
            sx={{
              height: 40,
              fontSize: 15,
              textAlign: "right",
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: "0 8px 8px 0", // רק צד ימין עגול
              },
            }}
          >
            {mainCategoryOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* סוג – משמאל */}
        <FormControl
          size="small"
          sx={{
            flex: 1,
            background: "#FEFEFE",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            px: 1,
          }}
        >
          <label
            style={{
              fontSize: 13,
              marginBottom: 4,
              color: "#7B5B4B",
              textAlign: "right",
            }}
          >
            בחר סוג
          </label>
          <Select
            value={subCategory}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            displayEmpty
            sx={{
              height: 40,
              fontSize: 15,
              textAlign: "right",
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: "8px 0 0 8px", // רק צד שמאל עגול
              },
            }}
          >
            {subCategoryOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Card>
  );
};

export default RecipesFilterBar;