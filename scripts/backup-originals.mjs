// Backup every original photo full-res to ./backup-originais/ before we
// compress anything. Read-only against Supabase — uses the public anon key.
// Run: node scripts/backup-originals.mjs
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// --- read env from .env.local ---
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
// service_role bypasses RLS so we can read every photo for the backup.
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) throw new Error('Missing Supabase env vars in .env.local');

const OUT = 'backup-originais';
mkdirSync(OUT, { recursive: true });

// --- list all photo rows ---
const res = await fetch(
  `${URL}/rest/v1/photos?select=id,image_url,width,height,created_at&order=created_at.asc`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
const rows = await res.json();
console.log(`Found ${rows.length} photos to back up.`);

const manifest = [];
let done = 0;
let totalBytes = 0;

for (const row of rows) {
  // Storage path → flat filename (replace slashes).
  const safeName = row.image_url.replace(/[/\\]/g, '__');
  const dest = join(OUT, safeName);

  if (existsSync(dest)) {
    const sz = readFileSync(dest).length;
    manifest.push({ id: row.id, path: row.image_url, file: safeName, bytes: sz, skipped: true });
    totalBytes += sz;
    done++;
    continue;
  }

  // Authenticated storage endpoint (works even if public reads are off).
  const url = `${URL}/storage/v1/object/photos/${row.image_url}`;
  const img = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!img.ok) {
    console.warn(`  ! skip ${row.image_url} (${img.status})`);
    manifest.push({ id: row.id, path: row.image_url, error: img.status });
    continue;
  }
  const buf = Buffer.from(await img.arrayBuffer());
  writeFileSync(dest, buf);
  totalBytes += buf.length;
  manifest.push({ id: row.id, path: row.image_url, file: safeName, bytes: buf.length });
  done++;
  if (done % 10 === 0) console.log(`  ...${done}/${rows.length}`);
}

writeFileSync(join(OUT, '_manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nDone. Backed up ${done}/${rows.length} photos.`);
console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB in ./${OUT}/`);
console.log(`Manifest: ./${OUT}/_manifest.json`);
