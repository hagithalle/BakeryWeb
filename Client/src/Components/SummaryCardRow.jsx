import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import SummaryCardItem from "./SummaryCardItem";

export default function SummaryCardRow({
  items = [],
  horizontal = true,
  cardProps = {},
  gap = 2,
  sx = {},
}) {
  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap,
        width: "100%",
        alignItems: "stretch",
        ...sx,
      }}
    >
      {items.map((item, idx) => (
        <SummaryCardItem
          key={idx}
          horizontal={horizontal}
          iconSize={isMobile ? 44 : 64}
          sx={{
            flex: "1 1 120px",
            minWidth: isMobile ? "100px" : "140px",
            maxWidth: "none",
            ...(item.sx || {}),
          }}
          {...cardProps}
          {...item}
        />
      ))}
    </Box>
  );
}
