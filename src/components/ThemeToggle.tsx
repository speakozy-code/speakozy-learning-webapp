import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, setTheme, type Theme } from '../lib/theme';

export function ThemeToggle({ label = false, className = 'icon-btn' }: { label?: boolean; className?: string }) {
  const [t, setT] = useState<Theme>(getTheme());
  useEffect(() => {
    const sync = () => setT(getTheme());
    window.addEventListener('speakozy-theme', sync);
    return () => window.removeEventListener('speakozy-theme', sync);
  }, []);
  const next: Theme = t === 'dark' ? 'light' : 'dark';
  const text = t === 'dark' ? 'الثيم الفاتح' : 'الثيم الداكن';
  return <button type="button" className={`${className} theme-toggle`} onClick={() => setTheme(next)} aria-label={text} title={text}>
    {t === 'dark' ? <Sun size={18} /> : <Moon size={18} />}{label && <span>{text}</span>}
  </button>;
}
