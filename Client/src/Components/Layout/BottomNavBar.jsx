import { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ellipsis } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { brandPalette as p } from '../../constants/brandPalette';
import MoreDrawer from './MoreDrawer';
import { MOBILE_TAB_ITEMS, findActiveNavItem, navLabel } from './navigation';

const ICON_SIZE = 22;
const MORE = 'more';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A page that lives in the More drawer highlights the "More" tab.
  const active = findActiveNavItem(pathname);
  const value = !active ? false : active.mobileTab ? active.id : MORE;

  const handleChange = (_, id) => {
    if (id === MORE) setDrawerOpen(true);
    else navigate(MOBILE_TAB_ITEMS.find((i) => i.id === id).path);
  };

  return (
    <>
      <Paper
        component="nav"
        aria-label={lang === 'he' ? 'ניווט ראשי' : 'Main navigation'}
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 1300,
          borderTop: `1px solid ${p.border}`,
          boxShadow: '0 -4px 20px rgba(94, 20, 40, 0.10)',
          pb: 'env(safe-area-inset-bottom)',
          bgcolor: p.white,
        }}
      >
        <BottomNavigation
          value={value}
          onChange={handleChange}
          showLabels
          sx={{
            height: 64,
            direction: 'rtl',
            bgcolor: p.white,
            '& .MuiBottomNavigationAction-root': {
              color: p.muted,
              minWidth: 0,
              px: 0.5,
              gap: 0.4,
              '& svg': { color: 'inherit' },
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': { color: p.burgundy },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '12px !important',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            },
            '& .Mui-selected .MuiBottomNavigationAction-label': { fontWeight: 800 },
          }}
        >
          {MOBILE_TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <BottomNavigationAction
                key={item.id}
                value={item.id}
                label={navLabel(item.shortLabel ?? item.label, lang)}
                icon={<Icon size={ICON_SIZE} strokeWidth={value === item.id ? 2.2 : 1.8} />}
                aria-current={value === item.id ? 'page' : undefined}
              />
            );
          })}
          <BottomNavigationAction
            value={MORE}
            label={lang === 'he' ? 'עוד' : 'More'}
            icon={<Ellipsis size={ICON_SIZE} strokeWidth={value === MORE ? 2.2 : 1.8} />}
            aria-haspopup="dialog"
          />
        </BottomNavigation>
      </Paper>

      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
