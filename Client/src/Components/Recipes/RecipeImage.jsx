import React from "react";
import { Box } from "@mui/material";
import BraImg from "../../assets/images/Bra.jpg";

export default function RecipeImage({ src, alt }) {
  const imageSrc = src || BraImg;
  return (
    <Box
      sx={{
        width: '100%',
        height: 250,
        mb: 3,
        bgcolor: 'white',
        borderRadius: '38px 12px 32px 18px', // קצוות לא שוות
        boxShadow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '2px dashed #D7CCC8'
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </Box>
  );
}
