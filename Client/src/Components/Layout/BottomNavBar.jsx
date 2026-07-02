import { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import CakeIcon from '@mui/icons-material/Cake';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GrainIcon from '@mui/icons-material/Grain';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MoreDrawer from './MoreDrawer';

const TABS = [
  { label: 'בית',       path: '/dashboard',  icon: <HomeIcon /> },
  { label: 'מוצרים',    path: '/products',   icon: <CakeIcon /> },
  { label: 'מתכונים',   path: '/recipes',    icon: <MenuBookIcon /> },
  { label: 'חומרי גלם', path: '/ingredients',icon: <GrainIcon /> },
  { label: 'עוד',       path: null,          icon: <MoreHorizIcon /> },
];

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const current = TABS.findIndex(t => t.path && location.pathname.startsWith(t.path));

  const handleChange = (_, idx) => {
    const tab = TABS[idx];
    if (!tab.path) {
      setDrawerOpen(true);
    } else {
      navigate(tab.path);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 1300,
          borderTop: '1px solid #F0E4DB',
          boxShadow: '0 -4px 20px rgba(120,70,45,0.12)',
        }}
      >
        <BottomNavigation
          value={current === -1 ? false : current}
          onChange={handleChange}
          showLabels
          sx={{
            height: 64,
            direction: 'rtl',
            bgcolor: '#FEFEFE',
            '& .MuiBottomNavigationAction-root': {
              color: '#C4A88A',
              minWidth: 0,
              gap: 0.3,
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': {
              color: '#9B1F3A',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem !important',
              fontWeight: 600,
            },
          }}
        >
          {TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.label}
              label={tab.label}
              icon={tab.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
