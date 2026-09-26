import { useEffect, useRef, useState } from "react";
import { useSettings } from "../store/settings";
import { useWindows } from "../store/windows";
import { useContextMenu } from "../store/ui";
import { APPS, getApp, openApp } from "../apps/registry";
import { TrashIcon, LaunchpadIcon } from "../components/icons";
import { useOverlays } from "../store/ui";
import type { MenuItem } from "../lib/types";

/** Espaço vertical que o Dock reserva (janelas maximizadas terminam acima dele). */
export const DOCK_RESERVED = 96;

const MAX_SCALE = 1.55;
const FALLOFF = 110;

export default function Dock() {
  const cfg = useSettings();
  const windows = useWindows((s) => s.windows);
  const showCtx = useContextMenu((s) => s.show);
  const setLaunchpad = useOverlays((s) => s.setLaunchpad);
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [peek, setPeek] = useState(false);

  const dockApps = APPS.filter((a) => a.inDock);
  const runningApps = new Set(windows.map((w) => w.appId));
  const base = cfg.dockSize;

  /* Amplificação com queda parabólica (referência dos clones maduros da cena) */
  const onMove = (e: React.PointerEvent) => {
    if (!cfg.dockMagnify) return;
    const dock = dockRef.current;
    if (!dock) return;
    dock.querySelectorAll<HTMLElement>("[data-dock-item]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const dist = Math.abs(e.clientX - (r.left + r.width / 2));
      const scale = 1 + (MAX_SCALE - 1) * Math.max(0, 1 - (dist / FALLOFF) ** 2);
      el.style.width = `${base * scale}px`;
      el.style.height = `${base * scale}px`;
    });
  };

  const reset = () => {
    dockRef.current?.querySelectorAll<HTMLElement>("[data-dock-item]").forEach((el) => {
      el.style.width = `${base}px`;
      el.style.height = `${base}px`;
    });
  };

  const launch = (id: string) => {
    const running = useWindows.getState().ofApp(id).length > 0;
    if (!running) {
      setBouncing(id);
      setTimeout(() => setBouncing(null), 950);
    }
    openApp(id);
  };

  const dockMenu = (id: string): MenuItem[] => [
    ...(runningApps.has(id)
      ? [
          {
            label: "Mostrar",
            action: () => openApp(id),
          },
          {
            label: "Ocultar",
            action: () =>
              useWindows.getState().ofApp(id).forEach((w) => useWindows.getState().minimize(w.id)),
          },
          {
            label: `Encerrar ${getApp(id)?.name ?? ""}`,
            action: () => useWindows.getState().closeAllOfApp(id),
          },
        ]
      : [{ label: "Abrir", action: () => launch(id) }]),
  ];

  /* Auto-ocultar: mostra ao encostar o mouse na base da tela */
  useEffect(() => {
    if (!cfg.dockAutohide) {
      setHidden(false);
      return;
    }
    setHidden(true);
    setPeek(false);
    const onMove = (e: PointerEvent) => {
      const near = e.clientY >= window.innerHeight - 6;
      setPeek(near);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [cfg.dockAutohide]);

  const visible = !hidden || peek;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[4000] flex justify-center">
      <div
        ref={dockRef}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onContextMenu={(e) => {
          e.preventDefault();
          showCtx(e.clientX, e.clientY, [{ label: "Abrir Ajustes do Dock", action: () => openApp("settings") }]);
        }}
        className={`pointer-events-auto m-2 flex items-end gap-1.5 rounded-[22px] border border-white/30 bg-white/40 px-2.5 pb-2 pt-2 transition-transform duration-300 dark:border-white/10 dark:bg-black/35 ${
          visible ? "translate-y-0" : "translate-y-[calc(100%+12px)]"
        }`}
        style={{
          // Liquid Glass: mais transparente, flutuando sobre o wallpaper
          backdropFilter: "blur(30px) saturate(1.8)",
          WebkitBackdropFilter: "blur(30px) saturate(1.8)",
          boxShadow: "0 18px 50px rgb(0 0 0 / 0.28), inset 0 1px 0 rgb(255 255 255 / 0.28)",
        }}
      >
        {dockApps.map((app, i) => {
          const Icon = app.icon;
          const running = runningApps.has(app.id);
          return (
            <button
              key={app.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              data-dock-item
              onClick={() => launch(app.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                showCtx(e.clientX, e.clientY, dockMenu(app.id));
              }}
              className={`group relative flex flex-col items-center ${bouncing === app.id ? "dock-bounce" : ""}`}
              style={{ width: base, height: base, transition: "width 90ms ease-out, height 90ms ease-out" }}
              title={app.name}
            >
              <span className="absolute -top-8 hidden rounded-md bg-black/75 px-2 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">
                {app.name}
              </span>
              <span className="flex h-[calc(100%-5px)] w-full items-center justify-center">
                <Icon />
              </span>
              {running && <span className="h-1 w-1 shrink-0 rounded-full bg-black/55 dark:bg-white/60" />}
            </button>
          );
        })}

        {/* Launchpad — abre a grade de apps (overlay) */}
        <button
          data-dock-item
          onClick={() => setLaunchpad(true)}
          className="group relative flex flex-col items-center"
          style={{ width: base, height: base, transition: "width 90ms ease-out, height 90ms ease-out" }}
          title="Launchpad"
        >
          <span className="absolute -top-8 hidden rounded-md bg-black/75 px-2 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">
            Launchpad
          </span>
          <LaunchpadIcon />
        </button>

        {/* divisor + Lixeira */}
        <div className="mx-1 h-10 w-px self-center bg-black/20 dark:bg-white/20" />
        <button
          onClick={() => launch("trash")}
          data-dock-item
          className="group relative flex flex-col items-center"
          style={{ width: base, height: base, transition: "width 90ms ease-out, height 90ms ease-out" }}
          title="Lixeira"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
