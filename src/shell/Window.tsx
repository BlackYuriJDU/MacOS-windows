import { useEffect, useRef, useState } from "react";
import { motion, type TargetAndTransition } from "framer-motion";
import type { WinState } from "../store/windows";
import { useWindows, MENUBAR_H } from "../store/windows";
import { getApp } from "../apps/registry";
import { DOCK_RESERVED } from "./Dock";

const MIN_W = 320;
const MIN_H = 200;

/** Curva de easing do macOS (suave, sem overshoot). */
const MAC_EASE = [0.32, 0.72, 0, 1] as const;

/** Distância (px) que a janela desce em direção ao Dock ao minimizar. */
const minimizeTravel = () =>
  typeof window === "undefined" ? 400 : Math.max(220, window.innerHeight * 0.45);

const CURSORS: Record<string, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
};

export default function Window({ win, focused, z }: { win: WinState; focused: boolean; z: number }) {
  const app = getApp(win.appId);
  const setBounds = useWindows((s) => s.setBounds);
  const focusWin = useWindows((s) => s.focus);
  const closeWin = useWindows((s) => s.close);
  const minimizeWin = useWindows((s) => s.minimize);
  const toggleMax = useWindows((s) => s.toggleMaximize);
  const dragMeta = useRef<{ sx: number; sy: number; x: number; y: number } | null>(null);
  const [interacting, setInteracting] = useState(false);

  // Segurança: se o ponteiro for solto fora da janela, reativa a transição.
  useEffect(() => {
    if (!interacting) return;
    const up = () => setInteracting(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [interacting]);

  if (!app) return null;

  /* ------- posição/tamanho (maximizada cobre da barra de menus até acima do Dock) ------- */
  const bounds = win.maximized
    ? { x: 8, y: MENUBAR_H + 6, w: window.innerWidth - 16, h: window.innerHeight - MENUBAR_H - DOCK_RESERVED - 16 }
    : { x: win.x, y: win.y, w: win.w, h: win.h };

  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || win.maximized) return;
    focusWin(win.id);
    setInteracting(true);
    dragMeta.current = { sx: e.clientX, sy: e.clientY, x: bounds.x, y: bounds.y };
    const move = (ev: PointerEvent) => {
      const d = dragMeta.current;
      if (!d) return;
      setBounds(win.id, {
        x: d.x + ev.clientX - d.sx,
        y: Math.max(MENUBAR_H + 2, d.y + ev.clientY - d.sy),
      });
    };
    const up = () => {
      dragMeta.current = null;
      setInteracting(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (dir: string) => (e: React.PointerEvent) => {
    if (e.button !== 0 || win.maximized) return;
    e.stopPropagation();
    focusWin(win.id);
    setInteracting(true);
    const start = { mx: e.clientX, my: e.clientY, ...bounds };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.mx;
      const dy = ev.clientY - start.my;
      const b = { ...start };
      if (dir.includes("e")) b.w = Math.max(MIN_W, start.w + dx);
      if (dir.includes("s")) b.h = Math.max(MIN_H, start.h + dy);
      if (dir.includes("w")) {
        const w = Math.max(MIN_W, start.w - dx);
        b.x = start.x + (start.w - w);
        b.w = w;
      }
      if (dir.includes("n")) {
        const h = Math.max(MIN_H, start.h - dy);
        b.y = Math.max(MENUBAR_H + 2, start.y + (start.h - h));
        b.h = h;
      }
      setBounds(win.id, b);
    };
    const up = () => {
      setInteracting(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const AppBody = app.component;

  /* Estado animado atual: minimizado encolhe e desce em direção ao Dock
     (aproximação do "Scale effect" do macOS — o Genie real é um mesh warp
     que não reproduzimos); normal fica em escala/posição plenas. */
  const animState: TargetAndTransition = win.minimized
    ? {
        opacity: 0,
        scale: 0.35,
        y: minimizeTravel(),
        transition: { duration: 0.4, ease: MAC_EASE },
      }
    : {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.35, ease: MAC_EASE },
      };

  return (
    <motion.div
      /* Abrir: nasce crescendo suavemente (scale 0.7→1 + fade + leve subida) */
      initial={{ opacity: 0, scale: 0.7, y: 24 }}
      animate={animState}
      /* Fechar: encolhe e some, rápido (~0.15s) */
      exit={{
        opacity: 0,
        scale: 0.85,
        y: 8,
        transition: { duration: 0.15, ease: "easeIn" },
      }}
      className={`absolute flex flex-col overflow-hidden bg-white dark:bg-[#232326] ${
        focused ? "win-shadow-focus" : "win-shadow-blur"
      }`}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        zIndex: z,
        borderRadius: 24, // Liquid Glass (Tahoe): raio de janela 24px
        pointerEvents: win.minimized ? "none" : "auto",
        // Maximizar/restaurar: transição suave de tamanho/posição via CSS
        // (barato; transform/opacity continuam no framer-motion via GPU).
        // Desativada durante drag/resize para a janela não "atrásar" o mouse.
        transition: interacting
          ? "none"
          : "left 0.25s cubic-bezier(0.32, 0.72, 0, 1), top 0.25s cubic-bezier(0.32, 0.72, 0, 1), width 0.25s cubic-bezier(0.32, 0.72, 0, 1), height 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      onPointerDown={() => !focused && focusWin(win.id)}
    >
      {/* Barra de título + semáforos (à esquerda, como no macOS) */}
      <div
        className="relative flex h-9 shrink-0 items-center gap-2 border-b border-black/10 bg-black/[0.04] px-3 dark:border-white/10 dark:bg-white/[0.05]"
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleMax(win.id)}
      >
        <div className="group flex items-center gap-2">
          <TrafficLight
            color={focused ? "#ff5f57" : undefined}
            title="Fechar"
            onClick={() => closeWin(win.id)}
          >
            <path d="M4 4l6 6M10 4l-6 6" />
          </TrafficLight>
          <TrafficLight
            color={focused ? "#febc2e" : undefined}
            title="Minimizar"
            onClick={() => minimizeWin(win.id)}
          >
            <path d="M3.5 7h7" />
          </TrafficLight>
          <TrafficLight
            color={focused ? "#28c840" : undefined}
            title="Zoom"
            onClick={() => toggleMax(win.id)}
          >
            <path d="M4.2 4.2l5.6 5.6M9.8 4.2L4.2 9.8" />
          </TrafficLight>
        </div>
        <p className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold opacity-80">
          {win.title}
        </p>
      </div>

      {/* Conteúdo do app */}
      <div className="relative min-h-0 flex-1">
        <AppBody winId={win.id} focused={focused} props={win.props} />
      </div>

      {/* Alças de redimensionamento (8 direções) */}
      {!win.maximized &&
        (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const).map((dir) => (
          <div
            key={dir}
            onPointerDown={startResize(dir)}
            className="absolute"
            style={{
              cursor: CURSORS[dir],
              ...(dir === "n" && { top: -3, left: 8, right: 8, height: 7 }),
              ...(dir === "s" && { bottom: -3, left: 8, right: 8, height: 7 }),
              ...(dir === "e" && { right: -3, top: 8, bottom: 8, width: 7 }),
              ...(dir === "w" && { left: -3, top: 8, bottom: 8, width: 7 }),
              ...(dir === "ne" && { top: -4, right: -4, width: 14, height: 14 }),
              ...(dir === "nw" && { top: -4, left: -4, width: 14, height: 14 }),
              ...(dir === "se" && { bottom: -4, right: -4, width: 14, height: 14 }),
              ...(dir === "sw" && { bottom: -4, left: -4, width: 14, height: 14 }),
            }}
          />
        ))}
    </motion.div>
  );
}

/** Semáforo: colorido quando a janela é a key window, cinza quando inativa (spec da HIG). */
function TrafficLight({
  color,
  title,
  onClick,
  children,
}: {
  color?: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const gray = "#cdcdce";
  return (
    <button
      title={title}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="flex h-3 w-3 items-center justify-center rounded-full ring-1 ring-black/15"
      style={{ background: color ?? gray }}
    >
      <svg
        viewBox="0 0 14 14"
        className="h-[9px] w-[9px] opacity-0 transition-opacity group-hover:opacity-70"
        stroke="black"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      >
        {children}
      </svg>
    </button>
  );
}
