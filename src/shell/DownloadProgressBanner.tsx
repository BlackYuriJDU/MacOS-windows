import { motion, AnimatePresence } from "framer-motion";
import { useDownloadProgress } from "../store/notifications";

function fmtBytes(n: number): string {
  if (n <= 0) return "0 MB";
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(1)} GB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Banner persistente com barra de progresso e "%" durante downloads grandes
 *  (ex.: atualização do app). Estilo macOS: canto superior direito, vidro. */
export default function DownloadProgressBanner() {
  const { active, label, downloaded, total } = useDownloadProgress();
  const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          className="glass-strong fixed right-3 top-[38px] z-[8600] w-[320px] rounded-2xl border border-white/40 p-3.5 shadow-2xl dark:border-white/10"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold text-black dark:text-white">{label}</p>
            <span className="shrink-0 text-[12px] tabular-nums text-black/60 dark:text-white/60">
              {pct !== null ? `${pct}%` : "…"}
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
            {pct !== null ? (
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
            )}
          </div>
          {total > 0 && (
            <p className="mt-1.5 text-[11px] tabular-nums text-black/50 dark:text-white/50">
              {fmtBytes(downloaded)} de {fmtBytes(total)}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
