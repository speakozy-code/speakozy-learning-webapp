import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const AR = /[؀-ۿ]/;
/** Files whose module-level Arabic strings are UI copy rendered through tr() at use sites. */
const DATA_FILES = ['src/lib/tours.ts', 'src/lib/help.ts', 'src/components/layout/nav.ts', 'src/pages/Trial.tsx', 'src/pages/Resources.tsx', 'src/lib/domain.ts'];

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

/** Every string the UI asks to translate: tr('…') first arguments + Arabic literals in the data files. */
export function collectKeys() {
  const keys = new Map(); // key -> Set(files)
  const add = (k, f) => { if (!keys.has(k)) keys.set(k, new Set()); keys.get(k).add(f); };
  for (const file of walk(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, file);
    if (rel.startsWith('src/lib/i18n/')) continue;
    const src = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
    const isData = DATA_FILES.includes(rel);
    (function visit(n) {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'tr' && n.arguments[0]) {
        const a = n.arguments[0];
        if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) add(a.text, rel);
      } else if (isData && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && AR.test(n.text)
        && !ts.isImportDeclaration(n.parent) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n)
        && !(ts.isBinaryExpression(n.parent) && /Equals/.test(ts.SyntaxKind[n.parent.operatorToken.kind]))) add(n.text, rel);
      ts.forEachChild(n, visit);
    })(sf);
  }
  return keys;
}
