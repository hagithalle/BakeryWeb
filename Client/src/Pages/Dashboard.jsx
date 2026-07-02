import React, { useEffect, useState } from 'react';
import { Box, Chip, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
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
import { useAuth } from '../context/AuthContext';

import { fetchIngredients } from '../Services/ingredientsService';
import { getAllRecipes } from '../Services/RecipeService';
import { fetchProducts } from '../Services/productService';
import { fetchPackaging } from '../Services/packagingService';
import CategoryChart from '../Components/Dashboard/CategoryChart';
import IncomeVsExpense from '../Components/Dashboard/IncomeVsExpense';
import QuickActions from '../Components/Dashboard/QuickActions';
import MonthlySummary from '../Components/Dashboard/MonthlySummary';

/* ── Compact card for 3-col mobile grid ── */
function CompactCard({ iconSrc, title, value, subtitle, valueColor = '#A63D40' }) {
  return (
    <Paper elevation={0} sx={{
      p: 1.5,
      borderRadius: '18px',
      border: '1px solid #F5EDE8',
      boxShadow: '0 2px 12px rgba(166,61,64,0.07)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 0.25,
    }}>
      <Box component="img" src={iconSrc} sx={{ width: 44, height: 44, objectFit: 'contain', mb: 0.25 }} />
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: 10, color: '#C4A88A', lineHeight: 1.3 }}>{subtitle}</Typography>
    </Paper>
  );
}

/* ── Wide card for 2-col mobile grid ── */
function WideCard({ iconSrc, title, value, subtitle, valueColor = '#A63D40', currency = '' }) {
  return (
    <Paper elevation={0} sx={{
      p: 2,
      borderRadius: '18px',
      border: '1px solid #F5EDE8',
      boxShadow: '0 2px 12px rgba(166,61,64,0.07)',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      direction: 'rtl',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: '#9B5A25', fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>{currency}{value}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 10, color: '#C4A88A', mt: 0.25 }}>{subtitle}</Typography>
        )}
      </Box>
      <Box component="img" src={iconSrc} sx={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
    </Paper>
  );
}

export default function Dashboard() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const greeting = `שלום ${user?.name || ''}! 🩷`;

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

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <Box sx={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Welcome card */}
        <Box sx={{
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #FFFDF9 0%, #FBF1EC 100%)',
          border: '1px solid #E8D5C4',
          boxShadow: '0 4px 20px rgba(120,70,45,0.08)',
          px: 3, py: 2.5,
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#9B1F3A', lineHeight: 1.2 }}>
            {greeting}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#8A5E4A', mt: 0.5 }}>
            היום יום נפלא לאפייה 🧁
          </Typography>
        </Box>

        {/* Quick-stat chips */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<SearchIcon sx={{ fontSize: 14 }} />}
            label={`${counts.ingredients} חומרי גלם`}
            size="small"
            sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, fontSize: 11 }}
          />
          <Chip
            icon={<CheckBoxOutlinedIcon sx={{ fontSize: 14 }} />}
            label={`${counts.recipes} מתכונים`}
            size="small"
            sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, fontSize: 11 }}
          />
          <Chip
            icon={<CakeIcon sx={{ fontSize: 14 }} />}
            label={`${counts.products} מוצרים פעילים`}
            size="small"
            sx={{ bgcolor: 'white', color: '#9B5A25', border: '1px solid #E8D5C4', fontWeight: 600, fontSize: 11 }}
          />
        </Box>

        {/* 3-column compact cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          {summaryItems.slice(0, 3).map((item, i) => (
            <CompactCard key={i} {...item} />
          ))}
        </Box>

        {/* 2-column wide cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
          {summaryItems.slice(3).map((item, i) => (
            <WideCard key={i} {...item} />
          ))}
        </Box>

        {/* Charts stacked */}
        <IncomeVsExpense strings={strings} />
        <CategoryChart strings={strings} />
        <QuickActions strings={strings} />

      </Box>
    );
  }

  /* ── Desktop layout ── */
  return (
    <Box sx={{ direction: strings.direction }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

        <Box>
          <PageHeader
            title={greeting}
            subtitle="היום יום נפלא לאפייה 🧁"
            illustration={dashboardHeaderIcon}
            centered
          />
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

        <SummaryCardRow
          horizontal
          gap={2}
          sx={{ mb: 0, margin: 0, justifyContent: 'flex-start' }}
          items={summaryItems}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <CategoryChart strings={strings} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <IncomeVsExpense strings={strings} />
          </Box>
        </Box>

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
