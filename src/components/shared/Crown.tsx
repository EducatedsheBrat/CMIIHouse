'use client';

import { useId } from 'react';

/** Gilded crown for the leading house. */
export function Crown({ size = 32, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" className={className} role="img" aria-label="Leading house">
      <defs>
        <linearGradient id={`crown-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBE9B4" />
          <stop offset="50%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8A6A22" />
        </linearGradient>
      </defs>
      <path
        d="M6 38 L2 12 L18 24 L32 4 L46 24 L62 12 L58 38 Z"
        fill={`url(#crown-${uid})`}
        stroke="#FBE9B4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="6" y="39" width="52" height="7" rx="1.5" fill={`url(#crown-${uid})`} stroke="#FBE9B4" strokeWidth="1.2" />
      <circle cx="2" cy="12" r="3" fill="#FBE9B4" />
      <circle cx="32" cy="4" r="3.5" fill="#FBE9B4" />
      <circle cx="62" cy="12" r="3" fill="#FBE9B4" />
      <path d="M32 22 L36 28 L32 34 L28 28 Z" fill="#9B6BA3" stroke="#FBE9B4" strokeWidth="1" />
      <circle cx="17" cy="31" r="2.6" fill="#5B8DBE" />
      <circle cx="47" cy="31" r="2.6" fill="#6AAB6E" />
    </svg>
  );
}
