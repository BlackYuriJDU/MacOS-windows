import { useEffect, useState } from "react";
import { useSession } from "../store/session";
import { useClock } from "../hooks/useClock";
import { Logo } from "../components/Logo";

/** Tela de bloqueio — qualquer tecla ou clique desbloqueia (v0.1, sem senha). */
export default function LockScreen() {
  const setLocked = useSession((s) => s.setLocked);
  const now = useClock();
  const [ready, setReady] = useState(false);

  /* Evita desbloquear imediatamente com a tecla que acionou o bloqueio */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const unlock = () => setLocked(false);
    window.addEventListener("keydown", unlock);
    window.addEventListener("pointerdown", unlock);
    return () => {
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pointerdown", unlock);
    };
  }, [ready, setLocked]);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const WD = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const MO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  return (
    <div className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl text-white">
      <p className="text-[13px] font-medium opacity-70">
        {WD[now.getDay()]}, {now.getDate()} de {MO[now.getMonth()]}
      </p>
      <p className="mt-1 text-[76px] font-semibold leading-none tabular-nums">
        {hh}:{mm}
      </p>
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <Logo size={44} />
        </div>
        <p className="text-[15px] font-medium">Arthur</p>
        <p className="text-[12.5px] opacity-60">Toque ou pressione qualquer tecla para desbloquear</p>
      </div>
    </div>
  );
}
