import { readFileSync } from 'node:fs';

/** All stylesheet partials concatenated in cascade order (see src/styles/index.css). */
export function readStyles() {
  const dir = new URL('../../src/styles/', import.meta.url);
  const index = readFileSync(new URL('index.css', dir), 'utf8');
  return [...index.matchAll(/@import\s+['"]\.\/([^'"]+)['"]/g)].map((m) => readFileSync(new URL(m[1], dir), 'utf8')).join('\n');
}
