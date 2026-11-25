import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Google Analytics 4. Active only when VITE_GA_ID (e.g. G-XXXXXXXXXX) is set at build time.
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
declare global { interface Window { dataLayer: unknown[]; gtag: (...args: unknown[]) => void } }

let loaded = false;
function load() {
  if (loaded || !GA_ID || typeof window === "undefined") return;
  loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

export default function Analytics() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!GA_ID) return;
    load();
    window.gtag("event", "page_view", { page_path: pathname + search, page_location: window.location.href, page_title: document.title });
  }, [pathname, search]);
  return null;
}
