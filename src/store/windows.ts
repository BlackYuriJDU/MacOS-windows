import { create } from "zustand";

export interface WinState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  props?: Record<string, unknown>;
}

export const MENUBAR_H = 30;

interface WindowsStore {
  windows: WinState[]; // ordem do array = ordem-z (último = topo)
  open: (
    appId: string,
    title: string,
    size: { w: number; h: number },
    props?: Record<string, unknown>
  ) => string;
  close: (id: string) => void;
  closeAllOfApp: (appId: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setBounds: (id: string, b: Partial<Pick<WinState, "x" | "y" | "w" | "h">>) => void;
  setTitle: (id: string, title: string) => void;
  focused: () => WinState | undefined;
  focusedApp: () => string | undefined;
  ofApp: (appId: string) => WinState[];
}

let seq = 0;

export const useWindows = create<WindowsStore>((set, get) => ({
  windows: [],

  open: (appId, title, size, props) => {
    const ws = get().windows;
    const existing = ws.filter((w) => w.appId === appId);
    // cascata simples para não empilhar tudo no mesmo lugar
    const n = ws.length;
    const w = {
      id: `w${++seq}`,
      appId,
      title,
      x: Math.max(16, 140 + (n % 7) * 34),
      y: Math.max(MENUBAR_H + 12, 60 + (n % 7) * 28),
      w: size.w,
      h: size.h,
      minimized: false,
      maximized: false,
      props,
      // reaproveita a posição da última janela do mesmo app (comportamento macOS)
      ...(existing.length
        ? { x: Math.max(16, existing[existing.length - 1].x + 36), y: Math.max(MENUBAR_H + 12, existing[existing.length - 1].y + 30) }
        : {}),
    };
    set({ windows: [...ws, w] });
    return w.id;
  },

  close: (id) => set({ windows: get().windows.filter((w) => w.id !== id) }),
  closeAllOfApp: (appId) => set({ windows: get().windows.filter((w) => w.appId !== appId) }),

  focus: (id) => {
    const ws = get().windows;
    const w = ws.find((x) => x.id === id);
    if (!w) return;
    set({ windows: [...ws.filter((x) => x.id !== id), { ...w, minimized: false }] });
  },

  minimize: (id) =>
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) }),

  restore: (id) => {
    get().focus(id);
  },

  toggleMaximize: (id) =>
    set({
      windows: get().windows.map((w) =>
        w.id === id
          ? w.maximized
            ? { ...w, maximized: false }
            : { ...w, maximized: true, minimized: false }
          : w
      ),
    }),

  setBounds: (id, b) =>
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, ...b } : w)) }),

  setTitle: (id, title) =>
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, title } : w)) }),

  focused: () => {
    const ws = get().windows;
    for (let i = ws.length - 1; i >= 0; i--) {
      if (!ws[i].minimized) return ws[i];
    }
    return undefined;
  },

  focusedApp: () => get().focused()?.appId,

  ofApp: (appId) => get().windows.filter((w) => w.appId === appId),
}));
