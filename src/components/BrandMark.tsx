import { useId } from 'react';

interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className = 'h-10 w-10' }: BrandMarkProps) {
  const gradientId = `connectae-mark-${useId().replace(/:/g, '')}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 96"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="18" x2="88" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16C9E8" />
          <stop offset="0.52" stopColor="#0787F2" />
          <stop offset="1" stopColor="#0A49B8" />
        </linearGradient>
      </defs>

      <path
        d="M58 14C33.5 14 16 30.7 16 51.2C16 71.3 30.8 85.2 50.5 86"
        stroke={`url(#${gradientId})`}
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M58 33C43.8 33 34.5 40.8 34.5 51.2C34.5 61.5 42.5 68 57.5 68H80"
        stroke={`url(#${gradientId})`}
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M58 33H80"
        stroke={`url(#${gradientId})`}
        strokeWidth="9.5"
        strokeLinecap="round"
      />

      <circle cx="58" cy="14" r="8.2" fill="#075FCA" />
      <circle cx="50.5" cy="86" r="8.2" fill="#0876E2" />
      <circle cx="82.5" cy="33" r="8.2" fill="#075BC9" />
      <circle cx="82.5" cy="68" r="8.2" fill="#0867D8" />
    </svg>
  );
}
