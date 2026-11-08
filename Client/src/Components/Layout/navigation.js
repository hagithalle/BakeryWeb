import {
  LayoutDashboard, Wheat, Package, BookOpen, ChefHat,
  CircleDollarSign, Receipt, ChartColumnIncreasing,
} from 'lucide-react';

/**
 * The single navigation configuration for the desktop sidebar, the mobile bottom bar and the
 * mobile "More" drawer. Only existing, working routes from App.jsx belong here.
 *
 * - `matches`: extra routes that count as this item's sub-pages (highlight the parent there).
 * - `mobileTab`: shown as a tab in the bottom bar; every other item appears in the More drawer.
 */
export const NAV_GROUPS = [
  {
    id: 'main',
    label: { he: 'ראשי', en: 'Main' },
    items: [
      { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, mobileTab: true,
        label: { he: 'דשבורד', en: 'Dashboard' }, shortLabel: { he: 'בית', en: 'Home' } },
    ],
  },
  {
    id: 'production',
    label: { he: 'ייצור', en: 'Production' },
    items: [
      { id: 'products', path: '/products', icon: ChefHat, mobileTab: true, label: { he: 'מוצרים', en: 'Products' } },
      { id: 'recipes', path: '/recipes', icon: BookOpen, mobileTab: true, label: { he: 'מתכונים', en: 'Recipes' } },
      { id: 'ingredients', path: '/ingredients', icon: Wheat, mobileTab: true, label: { he: 'חומרי גלם', en: 'Ingredients' } },
      { id: 'packaging', path: '/packaging', icon: Package, label: { he: 'מוצרי אריזה', en: 'Packaging' } },
    ],
  },
  {
    id: 'finance',
    label: { he: 'כספים', en: 'Finance' },
    items: [
      { id: 'income-expense', path: '/income-expense', icon: CircleDollarSign, label: { he: 'הכנסות והוצאות', en: 'Income & expenses' } },
      { id: 'fixed-expenses', path: '/fixed-expenses', icon: Receipt, label: { he: 'הוצאות קבועות', en: 'Fixed expenses' } },
      // Purchase VAT review is reached from cost management, so it highlights this item.
      { id: 'costs', path: '/costs', icon: ChartColumnIncreasing, matches: ['/purchase-vat'], label: { he: 'ניהול עלויות', en: 'Cost management' } },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
export const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((i) => i.mobileTab);
export const MORE_DRAWER_GROUPS = NAV_GROUPS
  .map((g) => ({ ...g, items: g.items.filter((i) => !i.mobileTab) }))
  .filter((g) => g.items.length > 0);

/** `route` or any path below it (segment boundary: "/costs" matches "/costs/x", not "/costsx"). */
const isUnder = (pathname, route) => pathname === route || pathname.startsWith(`${route}/`);

export const isNavItemActive = (item, pathname) =>
  [item.path, ...(item.matches ?? [])].some((route) => isUnder(pathname, route));

export const findActiveNavItem = (pathname) => NAV_ITEMS.find((item) => isNavItemActive(item, pathname)) ?? null;

export const navLabel = (labels, lang) => labels?.[lang] ?? labels?.he ?? '';
