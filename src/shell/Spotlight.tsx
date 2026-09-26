import { useEffect, useMemo, useRef, useState } from "react";
import { ipc } from "../lib/ipc";
import type { FsEntry } from "../lib/types";
import { useOverlays } from "../store/ui";
import { APPS, openApp } from "../apps/registry";
import { Magnifier, FolderGlyph, FileGlyph } from "../components/icons";

type Row =
  | { kind: "app"; id: string; name: string; icon: React.ReactNode }
  | { kind: "file"; entry: FsEntry }
  | { kind: "calc"; expr: string; result: string };

/** Avaliação aritmética segura — só entra na avaliação o que casar com o whitelist. */
function safeCalc(q: string): { expr: string; result: string } | null {
  const expr = q.replace(/,/g, ".").trim();
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) return null;
  if (!/[+\-*/%]/.test(expr) || !/\d/.test(expr)) return null;
  try {
    // whitelisted charset only
    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict";return (${expr})`)();
    if (typeof r === "number" && isFinite(r)) {
      return { expr, result: String(Math.round(r * 1e10) / 1e10) };
    }
  } catch {
    /* ignora */
  }
  return null;
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function Spotlight() {
  const setSpotlight = useOverlays((s) => s.setSpotlight);
  const [q, setQ] = useState("");
  const [files, setFiles] = useState<FsEntry[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length >= 2) {
        ipc.fsSearch(q).then(setFiles).catch(() => setFiles([]));
      } else {
        setFiles([]);
      }
    }, 140);
    return () => clearTimeout(t);
  }, [q]);

  const rows = useMemo<Row[]>(() => {
    const nq = norm(q);
    const apps = APPS.filter((a) => (q ? norm(a.name).includes(nq) : false))
      .slice(0, 5)
      .map((a) => ({ kind: "app", id: a.id, name: a.name, icon: <a.icon /> }) as Row);
    const fs = files.slice(0, 6).map((e) => ({ kind: "file", entry: e }) as Row);
    const calc = safeCalc(q) ? [{ kind: "calc", ...safeCalc(q)! } as Row] : [];
    return [...apps, ...fs, ...calc];
  }, [q, files]);

  useEffect(() => setSel(0), [q]);

  const activate = (row: Row) => {
    if (row.kind === "app") openApp(row.id);
    else if (row.kind === "file")
      openApp("finder", { forceNew: true, props: { initialPath: row.entry.is_dir ? row.entry.path : row.entry.path } });
    else if (row.kind === "calc") navigator.clipboard?.writeText(row.result).catch(() => {});
    setSpotlight(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start justify-center bg-black/10 pt-[16vh]"
      onPointerDown={() => setSpotlight(false)}
    >
      <div
        className="glass-strong w-[560px] overflow-hidden rounded-2xl border border-white/40 shadow-2xl dark:border-white/10 dark:text-white"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4">
          <Magnifier className="h-5 w-5 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, rows.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter" && rows[sel]) {
                activate(rows[sel]);
              }
            }}
            placeholder="Busca do Spotlight"
            spellCheck={false}
            className="h-14 w-full bg-transparent text-[19px] outline-none placeholder:text-black/30 dark:placeholder:text-white/30"
          />
        </div>

        {rows.length > 0 && (
          <div className="max-h-80 overflow-y-auto border-t border-black/10 p-1.5 dark:border-white/10">
            {rows.map((r, i) => (
              <button
                key={i}
                onClick={() => activate(r)}
                onMouseEnter={() => setSel(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left ${
                  i === sel ? "bg-accent text-white" : ""
                }`}
              >
                <span className="h-7 w-7 shrink-0">
                  {r.kind === "app" ? (
                    <span className="block h-7 w-7">{r.icon}</span>
                  ) : r.kind === "file" ? (
                    r.entry.is_dir ? (
                      <FolderGlyph className="h-7 w-7" />
                    ) : (
                      <FileGlyph className="h-7 w-7" />
                    )
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/10 text-[13px] dark:bg-white/15">=</span>
                  )}
                </span>
                {r.kind === "app" && (
                  <>
                    <span className="text-[13.5px]">{r.name}</span>
                    <span className="ml-auto text-[11.5px] opacity-50">Aplicativo</span>
                  </>
                )}
                {r.kind === "file" && (
                  <>
                    <span className="text-[13.5px]">{r.entry.name}</span>
                    <span className="ml-auto text-[11.5px] opacity-50">Documento</span>
                  </>
                )}
                {r.kind === "calc" && (
                  <>
                    <span className="text-[13.5px] tabular-nums">{r.expr} = {r.result}</span>
                    <span className="ml-auto text-[11.5px] opacity-50">Enter copia o resultado</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
