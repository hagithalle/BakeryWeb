import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';

import addRecipeIcon  from '../../assets/icons/actions/add-new-recipe.svg';
import addProductIcon from '../../assets/icons/actions/add-new-product.svg';

const ACTION_CARDS = [
  {
    label: 'מתכון חדש',
    icon: addRecipeIcon,
    bg: 'linear-gradient(135deg, #F5DEB3 0%, #E8C99A 100%)',
    iconBg: 'rgba(255,255,255,0.55)',
    labelColor: '#9B5A25',
    border: '#E8D5C4',
    path: '/recipes',
  },
  {
    label: 'מוצר חדש',
    icon: addProductIcon,
    bg: 'linear-gradient(135deg, #FFCDD2 0%, #FFAAB0 100%)',
    iconBg: 'rgba(255,255,255,0.55)',
    labelColor: '#A63D40',
    border: '#F5D0D0',
    path: '/products',
  },
];

const QuickActions = ({ strings }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '20px',
        border: '1px solid #F5EDE8',
        boxShadow: '0 4px 20px rgba(166,61,64,0.07)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#A63D40' }}>
          {strings.dashboard?.quickActions || 'פעולות מהירות'}
        </Typography>
        <FavoriteIcon sx={{ fontSize: 18, color: '#E891B0' }} />
      </Box>

      {/* Action cards */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        {ACTION_CARDS.map((card) => (
          <Box
            key={card.label}
            onClick={() => navigate(card.path)}
            sx={{
              flex: 1,
              borderRadius: '16px',
              background: card.bg,
              border: `1px solid ${card.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              py: 3,
              px: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              },
            }}
          >
            {/* Icon circle */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: card.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <Box
                component="img"
                src={card.icon}
                alt={card.label}
                sx={{ width: 44, height: 44, objectFit: 'contain' }}
              />
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: card.labelColor, textAlign: 'center' }}
            >
              {card.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default QuickActions;
