import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "auto";
export type Accent = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "grey";

interface SettingsState {
  theme: Theme;
  wallpaper: string;
  accent: Accent;
  dockSize: number; // px da base do ícone
  dockMagnify: boolean;
  dockAutohide: boolean;
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      wallpaper: "wp-0",
      accent: "blue",
      dockSize: 52,
      dockMagnify: true,
      dockAutohide: false,
      set: (patch) => set(patch),
    }),
    { name: "macos-windows-settings" }
  )
);
