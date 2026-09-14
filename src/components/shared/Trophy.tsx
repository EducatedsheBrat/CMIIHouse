'use client';

import { useId } from 'react';

/** The CMII Media Cup — a gilded chalice. */
export function Trophy({ size = 64, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={className} role="img" aria-label="CMII Media Cup">
      <defs>
        <linearGradient id={`cup-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A6A22" />
          <stop offset="30%" stopColor="#F7E2A6" />
          <stop offset="55%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#7A5C1C" />
        </linearGradient>
      </defs>
      <path d="M22 14 C12 14 8 20 9.5 27 C11 34 17 37 24 38" fill="none" stroke={`url(#cup-${uid})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 14 C68 14 72 20 70.5 27 C69 34 63 37 56 38" fill="none" stroke={`url(#cup-${uid})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M20 8 H60 V22 C60 36 51 46 40 46 C29 46 20 36 20 22 Z" fill={`url(#cup-${uid})`} stroke="#FBE9B4" strokeWidth="1.2" />
      <path d="M20 12 H60" stroke="#8A6A22" strokeWidth="1.5" />
      <path d="M40 18 L42.6 23.4 L48.5 24 L44 28 L45.3 33.8 L40 30.8 L34.7 33.8 L36 28 L31.5 24 L37.4 23.4 Z" fill="#FBE9B4" opacity="0.9" />
      <path d="M36 46 H44 L45 56 H35 Z" fill={`url(#cup-${uid})`} />
      <path d="M26 58 H54 L57 66 H23 Z" fill={`url(#cup-${uid})`} stroke="#FBE9B4" strokeWidth="1" />
      <rect x="19" y="66" width="42" height="7" rx="1.5" fill={`url(#cup-${uid})`} stroke="#FBE9B4" strokeWidth="1" />
      <circle cx="30" cy="62" r="1.6" fill="#5B8DBE" />
      <circle cx="40" cy="62" r="1.6" fill="#9B6BA3" />
      <circle cx="50" cy="62" r="1.6" fill="#6AAB6E" />
    </svg>
  );
}
