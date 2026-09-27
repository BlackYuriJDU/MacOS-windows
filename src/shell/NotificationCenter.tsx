import { motion } from "framer-motion";
import { useNotifications } from "../store/notifications";
import { getApp, openApp } from "../apps/registry";

function timeAgo(t: number): string {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)} h atrás`;
  return new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Central de Notificações: painel que desliza da direita (abre clicando no relógio). */
export default function NotificationCenter() {
  const { items, centerOpen, setCenterOpen, dismiss, clearAll } = useNotifications();

  if (!centerOpen) return null;

  return (
    <div className="fixed inset-0 z-[8400]" onPointerDown={() => setCenterOpen(false)}>
      <motion.aside
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-[360px] flex-col bg-transparent p-3 pt-12"
      >
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[15px] font-bold text-white" style={{ textShadow: "0 1px 3px rgb(0 0 0 / 0.4)" }}>
            Central de Notificações
          </p>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-full bg-black/30 px-3 py-1 text-[11.5px] font-medium text-white backdrop-blur hover:bg-black/45"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-[13px] text-white/70" style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.4)" }}>
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
                  className="glass-strong group relative rounded-2xl border border-white/40 p-3 shadow-lg dark:border-white/10"
                >
                  <button
                    onClick={() => dismiss(n.id)}
                    className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[11px] text-black/70 group-hover:flex dark:bg-white/20 dark:text-white/80"
                    title="Dispensar"
                  >
                    ×
                  </button>
                  <button
                    onClick={() => {
                      setCenterOpen(false);
                      if (app) openApp(n.appId);
                    }}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    {Icon && (
                      <span className="mt-0.5 h-8 w-8 shrink-0">
                        <Icon />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-semibold text-black dark:text-white">{n.title}</span>
                        <span className="shrink-0 text-[10.5px] text-black/50 dark:text-white/50">{timeAgo(n.time)}</span>
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-black/70 dark:text-white/70">
                        {n.body}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.aside>
    </div>
  );
}
