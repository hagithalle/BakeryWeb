import React from 'react';
import { Paper, Typography, Grid, Button, Box } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ strings }) => {
  const navigate = useNavigate();
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="subtitle1" color="primary" sx={{ mb: 2, textAlign: 'center' }}>{strings.dashboard?.quickActions || 'פעולות מהירות'}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 2 }}>
          <Button
            variant="contained"
            sx={{ bgcolor: '#ffe5e0', color: '#7c5c3b', borderRadius: 3, flexDirection: 'column', py: 2, px: 4, boxShadow: 3, minWidth: 140, minHeight: 120, mx: 1, fontWeight: 'bold', flex: 1 }}
            onClick={() => navigate('/products')}
          >
            <InventoryIcon sx={{ fontSize: 40, mb: 1 }} />
            {strings.dashboard?.newProduct || 'מוצר חדש'}
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#f7e9d7', color: '#7c5c3b', borderRadius: 3, flexDirection: 'column', py: 2, px: 4, boxShadow: 3, minWidth: 140, minHeight: 120, mx: 1, fontWeight: 'bold', flex: 1 }}
            onClick={() => navigate('/recipes')}
          >
            <MenuBookIcon sx={{ fontSize: 40, mb: 1 }} />
            {strings.dashboard?.newRecipe || 'מתכון חדש'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Button
            variant="contained"
            sx={{ bgcolor: '#e9e3dc', color: '#7c5c3b', borderRadius: 3, flexDirection: 'column', py: 2, px: 4, boxShadow: 3, minWidth: 140, minHeight: 120, mx: 1, fontWeight: 'bold', flex: 1 }}
            onClick={() => navigate('/costs')}
          >
            <AttachMoneyIcon sx={{ fontSize: 40, mb: 1 }} />
            {strings.dashboard?.newExpense || 'הוצאה חדשה'}
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#e0ffe5', color: '#7c5c3b', borderRadius: 3, flexDirection: 'column', py: 2, px: 4, boxShadow: 3, minWidth: 140, minHeight: 120, mx: 1, fontWeight: 'bold', flex: 1 }}
            onClick={() => navigate('/costs')}
          >
            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
            {strings.dashboard?.newIncome || 'הכנסה חדשה'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickActions;
