import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Manrope, Sora } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: "G'FIVE Pakistan - ERP System",
  description: "Complete IMEI + Inventory + Ledger System for G'FIVE Pakistan.",
  other: {
    'http-equiv': 'no-cache, no-store, must-revalidate',
    'cache-control': 'no-cache, no-store, must-revalidate',
    pragma: 'no-cache',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Protect mobiis-data from being removed by old cached code
                var origRemove = localStorage.removeItem;
                localStorage.removeItem = function(key) {
                  if (key === 'mobiis-data' || key === 'mobiis-chat') {
                    console.warn('[PROTECTION] Blocked removal of ' + key);
                    return;
                  }
                  return origRemove.apply(localStorage, arguments);
                };
                // Protect localStorage.clear from wiping our data
                var origClear = localStorage.clear;
                localStorage.clear = function() {
                  console.warn('[PROTECTION] Blocked localStorage.clear - preserving mobiis keys');
                  // Only remove non-mobiis keys
                  var keysToRemove = [];
                  for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && !key.startsWith('mobiis')) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach(function(k) { origRemove.call(localStorage, k); });
                };
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-[#f0f0f0]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
