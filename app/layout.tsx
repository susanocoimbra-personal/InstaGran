import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Vovo',
  description: 'Fotos de família, partilhadas com amor',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vovo',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF7F4',
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom — older users with low vision rely on it (WCAG 1.4.4).
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
