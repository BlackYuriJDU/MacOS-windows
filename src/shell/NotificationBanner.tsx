import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../store/notifications";
import { getApp, openApp } from "../apps/registry";

/** Banner estilo macOS: aparece no canto superior direito, some sozinho após ~5s. */
export default function NotificationBanner() {
  const items = useNotifications((s) => s.items);
  const latest = items[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latest) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [latest?.id]);

  const app = latest ? getApp(latest.appId) : null;
  const Icon = app?.icon;

  return (
    <div className="pointer-events-none fixed right-3 top-10 z-[8500] w-[340px]">
      <AnimatePresence>
        {visible && latest && (
          <motion.button
            key={latest.id}
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            onClick={() => {
              setVisible(false);
              if (getApp(latest.appId)) openApp(latest.appId);
            }}
            className="glass-strong pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-white/40 p-3 text-left shadow-2xl dark:border-white/10"
          >
            {Icon && (
              <span className="mt-0.5 h-8 w-8 shrink-0">
                <Icon />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-black dark:text-white">{latest.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-black/70 dark:text-white/70">
                {latest.body}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
