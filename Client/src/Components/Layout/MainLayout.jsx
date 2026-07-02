import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomNavBar from "./BottomNavBar";
import { Box, useMediaQuery, useTheme } from "@mui/material";

export default function MainLayout({ children }) {
    const { lang } = useLanguage();
    const strings = useLocaleStrings(lang);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Box sx={{
                display: 'flex',
                flex: 1,
                flexDirection: strings.direction === 'rtl' ? 'row-reverse' : 'row',
                minHeight: 0,
            }}>
                {!isMobile && <Sidebar lang={lang} />}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'linear-gradient(180deg, #FBF7F3 0%, #F8F2EE 40%, #F6EEE8 100%)',
                        minHeight: 0,
                    }}
                >
                    <TopBar />
                    <Box sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 3 },
                        pb: { xs: '88px', md: 3 },
                        overflow: "auto",
                    }}>
                        {children}
                    </Box>
                </Box>
            </Box>
            {isMobile && <BottomNavBar />}
        </Box>
    );
}
