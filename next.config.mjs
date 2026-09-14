import withPWAInit from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// next-pwa generates the service worker (public/sw.js) during production builds.
// It is a webpack plugin, so production builds run `next build --webpack`; in development
// the plugin is skipped entirely so `next dev` keeps using Turbopack.
const withPWA = withPWAInit({
  dest: 'public',
  // next-pwa 5 injects its auto-register script into the Pages Router entry, which the App Router
  // never loads — <ServiceWorkerRegistrar /> in app/layout.tsx registers /sw.js instead.
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // App Router build manifests are served from memory and 404 as static files, which
  // would make the whole precache (and the service worker install) fail.
  buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/, /dynamic-css-manifest\.json$/],
});

export default process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);
