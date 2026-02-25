import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

export default function ImportProgressBar({ isAnalyzing }) {
  if (!isAnalyzing) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <LinearProgress />
      <Typography
        variant="caption"
        sx={{ mt: 1, display: "block", textAlign: "center", color: "#9B5A25" }}
      >
        מנתחת את הקובץ... זה עלול לקחת כמה שניות
      </Typography>
    </Box>
  );
}
