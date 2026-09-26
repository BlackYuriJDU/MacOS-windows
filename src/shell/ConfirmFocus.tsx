import { useEffect, useMemo, useState } from "react";
import { ipc } from "../lib/ipc";
import type { FocusMode, FocusState, ProcInfo } from "../lib/types";
import { useSession } from "../store/session";
import { sessionFlow } from "../lib/session-flow";
import { Logo } from "../components/Logo";

const MODES: { id: FocusMode; title: string; desc: string }[] = [
  {
    id: "suspend",
    title: "Congelar aplicativos em segundo plano",
    desc: "Recomendado — os apps param de consumir CPU e voltam exatamente de onde pararam quando você sair.",
  },
  {
    id: "terminate",
    title: "Finalizar aplicativos em segundo plano",
    desc: "Encerra os apps de verdade (abas incluídas). O que não for salvo será perdido.",
  },
  {
    id: "none",
    title: "Não mexer nos processos",
    desc: "Entra no ambiente sem alterar nada em execução.",
  },
];

export default function ConfirmFocus() {
  const setPhase = useSession((s) => s.setPhase);
  const [mode, setMode] = useState<FocusMode>("suspend");
  const [candidates, setCandidates] = useState<ProcInfo[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [recovery, setRecovery] = useState<FocusState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ipc
      .focusCandidates()
      .then((list) => {
        setCandidates(list);
        setSelected(new Set(list.map((c) => c.pid))); // tudo marcado por padrão
      })
      .catch(() => setCandidates([]));
    ipc
      .focusState()
      .then((st) => {
        if (st && st.mode === "suspend" && st.pids.length > 0) setRecovery(st);
      })
      .catch(() => {});
  }, []);

  const toggle = (pid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const allSelected = useMemo(
    () => (candidates ? selected.size === candidates.length && candidates.length > 0 : false),
    [candidates, selected]
  );
  const toggleAll = () => {
    if (!candidates) return;
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.pid)));
  };

  const recover = async () => {
    setBusy(true);
    try {
      await ipc.focusExit();
    } finally {
      setRecovery(null);
      setBusy(false);
    }
  };

  const enter = (m: FocusMode) => {
    setBusy(true);
    // Modo Foco seletivo: passa os PIDs escolhidos (ou undefined = todos).
    const pids = m === "none" ? undefined : allSelected ? undefined : Array.from(selected);
    sessionFlow.enter(m, pids);
  };

  return (
    <div className="wp-0 fixed inset-0 z-[9990] flex items-center justify-center">
      <div className="glass w-[560px] rounded-2xl p-7 text-black shadow-2xl ring-1 ring-black/10 dark:text-white">
        <div className="mb-5 flex items-center gap-4">
          <Logo size={56} />
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">Mac OS</h1>
            <p className="text-[13px] opacity-60">Ambiente de trabalho estilo macOS para Windows</p>
          </div>
        </div>

        {recovery && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-[13px]">
            <p className="font-medium text-red-600 dark:text-red-400">
              A sessão anterior foi encerrada abruptamente e {recovery.pids.length} processos continuam congelados.
            </p>
            <button
              onClick={recover}
              disabled={busy}
              className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
            >
              Retomar processos agora
            </button>
          </div>
        )}

        <p className="mb-3 text-[13px] font-medium opacity-80">Como tratar os aplicativos em segundo plano?</p>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl border p-3 text-left transition ${
                mode === m.id
                  ? "border-accent bg-accent/10"
                  : "border-black/10 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <p className="text-[13.5px] font-medium">{m.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug opacity-60">{m.desc}</p>
            </button>
          ))}
        </div>

        {mode !== "none" && (
          <div className="mt-4 rounded-xl bg-black/5 p-3 dark:bg-white/5">
            {candidates === null ? (
              <p className="text-[12.5px] opacity-60">Verificando processos…</p>
            ) : candidates.length === 0 ? (
              <p className="text-[12.5px] opacity-60">Nenhum aplicativo em segundo plano para afetar.</p>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12.5px] font-medium">
                    {selected.size} de {candidates.length} processos selecionados
                  </p>
                  <button onClick={toggleAll} className="text-[11.5px] text-accent hover:underline">
                    {allSelected ? "Desmarcar tudo" : "Selecionar tudo"}
                  </button>
                </div>
                <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
                  {candidates.map((c) => (
                    <label
                      key={c.pid}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.pid)}
                        onChange={() => toggle(c.pid)}
                        className="h-3.5 w-3.5 accent-[#0a84ff]"
                      />
                      <span className="flex-1 truncate text-[12.5px]">{c.name.replace(/\.exe$/i, "")}</span>
                      <span className="text-[10.5px] tabular-nums opacity-40">{c.pid}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPhase("desktop")}
            disabled={busy}
            className="text-[13px] opacity-70 underline-offset-2 hover:underline"
          >
            Explorar sem Modo Foco
          </button>
          <button
            onClick={() => enter(mode)}
            disabled={busy || (mode !== "none" && selected.size === 0 && (candidates?.length ?? 0) > 0)}
            className="rounded-xl bg-accent px-5 py-2 text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
