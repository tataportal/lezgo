export type IconName =
  | 'analytics'
  | 'bell'
  | 'building'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'confetti'
  | 'coupon'
  | 'crown'
  | 'diamond'
  | 'download'
  | 'drink'
  | 'headphones'
  | 'id'
  | 'lock'
  | 'map-pin'
  | 'microphone'
  | 'money'
  | 'music'
  | 'no-entry'
  | 'pencil'
  | 'phone'
  | 'scanner'
  | 'shield'
  | 'spark'
  | 'speaker'
  | 'star'
  | 'ticket'
  | 'transfer'
  | 'user-check'
  | 'users'
  | 'warning'
  | 'x';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

function path(name: IconName) {
  switch (name) {
    case 'analytics':
      return (
        <>
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V5" />
          <path d="M17 16v-3" />
        </>
      );
    case 'bell':
      return (
        <>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      );
    case 'building':
      return (
        <>
          <path d="M4 20V6l8-3 8 3v14" />
          <path d="M9 20v-4h6v4" />
          <path d="M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01" />
        </>
      );
    case 'calendar':
      return (
        <>
          <rect x="3" y="5" width="18" height="16" rx="1" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </>
      );
    case 'check':
      return <path d="m5 12 5 5L20 7" />;
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </>
      );
    case 'confetti':
      return (
        <>
          <path d="m6 4 2 3M18 4l-2 3M12 3v4M5 13l3-1M19 12l-3-1M8 17l2-2M16 17l-2-2" />
          <path d="m8 11 4 10 4-10Z" />
        </>
      );
    case 'coupon':
      return (
        <>
          <path d="M20 12a2 2 0 0 1 0 4v3H4v-3a2 2 0 0 1 0-4 2 2 0 0 1 0-4V5h16v3a2 2 0 0 1 0 4Z" />
          <path d="M12 5v14" />
        </>
      );
    case 'crown':
      return (
        <>
          <path d="m3 8 5 4 4-6 4 6 5-4-2 11H5L3 8Z" />
        </>
      );
    case 'diamond':
      return (
        <>
          <path d="m12 3 7 6-7 12L5 9l7-6Z" />
          <path d="M9 9h6" />
        </>
      );
    case 'download':
      return (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 21h16" />
        </>
      );
    case 'drink':
      return (
        <>
          <path d="M7 3h10l-2 7a4 4 0 0 1-8 0L5 3h2Z" />
          <path d="M12 14v7M9 21h6" />
        </>
      );
    case 'headphones':
      return (
        <>
          <path d="M4 13a8 8 0 1 1 16 0" />
          <rect x="4" y="13" width="4" height="7" rx="1" />
          <rect x="16" y="13" width="4" height="7" rx="1" />
        </>
      );
    case 'id':
      return (
        <>
          <rect x="3" y="6" width="18" height="12" rx="1" />
          <circle cx="8" cy="12" r="2.25" />
          <path d="M13 10h5M13 14h4" />
        </>
      );
    case 'lock':
      return (
        <>
          <rect x="5" y="11" width="14" height="10" rx="1" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      );
    case 'map-pin':
      return (
        <>
          <path d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      );
    case 'microphone':
      return (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
        </>
      );
    case 'money':
      return (
        <>
          <path d="M12 3v18" />
          <path d="M16 7a4 4 0 0 0-4-2 4 4 0 0 0 0 8 4 4 0 0 1 0 8 4 4 0 0 1-4-2" />
        </>
      );
    case 'music':
      return (
        <>
          <path d="M14 4v11.5a2.5 2.5 0 1 1-2.5-2.5H14" />
          <path d="M14 4 20 6v9.5A2.5 2.5 0 1 1 17.5 13H20" />
        </>
      );
    case 'no-entry':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </>
      );
    case 'pencil':
      return (
        <>
          <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
          <path d="m13.5 6.5 4 4" />
        </>
      );
    case 'phone':
      return (
        <>
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18h2" />
        </>
      );
    case 'scanner':
      return (
        <>
          <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" />
          <path d="M7 12h10" />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M12 3 5 6v6c0 4.5 2.9 7.6 7 9 4.1-1.4 7-4.5 7-9V6l-7-3Z" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" />
        </>
      );
    case 'spark':
      return (
        <>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        </>
      );
    case 'speaker':
      return (
        <>
          <path d="M5 10h4l5-4v12l-5-4H5Z" />
          <path d="M18 9a4.5 4.5 0 0 1 0 6M16 7a7 7 0 0 1 0 10" />
        </>
      );
    case 'star':
      return <path d="m12 3 2.7 5.4 6 1-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 9.4l6-1L12 3Z" />;
    case 'ticket':
      return (
        <>
          <path d="M20 12a2 2 0 0 1 0 4v3H4v-3a2 2 0 0 1 0-4 2 2 0 0 1 0-4V5h16v3a2 2 0 0 1 0 4Z" />
          <path d="M12 5v14" />
        </>
      );
    case 'transfer':
      return (
        <>
          <path d="M7 7h10" />
          <path d="m13 3 4 4-4 4" />
          <path d="M17 17H7" />
          <path d="m11 13-4 4 4 4" />
        </>
      );
    case 'user-check':
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 19a5 5 0 0 1 10 0" />
          <path d="m16 11 2 2 3-4" />
        </>
      );
    case 'users':
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 19a5 5 0 0 1 10 0" />
          <path d="M18 19a4 4 0 0 0-4-4M15 5.5a2.5 2.5 0 1 1 0 5" />
        </>
      );
    case 'warning':
      return (
        <>
          <path d="M12 4 3 20h18L12 4Z" />
          <path d="M12 10v4M12 17h.01" />
        </>
      );
    case 'x':
      return <path d="M18 6 6 18M6 6l12 12" />;
  }
}

export function Icon({ name, className, size = 18, strokeWidth = 1.9 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path(name)}
    </svg>
  );
}
