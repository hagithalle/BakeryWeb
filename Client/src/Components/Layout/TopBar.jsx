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
    pageTitle = strings.sidebar.packaging;
  } else if (location.pathname.startsWith("/products")) {
    pageTitle = strings.sidebar.products;
  } else if (location.pathname.startsWith("/costs")) {
    pageTitle = "ניהול עלויות";
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
        elevation={0}
        sx={{ 
          bgcolor: '#FFF8F3',
          boxShadow: 'none',
          pt: 2
        }}
      >
        <Toolbar sx={{ 
          minHeight: 70, 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 3,
          py: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
           
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              onClick={() => setLang(nextLang)} 
              variant="outlined" 
              size="small" 
              sx={{ 
                borderColor: '#C98929',
                color: '#9B5A25',
                '&:hover': {
                  borderColor: '#971936',
                  bgcolor: '#D2A5A0'
                }
              }}
            >
              {lang === "he" ? "En" : "עב"}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ color: '#971936', fontWeight: 500 }}>Hagit</Typography>
              <IconButton 
                size="medium"
                sx={{ 
                  color: '#C98929',
                  '&:hover': {
                    bgcolor: '#D2A5A0'
                  }
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
