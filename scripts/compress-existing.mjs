// Compress every existing photo in place: read the local backup, downscale to
// a 1600px long edge + JPEG q82 with sharp, re-upload (upsert) to the SAME
// storage path, and update width/height in the DB. Requires the local backup
// to exist (scripts/backup-originals.mjs) — that's our safety net.
//
// Run: node scripts/compress-existing.mjs
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');

const BACKUP = 'backup-originais';
const MAX_EDGE = 1600;
const QUALITY = 82;

const manifest = JSON.parse(readFileSync(join(BACKUP, '_manifest.json'), 'utf8'));
let usable = manifest.filter((m) => m.file && !m.error);
// Optional: `node scripts/compress-existing.mjs 1` to process just the first N (test run).
const limit = parseInt(process.argv[2] || '0', 10);
if (limit > 0) usable = usable.slice(0, limit);
console.log(`Compressing ${usable.length} photos (backup is the source of truth).`);

let srcTotal = 0;
let outTotal = 0;
let done = 0;
let failed = 0;

for (const m of usable) {
  const localPath = join(BACKUP, m.file);
  if (!existsSync(localPath)) {
    console.warn(`  ! missing backup file for ${m.path}, skipping`);
    failed++;
    continue;
  }

  const srcBuf = readFileSync(localPath);

  let out;
  let meta;
  try {
    const pipeline = sharp(srcBuf, { failOn: 'none' })
      .rotate() // bake in EXIF orientation
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true });
    out = await pipeline.toBuffer();
    meta = await sharp(out).metadata();
  } catch (e) {
    console.warn(`  ! compress failed for ${m.path}: ${e.message}`);
    failed++;
    continue;
  }

  // Safety: never replace with something bigger than the original.
  if (out.length >= srcBuf.length) {
    console.log(`  = ${m.path}: already small (${kb(srcBuf.length)}), leaving as is`);
    srcTotal += srcBuf.length;
    outTotal += srcBuf.length;
    done++;
    continue;
  }

  // Re-upload to the same path (upsert overwrites).
  const up = await fetch(`${URL}/storage/v1/object/photos/${m.path}`, {
    method: 'PUT',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    body: out,
  });
  if (!up.ok) {
    console.warn(`  ! upload failed for ${m.path}: ${up.status} ${await up.text()}`);
    failed++;
    continue;
  }

  // Update dimensions in the DB so the feed aspect ratios stay correct.
  const patch = await fetch(`${URL}/rest/v1/photos?id=eq.${m.id}`, {
    method: 'PATCH',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ width: meta.width, height: meta.height }),
  });
  if (!patch.ok) console.warn(`  ~ dim update failed for ${m.path}: ${patch.status}`);

  srcTotal += srcBuf.length;
  outTotal += out.length;
  done++;
  if (done % 10 === 0) console.log(`  ...${done}/${usable.length}`);
}

console.log(`\nDone. Compressed ${done}, failed ${failed}.`);
console.log(`Before: ${mb(srcTotal)}   After: ${mb(outTotal)}   Saved: ${mb(srcTotal - outTotal)} (${Math.round((1 - outTotal / srcTotal) * 100)}%)`);

function kb(b) { return (b / 1024).toFixed(0) + ' KB'; }
function mb(b) { return (b / 1024 / 1024).toFixed(1) + ' MB'; }
