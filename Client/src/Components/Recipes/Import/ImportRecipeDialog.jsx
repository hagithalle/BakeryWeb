// src/Components/Recipes/Import/ImportRecipeDialog.jsx
import React, { useState } from "react";
import { Box, Typography, TextField, LinearProgress, Button } from "@mui/material";

import SoftDialog from "../../ui/SoftDialog";
import FormSection from "../../ui/FormSection";
import { fieldSx, primaryBtnSx, secondaryBtnSx } from "../../ui/dialogStyles";

import ImportSourceSelector from "./ImportSourceSelector";
import ImportFileArea from "./ImportFileArea";

import { useLanguage } from "../../../context/LanguageContext.jsx";
import useLocaleStrings from "../../../hooks/useLocaleStrings.js";
import {
  importRecipeFromFile,
  importRecipeFromUrl,
  importRecipeFromText,
  importRecipeFromImage,
} from "../../../Services/recipeImportService";

import recipeIcon from "../../../assets/decor/page-headers/recipe-header-icon.svg";

export default function ImportRecipeDialog({ open, onClose, onImported, onBackToStart }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang).importDialog;
  const [source, setSource] = useState("file");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const resetState = () => {
    setSource("file"); setFile(null); setUrl(""); setRawText("");
    setIsAnalyzing(false); setError(""); setSuccessMessage("");
  };

  const handleClose = () => {
    if (isAnalyzing) return;
    resetState();
    onClose();
  };

  const handleAnalyze = async () => {
    try {
      setError("");
      switch (source) {
        case "file": case "image":
          if (!file) { setError("בחרי קובץ קודם 🙂"); return; }
          break;
        case "url":
          if (!url.trim()) { setError("הכניסי כתובת URL תקינה 🙂"); return; }
          break;
        case "text":
          if (!rawText.trim()) { setError("הדביקי טקסט של מתכון 🙂"); return; }
          break;
        default: break;
      }
      setIsAnalyzing(true);
      let recipeDraft;
      switch (source) {
        case "file":   recipeDraft = await importRecipeFromFile(file); break;
        case "url":    recipeDraft = await importRecipeFromUrl(url.trim()); break;
        case "text":   recipeDraft = await importRecipeFromText(rawText); break;
        case "image":  recipeDraft = await importRecipeFromImage(file); break;
        default: break;
      }
      console.log(JSON.stringify({ type: "IMPORT_RECIPE", source, status: recipeDraft ? "success" : "fail", result: recipeDraft }, null, 2));
      onImported?.(recipeDraft);
      resetState();
      onClose();
    } catch (err) {
      console.error("❌ Error importing recipe:", err);
      setError(err?.message || "אירעה שגיאה בניתוח המתכון");
      setIsAnalyzing(false);
    }
  };

  const actions = (
    <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {onBackToStart && (
          <Button
            onClick={() => { if (isAnalyzing) return; resetState(); onBackToStart(); }}
            sx={secondaryBtnSx}
          >
            ← חזרה
          </Button>
        )}
        <Button onClick={handleClose} disabled={isAnalyzing} sx={secondaryBtnSx}>
          {strings?.cancel || "ביטול"}
        </Button>
      </Box>
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        sx={primaryBtnSx}
      >
        {strings?.analyze || "נתח מתכון"}
      </Button>
    </Box>
  );

  return (
    <SoftDialog
      open={open}
      onClose={handleClose}
      title={strings?.title || "ייבוא מתכון"}
      maxWidth="md"
      dir="rtl"
      showActions
      actions={actions}
      contentSx={{ maxHeight: '60vh' }}
    >
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 2.5, color: '#8A5E4A' }}>
        {strings?.step?.replace("{step}", "1").replace("{total}", "2") || "שלב 1 מתוך 2 – בחרי מקור והדביקי"}
      </Typography>

      <FormSection icon={recipeIcon}>
        <ImportSourceSelector source={source} onChange={setSource} />

        {(source === "file" || source === "image") && (
          <Box sx={{ mt: 2 }}>
            <ImportFileArea
              file={file}
              label={source === "image" ? "גררי תמונה לכאן או לחצי כדי לבחור" : "גררי קובץ לכאן או לחצי כדי לבחור"}
              onFileChange={(f) => { setFile(f); setError(""); }}
              disabled={isAnalyzing}
            />
          </Box>
        )}

        {source === "url" && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              placeholder="https://example.com/recipe..."
              label="URL"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              disabled={isAnalyzing}
              sx={fieldSx}
            />
          </Box>
        )}

        {source === "text" && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              placeholder={strings?.textPlaceholder || "הדביקי כאן את טקסט המתכון..."}
              label={strings?.textLabel || "טקסט מתכון"}
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setError(""); }}
              disabled={isAnalyzing}
              sx={fieldSx}
            />
          </Box>
        )}
      </FormSection>

      {isAnalyzing && (
        <Box sx={{ mt: 2.5 }}>
          <LinearProgress sx={{ borderRadius: 8, '& .MuiLinearProgress-bar': { background: '#9B1F3A' } }} />
          <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#8A5E4A' }}>
            {strings?.analyzing || "מנתחת את המתכון... זה עשוי לקחת כמה שניות"}
          </Typography>
        </Box>
      )}

      {error && (
        <Typography variant="body2" sx={{ mt: 2, color: '#C0392B', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </Typography>
      )}
      {successMessage && (
        <Typography variant="body2" sx={{ mt: 2, color: '#1A7A47', textAlign: 'center', fontWeight: 700 }}>
          {successMessage}
        </Typography>
      )}
    </SoftDialog>
  );
}
