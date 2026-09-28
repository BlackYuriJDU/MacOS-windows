import { motion } from "framer-motion";
import { Logo } from "../components/Logo";
import { useSession } from "../store/session";

/** Boot: logo próprio + barra de progresso (como um boot real, sem assets da Apple). */
export default function BootScreen() {
  const setPhase = useSession((s) => s.setPhase);
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-10 bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Logo size={96} />
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          onAnimationComplete={() => setPhase("login")}
        />
      </div>
    </motion.div>
  );
}
