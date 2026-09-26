import { useEffect, useState } from "react";

interface Note {
  id: number;
  text: string;
  updated: number;
}

const KEY = "macos-windows-notes";

function load(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Note[];
  } catch {
    /* ignora */
  }
  return [];
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(load);
  const [selId, setSelId] = useState<number | null>(notes[0]?.id ?? null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes]);

  const sel = notes.find((n) => n.id === selId) ?? null;

  const add = () => {
    const n: Note = { id: Date.now(), text: "", updated: Date.now() };
    setNotes([n, ...notes]);
    setSelId(n.id);
  };

  const del = () => {
    if (selId === null) return;
    const rest = notes.filter((n) => n.id !== selId);
    setNotes(rest);
    setSelId(rest[0]?.id ?? null);
  };

  const edit = (text: string) => {
    setNotes((ns) => ns.map((n) => (n.id === selId ? { ...n, text, updated: Date.now() } : n)));
  };

  return (
    <div className="flex h-full text-[13px] text-black dark:text-white">
      {/* Barra superior amarela — assinatura do Notes */}
      <div className="absolute inset-x-0 top-0 flex h-11 items-center gap-2 border-b border-black/10 bg-[#ffd400]/90 px-3 dark:border-white/10">
        <button onClick={add} className="rounded-md px-2 py-0.5 text-[15px] leading-none hover:bg-black/10" title="Nova nota">
          +
        </button>
        <button onClick={del} className="rounded-md px-2 py-0.5 text-[15px] leading-none hover:bg-black/10" title="Apagar nota">
          −
        </button>
      </div>

      <div className="mt-11 flex h-[calc(100%-2.75rem)] w-full">
        <div className="w-48 shrink-0 overflow-y-auto border-r border-black/10 bg-white/60 p-2 dark:border-white/10 dark:bg-black/20">
          {notes.length === 0 && <p className="p-2 text-[12px] opacity-50">Sem notas</p>}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelId(n.id)}
              className={`mb-1 block w-full rounded-lg px-2 py-1.5 text-left ${
                selId === n.id ? "bg-[#ffd400]/50" : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <p className="truncate text-[12.5px] font-medium">{n.text.split("\n")[0].trim() || "Nova Nota"}</p>
              <p className="text-[11px] opacity-50">
                {new Date(n.updated).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </p>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 bg-white/80 dark:bg-black/30">
          {sel ? (
            <textarea
              value={sel.text}
              onChange={(e) => edit(e.target.value)}
              spellCheck={false}
              placeholder="Comece a escrever…"
              className="h-full w-full resize-none bg-transparent p-4 text-[13px] leading-relaxed outline-none"
            />
          ) : (
            <p className="p-4 text-[12px] opacity-50">Selecione ou crie uma nota</p>
          )}
        </div>
      </div>
    </div>
  );
}
