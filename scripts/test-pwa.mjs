// PWA installability checks: manifest fields, real icon files, service worker, password-reset wiring
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));

t('manifest is installable (name, standalone, start_url, 192 and 512 icons)', () => {
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.start_url);
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
});
t('every manifest icon exists and is a non-empty PNG', () => {
  for (const i of manifest.icons) {
    const f = `public/${i.src.replace('./', '')}`;
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.ok(statSync(new URL(`../${f}`, import.meta.url)).size > 500, f);
    assert.equal(readFileSync(new URL(`../${f}`, import.meta.url)).subarray(1, 4).toString(), 'PNG');
  }
});
t('index.html links the manifest and apple icon', () => {
  const html = read('index.html');
  assert.ok(html.includes('manifest.webmanifest') && html.includes('apple-touch-icon'));
});
t('service worker has a fetch handler and a notification click handler', () => {
  const sw = read('public/sw.js');
  assert.ok(sw.includes("'fetch'") && sw.includes('notificationclick'));
});
t('password reset: login has a forgot flow and the reset page saves via Supabase', () => {
  assert.ok(read('src/pages/Login.tsx').includes('sbSendPasswordReset'));
  assert.ok(read('src/pages/ResetPassword.tsx').includes('sbChangePassword'));
  assert.ok(read('src/App.tsx').includes('openedFromRecoveryLink'));
});

console.log(`\n${pass} pwa checks passed`);
