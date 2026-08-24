#!/usr/bin/env node
/*
 * Generate the PWA icon set (icon-192, icon-512, icon-maskable-512, apple-touch-icon) as real
 * PNGs from an inline SVG design — a dark "speech bubble" card with a "BD" wordmark on the
 * app's gold accent color.
 *
 * Not wired into `npm run build`: this needs `sharp` (SVG rasterization via librsvg), which is
 * a heavy native dependency for something that only needs to run once, or again if the design
 * changes. Install it on demand rather than carrying it in package.json:
 *
 *   npm install --no-save sharp
 *   node tools/make-icons.js icons
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const GOLD = '#E0A93B';
const INK = '#16150F';

function svgIcon(size, maskable) {
  // Maskable icons get extra padding: OS-applied mask shapes (circle, squircle...) crop
  // straight to the edge, so content must stay inside a safe zone well within the canvas.
  const pad = size * (maskable ? 0.20 : 0.12);
  const cardX = pad, cardY = pad, cardW = size - pad * 2, cardH = size - pad * 2;
  const r = cardW * 0.14;
  const tail = cardW * 0.16;
  const tailBaseX = cardX + cardW * 0.22;
  const tailTopY = cardY + cardH;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${GOLD}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${r}" fill="${INK}"/>
  <polygon points="
    ${tailBaseX},${tailTopY}
    ${tailBaseX - tail * 0.5},${tailTopY + tail}
    ${tailBaseX + tail * 0.6},${tailTopY - tail * 0.1}
  " fill="${INK}"/>
  <text x="${cardX + cardW / 2}" y="${cardY + cardH / 2}" fill="${GOLD}"
    font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${cardW * 0.44}"
    text-anchor="middle" dominant-baseline="central">BD</text>
</svg>`;
}

async function render(size, maskable, outPath) {
  const svg = svgIcon(size, maskable);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log('wrote', outPath, `${size}x${size}`, maskable ? '(maskable)' : '');
}

const ICONS_DIR = path.resolve(process.argv[2] || 'icons');
if (!process.argv[2]) console.log(`No path given, defaulting to ${ICONS_DIR}`);
fs.mkdirSync(ICONS_DIR, { recursive: true });

(async () => {
  await render(192, false, path.join(ICONS_DIR, 'icon-192.png'));
  await render(512, false, path.join(ICONS_DIR, 'icon-512.png'));
  await render(512, true, path.join(ICONS_DIR, 'icon-maskable-512.png'));
  await render(180, false, path.join(ICONS_DIR, 'apple-touch-icon.png'));
})();
