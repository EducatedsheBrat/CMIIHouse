// Generates the PWA icons (royal blue shield, gold "C") with sharp.
//   npm run icons
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => resolve(root, 'public', p);
mkdirSync(out('icons'), { recursive: true });

const SHIELD = 'M50 4 L92 15 V55 C92 85 73 105 50 116 C27 105 8 85 8 55 V15 Z';

// "C" drawn as a thick arc so it doesn't depend on installed fonts.
const C_ARC = 'M63.5 44.5 A17 17 0 1 0 63.5 71.5';

/** @param {{ background: boolean, scale: number }} opts */
function iconSvg({ background, scale }) {
  const shield = `
    <defs>
      <linearGradient id="fill" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#1B3F82"/>
        <stop offset="60%" stop-color="#102A5C"/>
        <stop offset="100%" stop-color="#0A1628"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F7E2A6"/>
        <stop offset="50%" stop-color="#D4A843"/>
        <stop offset="100%" stop-color="#8A6A22"/>
      </linearGradient>
      <radialGradient id="bg" cx="0.5" cy="0.35" r="0.75">
        <stop offset="0%" stop-color="#16356F"/>
        <stop offset="100%" stop-color="#0A1628"/>
      </radialGradient>
    </defs>
    ${background ? '<rect width="120" height="120" fill="url(#bg)"/>' : ''}
    <g transform="translate(60 60) scale(${scale}) translate(-50 -60)">
      <path d="${SHIELD}" fill="url(#fill)" stroke="url(#gold)" stroke-width="5" stroke-linejoin="round"/>
      <path d="${SHIELD}" fill="none" stroke="#D4A843" stroke-opacity="0.45" stroke-width="1.5" transform="translate(50 60) scale(0.84) translate(-50 -60)"/>
      <path d="M50 22 L53 27 L50 32 L47 27 Z" fill="#D4A843"/>
      <path d="${C_ARC}" fill="none" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/>
      <path d="M50 96 L53 101 L50 106 L47 101 Z" fill="#D4A843" fill-opacity="0.8"/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${shield}</svg>`;
}

const standard = iconSvg({ background: true, scale: 0.9 });
const maskable = iconSvg({ background: true, scale: 0.66 }); // keeps the shield inside the maskable safe zone
const favicon = iconSvg({ background: false, scale: 0.98 });

const jobs = [
  { svg: standard, size: 192, file: 'icons/icon-192.png' },
  { svg: standard, size: 512, file: 'icons/icon-512.png' },
  { svg: maskable, size: 512, file: 'icons/icon-maskable-512.png' },
  { svg: standard, size: 180, file: 'apple-touch-icon.png' },
];

for (const { svg, size, file } of jobs) {
  await sharp(Buffer.from(svg), { density: Math.ceil((size / 120) * 72) })
    .resize(size, size)
    .png()
    .toFile(out(file));
  console.log(`✓ public/${file}`);
}

writeFileSync(out('favicon.svg'), favicon);
console.log('✓ public/favicon.svg');

// favicon.ico for browsers that request it directly: an ICO container holding one 48×48 PNG.
const png48 = await sharp(Buffer.from(standard), { density: 96 }).resize(48, 48).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
header.writeUInt8(48, 6); // width
header.writeUInt8(48, 7); // height
header.writeUInt8(0, 8); // palette colors
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // color planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png48.length, 14); // image size
header.writeUInt32LE(22, 18); // image offset
writeFileSync(out('favicon.ico'), Buffer.concat([header, png48]));
console.log('✓ public/favicon.ico');
