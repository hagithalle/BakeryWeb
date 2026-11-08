import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  NAV_GROUPS, NAV_ITEMS, MOBILE_TAB_ITEMS, MORE_DRAWER_GROUPS,
  isNavItemActive, findActiveNavItem, navLabel,
} from './navigation';
import { QUICK_ACTIONS } from '../Dashboard/quickActionsConfig';

// Signed-in routes declared in App.jsx (the source of truth for what exists).
const appSource = readFileSync(fileURLToPath(new URL('../../App.jsx', import.meta.url)), 'utf8');
const APP_ROUTES = [...appSource.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1]);

describe('shared navigation configuration', () => {
  it('groups pages into main, production and finance', () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(['main', 'production', 'finance']);
    expect(NAV_GROUPS[0].items.map((i) => i.id)).toEqual(['dashboard']);
  });

  it('includes fixed expenses but not purchase VAT review as a primary item', () => {
    const paths = NAV_ITEMS.map((i) => i.path);
    expect(paths).toContain('/fixed-expenses');
    expect(paths).not.toContain('/purchase-vat');
  });

  it('only links to routes that exist in App.jsx', () => {
    for (const path of [...NAV_ITEMS.map((i) => i.path), ...QUICK_ACTIONS.map((a) => a.path)]) {
      expect(APP_ROUTES).toContain(path);
    }
  });

  it('shows every page exactly once on mobile (bottom bar or More drawer)', () => {
    const drawerIds = MORE_DRAWER_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    const mobileIds = [...MOBILE_TAB_ITEMS.map((i) => i.id), ...drawerIds];
    expect(mobileIds.sort()).toEqual(NAV_ITEMS.map((i) => i.id).sort());
    expect(MOBILE_TAB_ITEMS.length).toBeLessThanOrEqual(4); // plus the "More" tab = 5
  });

  it('has Hebrew and English labels for every item and group', () => {
    for (const x of [...NAV_GROUPS, ...NAV_ITEMS]) {
      expect(navLabel(x.label, 'he')).toBeTruthy();
      expect(navLabel(x.label, 'en')).toBeTruthy();
    }
  });
});

describe('active navigation item', () => {
  const byId = (id) => NAV_ITEMS.find((i) => i.id === id);

  it('matches the page and its sub-pages on path-segment boundaries', () => {
    expect(isNavItemActive(byId('costs'), '/costs')).toBe(true);
    expect(isNavItemActive(byId('costs'), '/costs/labor')).toBe(true);
    expect(isNavItemActive(byId('costs'), '/costsx')).toBe(false);
    expect(isNavItemActive(byId('products'), '/products/12/edit')).toBe(true);
  });

  it('highlights cost management on the purchase VAT review page', () => {
    expect(findActiveNavItem('/purchase-vat')?.id).toBe('costs');
  });

  it('highlights exactly one item for each primary page', () => {
    for (const item of NAV_ITEMS) {
      expect(NAV_ITEMS.filter((i) => isNavItemActive(i, item.path))).toEqual([item]);
    }
  });

  it('highlights nothing on unknown pages', () => {
    expect(findActiveNavItem('/somewhere-else')).toBeNull();
  });
});
