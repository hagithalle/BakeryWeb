// SummaryCardItem.jsx
import React from "react";
import { Paper, Typography, Box } from "@mui/material";

export default function SummaryCardItem({
  icon: Icon,
  title,
  value,
  valueColor = "#3b3b3b",
  iconColor = "#ffffff",
  bgColor = "white",
  iconBgColor = "linear-gradient(135deg, #ff7664 0%, #ff4b5c 100%)",
  iconShadow = "0 10px 20px rgba(0,0,0,0.07)",   // 🔹 צל גנרי שניתן לשינוי
  currency = "",
  horizontal = false,
  ...paperProps
}) {
  return (
    <Paper
      elevation={3}
      {...paperProps}
      sx={{
        p: 0,
        borderRadius: 3,
        minHeight: 90,
        minWidth: 260,
        maxWidth: 340,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: "center",
        justifyContent: horizontal ? "space-between" : "center",
        fontWeight: "bold",
        bgcolor: bgColor,
        textAlign: horizontal ? "right" : "center",
        direction: "rtl",
        px: horizontal ? 2.5 : 2,
        py: horizontal ? 2 : 2.5,
        ...(paperProps.sx || {}),
      }}
    >
      {horizontal ? (
        <>
          <Box
            sx={{ justifyContent: 'space-between',
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 0.5,
              flex: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#7c5c3b",
                fontWeight: 400,
                fontSize: 14,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.2,
                color: valueColor,
              }}
            >
              {currency}
              {value}
            </Typography>
          </Box>

         
        {Icon && (
  <Box
    sx={{
      background: iconBgColor,
      borderRadius: 3,
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",     // <— מרכז אנכי
      justifyContent: "center", // <— מרכז אופקי
      boxShadow: iconShadow,
      ml: 3,
      flexShrink: 0,
    }}
  >
    <Icon sx={{ fontSize: 30, color: iconColor }} />
  </Box>
)}
        </>
      ) : (
        // מצב אנכי – גנרי
        <>
          {Icon && (
            <Box
              sx={{
                background: iconBgColor,
                borderRadius: 3,
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: iconShadow,
                mb: 1.5,
              }}
            >
              <Icon sx={{ fontSize: 30, color: iconColor }} />
            </Box>
          )}
          <Typography
            variant="subtitle2"
            sx={{ color: "#7c5c3b", fontWeight: 400, mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: valueColor }}
          >
            {currency}
            {value}
          </Typography>
        </>
      )}
    </Paper>
  );
}