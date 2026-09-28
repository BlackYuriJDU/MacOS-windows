import { useEffect, useMemo, useState } from "react";
import { ipc } from "../../lib/ipc";
import type { InstalledApp, StorePackage } from "../../lib/types";
import { Magnifier } from "../../components/icons";

/* Seleção curada (23 apps, 6 categorias) — IDs winget confirmados. */
const CURATED: { category: string; apps: { name: string; id: string }[] }[] = [
  { category: "Navegadores", apps: [
    { name: "Google Chrome", id: "Google.Chrome" },
    { name: "Mozilla Firefox", id: "Mozilla.Firefox" },
    { name: "Brave", id: "Brave.Brave" },
    { name: "Microsoft Edge", id: "Microsoft.Edge" },
  ]},
  { category: "Produtividade", apps: [
    { name: "VS Code", id: "Microsoft.VisualStudioCode" },
    { name: "Notepad++", id: "Notepad++.Notepad++" },
    { name: "Obsidian", id: "Obsidian.Obsidian" },
    { name: "LibreOffice", id: "TheDocumentFoundation.LibreOffice" },
  ]},
  { category: "Mídia", apps: [
    { name: "VLC", id: "VideoLAN.VLC" },
    { name: "Spotify", id: "Spotify.Spotify" },
    { name: "Audacity", id: "Audacity.Audacity" },
  ]},
  { category: "Comunicação", apps: [
    { name: "Discord", id: "Discord.Discord" },
    { name: "Telegram", id: "Telegram.TelegramDesktop" },
    { name: "WhatsApp", id: "WhatsApp.WhatsApp" },
    { name: "Zoom", id: "Zoom.Zoom" },
  ]},
  { category: "Utilidades", apps: [
    { name: "7-Zip", id: "7zip.7zip" },
    { name: "PowerToys", id: "Microsoft.PowerToys" },
    { name: "Everything", id: "voidtools.Everything" },
    { name: "ShareX", id: "ShareX.ShareX" },
  ]},
  { category: "Dev", apps: [
    { name: "Git", id: "Git.Git" },
    { name: "Node.js LTS", id: "OpenJS.NodeJS.LTS" },
    { name: "Python 3.13", id: "Python.Python.3.13" },
    { name: "GitHub Desktop", id: "GitHub.GitHubDesktop" },
  ]},
];

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function AppStore() {
  const [tab, setTab] = useState<"discover" | "installed">("discover");
  const [winget, setWinget] = useState<boolean | null>(null);

  useEffect(() => {
    ipc.wingetAvailable().then(setWinget).catch(() => setWinget(false));
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7] text-black dark:bg-[#1c1c1e] dark:text-white">
      {/* header */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/10 px-4 dark:border-white/10">
        <TabBtn active={tab === "discover"} onClick={() => setTab("discover")}>Descobrir</TabBtn>
        <TabBtn active={tab === "installed"} onClick={() => setTab("installed")}>Instalados</TabBtn>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "discover" ? <Discover winget={winget} /> : <Installed />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition ${
        active ? "bg-black text-white dark:bg-white dark:text-black" : "opacity-60 hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Descobrir ------------------------------- */

function Discover({ winget }: { winget: boolean | null }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StorePackage[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState<Record<string, "busy" | "done" | "error">>({});
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    ipc.listInstalledApps().then((apps) => {
      setInstalledIds(new Set(apps.map((a) => a.id.toLowerCase())));
    }).catch(() => {});
  }, []);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      setResults(await ipc.storeSearch(q));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const install = async (id: string) => {
    setInstalling((m) => ({ ...m, [id]: "busy" }));
    try {
      await ipc.storeInstall(id);
      setInstalling((m) => ({ ...m, [id]: "done" }));
      setInstalledIds((s) => new Set(s).add(id.toLowerCase()));
    } catch {
      setInstalling((m) => ({ ...m, [id]: "error" }));
    }
  };

  if (winget === null) {
    return <Center><p className="opacity-50">Verificando winget…</p></Center>;
  }
  if (!winget) {
    return (
      <Center>
        <div className="max-w-md text-center">
          <p className="text-[15px] font-semibold">winget não encontrado</p>
          <p className="mt-2 text-[13px] leading-relaxed opacity-60">
            Para instalar apps pela loja, instale o <b>App Installer</b> pela Microsoft Store (ele inclui o winget).
            A aba "Instalados" funciona normalmente.
          </p>
        </div>
      </Center>
    );
  }

  return (
    <div className="p-5">
      {/* busca */}
      <div className="mb-5 flex items-center gap-2">
        <div className="glass-strong flex flex-1 items-center gap-2 rounded-full px-4">
          <Magnifier className="h-4 w-4 opacity-50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Buscar apps no catálogo (ex.: vlc, spotify, 7zip)"
            className="h-10 w-full bg-transparent text-[13.5px] outline-none"
          />
        </div>
        <button onClick={search} disabled={searching} className="rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {/* resultados da busca */}
      {results !== null && (
        <section className="mb-6">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide opacity-40">
            Resultados ({results.length})
          </p>
          {results.length === 0 ? (
            <p className="text-[13px] opacity-50">Nenhum app encontrado para "{q}".</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {results.map((p) => (
                <StoreCard key={p.id} pkg={p} state={installing[p.id]} installed={installedIds.has(p.id.toLowerCase())} onInstall={() => install(p.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* curadoria */}
      {CURATED.map((cat) => (
        <section key={cat.category} className="mb-6">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide opacity-40">{cat.category}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {cat.apps.map((a) => (
              <StoreCard
                key={a.id}
                pkg={{ id: a.id, name: a.name, version: "" }}
                state={installing[a.id]}
                installed={installedIds.has(a.id.toLowerCase())}
                onInstall={() => install(a.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function StoreCard({ pkg, state, installed, onInstall }: { pkg: StorePackage; state?: "busy" | "done" | "error"; installed: boolean; onInstall: () => void }) {
  const isInstalled = installed || state === "done";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a84ff] to-[#0060c9] text-[18px] font-bold text-white">
        {pkg.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{pkg.name}</p>
        <p className="truncate text-[11px] opacity-50">{pkg.version || pkg.id}</p>
      </div>
      <button
        onClick={onInstall}
        disabled={isInstalled || state === "busy"}
        className={`shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
          isInstalled
            ? "bg-black/10 text-black/50 dark:bg-white/15 dark:text-white/50"
            : state === "error"
            ? "bg-red-500/15 text-red-600 dark:text-red-400"
            : "bg-accent text-white active:scale-95"
        }`}
      >
        {state === "busy" ? "…" : isInstalled ? "Instalado" : state === "error" ? "Erro" : "Obter"}
      </button>
    </div>
  );
}

/* ------------------------------- Instalados ------------------------------ */

function Installed() {
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [q, setQ] = useState("");
  const [icons, setIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    ipc.listInstalledApps().then(setApps).catch(() => setApps([]));
  }, []);

  const filtered = useMemo(() => {
    const list = apps ?? [];
    if (!q.trim()) return list;
    return list.filter((a) => norm(a.name).includes(norm(q)));
  }, [apps, q]);

  // extrai ícones sob demanda (só Win32 com exe válido)
  useEffect(() => {
    if (!apps) return;
    const need = apps.filter((a) => !a.is_uwp && a.id && !icons[a.id]).slice(0, 40);
    need.forEach((a) => {
      ipc.appIcon(a.id).then((data) => {
        if (data) setIcons((m) => ({ ...m, [a.id]: data }));
      }).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps]);

  if (apps === null) {
    return <Center><p className="opacity-50">Lendo apps instalados…</p></Center>;
  }

  return (
    <div className="p-5">
      <div className="glass-strong mb-4 flex items-center gap-2 rounded-full px-4">
        <Magnifier className="h-4 w-4 opacity-50" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Buscar entre ${apps.length} apps instalados`}
          className="h-10 w-full bg-transparent text-[13.5px] outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <Center><p className="opacity-50">Nenhum app encontrado.</p></Center>
      ) : (
        <div className="grid grid-cols-6 gap-x-4 gap-y-6">
          {filtered.map((a) => (
            <button
              key={a.id + a.name}
              onClick={() => ipc.launchApp(a.id, a.is_uwp)}
              className="group flex flex-col items-center gap-2"
              title={a.publisher || a.name}
            >
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition group-active:scale-95 dark:bg-white/10 dark:ring-white/10">
                {icons[a.id] ? (
                  <img src={icons[a.id]} alt="" className="h-10 w-10" />
                ) : (
                  <span className="bg-gradient-to-br from-[#5e5ce6] to-[#3634a3] flex h-full w-full items-center justify-center text-[20px] font-bold text-white">
                    {a.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] leading-tight">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>;
}
