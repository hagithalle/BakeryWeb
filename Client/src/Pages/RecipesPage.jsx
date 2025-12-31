import React from "react";
import { Box, Typography } from "@mui/material";
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";

export default function RecipesPage() {
    const { lang } = useLanguage();
    const strings = useLocaleStrings(lang);

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2, mt: 1, textAlign: 'center', color: '#751B13', fontFamily: 'Suez One, serif' }}>
                {strings.sidebar?.recipes || "מתכונים"}
            </Typography>
            {/* כאן יופיעו רכיבי דף המתכונים */}
        </Box>
    );
}