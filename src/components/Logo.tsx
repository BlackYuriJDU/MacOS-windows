/** Logo do projeto — marca própria, sem qualquer asset da Apple.
 *  Design "Liquid Glass": squircle azul-fluido do Tahoe com ondas translúcidas
 *  sobrepostas (a linguagem de vidro líquido do macOS Tahoe), arte 100% original. */
export function Logo({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-label="Mac OS">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8d4fc" />
          <stop offset="0.45" stopColor="#4a97f2" />
          <stop offset="1" stopColor="#0a3fb8" />
        </linearGradient>
        <linearGradient id="logo-wave1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="logo-wave2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcecff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#dcecff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* squircle de base (raio estilo Tahoe) */}
      <rect x="16" y="16" width="480" height="480" rx="118" fill="url(#logo-bg)" />
      {/* onda de vidro 1 — diagonal superior */}
      <path
        d="M16 240 Q 150 150 256 210 T 496 190 L 496 134 A 118 118 0 0 0 378 16 L 16 16 Z"
        fill="url(#logo-wave1)"
      />
      {/* onda de vidro 2 — diagonal inferior */}
      <path
        d="M16 300 Q 160 380 280 330 T 496 350 L 496 396 A 118 118 0 0 1 378 496 L 134 496 A 118 118 0 0 1 16 378 Z"
        fill="url(#logo-wave2)"
      />
      {/* brilho de vidro no topo */}
      <ellipse cx="200" cy="120" rx="150" ry="70" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}
