import { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Button,
  Avatar, Menu, MenuItem, ListItemIcon, Divider,
  useMediaQuery, useTheme,
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import BakeryIdentity from "../Branding/BakeryIdentity";
import "@fontsource/suez-one/400.css";

/* ── Letter-based avatar (falls back to user photo if available) ── */
function UserAvatar({ user, size = 34 }) {
  const letter = ((user?.name || user?.email || 'U')[0]).toUpperCase();
  if (user?.photoUrl) {
    return <Avatar src={user.photoUrl} sx={{ width: size, height: size }} />;
  }
  return (
    <Avatar sx={{
      width: size, height: size,
      bgcolor: '#C98929',
      fontSize: size * 0.42,
      fontWeight: 800,
      color: 'white',
      cursor: 'pointer',
    }}>
      {letter}
    </Avatar>
  );
}

export default function TopBar() {
  const { lang, setLang } = useLanguage();
  const nextLang = lang === "he" ? "en" : "he";
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState(null);

  React.useEffect(() => {
    document.body.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const displayName = user?.name || user?.email?.split('@')[0] || '';

  const openMenu  = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const handleLogout = () => { closeMenu(); logout(); };

  /* ── Shared user dropdown ── */
  const userDropdown = (
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor)}
      onClose={closeMenu}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        elevation: 4,
        sx: {
          borderRadius: '18px',
          border: '1px solid #F0E4DB',
          minWidth: 210,
          direction: 'rtl',
          mt: 1,
          boxShadow: '0 8px 32px rgba(120,70,45,0.14)',
        },
      }}
    >
      {/* User info */}
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <UserAvatar user={user} size={42} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#3D2B1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </Typography>
          {user?.email && (
            <Typography sx={{ fontSize: 13, color: "#9B5A25", direction: "ltr", textAlign: "right", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#F0E4DB' }} />

      <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: '#9B1F3A', fontWeight: 700, fontSize: 14 }}>
        <ListItemIcon sx={{ minWidth: 'auto' }}>
          <LogoutIcon sx={{ fontSize: 19, color: '#9B1F3A' }} />
        </ListItemIcon>
        התנתקות
      </MenuItem>
    </Menu>
  );

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Toolbar sx={{ minHeight: 60, px: 2, direction: 'rtl', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Right: the bakery's own identity (never a shared/global logo) */}
          <Box sx={{ minWidth: 0, flexShrink: 1 }}>
            <BakeryIdentity size={38} compact />
          </Box>

          {/* Left: lang + avatar + name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={() => setLang(nextLang)}
              variant="outlined"
              size="small"
              sx={{ borderColor: '#C98929', color: '#9B5A25', fontSize: 12, minWidth: 38, px: 0.75, py: 0.25, '&:hover': { borderColor: '#971936', bgcolor: '#FDE8E8' } }}
            >
              {lang === "he" ? "EN" : "עב"}
            </Button>

            {/* Avatar only on mobile: the bakery name needs the space; the menu shows the full name. */}
            <IconButton onClick={openMenu} aria-label={`תפריט משתמש: ${displayName}`} sx={{ p: 0.5 }}>
              <UserAvatar user={user} size={34} />
            </IconButton>
          </Box>
        </Toolbar>
        {userDropdown}
      </AppBar>
    );
  }

  /* ── Desktop ── */
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', pt: 2 }}>
      <Toolbar sx={{ minHeight: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1 }}>
        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            onClick={() => setLang(nextLang)}
            variant="outlined"
            size="small"
            sx={{ borderColor: '#C98929', color: '#9B5A25', '&:hover': { borderColor: '#971936', bgcolor: '#D2A5A0' } }}
          >
            {lang === "he" ? "En" : "עב"}
          </Button>

          {/* Avatar pill — click to open dropdown */}
          <Box
            onClick={openMenu}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              cursor: 'pointer', px: 1.5, py: 0.75,
              borderRadius: '999px',
              border: '1px solid #F0E4DB',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(120,70,45,0.07)',
              '&:hover': { bgcolor: '#FDF0E8', boxShadow: '0 4px 12px rgba(120,70,45,0.12)' },
              transition: 'all 0.2s ease',
            }}
          >
            <Typography sx={{ color: '#971936', fontWeight: 600, fontSize: 14 }}>{displayName}</Typography>
            <UserAvatar user={user} size={32} />
          </Box>
        </Box>
      </Toolbar>
      {userDropdown}
    </AppBar>
  );
}
