// src/Components/Recipes/Import/ImportSourceSelector.jsx
import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LanguageIcon from "@mui/icons-material/Language";
import DescriptionIcon from "@mui/icons-material/Description";

function SourceCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 3,
        textAlign: "center",
        cursor: "pointer",
        bgcolor: selected ? "#FFF3E0" : "#FEFEFE",
        border: selected ? "2px solid #C98929" : "1px solid #ead8cf",
        boxShadow: selected ? 3 : 1,
        transition: "0.2s",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          mx: "auto",
          mb: 1,
          bgcolor: "#FFF1E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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

export default function ImportSourceSelector({ source, onChange }) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <SourceCard
        icon={<CloudUploadIcon />}
        title="העלאה"
        subtitle="קובץ או תמונה"
        selected={source === "file"}
        onClick={() => onChange("file")}
      />
      <SourceCard
        icon={<LanguageIcon />}
        title="כתובת URL"
        subtitle="מתכון מאתר אינטרנט"
        selected={source === "url"}
        onClick={() => onChange("url")}
      />
      <SourceCard
        icon={<DescriptionIcon />}
        title="טקסט חופשי"
        subtitle="הדבקת מתכון כתוב"
        selected={source === "text"}
        onClick={() => onChange("text")}
      />
    </Stack>
  );
}