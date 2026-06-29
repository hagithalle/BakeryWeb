import React, { useEffect, useState } from 'react';
import { Box, Chip } from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import SearchIcon from '@mui/icons-material/Search';

import itemsIconUrl       from '../icons/items.svg';
import packagingIconUrl   from '../icons/packaging.svg';
import recipesIconUrl     from '../icons/מתכונים.svg';
import integrationIconUrl from '../icons/integration.svg';
import manyIconUrl        from '../icons/many.svg';

import PageHeader from '../Components/Common/PageHeader';
import dashboardHeaderIcon from '../assets/decor/page-headers/dashboard-header-icon.svg';

import SummaryCardRow from '../Components/SummaryCardRow';
import { useLanguage } from '../context/LanguageContext';
import useLocaleStrings from '../hooks/useLocaleStrings';

import { fetchIngredients } from '../Services/ingredientsService';
import { getAllRecipes } from '../Services/RecipeService';
import { fetchProducts } from '../Services/productService';
import { fetchPackaging } from '../Services/packagingService';
import CategoryChart from '../Components/Dashboard/CategoryChart';
import IncomeVsExpense from '../Components/Dashboard/IncomeVsExpense';
import QuickActions from '../Components/Dashboard/QuickActions';
import MonthlySummary from '../Components/Dashboard/MonthlySummary';


export default function Dashboard() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);

  const [counts, setCounts] = useState({
    ingredients: 0,
    recipes: 0,
    products: 0,
    packaging: 0,
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

  const summaryItems = [
    {
      iconSrc: itemsIconUrl,
      title: strings.dashboard?.products || 'מוצרים',
      value: counts.products,
      subtitle: 'מוצרים פעילים',
      valueColor: '#A63D40',
      sx: { flex: '1 1 160px', minWidth: '140px' },
    },
    {
      iconSrc: packagingIconUrl,
      title: strings.dashboard?.packaging || 'אריזות',
      value: counts.packaging,
      subtitle: 'פריטים במלאי',
      valueColor: '#E65100',
      sx: { flex: '1 1 160px', minWidth: '140px' },
    },
    {
      iconSrc: recipesIconUrl,
      title: strings.dashboard?.recipes || 'מתכונים',
      value: counts.recipes,
      subtitle: 'מתכונים פעילים',
      valueColor: '#9B5A25',
      sx: { flex: '1 1 160px', minWidth: '140px' },
    },
    {
      iconSrc: integrationIconUrl,
      title: strings.dashboard?.ingredients || 'חומרי גלם',
      value: counts.ingredients,
      subtitle: 'פריטים במערכת',
      valueColor: '#B7795A',
      sx: { flex: '1 1 160px', minWidth: '140px' },
    },
    {
      iconSrc: manyIconUrl,
      title: strings.dashboard?.profit || 'רווח נקי',
      value: counts.profit,
      subtitle: 'החודש',
      currency: '₪',
      valueColor: '#880E4F',
      sx: { flex: '1 1 160px', minWidth: '140px' },
    },
  ];

  return (
    <Box sx={{ direction: strings.direction }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Hero header ── */}
        <Box>
          <PageHeader
            title="שלום חגית! 🩷"
            subtitle="היום יום נפלא לאפייה 🧁"
            illustration={dashboardHeaderIcon}
            centered
          />
          {/* Quick-stat chips */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: -1, mb: 1 }}>
            <Chip
              icon={<CakeIcon sx={{ fontSize: 16 }} />}
              label={`${counts.products} מוצרים פעילים`}
              sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, px: 0.5 }}
            />
            <Chip
              icon={<CheckBoxOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`${counts.recipes} מתכונים`}
              sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, px: 0.5 }}
            />
            <Chip
              icon={<SearchIcon sx={{ fontSize: 16 }} />}
              label={`${counts.ingredients} חומרי גלם`}
              sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, px: 0.5 }}
            />
          </Box>
        </Box>

        {/* ── 5 Summary cards ── */}
        <SummaryCardRow
          horizontal
          gap={2}
          sx={{ mb: 0, margin: 0, justifyContent: 'flex-start' }}
          items={summaryItems}
        />

        {/* ── Middle row: Category chart + Income vs Expense ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <CategoryChart strings={strings} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <IncomeVsExpense strings={strings} />
          </Box>
        </Box>

        {/* ── Bottom row: Quick actions + Monthly summary ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, pb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <QuickActions strings={strings} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <MonthlySummary strings={strings} />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
