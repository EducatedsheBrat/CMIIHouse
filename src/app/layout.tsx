import type { Metadata, Viewport } from 'next';
import { Cinzel, Cinzel_Decorative, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ServiceWorkerRegistrar } from '../components/layout/ServiceWorkerRegistrar';
import { Providers } from './providers';

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cinzel',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CMII House Points',
    template: '%s · CMII House Points',
  },
  description: 'The CMII House System at Georgia State University. Earn points for your house and compete for the CMII Media Cup.',
  applicationName: 'CMII House Points',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'House Points',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F1B2D',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzelDecorative.variable} ${cinzel.variable} ${inter.variable}`}>
      <body>
        {/* Chrome can fire beforeinstallprompt before React hydrates; hold on to it for <InstallPrompt>. */}
        <Script id="lq-install-capture" strategy="beforeInteractive">
          {`window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__lqInstallPrompt = e; });`}
        </Script>
        <ServiceWorkerRegistrar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
