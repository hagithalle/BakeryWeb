import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useLanguage } from '../context/LanguageContext';
import useLocaleStrings from '../hooks/useLocaleStrings';
import SummaryCards from './Dashboard/SummaryCards';
import { fetchIngredients } from '../Services/ingredientsService';
import { getAllRecipes } from '../Services/RecipeService';
import { fetchProducts } from '../Services/productService';
import { fetchPackaging } from '../Services/packagingService';
import CategoryChart from './Dashboard/CategoryChart';
import IncomeVsExpense from './Dashboard/IncomeVsExpense';
import QuickActions from './Dashboard/QuickActions';
import MonthlySummary from './Dashboard/MonthlySummary';
export default function Dashboard() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const [counts, setCounts] = useState({ ingredients: 0, recipes: 0, products: 0, packaging: 0 });

  useEffect(() => {
    async function fetchData() {
      const [ingredients, recipes, products, packaging] = await Promise.all([
        fetchIngredients(),
        getAllRecipes(),
        fetchProducts(),
        fetchPackaging()
      ]);
      setCounts({
        ingredients: ingredients.length,
        recipes: recipes.length,
        products: products.length,
        packaging: packaging.length
      });
    }
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f5f2', minHeight: '100vh', direction: strings.direction }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right' }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <DashboardIcon sx={{ ml: 1, color: '#bfa47a' }} /> שלום!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'right' }}>
          {strings.dashboard?.subtitle || 'תמונה סקירה של המאפיה שלך'}
        </Typography>
      </Box>
      {/* First row: 4 summary cards */}
      <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(5, minmax(0, 1fr))',
    },
    gap: 3,
    mb: 4,
  }}
>
  <SummaryCards strings={strings} counts={counts} />
</Box>
      {/* Second row: 2 panels */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box sx={{ flex: 1 }}><IncomeVsExpense strings={strings} /></Box>
        <Box sx={{ flex: 1 }}><CategoryChart strings={strings} /></Box>
      </Box>
      {/* Third row: 2 panels */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}><MonthlySummary strings={strings} /></Box>
        <Box sx={{ flex: 1 }}><QuickActions strings={strings} /></Box>
      </Box>
    </Box>
  );
}

