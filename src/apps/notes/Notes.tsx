import { useEffect, useRef, useState } from "react";

interface Note {
  id: number;
  text: string;
  updated: number;
}

const KEY = "macos-windows-notes";
const DEBOUNCE_MS = 500;

function load(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Note[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignora */
  }
  return [];
}

function save(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* ignora */
  }
}

/** Data no estilo Notes: hoje = HH:MM, este ano = DD MMM, mais antigo = DD/MM/AA */
function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (d.getFullYear() === now.getFullYear()) {
    const s = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return s.replace(/\./g, "");
  }
  const yy = String(d.getFullYear()).slice(-2);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${yy}`;
}

function titleOf(text: string): string {
  return text.split("\n")[0]?.trim() || "Nova Nota";
}

function previewOf(text: string): string {
  const lines = text.split("\n");
  const second = lines.slice(1).find((l) => l.trim() !== "");
  return second?.trim() || "Sem texto adicional";
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(load);
  const [selId, setSelId] = useState<number | null>(() => load()[0]?.id ?? null);
  const timer = useRef<number | null>(null);
  const pending = useRef<Note[] | null>(null);

  const flush = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current !== null) {
      save(pending.current);
      pending.current = null;
    }
  };

  const scheduleSave = (next: Note[]) => {
    pending.current = next;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (pending.current !== null) {
        save(pending.current);
        pending.current = null;
      }
    }, DEBOUNCE_MS);
  };

  // Salva ao fechar/descarregar a janela
  useEffect(() => {
    const onUnload = () => flush();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...notes].sort((a, b) => b.updated - a.updated);
  const sel = notes.find((n) => n.id === selId) ?? null;

  const add = () => {
    flush();
    const now = Date.now();
    const n: Note = { id: now, text: "", updated: now };
    const next = [n, ...notes];
    setNotes(next);
    setSelId(n.id);
    save(next); // criação salva imediatamente
  };

  const del = () => {
    if (selId === null) return;
    flush();
    const rest = notes.filter((n) => n.id !== selId);
    const nextSel = sorted.find((n) => n.id !== selId)?.id ?? null;
    setNotes(rest);
    setSelId(nextSel);
    save(rest); // exclusão salva imediatamente
  };

  const edit = (text: string) => {
    if (selId === null) return;
    const next = notes.map((n) => (n.id === selId ? { ...n, text, updated: Date.now() } : n));
    setNotes(next);
    scheduleSave(next); // edição salva com debounce
  };

  const select = (id: number) => {
    if (id === selId) return;
    flush(); // salva a nota anterior ao trocar
    setSelId(id);
  };

  return (
    <div className="flex h-full text-[13px] text-neutral-900 dark:text-neutral-100">
      {/* Sidebar — lista de notas */}
      <div className="flex w-60 shrink-0 flex-col border-r border-black/10 bg-[#efece4] dark:border-white/10 dark:bg-[#1e1e1e]">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-black/5 px-3 dark:border-white/5">
          <span className="text-[12px] font-semibold opacity-60">Notas</span>
          <span className="text-[11px] opacity-40">
            {notes.length} {notes.length === 1 ? "nota" : "notas"}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {sorted.length === 0 && (
            <p className="p-3 text-center text-[12px] opacity-40">Sem notas</p>
          )}
          {sorted.map((n) => (
            <button
              key={n.id}
              onClick={() => select(n.id)}
              className={`mb-0.5 block w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                selId === n.id
                  ? "bg-[#f7d774] dark:bg-[#5a4d1e]"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <p className="truncate text-[12.5px] font-semibold leading-tight">{titleOf(n.text)}</p>
              <p className="mt-0.5 flex items-baseline gap-1.5 text-[11px] leading-tight">
                <span className="shrink-0 opacity-60">{formatDate(n.updated)}</span>
                <span className="truncate opacity-40">{previewOf(n.text)}</span>
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Área de edição */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#fbf9f4] dark:bg-[#262626]">
        {/* Toolbar */}
        <div className="flex h-11 shrink-0 items-center gap-1 border-b border-black/5 px-3 dark:border-white/5">
          <button
            onClick={add}
            title="Nova nota"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-black/5 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            onClick={del}
            disabled={!sel}
            title="Apagar nota"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-black/5 hover:text-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <div className="ml-auto text-[11px] opacity-40">
            {sel ? formatDate(sel.updated) : ""}
          </div>
        </div>

        {/* Editor */}
        <div className="min-h-0 flex-1">
          {sel ? (
            <textarea
              key={sel.id}
              value={sel.text}
              onChange={(e) => edit(e.target.value)}
              onBlur={flush}
              spellCheck={false}
              placeholder="Comece a escrever…"
              className="h-full w-full resize-none bg-transparent px-5 py-4 text-[13.5px] leading-relaxed outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-400 dark:text-neutral-500">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <p className="text-[13px] font-medium">Sem notas</p>
              <p className="text-[12px] opacity-70">Selecione ou crie uma nota</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
