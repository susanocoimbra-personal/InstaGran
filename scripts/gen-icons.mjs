// One-off: generate PWA icons from the source photo (assets/icon.png).
// Run with: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'assets/icon.png';
const OUT = 'public/icons';
mkdirSync(OUT, { recursive: true });

// Square crop (cover) variants — used as the standard "any" icons + apple-touch.
const square = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

for (const { size, file } of square) {
  await sharp(SRC)
    .resize(size, size, { fit: 'cover', position: 'attention' })
    .png()
    .toFile(`${OUT}/${file}`);
  console.log('wrote', file);
}

// Maskable 512: photo inset on a warm terracotta canvas so the OS safe-zone
// mask never clips the baby's face.
const inset = Math.round(512 * 0.72);
const photo = await sharp(SRC)
  .resize(inset, inset, { fit: 'cover', position: 'attention' })
  .toBuffer();

await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 0xc4, g: 0x81, b: 0x6b, alpha: 1 }, // primary terracotta
  },
})
  .composite([{ input: photo, gravity: 'center' }])
  .png()
  .toFile(`${OUT}/icon-512-maskable.png`);
console.log('wrote icon-512-maskable.png');

// Favicon (small) for browser tabs.
await sharp(SRC).resize(48, 48, { fit: 'cover', position: 'attention' }).png().toFile('public/favicon.png');
console.log('wrote favicon.png');
