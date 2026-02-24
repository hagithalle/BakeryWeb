import React from "react";
import { Box } from "@mui/material";
import BraImg from "../../assets/images/Bra.jpg";

export default function RecipeImage({ src, alt }) {
  const imageSrc = src || BraImg;
  return (
    <Box
      sx={{
        width: 170,
        height: 130,
        mb: 0,
        bgcolor: '#fff',
        borderRadius: '22px 32px 18px 28px', // קופסא מעוגלת לא סימטרית
        boxShadow: '0 4px 24px 0 rgba(180,140,90,0.13)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '3px solid #E0B089',
        transition: 'box-shadow 0.2s',
        ':hover': {
          boxShadow: '0 8px 32px 0 rgba(180,140,90,0.18)'
        }
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '20px 30px 16px 24px' // גם לתמונה עצמה
        }}
      />
    </Box>
  );
}
