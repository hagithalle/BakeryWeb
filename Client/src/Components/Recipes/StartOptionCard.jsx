import { Box, Typography, Chip } from "@mui/material";

export default function StartOptionCard({ icon, title, subtitle, disabled, badge, onClick }) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        position: "relative",
        flex: 1,
        p: 2.5,
        borderRadius: 3,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        bgcolor: disabled ? "#FFF5F0" : "#FEFEFE",
        border: "1px solid #ead8cf",
        boxShadow: disabled ? 0 : 2,
        transition: "0.2s",
        "&:hover": !disabled && { boxShadow: 4, transform: "translateY(-3px)" },
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
            color: "#fff"
          }}
        />
      )}

      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          mx: "auto",
          mb: 1.5,
          bgcolor: "#FFF1E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          color: "#9B5A25"
        }}
      >
        {icon}
      </Box>

      <Typography sx={{ fontWeight: 700, color: "#9B5A25" }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "#C98929" }}>{subtitle}</Typography>
    </Box>
  );
}