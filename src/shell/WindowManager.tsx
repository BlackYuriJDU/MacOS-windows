import { AnimatePresence } from "framer-motion";
import { useWindows } from "../store/windows";
import Window from "./Window";

export default function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focused()?.id);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Um único AnimatePresence envolvendo TODA a lista: sem isso cada
          AnimatePresence via apenas um filho e a animação de exit (fechar)
          nunca disparava — a janela sumia instantaneamente e travava a UI. */}
      <AnimatePresence>
        {windows.map((w, i) => (
          <Window key={w.id} win={w} focused={w.id === focusedId} z={10 + i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
