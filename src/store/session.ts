import { create } from "zustand";
import type { FocusMode } from "../lib/types";

export type Phase = "boot" | "confirm" | "desktop";

interface SessionState {
  phase: Phase;
  focusActive: boolean;
  focusMode: FocusMode;
  frozenCount: number;
  locked: boolean;
  setPhase: (p: Phase) => void;
  setFocusActive: (v: boolean, count?: number) => void;
  setFocusMode: (m: FocusMode) => void;
  setLocked: (v: boolean) => void;
}

export const useSession = create<SessionState>((set) => ({
  phase: "boot",
  focusActive: false,
  focusMode: "suspend",
  frozenCount: 0,
  locked: false,
  setPhase: (phase) => set({ phase }),
  setFocusActive: (focusActive, frozenCount) => set({ focusActive, frozenCount: frozenCount ?? 0 }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setLocked: (locked) => set({ locked }),
}));
