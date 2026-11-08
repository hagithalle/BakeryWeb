import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBakeryIdentity, DEFAULT_BAKERY_LABEL } from './resolveBakeryIdentity';

describe('bakery identity (tenant branding)', () => {
  it('without business data shows a neutral label and no logo', () => {
    const id = resolveBakeryIdentity({ business: null, user: { name: 'Dana Cohen', email: 'dana@example.com' } });
    expect(id).toEqual({ name: DEFAULT_BAKERY_LABEL, hasOwnName: false, logoUrl: null, initial: 'D' });
  });

  it('uses the bakery’s own name and logo when they exist', () => {
    const id = resolveBakeryIdentity({ business: { name: ' מאפיית השקד ', logoUrl: '/uploads/abc.webp' }, user: { name: 'Dana' } });
    expect(id).toEqual({ name: 'מאפיית השקד', hasOwnName: true, logoUrl: '/uploads/abc.webp', initial: 'מ' });
  });

  it('falls back to the email, then to no initial (icon)', () => {
    expect(resolveBakeryIdentity({ user: { email: 'baker@example.com' } }).initial).toBe('B');
    expect(resolveBakeryIdentity({ user: null }).initial).toBeNull();
  });

  it('has no global default name or logo', () => {
    const id = resolveBakeryIdentity();
    expect(id.logoUrl).toBeNull();
    expect(id.name).toBe(DEFAULT_BAKERY_LABEL);
  });
});

describe('no shared personal logo in the app', () => {
  const srcDir = fileURLToPath(new URL('../../', import.meta.url));
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (name !== 'assets') walk(full); }
      else if (/\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name)) files.push(full);
    }
  };
  walk(srcDir);

  it('no source file imports assets/images/logo.png', () => {
    // Quoted module paths only (imports/requires), not comments that mention the file.
    const offenders = files.filter((f) => /['"][^'"\n]*images\/logo\.png['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
