import React from "react";
import { Box, Typography } from "@mui/material";

export default function RecipeStepsPanel({ steps }) {
  if (!steps || steps.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Typography color="text.secondary">אין שלבי הכנה</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2 }}>
      <Box sx={{ direction: 'rtl', textAlign: 'right' }}>
        {steps.map((step, index) => (
          <Box 
            key={index}
            sx={{ 
              mb: 2,
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start'
            }}
          >
            <Typography 
              sx={{ 
                color: '#751B13',
                fontWeight: 'bold',
                fontSize: '1rem',
                minWidth: '24px'
              }}
            >
              {index + 1}.
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '1rem',
                lineHeight: 1.8,
                color: '#5D4037',
                flex: 1
              }}
            >
              {step.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
