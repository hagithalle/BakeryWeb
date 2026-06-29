import React from "react";
import { Box } from "@mui/material";
import SummaryCardItem from "./SummaryCardItem";

export default function SummaryCardRow({
  items = [],
  horizontal = true,
  cardProps = {},
  gap = 2,
  sx = {},
}) {
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
          sx={{
            flex: "1 1 150px",
            minWidth: "140px",
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
