const fs = require('fs');

const content = `'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';

const LIGHT_CSS = \`
  html[data-theme="light"] body {
    background: #f0ede8 !important;
    color: #1c1917 !important;
  }
  html[data-theme="light"] ::selection {
    background: rgba(201,168,76,0.2) !important;
    color: #1c1917 !important;
  }
  html[data-theme="light"] ::-webkit-scrollbar-track {
    background: #e8e2d9 !important;
  }
  html[data-theme="light"] ::-webkit-scrollbar-thumb {
    background: #d6cfc7 !important;
  }
  html[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
    background: #c9a84c !important;
  }
\`;

function applyLightTheme() {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== 'light') return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const els: Element[] = [];
  while (walker.nextNode()) els.push(walker.currentNode as Element);

  for (const el of els) {
    const htmlEl = el as HTMLElement;
    const computed = getComputedStyle(htmlEl);
    const bg = computed.backgroundColor;
    const txt = computed.color;
    const border = computed.borderColor;

    if (bg && (bg.startsWith('rgb(10, 14, 26)') || bg.startsWith('rgb(15, 21, 37)') || bg.startsWith('rgb(11, 17, 32)') || bg.startsWith('rgb(7, 10, 18)') || bg.startsWith('rgb(17, 24, 39)') || bg.startsWith('rgb(26, 35, 50)'))) {
      htmlEl.style.setProperty('background', '#ffffff', 'important');
    }

    if (txt && txt === 'rgb(240, 240, 240)' && bg && !bg.startsWith('rgb(0, 0, 0')) {
      htmlEl.style.setProperty('color', '#1c1917', 'important');
    }

    if (txt && txt === 'rgb(148, 163, 184)') {
      htmlEl.style.setProperty('color', '#78716c', 'important');
    }
    if (txt && txt === 'rgb(100, 116, 139)') {
      htmlEl.style.setProperty('color', '#a8a29e', 'important');
    }

    if (border && (border.startsWith('rgb(30, 42, 58)') || border.startsWith('rgb(42, 58, 80)'))) {
      htmlEl.style.setProperty('border-color', '#e8e2d9', 'important');
    }
  }
}

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

      requestAnimationFrame(() => {
        applyLightTheme();
        setTimeout(applyLightTheme, 100);
        setTimeout(applyLightTheme, 500);
      });

      const observer = new MutationObserver(() => {
        requestAnimationFrame(applyLightTheme);
      });
      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    } else {
      if (style) style.remove();
      const all = document.querySelectorAll('[style*="important"]');
      all.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.removeProperty('background');
        htmlEl.style.removeProperty('color');
        htmlEl.style.removeProperty('border-color');
      });
    }
  }, [theme]);

  return <>{children}</>;
}
`;

fs.writeFileSync('src/components/theme-provider.tsx', content);
console.log('Theme provider rewritten');
