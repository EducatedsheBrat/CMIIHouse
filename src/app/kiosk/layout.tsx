import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Kiosk' };

/** Bare layout for the hallway TV: no header, no navigation, no padding. */
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 overflow-hidden bg-royal-night">{children}</div>;
}
