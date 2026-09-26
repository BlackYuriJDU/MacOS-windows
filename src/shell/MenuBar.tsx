import { useEffect, useRef, useState } from "react";
import { useSession } from "../store/session";
import { useSystem } from "../store/system";
import { useOverlays } from "../store/ui";
import { useWindows, MENUBAR_H } from "../store/windows";
import { sessionFlow } from "../lib/session-flow";
import { buildMenus, openApp } from "../apps/registry";
import { formatMenubar, useClock } from "../hooks/useClock";
import type { AppMenu, MenuItem } from "../lib/types";
import { Logo } from "../components/Logo";
import { Magnifier, WifiIcon, BatteryIcon, ControlCenterGlyph } from "../components/icons";

type Dropdown = { kind: "apple" | "app"; index: number } | null;

export default function MenuBar() {
  const now = useClock();
  const system = useSystem();
  const setSpotlight = useOverlays((s) => s.setSpotlight);
  const setControlCenter = useOverlays((s) => s.setControlCenter);
  const controlCenterOpen = useOverlays((s) => s.controlCenter);
  const focusActive = useSession((s) => s.focusActive);
  const setLocked = useSession((s) => s.setLocked);
  const activeAppId = useWindows((s) => s.focused()?.appId) ?? "finder";
  const [drop, setDrop] = useState<Dropdown>(null);
  const [calOpen, setCalOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const appMenus: AppMenu[] = buildMenus(activeAppId);

  /* Fecha dropdown com clique fora */
  useEffect(() => {
    if (!drop && !calOpen) return;
    const close = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setDrop(null);
        setCalOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [drop, calOpen]);

  const run = (item: MenuItem) => {
    setDrop(null);
    item.action?.();
  };

  const appleMenu: MenuItem[] = [
    { label: "Sobre Este Mac", action: () => openApp("about") },
    { separator: true },
    { label: "Ajustes do Sistema…", shortcut: "⌘,", action: () => openApp("settings") },
    { separator: true },
    { label: "Bloquear Tela", action: () => setLocked(true) },
    ...(focusActive
      ? [{ label: "Sair do Modo Foco", action: () => sessionFlow.leaveFocus() } as MenuItem]
      : []),
    { separator: true },
    { label: "Reiniciar…", action: () => sessionFlow.restart() },
    { label: "Desligar…", action: () => sessionFlow.shutdown() },
  ];

  const hover = (d: Dropdown) => {
    if (drop) setDrop(d);
  };

  return (
    <div
      ref={barRef}
      className="glass fixed inset-x-0 top-0 z-[5000] flex items-stretch text-[13px] text-black dark:text-white"
      style={{ height: MENUBAR_H }}
    >
      {/* Menu  (logo) */}
      <div className="relative flex">
        <button
          onPointerDown={() => setDrop(drop?.kind === "apple" ? null : { kind: "apple", index: -1 })}
          onPointerEnter={() => hover({ kind: "apple", index: -1 })}
          className={`flex w-9 items-center justify-center ${drop?.kind === "apple" ? "bg-black/10 dark:bg-white/15" : ""}`}
          title="Menu do sistema"
        >
          <Logo size={17} />
        </button>
        {drop?.kind === "apple" && (
          <Dropdown items={appleMenu} onRun={run} onClose={() => setDrop(null)} />
        )}
      </div>

      {/* Menus do app ativo */}
      <div className="relative flex">
        <button
          onPointerDown={() => setDrop(drop?.kind === "app" && drop.index === -1 ? null : { kind: "app", index: -1 })}
          onPointerEnter={() => hover({ kind: "app", index: -1 })}
          className={`px-2.5 font-semibold ${drop?.kind === "app" && drop.index === -1 ? "bg-black/10 dark:bg-white/15" : ""}`}
        >
          {appMenus[0].title}
        </button>
        {drop?.kind === "app" && drop.index === -1 && (
          <Dropdown items={appMenus[0].items} onRun={run} onClose={() => setDrop(null)} />
        )}
      </div>

      {appMenus.slice(1).map((m, i) => (
        <div key={m.title} className="relative flex">
          <button
            onPointerDown={() => setDrop(drop?.kind === "app" && drop.index === i ? null : { kind: "app", index: i })}
            onPointerEnter={() => hover({ kind: "app", index: i })}
            className={`px-2.5 ${drop?.kind === "app" && drop.index === i ? "bg-black/10 dark:bg-white/15" : ""}`}
          >
            {m.title}
          </button>
          {drop?.kind === "app" && drop.index === i && (
            <Dropdown items={m.items} onRun={run} onClose={() => setDrop(null)} />
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* Lado direito: status + Control Center + Spotlight + relógio */}
      <div className="flex items-center gap-1 pr-2">
        {system.battery && (
          <span className="flex items-center gap-1 px-1" title={system.battery.plugged ? "Carregando" : "Bateria"}>
            <BatteryIcon className="h-3.5 w-7" />
            <span className="text-[12px] tabular-nums">{system.battery.percent}%</span>
          </span>
        )}
        <button
          className="px-1.5 py-1 hover:bg-black/10 dark:hover:bg-white/15"
          title={system.wifi ? `Wi-Fi: ${system.wifi}` : "Wi-Fi"}
        >
          <WifiIcon className="h-4 w-4" />
        </button>
        <button
          onPointerDown={() => setControlCenter(!controlCenterOpen)}
          className={`rounded px-1.5 py-1 ${controlCenterOpen ? "bg-black/10 dark:bg-white/15" : "hover:bg-black/10 dark:hover:bg-white/15"}`}
          title="Central de Controle"
        >
          <ControlCenterGlyph className="h-4 w-4" />
        </button>
        <button
          onPointerDown={() => setSpotlight(true)}
          className="rounded px-1.5 py-1 hover:bg-black/10 dark:hover:bg-white/15"
          title="Busca (Ctrl+Espaço)"
        >
          <Magnifier className="h-4 w-4" />
        </button>
        <button
          onPointerDown={() => setCalOpen(!calOpen)}
          className={`rounded px-2 py-1 tabular-nums hover:bg-black/10 dark:hover:bg-white/15 ${calOpen ? "bg-black/10 dark:bg-white/15" : ""}`}
        >
          {formatMenubar(now)}
        </button>
      </div>

      {calOpen && <Calendar now={now} />}
    </div>
  );
}

function Dropdown({
  items,
  onRun,
  onClose,
}: {
  items: MenuItem[];
  onRun: (i: MenuItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="glass-strong absolute left-0 top-full z-[5100] min-w-52 rounded-xl border border-black/10 p-1.5 text-[13px] text-black shadow-2xl dark:border-white/10 dark:text-white">
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="mx-2 my-1 border-t border-black/10 dark:border-white/10" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => onRun(item)}
            className={`flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-1 text-left ${
              item.disabled
                ? "opacity-35"
                : "hover:bg-accent hover:text-white"
            }`}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-[12px] opacity-50">{item.shortcut}</span>}
          </button>
        )
      )}
      <div className="hidden" onClick={onClose} />
    </div>
  );
}

function Calendar({ now }: { now: Date }) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="glass-strong absolute right-2 top-full z-[5100] w-64 rounded-2xl border border-black/10 p-3 text-black shadow-2xl dark:border-white/10 dark:text-white">
      <p className="mb-1 text-center text-[13px] font-semibold">
        {MONTHS[m]} de {y}
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {DOW.map((d, i) => (
          <span key={i} className="opacity-40">
            {d}
          </span>
        ))}
        {Array.from({ length: first }).map((_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const today = day === now.getDate();
          return (
            <span
              key={day}
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                today ? "bg-red-500 font-semibold text-white" : ""
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
