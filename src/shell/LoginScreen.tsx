import { useEffect, useRef, useState } from "react";
import { useClock } from "../hooks/useClock";
import { Logo } from "../components/Logo";
import { sessionFlow } from "../lib/session-flow";
import type { FocusMode } from "../lib/types";

const WD = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const FOCUS_OPTIONS: { id: FocusMode; label: string }[] = [
  { id: "none", label: "Desativado" },
  { id: "suspend", label: "Congelar apps em 2º plano" },
  { id: "terminate", label: "Finalizar apps em 2º plano" },
];

/** Tela de login/ espera estilo macOS Tahoe: relógio grande, avatar, senha
 *  (simulada — qualquer valor entra) e Modo Foco como sub-opção discreta. */
export default function LoginScreen() {
  const now = useClock();
  const [password, setPassword] = useState("");
  const [focusMode, setFocusMode] = useState<FocusMode>("none");
  const [showFocus, setShowFocus] = useState(false);
  const [entering, setEntering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Foco automático no campo de senha ao abrir */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    // pids undefined = afeta todos os processos candidatos quando modo != none
    void sessionFlow.enter(focusMode, undefined);
  };

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <div className="wp-0 fixed inset-0 z-[9990] flex flex-col items-center justify-center text-white">
      {/* véu escuro + blur sobre o wallpaper, como na tela de login real */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-2xl" />

      <div className="relative flex flex-col items-center">
        {/* Data + relógio grande */}
        <p className="text-[15px] font-medium opacity-80">
          {WD[now.getDay()]}, {now.getDate()} de {MO[now.getMonth()]}
        </p>
        <p className="mt-1 text-[92px] font-semibold leading-none tracking-tight tabular-nums">
          {hh}:{mm}
        </p>

        {/* Avatar + nome */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-md">
            <Logo size={56} />
          </div>
          <p className="text-[17px] font-semibold">Arthur</p>

          {/* Campo de senha + seta (simulação: qualquer valor entra) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enter();
            }}
            className="mt-1 flex items-center gap-2"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                autoComplete="off"
                className="h-9 w-56 rounded-full bg-white/15 pl-4 pr-10 text-[13.5px] text-white placeholder-white/50 outline-none ring-1 ring-white/20 backdrop-blur-md transition focus:bg-white/20 focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                aria-label="Entrar"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[13px] transition hover:bg-white/35 active:scale-95"
              >
                →
              </button>
            </div>
          </form>

          {/* Modo Foco como sub-opção discreta (padrão: desativado) */}
          <div className="mt-3 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowFocus((v) => !v)}
              className="text-[12px] opacity-60 underline-offset-2 transition hover:opacity-90 hover:underline"
            >
              Opções do Modo Foco{focusMode !== "none" ? ` · ${FOCUS_OPTIONS.find((o) => o.id === focusMode)?.label}` : ""}
            </button>
            {showFocus && (
              <div className="mt-2 flex gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-md">
                {FOCUS_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setFocusMode(o.id)}
                    className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition ${
                      focusMode === o.id ? "bg-white/85 text-black shadow" : "text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
