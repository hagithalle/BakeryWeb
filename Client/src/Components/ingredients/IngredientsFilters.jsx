import React from 'react';
import {
  Box,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';

import searchIcon from '../../assets/icons/actions/search-icon.svg';
import filterIcon from '../../assets/icons/actions/filter-icon.svg';

export default function IngredientsFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  lowStockOnly,
  onLowStockToggle,
  categories,
  strings,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '18px',
        border: '1px solid #F0E4DB',
        p: 2,
        mb: 3,
        direction: 'rtl',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          direction: 'rtl',
        }}
      >
        {/* Search field */}
        <TextField
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`${strings?.filter?.search || 'חיפוש לפי שם'} חומר גלם...`}
          size="small"
          sx={{ flex: '1 1 200px' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  component="img"
                  src={searchIcon}
                  alt="חיפוש"
                  sx={{ width: 20, height: 20, opacity: 0.6 }}
                />
              </InputAdornment>
            ),
            sx: { borderRadius: '10px' },
          }}
        />

        {/* Category select */}
        <FormControl size="small" sx={{ flex: '1 1 160px' }}>
          <InputLabel id="category-select-label">
            {strings?.filter?.category || 'קטגוריה'}
          </InputLabel>
          <Select
            labelId="category-select-label"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            label={strings?.filter?.category || 'קטגוריה'}
            startAdornment={
              <InputAdornment position="start">
                <Box
                  component="img"
                  src={filterIcon}
                  alt="סינון"
                  sx={{ width: 18, height: 18, opacity: 0.6 }}
                />
              </InputAdornment>
            }
            sx={{ borderRadius: '10px' }}
          >
            <MenuItem value="">כל הקטגוריות</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {strings?.ingredient?.categoryValues?.[cat.label] || cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Low stock toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={lowStockOnly}
              onChange={(e) => onLowStockToggle(e.target.checked)}
              color="warning"
            />
          }
          label="מלאי נמוך בלבד"
          sx={{ mr: 0 }}
        />
      </Box>
    </Card>
  );
}
