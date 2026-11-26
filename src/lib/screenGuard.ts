// Best-effort deterrent against screenshots/recording of the app for students.
// A web page cannot truly block OS screenshots; this hides the content on the
// common triggers (PrintScreen / Cmd+Shift+3-5 / Win+Shift+S, losing focus,
// printing, right-click / long-press save) and is skipped for admins.
const CLS = 'screen-guard-hide';
let timer: number | undefined;
let installed: (() => void) | null = null;

const hideFor = (ms: number) => {
  document.documentElement.classList.add(CLS);
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { if (!document.hidden && document.hasFocus()) document.documentElement.classList.remove(CLS); }, ms);
};

export function installScreenGuard() {
  if (installed) return installed;
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    const shot = k === 'PrintScreen' || k === 'Snapshot'
      || (e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(k))
      || (e.metaKey && e.shiftKey && /^s$/i.test(k)) // Win+Shift+S
      || (e.ctrlKey && e.shiftKey && /^s$/i.test(k));
    if (shot) { hideFor(1500); try { navigator.clipboard?.writeText(''); } catch {} }
    if ((e.ctrlKey || e.metaKey) && /^[ps]$/i.test(k)) e.preventDefault(); // print / save
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'PrintScreen') { hideFor(1500); try { navigator.clipboard?.writeText(''); } catch {} } };
  const onVis = () => { if (document.hidden) document.documentElement.classList.add(CLS); else hideFor(300); };
  const onBlur = () => document.documentElement.classList.add(CLS);
  const onFocus = () => hideFor(300);
  const onCtx = (e: Event) => { const t = e.target as HTMLElement; if (!t?.closest?.('input,textarea,[contenteditable="true"]')) e.preventDefault(); };
  const onDrag = (e: Event) => e.preventDefault();
  document.documentElement.classList.add('screen-guard');
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKeyUp, true);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('beforeprint', onBlur);
  document.addEventListener('contextmenu', onCtx);
  document.addEventListener('dragstart', onDrag);
  installed = () => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('beforeprint', onBlur);
    document.removeEventListener('contextmenu', onCtx);
    document.removeEventListener('dragstart', onDrag);
    document.documentElement.classList.remove('screen-guard', CLS);
    installed = null;
  };
  return installed;
}
