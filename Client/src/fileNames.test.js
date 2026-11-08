import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows file systems are case-insensitive and Vite tries ".js" before ".jsx", so an import of
// "./Foo" can silently load "foo.js" instead of "Foo.jsx". Keep module names unique ignoring
// case and extension.
describe('source file names', () => {
  it('no two modules differ only by letter case or extension', () => {
    const root = fileURLToPath(new URL('.', import.meta.url));
    const seen = new Map();
    const clashes = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(jsx?|tsx?)$/.test(name)) continue;
        const rel = relative(root, full).replace(/\\/g, '/');
        const key = rel.replace(/\.(test\.)?[jt]sx?$/, (m) => (m.startsWith('.test') ? '.test' : '')).toLowerCase();
        if (seen.has(key) && seen.get(key) !== rel) clashes.push(`${seen.get(key)} <-> ${rel}`);
        else seen.set(key, rel);
      }
    };
    walk(root);
    expect(clashes).toEqual([]);
  });
});
