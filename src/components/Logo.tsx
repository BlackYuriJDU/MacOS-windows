/** Logo do projeto — marca própria, sem qualquer asset da Apple. */
export function Logo({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-label="Mac OS">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#283e78" />
          <stop offset="0.55" stopColor="#7a5aa8" />
          <stop offset="1" stopColor="#ff8a5c" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#logo-g)" />
      <circle cx="256" cy="256" r="118" fill="none" stroke="#fff" strokeWidth="30" />
      <circle cx="256" cy="256" r="28" fill="#fff" />
    </svg>
  );
}
