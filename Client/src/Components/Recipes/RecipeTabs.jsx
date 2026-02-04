import React from "react";
import { Tabs, Tab, Box } from "@mui/material";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import { useLanguage } from "../../context/LanguageContext";

export default function RecipeTabs({ tab, onTabChange }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs value={tab} onChange={(_, v) => onTabChange(v)}>
        <Tab label={strings.recipeTabs?.ingredients || "חומרים"} value="ingredients" />
        <Tab label={strings.recipeTabs?.steps || "שלבים"} value="steps" />
        <Tab label={strings.recipeTabs?.costs || "עלויות"} value="costs" />
      </Tabs>
    </Box>
  );
}
