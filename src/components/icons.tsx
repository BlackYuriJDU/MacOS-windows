import type { FC } from "react";

type P = { className?: string };

const grad = (id: string, from: string, to: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  </defs>
);

const tile = (id: string, children: React.ReactNode) => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    {grad(id, "#66e0ff", "#1d6ef5")}
    <rect x="16" y="16" width="480" height="480" rx="108" fill={`url(#${id})`} />
    {children}
  </svg>
);

/** Todos os ícones abaixo são arte original genérica (símbolos universais), não artwork da Apple. */

export const FinderIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="fi-l" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#aee2ff" />
        <stop offset="1" stopColor="#d9f0ff" />
      </linearGradient>
      <linearGradient id="fi-r" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f9bff" />
        <stop offset="1" stopColor="#1e6ee8" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="#f4fafd" />
    <path d="M256 16h134a108 108 0 0 1 108 108v264a108 108 0 0 1-108 108H256z" fill="url(#fi-r)" />
    <path d="M256 16h122a108 108 0 0 1 108 108v264a108 108 0 0 1-108 108H256z" fill="none" />
    <path d="M16 124A108 108 0 0 1 124 16h132v480H124A108 108 0 0 1 16 388z" fill="url(#fi-l)" />
    <circle cx="180" cy="220" r="22" fill="#1b3a5c" />
    <circle cx="332" cy="220" r="22" fill="#eaf6ff" />
    <path d="M170 330q86 54 172 0" stroke="#1b3a5c" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.55" />
    <path d="M170 330q86 54 172 0" stroke="#eaf6ff" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

export const SafariIcon: FC<P> = () =>
  tile("si-g", (
    <>
      <circle cx="256" cy="256" r="150" fill="#fff" opacity="0.92" />
      <circle cx="256" cy="256" r="150" fill="none" stroke="#fff" strokeWidth="16" />
      <circle cx="256" cy="256" r="12" fill="#1d6ef5" />
      <path d="M256 256 356 156" stroke="#e8483f" strokeWidth="14" strokeLinecap="round" />
      <path d="M256 256 156 356" stroke="#8a8f99" strokeWidth="14" strokeLinecap="round" />
    </>
  ));

export const NotesIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="ni-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff8c9" />
        <stop offset="1" stopColor="#ffd60a" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#ni-g)" />
    <rect x="16" y="16" width="480" height="120" rx="108" fill="#f2b705" />
    <rect x="16" y="106" width="480" height="30" fill="#f2b705" />
    <g stroke="#b98a00" strokeWidth="16" strokeLinecap="round" opacity="0.6">
      <path d="M92 216h328" />
      <path d="M92 296h328" />
      <path d="M92 376h328" />
    </g>
  </svg>
);

export const CalcIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="#2c2c2e" />
    <rect x="64" y="56" width="384" height="96" rx="18" fill="#1c1c1e" />
    <text x="424" y="128" textAnchor="end" fill="#fff" fontFamily="monospace" fontSize="64">
      42
    </text>
    <g fill="#5a5a5f">
      <rect x="64" y="180" width="88" height="64" rx="14" />
      <rect x="168" y="180" width="88" height="64" rx="14" />
      <rect x="272" y="180" width="88" height="64" rx="14" />
      <rect x="64" y="258" width="88" height="64" rx="14" />
      <rect x="168" y="258" width="88" height="64" rx="14" />
      <rect x="272" y="258" width="88" height="64" rx="14" />
      <rect x="64" y="336" width="88" height="64" rx="14" />
      <rect x="168" y="336" width="88" height="64" rx="14" />
      <rect x="272" y="336" width="88" height="64" rx="14" fill="#ff9f0a" />
    </g>
    <rect x="376" y="180" width="72" height="220" rx="14" fill="#ff9f0a" />
  </svg>
);

export const SettingsIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="se-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9aa0aa" />
        <stop offset="1" stopColor="#5b616b" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#se-g)" />
    <g transform="translate(256 256)">
      <circle r="128" fill="none" stroke="#fff" strokeWidth="34" />
      <g fill="#fff">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="-16" y="-196" width="32" height="64" rx="10" transform={`rotate(${i * 45})`} />
        ))}
      </g>
      <circle r="52" fill="#5b616b" />
    </g>
  </svg>
);

export const TerminalIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="#111214" />
    <rect x="16" y="16" width="480" height="96" rx="108" fill="#2c2c2e" />
    <rect x="16" y="86" width="480" height="26" fill="#2c2c2e" />
    <g fill="#37e57b" fontFamily="monospace" fontSize="86" fontWeight="bold">
      <text x="64" y="300">&gt;_</text>
    </g>
  </svg>
);

export const AboutIcon: FC<P> = () =>
  tile("ai-g", (
    <>
      <circle cx="256" cy="256" r="160" fill="#fff" opacity="0.94" />
      <text x="256" y="330" textAnchor="middle" fill="#1d6ef5" fontFamily="system-ui" fontSize="230" fontWeight="600">
        i
      </text>
    </>
  ));

