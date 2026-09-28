import type { FC } from "react";
import type { AppMenu, MenuItem } from "../lib/types";
import { useWindows } from "../store/windows";
import { useSession } from "../store/session";
import { useOverlays } from "../store/ui";
import { FinderIcon, NotesIcon, CalcIcon, SettingsIcon, TerminalIcon, AboutIcon, SafariIcon, TrashIcon, AppStoreIcon, MinesIcon, SnakeIcon, GamesIcon } from "../components/icons";
import Finder from "./finder/Finder";
import Notes from "./notes/Notes";
import Calculator from "./calculator/Calculator";
import Settings from "./settings/Settings";
import Terminal from "./terminal/Terminal";
import About from "./about/About";
import Safari from "./safari/Safari";
import Trash from "./trash/Trash";
import AppStore from "./appstore/AppStore";
import Games from "./games/Games";
import Minesweeper from "./games/Minesweeper";
import Snake from "./games/Snake";

export interface AppProps {
  winId: string;
  focused: boolean;
  props?: Record<string, unknown>;
}

export interface AppDef {
  id: string;
  name: string;
  icon: FC<{ className?: string }>;
  component: FC<AppProps>;
  defaultSize: { w: number; h: number };
  inDock: boolean;
}

export const APPS: AppDef[] = [
  { id: "finder", name: "Finder", icon: FinderIcon, component: Finder, defaultSize: { w: 860, h: 540 }, inDock: true },
  { id: "appstore", name: "App Store", icon: AppStoreIcon, component: AppStore, defaultSize: { w: 920, h: 600 }, inDock: true },
  { id: "safari", name: "Safari", icon: SafariIcon, component: Safari, defaultSize: { w: 900, h: 600 }, inDock: true },
  { id: "notes", name: "Notas", icon: NotesIcon, component: Notes, defaultSize: { w: 660, h: 460 }, inDock: true },
  { id: "calculator", name: "Calculadora", icon: CalcIcon, component: Calculator, defaultSize: { w: 260, h: 380 }, inDock: true },
  { id: "terminal", name: "Terminal", icon: TerminalIcon, component: Terminal, defaultSize: { w: 620, h: 420 }, inDock: true },
  { id: "games", name: "Jogos", icon: GamesIcon, component: Games, defaultSize: { w: 480, h: 420 }, inDock: true },
  { id: "minesweeper", name: "Campo Minado", icon: MinesIcon, component: Minesweeper, defaultSize: { w: 380, h: 520 }, inDock: false },
  { id: "snake", name: "Cobrinha", icon: SnakeIcon, component: Snake, defaultSize: { w: 420, h: 520 }, inDock: false },
  { id: "settings", name: "Ajustes do Sistema", icon: SettingsIcon, component: Settings, defaultSize: { w: 740, h: 500 }, inDock: true },
  { id: "about", name: "Sobre", icon: AboutIcon, component: About, defaultSize: { w: 480, h: 560 }, inDock: false },
  { id: "trash", name: "Lixeira", icon: TrashIcon, component: Trash, defaultSize: { w: 560, h: 380 }, inDock: false },
];

const APP_MAP: Record<string, AppDef> = Object.fromEntries(APPS.map((a) => [a.id, a]));

export function getApp(id: string): AppDef | undefined {
  return APP_MAP[id];
}

/** Abre um app estilo macOS: se já está rodando, foca a última janela; senão abre nova. */
export function openApp(id: string, opts?: { forceNew?: boolean; props?: Record<string, unknown> }) {
  const def = APP_MAP[id];
  if (!def) return;
  const ws = useWindows.getState();
  const existing = ws.ofApp(id);
  if (existing.length && !opts?.forceNew) {
    // foca a janela mais recente (comportamento do Dock: ativa a frontal ou a última minimizada)
    const target = existing[existing.length - 1];
    ws.focus(target.id);
    return;
  }
  ws.open(id, def.name, def.defaultSize, opts?.props);
}

function disabledEditItems(): MenuItem[] {
  return [
    { label: "Desfazer", shortcut: "⌘Z", disabled: true },
    { label: "Cortar", shortcut: "⌘X", disabled: true },
    { label: "Copiar", shortcut: "⌘C", disabled: true },
    { label: "Colar", shortcut: "⌘V", disabled: true },
    { label: "Selecionar Tudo", shortcut: "⌘A", disabled: true },
  ];
}

/** Menus padrão de app (File/Edit/Window/Help) — ordem oficial da HIG. */
export function buildMenus(appId: string): AppMenu[] {
  const def = APP_MAP[appId] ?? APP_MAP.finder;
  const ws = useWindows.getState();
  const wins = ws.ofApp(appId);
  const focused = ws.focused();
  const win = focused && focused.appId === appId ? focused : wins[wins.length - 1];

  return [
    {
      title: def.name,
      items: [
        { label: `Sobre ${def.name}`, action: () => openApp("about") },
        { separator: true },
        { label: "Ajustes…", shortcut: "⌘,", action: () => openApp("settings") },
        { separator: true },
        {
          label: `Ocultar ${def.name}`,
          action: () => wins.forEach((w) => useWindows.getState().minimize(w.id)),
        },
        {
          label: `Encerrar ${def.name}`,
          shortcut: "⌘Q",
          action: () => useWindows.getState().closeAllOfApp(appId),
        },
      ],
    },
    {
      title: "Arquivo",
      items:
        appId === "finder"
          ? [
              { label: "Nova Janela do Finder", shortcut: "⌘N", action: () => openApp("finder", { forceNew: true }) },
              { label: "Fechar Janela", shortcut: "⌘W", disabled: !win, action: () => win && ws.close(win.id) },
            ]
          : [
              { label: "Nova Janela", shortcut: "⌘N", action: () => openApp(appId, { forceNew: true }) },
              { label: "Fechar Janela", shortcut: "⌘W", disabled: !win, action: () => win && ws.close(win.id) },
            ],
    },
    { title: "Edição", items: disabledEditItems() },
    {
      title: "Janela",
      items: [
        { label: "Minimizar", shortcut: "⌘M", disabled: !win, action: () => win && ws.minimize(win.id) },
        { label: "Zoom", disabled: !win, action: () => win && ws.toggleMaximize(win.id) },
        {
          label: "Trazer Tudo para a Frente",
          action: () => wins.forEach((w) => useWindows.getState().focus(w.id)),
        },
      ],
    },
    {
      title: "Ajuda",
      items: [
        { label: `Ajuda do ${def.name}`, disabled: true },
        { label: "Sobre o ambiente", action: () => openApp("about") },
      ],
    },
  ];
}

/** Menus do Finder quando nenhuma janela está focada (comportamento oficial do macOS). */
export function finderIdleMenus(): AppMenu[] {
  return buildMenus("finder");
}

/** Conveniência para outros módulos abrirem o Spotlight/overlay sem import circular. */
export function toggleSpotlight() {
  useOverlays.getState().setSpotlight(!useOverlays.getState().spotlight);
}

export function isSessionFocused() {
  return useSession.getState().focusActive;
}
