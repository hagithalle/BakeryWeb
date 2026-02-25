import React from "react";
import { Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export default function ImportFileArea({
  file,
  onFileChange,
  isAnalyzing,
  error,
}) {
  const handleClick = () => {
    if (isAnalyzing) return;
    document.getElementById("recipe-file-input")?.click();
  };

  return (
    <>
      <Box
        sx={{
          borderRadius: 3,
          border: "1px dashed #e0c7be",
          bgcolor: "#FEFEFE",
          p: 3,
          textAlign: "center",
          cursor: isAnalyzing ? "wait" : "pointer",
          "&:hover": !isAnalyzing && { borderColor: "#C98929" },
        }}
        onClick={handleClick}
      >
        <CloudUploadIcon sx={{ fontSize: 42, color: "#C98929", mb: 1 }} />
        <Typography sx={{ fontWeight: 600, color: "#9B5A25", mb: 0.5 }}>
          גררי קובץ לכאן או לחצי כדי לבחור
        </Typography>
        <Typography variant="body2" sx={{ color: "#B07D62" }}>
          נתמך: PDF, תמונה, DOCX ועוד
        </Typography>

        <input
          id="recipe-file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic,.webp"
          style={{ display: "none" }}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          disabled={isAnalyzing}
        />

        {file && (
          <Box
            sx={{
              mt: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "#FFF1E6",
            }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 18, color: "#9B5A25" }} />
            <Typography variant="body2" sx={{ color: "#9B5A25" }}>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Typography
          variant="body2"
          sx={{ mt: 1.5, color: "#c62828", textAlign: "center" }}
        >
          {error}
        </Typography>
      )}
    </>
  );
}