export const TrashIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="ti-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dfe7ee" stopOpacity="0.95" />
        <stop offset="1" stopColor="#aebdcd" stopOpacity="0.95" />
      </linearGradient>
    </defs>
    <rect x="140" y="96" width="232" height="40" rx="20" fill="#b9c6d3" />
    <path d="M120 168h272l-30 300a40 40 0 0 1-40 36H190a40 40 0 0 1-40-36z" fill="url(#ti-g)" stroke="#8fa2b5" strokeWidth="10" />
    <g stroke="#8fa2b5" strokeWidth="10" strokeLinecap="round" opacity="0.7">
      <path d="M216 220v230" />
      <path d="M296 220v230" />
    </g>
  </svg>
);

/* Ícones utilitários do sistema */

export const Magnifier: FC<P> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);

export const WifiIcon: FC<P> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M2.5 9.5a15 15 0 0 1 19 0" />
    <path d="M5.5 13a10.5 10.5 0 0 1 13 0" />
    <path d="M8.7 16.4a5.6 5.6 0 0 1 6.6 0" />
    <circle cx="12" cy="19.6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const BatteryIcon: FC<P> = ({ className }) => (
  <svg viewBox="0 0 32 16" className={className} fill="none">
    <rect x="1" y="1.5" width="26" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
    <path d="M29 5.5v5a2.6 2.6 0 0 0 0-5z" fill="currentColor" opacity="0.5" />
    <rect x="3" y="3.5" width="16" height="9" rx="2" fill="currentColor" />
  </svg>
);

export const ControlCenterGlyph: FC<P> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="8" height="18" rx="4" />
    <rect x="13" y="3" width="8" height="18" rx="4" />
    <circle cx="7" cy="8" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="17" cy="16" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const FolderGlyph: FC<P> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#6fc0f7">
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const FileGlyph: FC<P> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#dfe4ea" stroke="#a8b2bd" strokeWidth="1">
    <path d="M6 2.5h8L19 8v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
    <path d="M14 2.5V8h5" fill="#f2f5f8" />
  </svg>
);

/** App Store — "A" estilizado (arte original). */
export const AppStoreIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="as-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1fb6ff" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#as-g)" />
    <g stroke="#fff" strokeWidth="34" strokeLinecap="round" fill="none">
      <path d="M168 360 L256 152 L344 360" />
      <path d="M196 300 H316" />
    </g>
  </svg>
);

/** Jogos — controle (arte original). */
export const GamesIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="gm-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff9f0a" />
        <stop offset="1" stopColor="#ff375f" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#gm-g)" />
    <g fill="#fff">
      <rect x="150" y="226" width="212" height="60" rx="30" />
      <rect x="226" y="150" width="60" height="212" rx="30" />
    </g>
    <circle cx="356" cy="196" r="22" fill="#fff" opacity="0.9" />
    <circle cx="386" cy="236" r="22" fill="#fff" opacity="0.7" />
  </svg>
);

/** Campo Minado — bomba (arte original). */
export const MinesIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="#3a3a3c" />
    <circle cx="256" cy="286" r="120" fill="#1c1c1e" />
    <g stroke="#1c1c1e" strokeWidth="26" strokeLinecap="round">
      <path d="M256 130v40M150 200l30 30M362 200l-30 30M150 372l30-30M362 372l-30-30" />
    </g>
    <rect x="236" y="120" width="40" height="60" rx="12" fill="#1c1c1e" />
    <path d="M276 120 q40 -30 70 6" stroke="#ff9f0a" strokeWidth="16" fill="none" strokeLinecap="round" />
    <circle cx="352" cy="120" r="16" fill="#ffd60a" />
  </svg>
);

/** Cobrinha (arte original). */
export const SnakeIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="#0b3d1e" />
    <path d="M120 360 q0 -60 60 -60 h100 q60 0 60 -60 v-40 q0 -60 60 -60" stroke="#32d74b" strokeWidth="44" fill="none" strokeLinecap="round" />
    <circle cx="410" cy="140" r="34" fill="#32d74b" />
    <circle cx="420" cy="132" r="8" fill="#0b3d1e" />
    <circle cx="150" cy="360" r="20" fill="#ff453a" />
  </svg>
);

/** Ícone do Launchpad — grade 3x3 de tiles (arte original). */
export const LaunchpadIcon: FC<P> = () => (
  <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="lp-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8e8e93" />
        <stop offset="1" stopColor="#3a3a3c" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#lp-g)" />
    {[
      [96, 96], [216, 96], [336, 96],
      [96, 216], [216, 216], [336, 216],
      [96, 336], [216, 336], [336, 336],
    ].map(([x, y], i) => (
      <rect key={i} x={x} y={y} width="80" height="80" rx="20" fill="#f2f2f7" opacity="0.92" />
    ))}
  </svg>
);
