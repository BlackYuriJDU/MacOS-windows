import { useEffect, useMemo, useState } from "react";
import { ipc } from "../../lib/ipc";
import type { InstalledApp, StorePackage } from "../../lib/types";
import { CATALOG, CATEGORIES } from "./catalog";
import { Magnifier } from "../../components/icons";

type Tab = "installed" | "discover";

export default function AppStore() {
  const [tab, setTab] = useState<Tab>("discover");
  const [q, setQ] = useState("");

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7] text-black dark:bg-[#161617] dark:text-white">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-black/10 px-4 dark:border-white/10">
        <div className="flex gap-1 rounded-lg bg-black/[0.06] p-0.5 dark:bg-white/10">
          {(["discover", "installed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1 text-[12.5px] font-medium transition ${
                tab === t ? "bg-white shadow-sm dark:bg-white/20" : "opacity-60"
              }`}
            >
              {t === "discover" ? "Descobrir" : "Instalados"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-64 items-center gap-2 rounded-lg bg-black/[0.06] px-3 dark:bg-white/10">
          <Magnifier className="h-3.5 w-3.5 opacity-50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "discover" ? "Buscar apps para instalar" : "Buscar nos instalados"}
            className="h-8 w-full bg-transparent text-[12.5px] outline-none"
          />
        </div>
      </div>

      {tab === "discover" ? <Discover q={q} /> : <Installed q={q} />}
    </div>
  );
}

/* ------------------------------- Descobrir -------------------------------- */

function Discover({ q }: { q: string }) {
  const [winget, setWinget] = useState<boolean | null>(null);
  const [results, setResults] = useState<StorePackage[] | null>(null);
  const [installing, setInstalling] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    ipc.wingetAvailable().then(setWinget).catch(() => setWinget(false));
  }, []);

  // Busca livre no winget quando há query; senão, mostra a seleção curada.
  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      ipc.storeSearch(q).then(setResults).catch(() => setResults([]));
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const install = async (id: string) => {
    setInstalling((s) => ({ ...s, [id]: true }));
    try {
      await ipc.storeInstall(id);
      setDone((s) => ({ ...s, [id]: true }));
    } catch (e) {
      console.error("install falhou", e);
    } finally {
      setInstalling((s) => ({ ...s, [id]: false }));
    }
  };

  if (winget === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[15px] font-semibold">WinGet não encontrado</p>
        <p className="max-w-96 text-[12.5px] leading-relaxed opacity-60">
          Para instalar apps novos, o Windows precisa do gerenciador de pacotes WinGet (parte do "App Installer" da
          Microsoft Store). Instale-o e reabra a App Store.
        </p>
      </div>
    );
  }

  const searching = q.trim().length > 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      {searching ? (
        <SearchResults results={results} installing={installing} done={done} onInstall={install} />
      ) : (
        CATEGORIES.map((cat) => (
          <section key={cat} className="mb-7">
            <h2 className="mb-3 text-[17px] font-bold">{cat}</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {CATALOG.filter((a) => a.category === cat).map((app) => (
                <AppCard
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  desc={app.desc}
                  installing={!!installing[app.id]}
                  done={!!done[app.id]}
                  onInstall={() => install(app.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function SearchResults({
  results,
  installing,
  done,
  onInstall,
}: {
  results: StorePackage[] | null;
  installing: Record<string, boolean>;
  done: Record<string, boolean>;
  onInstall: (id: string) => void;
}) {
  if (results === null) return <p className="py-10 text-center text-[13px] opacity-50">Buscando…</p>;
  if (results.length === 0)
    return <p className="py-10 text-center text-[13px] opacity-50">Nenhum app encontrado.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {results.map((p) => (
        <AppCard
          key={p.id}
          id={p.id}
          name={p.name}
          desc={p.version}
          installing={!!installing[p.id]}
          done={!!done[p.id]}
          onInstall={() => onInstall(p.id)}
        />
      ))}
    </div>
  );
}

function AppCard({
  name,
  desc,
  installing,
  done,
  onInstall,
}: {
  id: string;
  name: string;
  desc: string;
  installing: boolean;
  done: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0a84ff] to-[#0060c9] text-[18px] font-bold text-white">
        {name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold">{name}</p>
        <p className="truncate text-[11.5px] opacity-55">{desc}</p>
      </div>
      <button
        onClick={onInstall}
        disabled={installing || done}
        className={`mt-auto rounded-full py-1.5 text-[12px] font-semibold transition ${
          done
            ? "bg-green-500/15 text-green-600 dark:text-green-400"
            : "bg-accent text-white hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {done ? "Instalado" : installing ? "Instalando…" : "Obter"}
      </button>
    </div>
  );
}

/* ------------------------------- Instalados ------------------------------- */

function Installed({ q }: { q: string }) {
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [icons, setIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    ipc.listInstalledApps().then(setApps).catch(() => setApps([]));
  }, []);

  // Extrai o ícone real de cada app (sob demanda, em lote).
  useEffect(() => {
    if (!apps) return;
    apps.slice(0, 60).forEach((a) => {
      if (icons[a.path]) return;
      ipc.appIcon(a.path).then((data) => {
        if (data) setIcons((s) => (s[a.path] ? s : { ...s, [a.path]: data }));
      });
    });
  }, [apps, icons]);

  const filtered = useMemo(() => {
    if (!apps) return null;
    const n = q.trim().toLowerCase();
    return n ? apps.filter((a) => a.name.toLowerCase().includes(n)) : apps;
  }, [apps, q]);

  if (filtered === null) return <p className="py-10 text-center text-[13px] opacity-50">Lendo apps instalados…</p>;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <p className="mb-4 text-[12px] opacity-50">
        {filtered.length} apps instalados neste Windows — clique para abrir.
      </p>
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-5">
        {filtered.map((app) => (
          <button
            key={app.path + app.name}
            onClick={() => ipc.launchApp(app.path)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-accent/50 dark:bg-white/[0.06] dark:ring-white/10"
            title={app.path}
          >
            {icons[app.path] ? (
              <img src={icons[app.path]} alt="" className="h-11 w-11" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/10 text-[18px] font-bold dark:bg-white/15">
                {app.name.charAt(0)}
              </div>
            )}
            <p className="w-full truncate text-center text-[12px] font-medium">{app.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
