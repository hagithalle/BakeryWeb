import React from "react";
import { Box, List, ListItem, Typography } from "@mui/material";

export default function RecipeIngredientsTable({ ingredients }) {
  return (
    <Box sx={{ mt: 2 }}>
      <List sx={{ bgcolor: 'white', borderRadius: 2, p: 3 }}>
        {(ingredients || []).map((item, idx) => (
          <ListItem 
            key={idx}
            sx={{ 
              py: 1.5,
              px: 2,
              justifyContent: 'flex-start',
              '&:hover': {
                bgcolor: '#FFF7F2',
                borderRadius: 1
              }
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#5D4037',
                direction: 'rtl',
                textAlign: 'right',
                width: '100%'
              }}
            >
              <Box component="span" sx={{ fontWeight: 'bold', color: '#751B13' }}>
                {item.amount} {item.unit}
              </Box>
              {' '}
              {item.name}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
