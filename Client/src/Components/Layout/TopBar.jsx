import { AppBar, Toolbar, Typography, Box, IconButton, Button } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useLocation } from "react-router-dom";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import "@fontsource/suez-one/400.css";

export default function TopBar() {
  const { lang, setLang } = useLanguage();
  const nextLang = lang === "he" ? "en" : "he";
  const location = useLocation();
  const strings = useLocaleStrings(lang);

  // Determine page title based on path
  let pageTitle = "";
  if (location.pathname.startsWith("/ingredients")) {
    pageTitle = strings.sidebar.ingredients;
  } else if (location.pathname.startsWith("/recipes")) {
    pageTitle = strings.sidebar.recipes;
    } else if (location.pathname.startsWith("/packaging")) {
    pageTitle = strings.sidebar.packaging
  } else if (location.pathname.startsWith("/products")) {
    pageTitle = strings.sidebar.products;
  } else {
    pageTitle = "";
  }

  // Optional: update document direction for accessibility
  React.useEffect(() => {
    document.body.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <>
      <AppBar
        position="static"
        color="rgba(117, 11, 19, 1)"
        elevation={0}
        sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
      >
        <Toolbar sx={{ minHeight: 100, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', width: '100%', color: '#751B13', fontFamily: 'Suez One, serif', textShadow: '-1px 0 #222, 0 1px #222, 1px 0 #222, 0 -1px #222', letterSpacing: '0.08em', mb: 0 }}>
              {pageTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button onClick={() => setLang(nextLang)} variant="outlined" size="small" sx={{ mx: 2 }}>
              {lang === "he" ? "En" : "he"}
            </Button>
            <Typography variant="body2">Hagit</Typography>
            <IconButton size="small">
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
