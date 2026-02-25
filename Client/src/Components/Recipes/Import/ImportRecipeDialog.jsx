// src/Components/Recipes/Import/ImportRecipeDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import ImportSourceSelector from "./ImportSourceSelector";
import ImportFileArea from "./ImportFileArea";
// כאן את תשתמשי בפונקציות האמיתיות שלך
// import { importRecipeFromFile, importRecipeFromUrl, importRecipeFromText } from "../../Services/RecipeService";

export default function ImportRecipeDialog({
  open,
  onClose,
  onImported,
  onBackToStart, // 🔙 לחזור למסך הראשון
}) {
  const [source, setSource] = useState("file"); // 'file' | 'url' | 'text'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setSource("file");
    setFile(null);
    setUrl("");
    setRawText("");
    setIsAnalyzing(false);
    setError("");
  };

  const handleClose = () => {
    if (isAnalyzing) return;
    resetState();
    onClose();
  };

  const handleAnalyze = async () => {
    try {
      setError("");

      if (source === "file" && !file) {
        setError("בחרי קובץ קודם 🙂");
        return;
      }
      if (source === "url" && !url.trim()) {
        setError("הכניסי כתובת URL תקינה 🙂");
        return;
      }
      if (source === "text" && !rawText.trim()) {
        setError("הדביקי טקסט של מתכון 🙂");
        return;
      }

      setIsAnalyzing(true);

      let recipeDraft;

      // 🧠 פה את מחברת ל־API שלך
      if (source === "file") {
        // recipeDraft = await importRecipeFromFile(file);
        console.log("TODO: call importRecipeFromFile(file)");
      } else if (source === "url") {
        // recipeDraft = await importRecipeFromUrl(url);
        console.log("TODO: call importRecipeFromUrl(url)");
      } else if (source === "text") {
        // recipeDraft = await importRecipeFromText(rawText);
        console.log("TODO: call importRecipeFromText(rawText)");
      }

      // בינתיים לדוגמה – שנראה איך זה זורם:
      recipeDraft = recipeDraft || {
        name: "Imported recipe",
        description: "",
        category: "עוגות",
        recipeType: 2,
        imageUrl: null,
        yieldAmount: 1,
        outputUnitType: 0,
        bakeTime: 0,
        prepTime: 0,
        temperature: 0,
        ingredients: [],
        steps: [],
        baseRecipes: [],
      };

      onImported && onImported(recipeDraft);
      resetState();
      onClose();
    } catch (err) {
      console.error("❌ Error importing recipe:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "אירעה שגיאה בניתוח המתכון"
      );
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, bgcolor: "#FFF8F3", direction: "rtl" },
      }}
    >
      {/* X סגירה */}
      <Box sx={{ position: "absolute", left: 16, top: 16 }}>
        <IconButton size="small" onClick={handleClose} disabled={isAnalyzing}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogTitle
        sx={{ textAlign: "center", fontWeight: 700, color: "#971936", mt: 1 }}
      >
        ייבוא מתכון
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", mb: 2, color: "#9B5A25" }}
        >
          שלב 1 מתוך 2 – בחרי מקור והדביקי
        </Typography>

        {/* בחירת מקור */}
        <ImportSourceSelector source={source} onChange={setSource} />

        {/* קלט בהתאם למקור */}
        {source === "file" && (
          <ImportFileArea
            file={file}
            onFileChange={(f) => {
              setFile(f);
              setError("");
            }}
            disabled={isAnalyzing}
          />
        )}

        {source === "url" && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              placeholder="https://example.com/recipe..."
              label="כתובת מתכון (URL)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              disabled={isAnalyzing}
            />
          </Box>
        )}

        {source === "text" && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              placeholder="הדביקי כאן את טקסט המתכון..."
              label="טקסט מתכון"
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setError("");
              }}
              disabled={isAnalyzing}
            />
          </Box>
        )}

        {isAnalyzing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: "block",
                textAlign: "center",
                color: "#9B5A25",
              }}
            >
              מנתחת את המתכון... זה עשוי לקחת כמה שניות
            </Typography>
          </Box>
        )}

        {error && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: "#c62828", textAlign: "center" }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "#F9E3D6",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          p: 2,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* 🔙 חזרה למסך הראשון */}
          {onBackToStart && (
            <Button
              color="inherit"
              onClick={() => {
                if (isAnalyzing) return;
                resetState();
                onBackToStart();
              }}
            >
              ← חזרה
            </Button>
          )}
          <Button onClick={handleClose} disabled={isAnalyzing}>
            ביטול
          </Button>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          נתח מתכון
        </Button>
      </DialogActions>
    </Dialog>
  );
}