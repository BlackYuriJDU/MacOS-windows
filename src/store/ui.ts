import { create } from "zustand";
import type { MenuItem } from "../lib/types";

interface CtxState {
  open: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  show: (x: number, y: number, items: MenuItem[]) => void;
  hide: () => void;
}

export const useContextMenu = create<CtxState>((set) => ({
  open: false,
  x: 0,
  y: 0,
  items: [],
  show: (x, y, items) => set({ open: true, x, y, items }),
  hide: () => set({ open: false }),
}));

interface OverlayState {
  spotlight: boolean;
  launchpad: boolean;
  controlCenter: boolean;
  setSpotlight: (v: boolean) => void;
  setLaunchpad: (v: boolean) => void;
  setControlCenter: (v: boolean) => void;
  closeAll: () => void;
}

export const useOverlays = create<OverlayState>((set) => ({
  spotlight: false,
  launchpad: false,
  controlCenter: false,
  setSpotlight: (spotlight) => set({ spotlight, launchpad: false, controlCenter: false }),
  setLaunchpad: (launchpad) => set({ launchpad, spotlight: false, controlCenter: false }),
  setControlCenter: (controlCenter) => set({ controlCenter, spotlight: false, launchpad: false }),
  closeAll: () => set({ spotlight: false, launchpad: false, controlCenter: false }),
}));
