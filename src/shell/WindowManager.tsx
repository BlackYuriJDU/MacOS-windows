import { AnimatePresence } from "framer-motion";
import { useWindows } from "../store/windows";
import Window from "./Window";

export default function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focused()?.id);

  return (
    <div className="pointer-events-none absolute inset-0">
      {windows.map((w, i) => (
        <div key={w.id} className="pointer-events-auto contents">
          <AnimatePresence>
            <Window win={w} focused={w.id === focusedId} z={10 + i} />
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
