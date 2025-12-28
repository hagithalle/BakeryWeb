import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";

export default function MainLayout({children}) {
    const { lang } = useLanguage();
    const strings = useLocaleStrings(lang);
    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FFE6D4" }}>
            <Box sx={{ display: 'flex', flex: 1, flexDirection: strings.direction === 'rtl' ? 'row-reverse' : 'row' ,}}>
                <Sidebar lang={lang} />
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <TopBar />
                    <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}