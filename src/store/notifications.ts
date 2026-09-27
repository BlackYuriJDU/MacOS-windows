import { create } from "zustand";

export interface Notification {
  id: number;
  appId: string;
  appName: string;
  title: string;
  body: string;
  time: number;
}

interface NotifState {
  items: Notification[];
  centerOpen: boolean;
  push: (n: Omit<Notification, "id" | "time">) => void;
  dismiss: (id: number) => void;
  clearAll: () => void;
  setCenterOpen: (v: boolean) => void;
}

let nextId = 1;
const MAX = 50;

export const useNotifications = create<NotifState>((set) => ({
  items: [],
  centerOpen: false,
  push: (n) =>
    set((s) => ({
      items: [{ ...n, id: nextId++, time: Date.now() }, ...s.items].slice(0, MAX),
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clearAll: () => set({ items: [] }),
  setCenterOpen: (centerOpen) => set({ centerOpen }),
}));

/** Atalho para qualquer módulo emitir uma notificação. */
export function notify(appId: string, appName: string, title: string, body: string) {
  useNotifications.getState().push({ appId, appName, title, body });
}
