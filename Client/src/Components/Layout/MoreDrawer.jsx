import {
  Drawer, Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'הכנסות והוצאות', icon: AttachMoneyIcon,   path: '/income-expense' },
  { label: 'ניהול עלויות',   icon: BarChartIcon,       path: '/costs' },
  { label: 'הוצאות קבועות',  icon: RequestQuoteIcon,   path: '/fixed-expenses' },
];

const ACTION_ITEMS = [
  { label: 'הגדרות',        icon: SettingsIcon,    action: 'settings', soon: true },
  { label: 'עזרה ותמיכה',   icon: HelpOutlineIcon, action: 'help',     soon: true },
];

export default function MoreDrawer({ open, onClose }) {
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const go = (path) => { onClose(); navigate(path); };
  const handleLogout = () => { onClose(); logout(); };

  const displayName = user?.name || user?.email?.split('@')[0] || '';

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px 24px 0 0',
          direction: 'rtl',
          pb: 3,
          boxShadow: '0 -8px 40px rgba(120,70,45,0.14)',
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ width: 40, height: 4, bgcolor: '#DDD0C8', borderRadius: 2, mx: 'auto', mt: 1.5, mb: 0.5 }} />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 1, pb: 1.5 }}>
        <IconButton size="small" onClick={onClose} sx={{ color: '#9B5A25' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#3D2B1F' }}>עוד</Typography>
        <Box sx={{ width: 32 }} />
      </Box>

      <Divider sx={{ borderColor: '#F0E4DB', mx: 2 }} />

      <List sx={{ pt: 1, px: 1 }}>
        {/* Navigation items */}
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <ListItemButton
            key={label}
            onClick={() => go(path)}
            sx={{ borderRadius: '14px', mb: 0.25, py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <Icon sx={{ color: '#C98929', fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontWeight: 600, color: '#3D2B1F', fontSize: 15 }}
            />
          </ListItemButton>
        ))}

        <Divider sx={{ borderColor: '#F0E4DB', my: 1 }} />

        {/* Action items (settings, help) */}
        {ACTION_ITEMS.map(({ label, icon: Icon, soon }) => (
          <ListItemButton
            key={label}
            disabled={soon}
            sx={{ borderRadius: '14px', mb: 0.25, py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <Icon sx={{ color: '#C98929', fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText
              primary={label}
              secondary={soon ? 'בקרוב' : null}
              primaryTypographyProps={{ fontWeight: 600, color: '#3D2B1F', fontSize: 15 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </ListItemButton>
        ))}

        <Divider sx={{ borderColor: '#F0E4DB', my: 1 }} />

        {/* Logout */}
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: '14px', py: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 42 }}>
            <LogoutIcon sx={{ color: '#9B1F3A', fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="התנתקות"
            primaryTypographyProps={{ fontWeight: 700, color: '#9B1F3A', fontSize: 15 }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
