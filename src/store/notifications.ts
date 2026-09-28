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
  push: (n: Omit<Notification, "id" | "time">) => void;
  dismiss: (id: number) => void;
  clear: () => void;
}

let seq = 1;
const MAX = 50;

export const useNotifications = create<NotifState>((set) => ({
  items: [],
  push: (n) =>
    set((s) => ({
      items: [{ ...n, id: seq++, time: Date.now() }, ...s.items].slice(0, MAX),
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  clear: () => set({ items: [] }),
}));

/** Atalho global para emitir notificação de qualquer lugar. */
export function notify(appId: string, appName: string, title: string, body: string) {
  useNotifications.getState().push({ appId, appName, title, body });
}
