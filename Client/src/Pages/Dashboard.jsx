import SummaryCardRow from '../Components/SummaryCardRow';
// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CakeIcon from '@mui/icons-material/Cake';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import PageHeader from '../Components/Common/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import useLocaleStrings from '../hooks/useLocaleStrings';

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

  const [counts, setCounts] = useState({
    ingredients: 0,
    recipes: 0,
    products: 0,
    packaging: 0,
    // כרגע אין לך רווח מהשרת, אז זה placeholder
    profit: 0,
  });

  useEffect(() => {
    async function fetchData() {
      const [ingredients, recipes, products, packaging] = await Promise.all([
        fetchIngredients(),
        getAllRecipes(),
        fetchProducts(),
        fetchPackaging(),
      ]);

      setCounts(prev => ({
        ...prev,
        ingredients: ingredients.length,
        recipes: recipes.length,
        products: products.length,
        packaging: packaging.length,
      }));
    }

    fetchData();
  }, []);

  // 🌟 Summary cards items array
  const items = [
    {
      icon: Inventory2Icon,
      title: strings.dashboard?.products || 'מוצרים',
      value: counts.products ?? 0,
      iconColor: '#ffffff',
    },
    {
      icon: AllInboxIcon,
      title: strings.dashboard?.packaging || 'אריזות',
      value: counts.packaging ?? 0,
      iconColor: '#ffffff',
    },
    {
      icon: MenuBookIcon,
      title: strings.dashboard?.recipes || 'מתכונים',
      value: counts.recipes ?? 0,
      iconColor: '#ffffff',
    },
    {
      icon: CakeIcon,
      title: strings.dashboard?.ingredients || 'חומרי גלם',
      value: counts.ingredients ?? 0,
      iconColor: '#ffffff',
    },
    {
      icon: AttachMoneyIcon,
      title: strings.dashboard?.profit || 'רווח נקי',
      value: counts.profit ?? 0,
      iconColor: '#ffffff',
      valueColor: 'success.main',
      currency: '₪',
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        minHeight: '100vh',
        direction: strings.direction,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Header */}
        <PageHeader
          title={strings.dashboard?.title || 'שלום!'}
          subtitle={strings.dashboard?.subtitle || 'תמונה סקירה של המאפיה שלך'}
          icon={DashboardIcon}
        />

        {/* Summary Cards Row */}
        <SummaryCardRow items={items} />

        {/* Second row: two blocks */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 360 }}>
            <IncomeVsExpense strings={strings} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 360 }}>
            <CategoryChart strings={strings} />
          </Box>
        </Box>

        {/* Third row: two blocks */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            mb: 4,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 360 }}>
            <MonthlySummary strings={strings} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 360 }}>
            <QuickActions strings={strings} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}