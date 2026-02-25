import { Box, Typography, Chip } from "@mui/material";


   export default function StartOptionCard({
  icon,
  title,
  subtitle,
  disabled,
  badge,
  onClick,
  sx = {},
}) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        position: "relative",
        // ❌ לא flex: 1 – שחררנו את המתיחה
        p: 2.5,
        borderRadius: 3,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        bgcolor: disabled ? "#FFF5F0" : "#FEFEFE",
        border: disabled ? "1px solid #ead8cf" : "1px solid #ead8cf",
        boxShadow: disabled ? 0 : 2,
        transition: "0.2s",
        "&:hover": !disabled && {
          boxShadow: 4,
          transform: "translateY(-3px)",
        },
        ...sx, // מאפשר להוסיף רוחב/מרווח מבחוץ אם תרצי
      }}
    >
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            bgcolor: "#C98929",
            color: "#fff",
            fontSize: "0.7rem",
          }}
        />
      )}

      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          mx: "auto",
          mb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#FFF1E6",
          color: "#9B5A25",
        }}
      >
        {icon}
      </Box>

      <Typography sx={{ fontWeight: 700, color: "#9B5A25", mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "#B07D62" }}>
        {subtitle}
      </Typography>
    </Box>
  );
}