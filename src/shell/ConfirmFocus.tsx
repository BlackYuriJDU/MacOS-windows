import { useEffect, useState } from "react";
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
  const [recovery, setRecovery] = useState<FocusState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ipc.focusCandidates().then(setCandidates).catch(() => setCandidates([]));
    ipc
      .focusState()
      .then((st) => {
        if (st && st.mode === "suspend" && st.pids.length > 0) setRecovery(st);
      })
      .catch(() => {});
  }, []);

  const names = Array.from(new Set((candidates ?? []).map((c) => c.name.replace(/\.exe$/i, ""))));

  const recover = async () => {
    setBusy(true);
    try {
      const resumed = await ipc.focusExit();
      console.log(`recuperação: ${resumed} processos retomados`);
    } finally {
      setRecovery(null);
      setBusy(false);
    }
  };

  const enter = (m: FocusMode) => {
    setBusy(true);
    sessionFlow.enter(m);
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
          <div className="mt-4 rounded-xl bg-black/5 p-3 text-[12.5px] dark:bg-white/5">
            {candidates === null ? (
              <p className="opacity-60">Verificando processos…</p>
            ) : names.length === 0 ? (
              <p className="opacity-60">Nenhum aplicativo em segundo plano para afetar.</p>
            ) : (
              <>
                <p className="mb-1.5 font-medium">{candidates.length} processos serão afetados:</p>
                <p className="leading-relaxed opacity-70">
                  {names.slice(0, 9).join(", ")}
                  {names.length > 9 ? ` e mais ${names.length - 9}` : ""}
                </p>
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
            disabled={busy}
            className="rounded-xl bg-accent px-5 py-2 text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98] disabled:opacity-50"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
