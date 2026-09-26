import { useCallback, useEffect, useState } from "react";
import { ipc } from "../../lib/ipc";
import type { TrashEntry } from "../../lib/types";
import { TrashIcon, FolderGlyph, FileGlyph } from "../../components/icons";

function fmtSize(b: number): string {
  if (!b) return "—";
  if (b < 1024) return `${b} bytes`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(1)} GB`;
}

export default function Trash() {
  const [items, setItems] = useState<TrashEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(() => {
    setItems(null);
    ipc.trashList().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(load, [load]);

  const empty = async () => {
    setBusy(true);
    try {
      await ipc.trashEmpty();
      setConfirm(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f2f2f4] text-black dark:bg-[#1e1e20] dark:text-white">
      {/* barra de ferramentas */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/10">
        <p className="text-[13px] font-medium opacity-70">
          {items === null ? "Carregando…" : items.length === 0 ? "Lixeira vazia" : `${items.length} ${items.length === 1 ? "item" : "itens"}`}
        </p>
        {items && items.length > 0 && (
          <button
            onClick={() => setConfirm(true)}
            disabled={busy}
            className="rounded-lg bg-black/[0.06] px-3 py-1 text-[12.5px] font-medium hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Esvaziar
          </button>
        )}
      </div>

      {/* conteúdo */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {items === null ? (
          <Center><Spinner /></Center>
        ) : items.length === 0 ? (
          <Center>
            <TrashIcon className="h-24 w-24 opacity-70" />
            <p className="mt-3 text-[14px] font-medium opacity-60">O Lixo está vazio</p>
          </Center>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {items.map((it, i) => (
              <div
                key={`${it.name}-${i}`}
                title={`${it.name}\nDe: ${it.original_path}`}
                className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
              >
                {it.is_dir ? <FolderGlyph className="h-12 w-12" /> : <FileGlyph className="h-12 w-12" />}
                <p className="w-full truncate text-[11.5px] leading-tight">{it.name}</p>
                <p className="text-[10px] opacity-45">{fmtSize(it.size)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* confirmação de esvaziar (pop-up estilo Tahoe) */}
      {confirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30" onClick={() => !busy && setConfirm(false)}>
          <div
            className="glass-strong w-[300px] rounded-2xl p-5 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] font-semibold">Esvaziar a Lixeira?</p>
            <p className="mt-1.5 text-[12px] leading-relaxed opacity-60">
              {items?.length} {items?.length === 1 ? "item será apagado" : "itens serão apagados"} definitivamente. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                disabled={busy}
                className="flex-1 rounded-lg bg-black/[0.08] py-1.5 text-[13px] font-medium hover:bg-black/12 dark:bg-white/12"
              >
                Cancelar
              </button>
              <button
                onClick={empty}
                disabled={busy}
                className="flex-1 rounded-lg bg-[#ff453a] py-1.5 text-[13px] font-semibold text-white hover:bg-[#ff453a]/90 disabled:opacity-50"
              >
                {busy ? "Esvaziando…" : "Esvaziar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center">{children}</div>;
}

function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/15 border-t-black/50 dark:border-white/15 dark:border-t-white/60" />
  );
}
