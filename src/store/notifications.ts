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

/* ------------------------------------------------------------------ */
/* Progresso de download (atualização do app / downloads grandes).     */
/* Dirige a barra com "%" que aparece como banner persistente.         */
/* ------------------------------------------------------------------ */

export interface DownloadProgress {
  active: boolean;
  label: string;
  downloaded: number; // bytes
  total: number; // bytes (0 = indeterminado)
}

interface ProgressState extends DownloadProgress {
  start: (label: string) => void;
  update: (downloaded: number, total: number) => void;
  finish: () => void;
}

export const useDownloadProgress = create<ProgressState>((set) => ({
  active: false,
  label: "",
  downloaded: 0,
  total: 0,
  start: (label) => set({ active: true, label, downloaded: 0, total: 0 }),
  update: (downloaded, total) => set({ downloaded, total }),
  finish: () => set({ active: false, downloaded: 0, total: 0 }),
}));
