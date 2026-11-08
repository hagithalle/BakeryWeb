import {
  Drawer, Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton,
} from '@mui/material';
import { X, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { brandPalette as p } from '../../constants/brandPalette';
import { MORE_DRAWER_GROUPS, isNavItemActive, navLabel } from './navigation';

const ICON_SIZE = 20;

export default function MoreDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { lang } = useLanguage();

  const go = (path) => { onClose(); navigate(path); };
  const handleLogout = () => { onClose(); logout(); };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      // Above the fixed bottom bar (z-index 1300), which otherwise hides the last items (logout).
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          borderRadius: '24px 24px 0 0',
          direction: 'rtl',
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(94, 20, 40, 0.14)',
          bgcolor: p.white,
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ width: 40, height: 4, bgcolor: p.border, borderRadius: 2, mx: 'auto', mt: 1.5, mb: 0.5 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 1, pb: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, color: p.ink }}>
          {lang === 'he' ? 'עוד' : 'More'}
        </Typography>
        <IconButton onClick={onClose} aria-label={lang === 'he' ? 'סגירה' : 'Close'} sx={{ width: 44, height: 44, color: p.muted }}>
          <X size={20} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: p.border, mx: 2 }} />

      <Box component="nav" sx={{ px: 1, pt: 1 }}>
        {MORE_DRAWER_GROUPS.map((group) => (
          <Box key={group.id} sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: p.muted, px: 2, pt: 1, pb: 0.5 }}>
              {navLabel(group.label, lang)}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item, pathname);
                return (
                  <ListItemButton
                    key={item.id}
                    onClick={() => go(item.path)}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      minHeight: 48,
                      borderRadius: '14px',
                      mb: 0.25,
                      bgcolor: active ? p.blush : 'transparent',
                      '&:hover': { bgcolor: active ? p.blush : p.blushSoft },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: active ? p.burgundy : p.muted }}>
                      <Icon size={ICON_SIZE} strokeWidth={active ? 2.2 : 1.8} />
                    </ListItemIcon>
                    <ListItemText
                      primary={navLabel(item.label, lang)}
                      primaryTypographyProps={{ fontWeight: active ? 800 : 600, color: active ? p.burgundy : p.ink, fontSize: 16 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}

        <Divider sx={{ borderColor: p.border, my: 1 }} />

        <ListItemButton onClick={handleLogout} sx={{ minHeight: 48, borderRadius: '14px' }}>
          <ListItemIcon sx={{ minWidth: 40, color: p.burgundy }}>
            <LogOut size={ICON_SIZE} strokeWidth={1.9} />
          </ListItemIcon>
          <ListItemText
            primary="התנתקות"
            primaryTypographyProps={{ fontWeight: 700, color: p.burgundy, fontSize: 16 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
