// SummaryCardRow.jsx
import React from "react";
import { Box } from "@mui/material";
import SummaryCardItem from "./SummaryCardItem";

/**
 * items: [{ icon, title, value, valueColor, iconColor, bgColor, currency, sx, ... }]
 * horizontal: default true
 * cardProps: default props for all SummaryCardItem
 */
export default function SummaryCardRow({
  items = [],
  horizontal = true,
  cardProps = {},
  gap = 4,
  sx = {},
}) {
  // צבעי ברירת מחדל לאיקונים לפי אינדקס
  const defaultIconStyles = [
    {
      // 0 – רווח נקי (אדום)
      iconBgColor: "linear-gradient(135deg, #ff7664 0%, #ff4b5c 100%)",
      iconShadow: "0 10px 20px rgba(255, 118, 100, 0.45)",
    },
    {
      // 1 – מוצרים (ורוד/קופי)
      iconBgColor: "linear-gradient(135deg, #f4d0c0 0%, #e7b8a5 100%)",
      iconShadow: "0 10px 20px rgba(231, 184, 165, 0.45)",
    },
    {
      // 2 – מתכונים (חום כהה)
      iconBgColor: "linear-gradient(135deg, #6b4a2f 0%, #8a623f 100%)",
      iconShadow: "0 10px 20px rgba(107, 74, 47, 0.45)",
    },
    {
      // 3 – חומרי גלם (זהב)
      iconBgColor: "linear-gradient(135deg, #c89a40 0%, #e2b35a 100%)",
      iconShadow: "0 10px 20px rgba(200, 154, 64, 0.45)",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap,
        mb: 4,
        width: "100%",
        maxWidth: 1200,
        margin: '0 auto',
        justifyContent: "center",
        alignItems: "flex-start",
        overflowX: 'auto',
        ...sx,
      }}
    >
      {items.map((item, idx) => {
        const iconDefaults = defaultIconStyles[idx] || {};
        return (
          <SummaryCardItem
            key={idx}
            horizontal={horizontal}
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: 'none',
              ...(item.sx || {}),
            }}
            // סדר חשוב: ברירת מחדל -> cardProps -> item
            {...iconDefaults}
            {...cardProps}
            {...item}
          />
        );
      })}
    </Box>
  );
}