import { AppBar, Toolbar, Typography, Box, IconButton, Button, useMediaQuery, useTheme } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import { useAuth } from "../../context/AuthContext";
import logoUrl from "../../assets/images/logo.png";
import "@fontsource/suez-one/400.css";

export default function TopBar() {
  const { lang, setLang } = useLanguage();
  const nextLang = lang === "he" ? "en" : "he";
  const strings = useLocaleStrings(lang);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    document.body.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  if (isMobile) {
    return (
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Toolbar sx={{
          minHeight: 60,
          px: 2,
          direction: 'rtl',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Right side: Logo */}
          <Box
            component="img"
            src={logoUrl}
            alt="Logo"
            sx={{ height: 44, objectFit: 'contain' }}
          />

          {/* Left side: user + lang */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={() => setLang(nextLang)}
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#C98929',
                color: '#9B5A25',
                fontSize: 12,
                minWidth: 38,
                px: 0.75,
                py: 0.25,
                '&:hover': { borderColor: '#971936', bgcolor: '#FDE8E8' },
              }}
            >
              {lang === "he" ? "EN" : "עב"}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: '#971936', fontWeight: 600, fontSize: 14 }}>
                {user?.name || user?.email?.split('@')[0] || ''}
              </Typography>
              <AccountCircleIcon sx={{ color: '#C98929', fontSize: 28 }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', pt: 2 }}>
      <Toolbar sx={{
        minHeight: 70,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 1,
      }}>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={() => setLang(nextLang)}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#C98929',
              color: '#9B5A25',
              '&:hover': { borderColor: '#971936', bgcolor: '#D2A5A0' },
            }}
          >
            {lang === "he" ? "En" : "עב"}
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ color: '#971936', fontWeight: 500 }}>
              {user?.name || user?.email?.split('@')[0] || 'Hagit'}
            </Typography>
            <IconButton size="medium" sx={{ color: '#C98929', '&:hover': { bgcolor: '#D2A5A0' } }}>
              <AccountCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
