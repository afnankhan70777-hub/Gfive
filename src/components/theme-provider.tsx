'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';

/*
  Comprehensive Light Theme CSS
  Maps dark mode colors to a warm, aesthetic light palette.
  Preserves visual hierarchy: page bg < cards < elevated elements.
*/
const LIGHT_CSS = `
  /* ── Base ── */
  html[data-theme="light"] body {
    background: #f5f2ed !important;
    color: #1c1917 !important;
  }
  html[data-theme="light"] ::selection {
    background: rgba(201,168,76,0.25) !important;
    color: #1c1917 !important;
  }

  /* ── Scrollbar ── */
  html[data-theme="light"] ::-webkit-scrollbar-track { background: #e8e2d9 !important; }
  html[data-theme="light"] ::-webkit-scrollbar-thumb { background: #d6cfc7 !important; }
  html[data-theme="light"] ::-webkit-scrollbar-thumb:hover { background: #c9a84c !important; }

  /* ── Page backgrounds ── */
  html[data-theme="light"] [class*="bg-[#0a0e1a]"],
  html[data-theme="light"] [class*="bg-[#0a0e17]"],
  html[data-theme="light"] [class*="bg-[#080c14]"] {
    background: #f5f2ed !important;
  }

  /* ── Cards / containers ── */
  html[data-theme="light"] [class*="bg-[#0f1525]"],
  html[data-theme="light"] [class*="bg-[#0c1220]"],
  html[data-theme="light"] [class*="bg-[#161b22]"],
  html[data-theme="light"] [class*="bg-[#0d1321]"] {
    background: #ffffff !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important;
  }

  /* ── Gradient cards ── */
  html[data-theme="light"] [class*="bg-gradient-to-br from-[#0f1525] to-[#0d1321]"],
  html[data-theme="light"] [class*="bg-gradient-to-br from-[#0d1321] to-[#0a0e1a]"] {
    background: #ffffff !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important;
  }

  /* ── Inputs / inner containers ── */
  html[data-theme="light"] input[class*="bg-[#0d1321]"],
  html[data-theme="light"] select[class*="bg-[#0d1321]"],
  html[data-theme="light"] textarea[class*="bg-[#0d1321]"] {
    background: #faf8f5 !important;
    border-color: #e8e2d9 !important;
  }

  /* ── Golden accent backgrounds ── */
  html[data-theme="light"] [class*="bg-[rgba(201,168,76,0.12)]"] {
    background: rgba(201,168,76,0.1) !important;
  }
  html[data-theme="light"] [class*="bg-[rgba(201,168,76,0.08)]"] {
    background: rgba(201,168,76,0.06) !important;
  }
  html[data-theme="light"] [class*="bg-[rgba(201,168,76,0.1)]"] {
    background: rgba(201,168,76,0.08) !important;
  }
  html[data-theme="light"] [class*="bg-[rgba(201,168,76,0.15)]"] {
    background: rgba(201,168,76,0.12) !important;
  }

  /* ── Hover states ── */
  html[data-theme="light"] [class*="hover:bg-[#1e2a3a]"]:hover {
    background: #f5f2ed !important;
  }
  html[data-theme="light"] [class*="hover:bg-[rgba(239,68,68,0.1)]"]:hover {
    background: rgba(239,68,68,0.06) !important;
  }
  html[data-theme="light"] [class*="hover:bg-[rgba(201,168,76,0.08)]"]:hover {
    background: rgba(201,168,76,0.06) !important;
  }

  /* ── Sidebar ── */
  html[data-theme="light"] aside {
    background: #ffffff !important;
    border-right: 1px solid #e8e2d9 !important;
  }
  html[data-theme="light"] aside [class*="text-[#f0f0f0]"],
  html[data-theme="light"] aside h1,
  html[data-theme="light"] aside p {
    color: #1c1917 !important;
  }
  html[data-theme="light"] aside [class*="text-[#94a3b8]"] {
    color: #78716c !important;
  }
  html[data-theme="light"] aside nav a {
    color: #57534e !important;
  }
  html[data-theme="light"] aside nav a:hover {
    background: #f5f2ed !important;
    color: #1c1917 !important;
  }
  html[data-theme="light"] aside nav a[data-active="true"],
  html[data-theme="light"] aside nav a[aria-current="page"] {
    background: rgba(201,168,76,0.08) !important;
    color: #a88a3a !important;
    border-right: 3px solid #c9a84c !important;
  }

  /* ── Header ── */
  html[data-theme="light"] header {
    background: rgba(255,255,255,0.85) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    border-bottom: 1px solid #e8e2d9 !important;
  }
  html[data-theme="light"] header [class*="text-[#f0f0f0]"] {
    color: #1c1917 !important;
  }

  /* ── Borders ── */
  html[data-theme="light"] [class*="border-[#1e2a3a]"],
  html[data-theme="light"] [class*="border-[#21262d]"] {
    border-color: #e8e2d9 !important;
  }
  html[data-theme="light"] [class*="border-[#2a3a4a]"] {
    border-color: #ddd6cc !important;
  }

  /* ── Text colors ── */
  html[data-theme="light"] [class*="text-[#f0f0f0]"] { color: #1c1917 !important; }
  html[data-theme="light"] [class*="text-[#e2e8f0]"] { color: #292524 !important; }
  html[data-theme="light"] [class*="text-[#94a3b8]"] { color: #78716c !important; }
  html[data-theme="light"] [class*="text-[#64748b]"] { color: #a8a29e !important; }
  html[data-theme="light"] [class*="text-[#c9a84c]"] { color: #a88a3a !important; }

  /* ── Inputs ── */
  html[data-theme="light"] input,
  html[data-theme="light"] select,
  html[data-theme="light"] textarea {
    background: #ffffff !important;
    border-color: #ddd6cc !important;
    color: #1c1917 !important;
  }
  html[data-theme="light"] input::placeholder,
  html[data-theme="light"] textarea::placeholder {
    color: #a8a29e !important;
  }
  html[data-theme="light"] input:focus,
  html[data-theme="light"] select:focus,
  html[data-theme="light"] textarea:focus {
    border-color: #c9a84c !important;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important;
  }

  /* ── Tables ── */
  html[data-theme="light"] table { background: #ffffff !important; }
  html[data-theme="light"] th {
    background: #faf8f5 !important;
    color: #57534e !important;
    border-bottom: 1px solid #e8e2d9 !important;
  }
  html[data-theme="light"] td {
    border-bottom: 1px solid #f0ebe3 !important;
    color: #44403c !important;
  }
  html[data-theme="light"] tr:hover td { background: #faf8f5 !important; }

  /* ── Buttons ── */
  html[data-theme="light"] button[class*="bg-[#c9a84c]"],
  html[data-theme="light"] .btn-primary {
    background: #c9a84c !important;
    color: #ffffff !important;
  }
  html[data-theme="light"] button[class*="bg-[#1e2a3a]"],
  html[data-theme="light"] button[class*="bg-[#21262d]"] {
    background: #f5f2ed !important;
    color: #57534e !important;
    border: 1px solid #e8e2d9 !important;
  }
  html[data-theme="light"] button[class*="bg-[#1e2a3a]"]:hover,
  html[data-theme="light"] button[class*="bg-[#21262d]"]:hover {
    background: #ede9e2 !important;
  }

  /* ── Status badges ── */
  html[data-theme="light"] [class*="bg-[rgba(34,197,94,0.1)]"] { background: rgba(34,197,94,0.08) !important; }
  html[data-theme="light"] [class*="bg-[rgba(245,158,11,0.1)]"] { background: rgba(245,158,11,0.08) !important; }
  html[data-theme="light"] [class*="bg-[rgba(239,68,68,0.1)]"]   { background: rgba(239,68,68,0.08) !important; }

  /* ── Dividers ── */
  html[data-theme="light"] hr,
  html[data-theme="light"] [class*="border-t"] { border-color: #e8e2d9 !important; }

  /* ── Modal / overlay backdrops ── */
  html[data-theme="light"] [class*="bg-black/"] { background: rgba(0,0,0,0.3) !important; }

  /* ── Login page specific ── */
  html[data-theme="light"] .card-futuristic {
    background: #ffffff !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) !important;
  }
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.settings.appearance.theme);

  useEffect(() => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    document.documentElement.setAttribute('data-theme', activeTheme);

    let style = document.getElementById('theme-light-overrides') as HTMLStyleElement | null;
    if (activeTheme === 'light') {
      if (!style) {
        style = document.createElement('style');
        style.id = 'theme-light-overrides';
        document.head.appendChild(style);
      }
      style.textContent = LIGHT_CSS;
    } else {
      if (style) style.remove();
    }
  }, [theme]);

  return <>{children}</>;
}
