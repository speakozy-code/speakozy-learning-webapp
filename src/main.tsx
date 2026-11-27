import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './lib/store';
import App from './App';
import './styles/index.css';
import { applyTheme, getTheme } from './lib/theme';

applyTheme(getTheme());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppProvider><App /></AppProvider></React.StrictMode>
);
