/**
 * Root layout for the Mettu Karl HIS Next.js application.
 *
 * Wraps the entire app with:
 * - MantineProvider (UI library)
 * - AuthProvider (authentication context)
 * - ReactQueryProvider (server state management)
 */
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mettu Karl Hospital Information System',
  description: 'Integrated Hospital Information System for Mettu Karl Referral Hospital',
  manifest: '/manifest.json',
  keywords: ['hospital', 'HIS', 'FHIR', 'healthcare', 'Ethiopia'],
  authors: [{ name: 'Mettu Karl HIS Team' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mettu Karl HIS',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) r.unregister();
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var k of keys) caches.delete(k);
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
