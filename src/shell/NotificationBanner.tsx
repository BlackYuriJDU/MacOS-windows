import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../store/notifications";
import { getApp, openApp } from "../apps/registry";

/** Banners temporários no canto superior direito (estilo macOS). */
export default function NotificationBanner() {
  const items = useNotifications((s) => s.items);
  const dismiss = useNotifications((s) => s.dismiss);
  const [visible, setVisible] = useState<number[]>([]);

  // mostra os 2 mais recentes por 5s
  useEffect(() => {
    const recent = items.slice(0, 2).map((n) => n.id);
    setVisible(recent);
    if (recent.length === 0) return;
    const t = setTimeout(() => setVisible([]), 5000);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <div className="pointer-events-none fixed right-3 top-[38px] z-[8500] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {items
          .filter((n) => visible.includes(n.id))
          .map((n) => {
            const app = getApp(n.appId);
            const Icon = app?.icon;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => {
                  dismiss(n.id);
                  if (app) openApp(n.appId);
                }}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/40 p-3 text-left shadow-2xl dark:border-white/10"
              >
                <span className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                  {Icon ? <Icon /> : <span className="flex h-full w-full items-center justify-center bg-accent text-[14px] font-bold text-white">{n.appName.charAt(0)}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-black dark:text-white">{n.title}</span>
                    <span className="shrink-0 text-[10px] text-black/40 dark:text-white/40">{n.appName}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-black/70 dark:text-white/70">{n.body}</span>
                </span>
              </motion.button>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
