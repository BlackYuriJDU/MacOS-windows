import { create } from "zustand";
import { ipc } from "../lib/ipc";
import type { BatteryInfo } from "../lib/types";

interface SystemStore {
  battery: BatteryInfo | null;
  wifi: string | null;
  refresh: () => Promise<void>;
}

export const useSystem = create<SystemStore>((set) => ({
  battery: null,
  wifi: null,
  refresh: async () => {
    const [battery, wifi] = await Promise.all([ipc.battery().catch(() => null), ipc.wifi().catch(() => null)]);
    set({ battery, wifi });
  },
}));
