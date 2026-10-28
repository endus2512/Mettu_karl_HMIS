/**
 * Root layout for the Mettu Karl HIS Next.js application.
 *
 * Wraps the entire app with:
 * - MantineProvider (UI library)
 * - AuthProvider (authentication context)
 * - ReactQueryProvider (server state management)
 */
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
