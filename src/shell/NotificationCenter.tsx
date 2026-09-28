import { motion } from "framer-motion";
import { useNotifications } from "../store/notifications";
import { getApp, openApp } from "../apps/registry";
import { useOverlays } from "../store/ui";

function fmtTime(t: number): string {
  const d = new Date(t);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Central de Notificações — painel deslizante da direita (estilo macOS). */
export default function NotificationCenter() {
  const items = useNotifications((s) => s.items);
  const clear = useNotifications((s) => s.clear);
  const dismiss = useNotifications((s) => s.dismiss);
  const setNotifCenter = useOverlays((s) => s.setNotifCenter);

  return (
    <div className="fixed inset-0 z-[8400]" onPointerDown={() => setNotifCenter(false)}>
      <motion.div
        initial={{ x: 360 }}
        animate={{ x: 0 }}
        exit={{ x: 360 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-[340px] flex-col bg-transparent p-3 pt-[38px]"
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[15px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgb(0 0 0 / 0.4)" }}>
            Central de Notificações
          </p>
          {items.length > 0 && (
            <button onClick={clear} className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white backdrop-blur">
              Limpar Tudo
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-[13px] text-white/60" style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.4)" }}>
                Nenhuma notificação
              </p>
            </div>
          ) : (
            items.map((n) => {
              const app = getApp(n.appId);
              const Icon = app?.icon;
              return (
                <div
                  key={n.id}
                  className="glass-strong group flex items-start gap-3 rounded-2xl border border-white/40 p-3 shadow-lg dark:border-white/10"
                >
                  <span className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                    {Icon ? <Icon /> : <span className="flex h-full w-full items-center justify-center bg-accent text-[14px] font-bold text-white">{n.appName.charAt(0)}</span>}
                  </span>
                  <button
                    onClick={() => { dismiss(n.id); if (app) { openApp(n.appId); setNotifCenter(false); } }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-black dark:text-white">{n.title}</span>
                      <span className="shrink-0 text-[10px] text-black/40 dark:text-white/40">{fmtTime(n.time)}</span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-black/70 dark:text-white/70">{n.body}</span>
                  </button>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="shrink-0 rounded-full p-1 text-black/30 opacity-0 transition group-hover:opacity-100 hover:bg-black/10 dark:text-white/40 dark:hover:bg-white/10"
                    title="Dispensar"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
