import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, ButtonBase, Skeleton, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ChefHat, BookOpen, Wheat, Package } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { brandPalette as p } from '../constants/brandPalette';
import { fetchIngredients } from '../Services/ingredientsService';
import { getAllRecipes } from '../Services/RecipeService';
import { fetchProducts } from '../Services/productService';
import { fetchPackaging } from '../Services/packagingService';
import { countsFromSettled, hasFailedCounts } from '../utils/dashboardCounts';
import QuickActions from '../Components/Dashboard/QuickActions';
import CategoryChart from '../Components/Dashboard/CategoryChart';

const FONT = '"Assistant", "Heebo", "Roboto", sans-serif';

// Real data only. The former finance widgets (profit, income vs. expenses, monthly summary)
// showed placeholder zeros; they stay hidden until the backend stores income and expenses.
const STATS = [
  { key: 'products', label: 'מוצרים', path: '/products', icon: ChefHat },
  { key: 'recipes', label: 'מתכונים', path: '/recipes', icon: BookOpen },
  { key: 'ingredients', label: 'חומרי גלם', path: '/ingredients', icon: Wheat },
  { key: 'packaging', label: 'מוצרי אריזה', path: '/packaging', icon: Package },
];

function SectionTitle({ children, id }) {
  return (
    <Typography id={id} component="h2" sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: p.ink, mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function StatCard({ stat, value, loading }) {
  const Icon = stat.icon;
  return (
    <ButtonBase
      component={RouterLink}
      to={stat.path}
      aria-label={`${stat.label}: ${loading ? 'בטעינה' : value ?? 'לא זמין'}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: { xs: 1, md: 1.5 },
        width: '100%',
        boxSizing: 'border-box',
        p: { xs: 1.5, md: 2 },
        minHeight: 76,
        borderRadius: '16px',
        bgcolor: p.white,
        border: `1px solid ${p.border}`,
        boxShadow: '0 4px 16px rgba(94, 20, 40, 0.05)',
        textAlign: 'right',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { borderColor: p.burgundy, boxShadow: '0 8px 20px rgba(94, 20, 40, 0.09)' },
        '&.Mui-focusVisible': { outline: `3px solid ${p.burgundy}`, outlineOffset: 2 },
      }}
    >
      <Box aria-hidden sx={{ width: { xs: 36, md: 44 }, height: { xs: 36, md: 44 }, flexShrink: 0, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: p.blushSoft, color: p.burgundy }}>
        <Icon size={22} strokeWidth={1.9} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: FONT, fontSize: 26, fontWeight: 800, color: p.burgundy, lineHeight: 1.1 }}>
          {loading ? <Skeleton width={36} /> : value ?? '—'}
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: p.muted, lineHeight: 1.3 }}>
          {stat.label}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);
  // The products list feeds both the count and the category chart (one request).
  const [products, setProducts] = useState({ status: 'loading', list: null });

  // State is only set when the requests settle (never synchronously inside the effect).
  const load = useCallback(
    () => Promise.allSettled([fetchProducts(), getAllRecipes(), fetchIngredients(), fetchPackaging()])
      .then((settled) => {
        setCounts(countsFromSettled(settled));
        const [productsResult] = settled;
        setProducts(productsResult.status === 'fulfilled' && Array.isArray(productsResult.value)
          ? { status: 'ready', list: productsResult.value }
          : { status: 'error', list: null });
      }),
    [],
  );

  useEffect(() => { load(); }, [load]);

  const retry = () => { setCounts(null); setProducts({ status: 'loading', list: null }); load(); };

  const firstName = (user?.name || '').trim().split(/\s+/)[0];
  const today = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const loading = counts === null;

  return (
    <Box sx={{ direction: 'rtl', fontFamily: FONT, width: '100%', maxWidth: 1120, mx: 'auto', display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 }, pb: 3 }}>
      {/* Greeting */}
      <Box component="header">
        <Typography component="h1" sx={{ fontFamily: '"Suez One", "Assistant", serif', fontSize: { xs: 26, md: 32 }, color: p.burgundy, lineHeight: 1.2 }}>
          {firstName ? `שלום, ${firstName}` : 'שלום!'}
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 15, color: p.muted, mt: 0.5 }}>
          {today} · מה נעשה היום במאפייה?
        </Typography>
      </Box>

      {/* Quick actions */}
      <Box component="section" aria-labelledby="dash-actions">
        <SectionTitle id="dash-actions">פעולות מהירות</SectionTitle>
        <QuickActions />
      </Box>

      {/* Real counts */}
      <Box component="section" aria-labelledby="dash-overview">
        <SectionTitle id="dash-overview">סקירה</SectionTitle>
        {!loading && hasFailedCounts(counts) && (
          <Alert
            severity="warning"
            sx={{ mb: 1.5, borderRadius: '14px' }}
            action={<Button color="inherit" size="small" onClick={retry}>נסו שוב</Button>}
          >
            חלק מהנתונים לא נטענו.
          </Alert>
        )}
        <Box
          component="ul"
          sx={{
            listStyle: 'none', m: 0, p: 0,
            display: 'grid',
            gap: { xs: 1.25, md: 2 },
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          }}
        >
          {STATS.map((stat) => (
            <Box component="li" key={stat.key} sx={{ display: 'flex' }}>
              <StatCard stat={stat} value={counts?.[stat.key]} loading={loading} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Products by category (real products only) */}
      <Box component="section" aria-labelledby="dash-categories">
        <SectionTitle id="dash-categories">מוצרים לפי קטגוריה</SectionTitle>
        <CategoryChart products={products.list} status={products.status} onRetry={retry} />
      </Box>
    </Box>
  );
}
