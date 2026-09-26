import { useState } from "react";
import { ipc } from "../../lib/ipc";

const SUGGESTIONS = [
  { label: "Google", url: "https://www.google.com" },
  { label: "Wikipédia", url: "https://pt.wikipedia.org" },
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org" },
  { label: "Example.com", url: "https://example.com" },
];

function normalize(url: string): string {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  // Parece busca (tem espaço) → Google; senão, trata como domínio.
  if (/\s/.test(u)) return `https://www.google.com/search?q=${encodeURIComponent(u)}`;
  return `https://${u}`;
}

export default function Safari() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (target?: string) => {
    const raw = (target ?? url).trim();
    if (!raw) return;
    const final = normalize(raw);
    setUrl(final);
    setBusy(true);
    try {
      await ipc.openBrowser(final, "Safari");
    } catch (e) {
      console.error("abrir navegador falhou", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1c1c1e]">
      {/* Barra de endereço */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 dark:border-white/10 dark:bg-white/[0.04]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none" />
        </svg>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Buscar ou digitar endereço"
          spellCheck={false}
          className="flex-1 rounded-lg border border-black/10 bg-white/80 px-3 py-1 text-center text-[12.5px] text-black outline-none focus:border-accent dark:border-white/10 dark:bg-white/10 dark:text-white"
        />
        <button
          onClick={() => go()}
          disabled={busy || !url.trim()}
          className="shrink-0 rounded-md bg-accent px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
        >
          {busy ? "…" : "Ir"}
        </button>
      </div>

      {/* Página inicial */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-b from-[#eaf4ff] to-white p-6 dark:from-[#101a2c] dark:to-[#1c1c1e]">
        <div className="text-center">
          <p className="text-[19px] font-semibold text-black dark:text-white">Safari</p>
          <p className="mt-1.5 max-w-92 text-[12px] leading-relaxed text-black/60 dark:text-white/60">
            Digite um endereço ou uma busca. A página abre numa janela de navegação real — sem a limitação de sites que
            bloqueiam incorporação.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-3 gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.url}
              onClick={() => go(s.url)}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white px-3 py-3 text-[12px] font-medium text-black shadow-sm ring-1 ring-black/10 transition hover:bg-black/[0.03] active:scale-[0.97] dark:bg-white/10 dark:text-white dark:ring-white/10"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-[15px] font-semibold text-accent">
                {s.label[0]}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
