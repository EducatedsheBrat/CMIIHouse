'use client';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export type NavIconName = 'leaderboard' | 'award' | 'roster' | 'activity' | 'house' | 'admin' | 'signout' | 'kiosk' | 'ceremony';

export function NavIcon({ name, size = 22 }: { name: NavIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === 'leaderboard' && (
        // Tournament cup
        <g {...base}>
          <path d="M7 3.5 H17 V9 A5 5 0 0 1 7 9 Z" />
          <path d="M7 5.5 H4 C4 8.5 5.5 10 7.3 10.3 M17 5.5 H20 C20 8.5 18.5 10 16.7 10.3" />
          <path d="M12 14 V17.5 M8.5 20.5 H15.5 L14.5 17.5 H9.5 Z" />
        </g>
      )}
      {name === 'award' && (
        // Star medallion with ribbon
        <g {...base}>
          <circle cx="12" cy="9.5" r="6" />
          <path d="M12 6.6 L12.9 8.6 L15 8.8 L13.4 10.2 L13.9 12.3 L12 11.2 L10.1 12.3 L10.6 10.2 L9 8.8 L11.1 8.6 Z" />
          <path d="M8.5 14.5 L7 21 L12 19 L17 21 L15.5 14.5" />
        </g>
      )}
      {name === 'roster' && (
        // Scroll
        <g {...base}>
          <path d="M6 4 H17 A2 2 0 0 1 19 6 V18 A2 2 0 0 1 17 20 H7" />
          <path d="M6 4 A2 2 0 0 0 4 6 V7 H8 V6 A2 2 0 0 0 6 4 Z" />
          <path d="M7 20 A2 2 0 0 0 9 18 V17 H5 V18 A2 2 0 0 0 7 20" />
          <path d="M11 9 H16 M11 12.5 H16" />
        </g>
      )}
      {name === 'activity' && (
        // Quill
        <g {...base}>
          <path d="M20 3.5 C12 4.5 7.5 9.5 6 17 L8 16 C9.5 11 13 7.5 20 3.5 Z" />
          <path d="M9.5 12.5 L13.5 12" />
          <path d="M6 17 L4 20.5" />
          <path d="M11 20.5 H20" />
        </g>
      )}
      {name === 'house' && (
        // Shield
        <g {...base}>
          <path d="M12 3 L19.5 5 V11.5 C19.5 16 16.5 19.3 12 21 C7.5 19.3 4.5 16 4.5 11.5 V5 Z" />
          <path d="M12 7.5 L13.2 10.2 L16 10.4 L13.9 12.3 L14.5 15 L12 13.6 L9.5 15 L10.1 12.3 L8 10.4 L10.8 10.2 Z" />
        </g>
      )}
      {name === 'admin' && (
        // Key
        <g {...base}>
          <circle cx="8" cy="12" r="4.5" />
          <circle cx="8" cy="12" r="1.3" />
          <path d="M12.5 12 H21 M18 12 V15.5 M15.2 12 V14.5" />
        </g>
      )}
      {name === 'ceremony' && (
        // Sorting wheel with pointer
        <g {...base}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 5 V21 M4 13 H20" />
          <circle cx="12" cy="13" r="2.2" />
          <path d="M9.5 2.5 H14.5 L12 5.5 Z" fill="currentColor" />
        </g>
      )}
      {name === 'signout' && (
        <g {...base}>
          <path d="M14 4 H6 V20 H14" />
          <path d="M10 12 H21 M17.5 8.5 L21 12 L17.5 15.5" />
        </g>
      )}
      {name === 'kiosk' && (
        <g {...base}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M9 20 H15 M12 16 V20" />
        </g>
      )}
    </svg>
  );
}
