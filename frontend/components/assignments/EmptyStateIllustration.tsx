import React from 'react';

export default function EmptyState() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="90" cy="95" r="70" fill="#F3F4F6" />

      {/* Document */}
      <rect x="50" y="45" width="75" height="95" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Document lines */}
      <rect x="62" y="62" width="40" height="4" rx="2" fill="#E5E7EB" />
      <rect x="62" y="74" width="51" height="3" rx="1.5" fill="#F3F4F6" />
      <rect x="62" y="83" width="45" height="3" rx="1.5" fill="#F3F4F6" />
      <rect x="62" y="92" width="48" height="3" rx="1.5" fill="#F3F4F6" />

      {/* Red X circle */}
      <circle cx="90" cy="105" r="28" fill="#FEE2E2" />
      <circle cx="90" cy="105" r="22" fill="#EF4444" />

      {/* X mark */}
      <path
        d="M82 97L98 113M98 97L82 113"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Magnifying glass */}
      <circle cx="100" cy="100" r="32" fill="none" stroke="#D1D5DB" strokeWidth="2.5" opacity="0.6" />
      <line x1="124" y1="124" x2="140" y2="140" stroke="#9CA3AF" strokeWidth="3.5" strokeLinecap="round" />

      {/* Sparkles */}
      <path d="M44 68 L46 62 L48 68 L54 70 L48 72 L46 78 L44 72 L38 70 Z" fill="#60A5FA" opacity="0.7" />
      <path d="M130 52 L131.5 47 L133 52 L138 53.5 L133 55 L131.5 60 L130 55 L125 53.5 Z" fill="#60A5FA" opacity="0.5" />
      <circle cx="140" cy="85" r="4" fill="#BFDBFE" opacity="0.8" />
    </svg>
  );
}
