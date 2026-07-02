import {
  Drawer, Box, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton,
} from '@mui/material';
import { X, CircleDollarSign, ChartColumnIncreasing, Receipt, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ICON_SIZE = 20;

const NAV_ITEMS = [
  { label: 'הכנסות והוצאות', icon: CircleDollarSign,      path: '/income-expense' },
  { label: 'ניהול עלויות',   icon: ChartColumnIncreasing,  path: '/costs' },
  { label: 'הוצאות קבועות',  icon: Receipt,                path: '/fixed-expenses' },
];

const ACTION_ITEMS = [
  { label: 'הגדרות',       icon: Settings,    soon: true },
  { label: 'עזרה ותמיכה',  icon: HelpCircle,  soon: true },
];

const ICON_SX = { color: '#C98929', display: 'flex', alignItems: 'center' };
const LOGOUT_SX = { color: '#9B1F3A', display: 'flex', alignItems: 'center' };

export default function MoreDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const go = (path) => { onClose(); navigate(path); };
  const handleLogout = () => { onClose(); logout(); };

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
          <X size={18} />
        </IconButton>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#3D2B1F' }}>עוד</Typography>
        <Box sx={{ width: 32 }} />
      </Box>

      <Divider sx={{ borderColor: '#F0E4DB', mx: 2 }} />

      <List sx={{ pt: 1, px: 1 }}>
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <ListItemButton
            key={label}
            onClick={() => go(path)}
            sx={{ borderRadius: '14px', mb: 0.25, py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 42, ...ICON_SX }}>
              <Icon size={ICON_SIZE} strokeWidth={1.8} />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontWeight: 600, color: '#3D2B1F', fontSize: 15 }}
            />
          </ListItemButton>
        ))}

        <Divider sx={{ borderColor: '#F0E4DB', my: 1 }} />

        {ACTION_ITEMS.map(({ label, icon: Icon, soon }) => (
          <ListItemButton
            key={label}
            disabled={soon}
            sx={{ borderRadius: '14px', mb: 0.25, py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 42, ...ICON_SX }}>
              <Icon size={ICON_SIZE} strokeWidth={1.8} />
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

        <ListItemButton onClick={handleLogout} sx={{ borderRadius: '14px', py: 1.2 }}>
          <ListItemIcon sx={{ minWidth: 42, ...LOGOUT_SX }}>
            <LogOut size={ICON_SIZE} strokeWidth={1.8} />
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
