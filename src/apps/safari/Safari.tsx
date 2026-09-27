import { useEffect, useState } from "react";
import { ipc } from "../../lib/ipc";
import { notify } from "../../store/notifications";

const SUGGESTIONS = [
  { label: "Example.com", url: "https://example.com" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=-35.2,-8.1,-34.9,-7.9" },
  { label: "Wikipédia (PT)", url: "https://pt.m.wikipedia.org/wiki/Special:Random" },
];

interface Tab {
  id: number;
  url: string;
  title: string;
}

interface Download {
  url: string;
  path?: string;
  status: "downloading" | "done" | "error";
}

function normalize(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.includes(".") && !u.includes(" ")) return `https://${u}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(u)}`;
}

let nextTab = 1;

export default function Safari() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);

  const activeTab = tabs.find((t) => t.id === active) ?? null;

  /* Escuta downloads concluídos vindos do backend */
  useEffect(() => {
    if (!ipc.isTauri) return;
    let un: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ url: string; path: string }>("download-complete", (e) => {
        setDownloads((d) => d.map((x) => (x.url === e.payload.url ? { ...x, path: e.payload.path, status: "done" } : x)));
        notify("safari", "Safari", "Download concluído", e.payload.path.split("\\").pop() ?? "arquivo");
      }).then((u) => (un = u));
    });
    return () => un?.();
  }, []);

  const openTab = (url: string) => {
    const t: Tab = { id: nextTab++, url: normalize(url), title: "Carregando…" };
    setTabs((ts) => [...ts, t]);
    setActive(t.id);
    setAddress(t.url);
  };

  const go = (u?: string) => {
    const target = normalize(u ?? address);
    if (!target) return;
    if (activeTab) {
      setTabs((ts) => ts.map((t) => (t.id === activeTab.id ? { ...t, url: target } : t)));
      setAddress(target);
    } else {
      openTab(target);
    }
  };

  const closeTab = (id: number) => {
    setTabs((ts) => {
      const next = ts.filter((t) => t.id !== id);
      if (active === id) {
        const last = next[next.length - 1];
        setActive(last?.id ?? null);
        setAddress(last?.url ?? "");
      }
      return next;
    });
  };

  const download = (url: string) => {
    setDownloads((d) => [...d, { url, status: "downloading" }]);
    setShowDownloads(true);
    ipc.downloadFile(url).catch(() => {
      setDownloads((d) => d.map((x) => (x.url === url ? { ...x, status: "error" } : x)));
    });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1c1c1e]">
      {/* Barra de abas */}
      <div className="flex h-9 shrink-0 items-end gap-1 border-b border-black/10 bg-black/[0.04] px-2 dark:border-white/10 dark:bg-white/[0.05]">
        {tabs.map((t) => (
          <div
            key={t.id}
            onClick={() => { setActive(t.id); setAddress(t.url); }}
            className={`group flex max-w-40 cursor-default items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-[12px] ${
              active === t.id ? "bg-white dark:bg-[#1c1c1e]" : "opacity-60 hover:opacity-100"
            }`}
          >
            <span className="truncate">{t.url.replace(/^https?:\/\//, "").split("/")[0]}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              className="hidden h-4 w-4 items-center justify-center rounded-full text-[11px] hover:bg-black/15 group-hover:flex dark:hover:bg-white/20"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => openTab("example.com")}
          className="mb-1 ml-1 flex h-6 w-6 items-center justify-center rounded-md text-[15px] opacity-70 hover:bg-black/10 dark:hover:bg-white/10"
          title="Nova aba"
        >
          +
        </button>
      </div>

      {/* Barra de endereço + ações */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 dark:border-white/10 dark:bg-white/[0.04]">
        <button onClick={() => activeTab && go(activeTab.url)} className="rounded-md px-2 py-1 text-[13px] opacity-70 hover:bg-black/10 dark:hover:bg-white/10" title="Recarregar">⟳</button>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Buscar ou digitar endereço"
          spellCheck={false}
          className="flex-1 rounded-lg border border-black/10 bg-white/80 px-3 py-1 text-center text-[12.5px] text-black outline-none focus:border-accent dark:border-white/10 dark:bg-white/10 dark:text-white"
        />
        <button
          onClick={() => setShowDownloads(!showDownloads)}
          className={`relative rounded-md px-2 py-1 text-[13px] opacity-70 hover:bg-black/10 dark:hover:bg-white/10 ${showDownloads ? "bg-black/10 dark:bg-white/15" : ""}`}
          title="Downloads"
        >
          ⤓
          {downloads.some((d) => d.status === "downloading") && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Painel de downloads */}
      {showDownloads && (
        <div className="max-h-48 shrink-0 overflow-y-auto border-b border-black/10 bg-black/[0.02] p-2 dark:border-white/10">
          {downloads.length === 0 ? (
            <p className="py-3 text-center text-[12px] opacity-50">Nenhum download nesta sessão.</p>
          ) : (
            downloads.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5">
                <span className="truncate">{d.url.split("/").pop()}</span>
                <span className="ml-auto shrink-0 opacity-60">
                  {d.status === "downloading" ? "Baixando…" : d.status === "done" ? "Concluído" : "Erro"}
                </span>
                {d.status === "done" && d.path && (
                  <button
                    onClick={() => ipc.launchApp(d.path!)}
                    className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-white"
                  >
                    Abrir
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Conteúdo */}
      {activeTab === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-gradient-to-b from-[#eaf4ff] to-white p-6 dark:from-[#101a2c] dark:to-[#1c1c1e]">
          <p className="text-[17px] font-semibold text-black dark:text-white">Safari</p>
          <p className="max-w-90 text-center text-[12px] leading-relaxed text-black/60 dark:text-white/60">
            Digite um endereço ou escolha uma sugestão. Para baixar um arquivo, cole o link direto do arquivo e
            use o botão de download.
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
          <div className="mt-2 flex items-center gap-2">
            <input
              placeholder="Colar link de arquivo para baixar"
              onKeyDown={(e) => {
                if (e.key === "Enter") download((e.target as HTMLInputElement).value);
              }}
              className="w-72 rounded-lg border border-black/10 bg-white/80 px-3 py-1.5 text-[12px] outline-none dark:border-white/10 dark:bg-white/10"
            />
            <button
              onClick={(e) => {
                const inp = (e.currentTarget.previousSibling as HTMLInputElement);
                if (inp.value.trim()) download(inp.value.trim());
              }}
              className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Baixar
            </button>
          </div>
        </div>
      ) : (
        <iframe
          key={activeTab.id + activeTab.url}
          src={activeTab.url}
          title="Safari"
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      )}
    </div>
  );
}
