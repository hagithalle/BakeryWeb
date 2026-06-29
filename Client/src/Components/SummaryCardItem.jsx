import React from "react";
import { Paper, Typography, Box } from "@mui/material";

function IconRenderer({ Icon, iconSrc, iconColor, size = 48 }) {
  if (iconSrc) {
    return (
      <Box
        component="img"
        src={iconSrc}
        alt=""
        sx={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      />
    );
  }
  if (Icon) {
    return <Icon sx={{ fontSize: size * 0.65, color: iconColor, flexShrink: 0 }} />;
  }
  return null;
}

export default function SummaryCardItem({
  icon: Icon,
  iconSrc,
  title,
  value,
  subtitle,
  valueColor = "#3D2B1F",
  iconColor = "#9B5A25",
  bgColor = "white",
  // kept in signature so callers don't break, but not rendered
  iconBgColor,
  iconShadow,
  currency = "",
  horizontal = false,
  ...paperProps
}) {
  const hasIcon = Boolean(Icon || iconSrc);

  return (
    <Paper
      elevation={0}
      {...paperProps}
      sx={{
        p: 0,
        borderRadius: "20px",
        minHeight: 90,
        boxShadow: "0 4px 20px rgba(166, 61, 64, 0.08)",
        border: "1px solid #F5EDE8",
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: "center",
        justifyContent: horizontal ? "space-between" : "center",
        bgcolor: bgColor,
        textAlign: horizontal ? "right" : "center",
        direction: "rtl",
        px: horizontal ? 2 : 2,
        py: horizontal ? 1.5 : 2.5,
        overflow: "hidden",
        ...(paperProps.sx || {}),
      }}
    >
      {horizontal ? (
        <>
          {/* Text */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.2, flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: "#9B5A25", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
              {title}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 }, lineHeight: 1.1, color: valueColor }}>
              {currency}{value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "#C4A88A", fontSize: 11, whiteSpace: "nowrap" }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Icon — no background box */}
          {hasIcon && (
            <Box sx={{ ml: 1.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconRenderer Icon={Icon} iconSrc={iconSrc} iconColor={iconColor} size={120} />
            </Box>
          )}
        </>
      ) : (
        <>
          {hasIcon && (
            <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconRenderer Icon={Icon} iconSrc={iconSrc} iconColor={iconColor} size={120} />
            </Box>
          )}
          <Typography variant="subtitle2" sx={{ color: "#9B5A25", fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: valueColor }}>
            {currency}{value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "#C4A88A", mt: 0.3 }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
