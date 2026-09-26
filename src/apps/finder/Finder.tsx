import { useCallback, useEffect, useMemo, useState } from "react";
import { ipc } from "../../lib/ipc";
import type { FsEntry } from "../../lib/types";
import { FolderGlyph, FileGlyph, Magnifier } from "../../components/icons";

export default function Finder({ focused, props: p }: { focused: boolean; props?: Record<string, unknown> }) {
  const initialPath = typeof p?.initialPath === "string" ? (p.initialPath as string) : undefined;
  return <FinderInner focused={focused} initialPath={initialPath} />;
}

const SIDEBAR = [
  { group: "Favoritos", items: [
    { label: "Mesa", dir: "Desktop" },
    { label: "Documentos", dir: "Documents" },
    { label: "Downloads", dir: "Downloads" },
    { label: "Imagens", dir: "Pictures" },
    { label: "Música", dir: "Music" },
    { label: "Vídeos", dir: "Videos" },
  ]},
];

function fmtSize(b: number): string {
  if (b < 1024) return `${b} bytes`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(1)} GB`;
}

function fmtDate(s: number): string {
  return new Date(s * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function FinderInner({ focused, initialPath }: { focused: boolean; initialPath?: string }) {
  const [home, setHome] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(initialPath ?? null);
  const [entries, setEntries] = useState<FsEntry[] | null>(null);
  const [selected, setSelected] = useState<FsEntry | null>(null);
  const [qlook, setQlook] = useState<FsEntry | null>(null);
  const [view, setView] = useState<"icons" | "list">("icons");
  const [filter, setFilter] = useState("");
  const [back, setBack] = useState<string[]>([]);
  const [fwd, setFwd] = useState<string[]>([]);

  useEffect(() => {
    ipc.homeDir().then((h) => {
      setHome(h);
      setPath((p) => p ?? h);
    });
  }, []);

  const load = useCallback(async (p: string) => {
    setEntries(null);
    try {
      setEntries(await ipc.fsList(p));
    } catch (e) {
      console.error(e);
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    if (path) void load(path);
  }, [path, load]);

  /* Quick Look com barra de espaço (janela focada) */
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && selected) {
        e.preventDefault();
        setQlook((q) => (q ? null : selected));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, selected]);

  const navigate = (to: string) => {
    setBack((b) => (path ? [...b, path] : b));
    setFwd([]);
    setSelected(null);
    setPath(to);
  };

  const goBack = () => {
    setBack((b) => {
      if (!b.length) return b;
      const prev = b[b.length - 1];
      setFwd((f) => (path ? [path, ...f] : f));
      setPath(prev);
      return b.slice(0, -1);
    });
  };

  const goFwd = () => {
    setFwd((f) => {
      if (!f.length) return f;
      setBack((b) => (path ? [...b, path] : b));
      setPath(f[0]);
      return f.slice(1);
    });
  };

  const visible = useMemo(() => {
    if (!entries) return null;
    const f = filter.trim().toLowerCase();
    return f ? entries.filter((e) => e.name.toLowerCase().includes(f)) : entries;
  }, [entries, filter]);

  const title = path ? (path === home ? "Pasta pessoal" : path.split(/[\\/]/).pop() || path) : "Finder";

  const openEntry = (e: FsEntry) => {
    if (e.is_dir) navigate(e.path);
    else setQlook(e);
  };

  return (
    <div className="flex h-full flex-col text-[13px] text-black dark:text-white">
      {/* Barra de ferramentas */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 bg-black/[0.03] px-3 dark:border-white/10 dark:bg-white/[0.04]">
        <button
          onClick={goBack}
          disabled={!back.length}
          className="rounded-md px-2 py-1 text-[15px] leading-none opacity-70 hover:bg-black/10 disabled:opacity-25 dark:hover:bg-white/10"
          title="Voltar"
        >
          ‹
        </button>
        <button
          onClick={goFwd}
          disabled={!fwd.length}
          className="rounded-md px-2 py-1 text-[15px] leading-none opacity-70 hover:bg-black/10 disabled:opacity-25 dark:hover:bg-white/10"
          title="Avançar"
        >
          ›
        </button>
        <p className="ml-2 font-semibold">{title}</p>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 rounded-lg bg-black/10 p-0.5 dark:bg-white/10">
          <button
            onClick={() => setView("icons")}
            className={`rounded-md px-2 py-0.5 text-[11px] ${view === "icons" ? "bg-white shadow-sm dark:bg-white/20" : "opacity-60"}`}
          >
            Ícones
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md px-2 py-0.5 text-[11px] ${view === "list" ? "bg-white shadow-sm dark:bg-white/20" : "opacity-60"}`}
          >
            Lista
          </button>
        </div>
        <div className="ml-2 flex w-40 items-center gap-1 rounded-lg border border-black/10 bg-white/70 px-2 py-1 dark:border-white/10 dark:bg-white/10">
          <Magnifier className="h-3 w-3 opacity-50" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar"
            className="w-full bg-transparent text-[12px] outline-none"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Barra lateral */}
        <div className="w-44 shrink-0 overflow-y-auto border-r border-black/10 bg-black/[0.02] p-2 dark:border-white/10 dark:bg-white/[0.03]">
          {SIDEBAR.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase opacity-40">{g.group}</p>
              {g.items.map((it) => (
                <button
                  key={it.dir}
                  onClick={() => home && navigate(`${home}\\${it.dir}`)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <FolderGlyph className="h-4 w-4" />
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          {home && (
            <div>
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase opacity-40">Locais</p>
              <button
                onClick={() => navigate(`${home.slice(0, 2)}\\`)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] hover:bg-black/10 dark:hover:bg-white/10"
              >
                <FolderGlyph className="h-4 w-4" /> Macintosh HD
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3" onClick={() => setSelected(null)}>
          {visible === null ? (
            <p className="p-4 text-center text-[12px] opacity-50">Carregando…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-center text-[12px] opacity-50">Pasta vazia ou indisponível</p>
          ) : view === "icons" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1">
              {visible.map((e) => (
                <button
                  key={e.path}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelected(e);
                  }}
                  onDoubleClick={() => openEntry(e)}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 ${
                    selected?.path === e.path ? "bg-accent/20" : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {e.is_dir ? <FolderGlyph className="h-11 w-11" /> : <FileGlyph className="h-11 w-11" />}
                  <span className="w-full truncate text-center text-[11.5px] leading-tight">{e.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="text-left opacity-40">
                <tr>
                  <th className="py-1 font-medium">Nome</th>
                  <th className="py-1 font-medium">Modificado</th>
                  <th className="py-1 font-medium">Tamanho</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr
                    key={e.path}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelected(e);
                    }}
                    onDoubleClick={() => openEntry(e)}
                    className={`cursor-default rounded ${
                      selected?.path === e.path ? "bg-accent/20" : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <td className="flex items-center gap-2 py-1">
                      {e.is_dir ? <FolderGlyph className="h-4 w-4" /> : <FileGlyph className="h-4 w-4" />}
                      {e.name}
                    </td>
                    <td className="py-1 opacity-60">{e.modified ? fmtDate(e.modified) : "—"}</td>
                    <td className="py-1 opacity-60">{e.is_dir ? "—" : fmtSize(e.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Look */}
      {qlook && <QuickLook entry={qlook} onClose={() => setQlook(null)} />}
    </div>
  );
}

function QuickLook({ entry, onClose }: { entry: FsEntry; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const isImg = /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(entry.name);
  const isTxt = !isImg && /\.(txt|md|json|js|ts|tsx|css|html|xml|yml|yaml|csv|ini|log|rs|py|sh)$/i.test(entry.name);

  useEffect(() => {
    if (isTxt) ipc.fsReadText(entry.path).then(setText).catch(() => setText("(não foi possível ler o arquivo)"));
  }, [entry.path, isTxt]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="border-b border-black/10 px-4 py-2 text-[12px] font-semibold dark:border-white/10">{entry.name}</p>
        <div className="max-h-80 overflow-auto p-4 text-[12px]">
          {isImg ? (
            <img src={ipc.fsAsset(entry.path)} alt={entry.name} className="max-h-72 rounded-lg object-contain" />
          ) : isTxt ? (
            text === null ? (
              <p className="opacity-50">Carregando…</p>
            ) : (
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">{text}</pre>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 opacity-60">
              <FileGlyph className="h-14 w-14" />
              <p>Sem pré-visualização — {fmtSize(entry.size)}</p>
            </div>
          )}
        </div>
        <p className="border-t border-black/10 px-4 py-1.5 text-center text-[10.5px] opacity-50 dark:border-white/10">
          Clique fora ou use espaço para fechar
        </p>
      </div>
    </div>
  );
}
