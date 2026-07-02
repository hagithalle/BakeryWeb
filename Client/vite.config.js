
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detects SVG files that are actually PNG images wrapped in SVG containers
 * (common export from design tools like Figma/Illustrator).
 * Extracts the embedded PNG, converts to WebP at max 300×300px, and
 * inlines it as a base64 data-URL so the browser gets it from the JS
 * bundle instantly — no separate HTTP request needed.
 */
function svgEmbeddedImagePlugin() {
  let sharp;
  const cache = new Map();

  return {
    name: 'inline-svg-embedded-images',
    enforce: 'pre', // run before Vite's built-in asset handler

    async buildStart() {
      try {
        sharp = (await import('sharp')).default;
        console.log('✅ [icon-optimizer] sharp loaded — SVG icons will be converted to WebP');
      } catch {
        console.warn('⚠️  [icon-optimizer] sharp not found, SVG icons will not be optimized');
      }
    },

    async load(id) {
      // Only handle plain .svg imports (no query params)
      if (!id.endsWith('.svg') || !sharp) return null;
      if (cache.has(id)) return cache.get(id);

      let fileSize;
      try { fileSize = fs.statSync(id).size; } catch { return null; }

      // Only process large SVGs (real vector SVGs are small)
      if (fileSize < 50_000) return null;

      const content = fs.readFileSync(id, 'utf8');

      // Match embedded raster image (PNG/JPEG) in href="data:image/...;base64,..."
      const match = content.match(
        /href="data:image\/(?:png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)"/
      );
      if (!match) return null;

      try {
        const srcBuffer = Buffer.from(match[1], 'base64');

        const webpBuffer = await sharp(srcBuffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        const dataUrl = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
        const result   = `export default ${JSON.stringify(dataUrl)}`;

        cache.set(id, result);
        console.log(
          `  ↳ ${path.basename(id)} ${(fileSize / 1024).toFixed(0)} KB → ${(webpBuffer.length / 1024).toFixed(0)} KB WebP`
        );
        return result;
      } catch (err) {
        console.warn(`⚠️  [icon-optimizer] Could not optimize ${path.basename(id)}: ${err.message}`);
        return null;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    svgEmbeddedImagePlugin(),
    react(),
  ],
  build: {
    // Icons are inlined as WebP data-URLs — the bundle is intentionally larger
    // than the default 500 kB warning threshold.
    chunkSizeWarningLimit: 3000,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5003'
    },
    fs: {
      allow: [
        './',
        '../node_modules',
        '../../node_modules',
        '../',
        '../../',
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, './node_modules'),
      ]
    }
  }
});
