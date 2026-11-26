export type Theme = 'light' | 'dark';

const KEY = 'speakozy-theme';

// Light is the default; only an explicit earlier choice of dark is remembered.
export function getTheme(): Theme {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0b1220' : '#f5f7fa');
}

export function setTheme(t: Theme) {
  try { if (t === 'dark') localStorage.setItem(KEY, 'dark'); else localStorage.removeItem(KEY); } catch { /* storage blocked: keep for this session only */ }
  applyTheme(t);
  window.dispatchEvent(new Event('speakozy-theme'));
}
