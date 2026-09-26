import { useState } from "react";

const SUGGESTIONS = [
  { label: "Example.com", url: "https://example.com" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=-35.2,-8.1,-34.9,-7.9" },
  { label: "Wikipédia (PT)", url: "https://pt.m.wikipedia.org/wiki/Special:Random" },
];

function normalize(url: string): string {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export default function Safari() {
  const [url, setUrl] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const go = (u?: string) => {
    const target = u ?? url;
    if (!target.trim()) return;
    setUrl(normalize(target));
    setActive(normalize(target));
    setKey((k) => k + 1);
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1c1c1e]">
      {/* Barra de endereço */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 dark:border-white/10 dark:bg-white/[0.04]">
        <button
          onClick={() => setActive(null)}
          className="rounded-md px-2 py-1 text-[13px] leading-none opacity-70 hover:bg-black/10 dark:hover:bg-white/10"
          title="Página inicial"
        >
          ⌂
        </button>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="rounded-md px-2 py-1 text-[13px] leading-none opacity-70 hover:bg-black/10 dark:hover:bg-white/10"
          title="Recarregar"
        >
          ⟳
        </button>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Buscar ou digitar endereço"
          spellCheck={false}
          className="flex-1 rounded-lg border border-black/10 bg-white/80 px-3 py-1 text-center text-[12.5px] text-black outline-none focus:border-accent dark:border-white/10 dark:bg-white/10 dark:text-white"
        />
      </div>

      {active === null ? (
        /* Página inicial */
        <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-gradient-to-b from-[#eaf4ff] to-white p-6 dark:from-[#101a2c] dark:to-[#1c1c1e]">
          <p className="text-[17px] font-semibold text-black dark:text-white">Safari</p>
          <p className="max-w-90 text-center text-[12px] leading-relaxed text-black/60 dark:text-white/60">
            Navegador embutido (v0.1). Sites que bloqueiam exibição dentro de outros sites (X-Frame-Options) não
            carregam — é uma limitação do padrão web, não do ambiente.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.url}
                onClick={() => go(s.url)}
                className="rounded-xl bg-white px-4 py-2 text-[12.5px] font-medium text-black shadow-sm ring-1 ring-black/10 hover:bg-black/[0.03] dark:bg-white/10 dark:text-white dark:ring-white/10"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <iframe
          key={key}
          src={active}
          title="Safari"
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </div>
  );
}
