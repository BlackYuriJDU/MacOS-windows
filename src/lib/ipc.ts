import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type {
  BatteryInfo,
  FocusMode,
  FocusState,
  FsEntry,
  MachineInfo,
  ProcInfo,
} from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/* ---------- mocks (desenvolvimento no navegador, sem Tauri) ---------- */

const MOCK_HOME = "C:\\Users\\Arthur Araújo";

const mockEntries = (path: string): FsEntry[] => [
  { name: "Desktop", path: `${path}\\Desktop`, is_dir: true, size: 0, modified: Date.now() / 1000 },
  { name: "Documentos", path: `${path}\\Documents`, is_dir: true, size: 0, modified: Date.now() / 1000 },
  { name: "Downloads", path: `${path}\\Downloads`, is_dir: true, size: 0, modified: Date.now() / 1000 },
  { name: "projeto-mac-os.md", path: `${path}\\projeto-mac-os.md`, is_dir: false, size: 4821, modified: Date.now() / 1000 },
  { name: "wallpaper.png", path: `${path}\\wallpaper.png`, is_dir: false, size: 812334, modified: Date.now() / 1000 },
];

/* ---------------------------------------------------------------------- */

export const ipc = {
  isTauri,

  homeDir: (): Promise<string> =>
    isTauri ? invoke<string>("home_dir") : Promise.resolve(MOCK_HOME),

  fsList: (path: string): Promise<FsEntry[]> =>
    isTauri ? invoke<FsEntry[]>("fs_list", { path }) : Promise.resolve(mockEntries(path)),

  fsReadText: (path: string): Promise<string> =>
    isTauri
      ? invoke<string>("fs_read_text", { path })
      : Promise.resolve("Arquivo de exemplo — conteúdo em modo navegador."),

  fsSearch: (query: string): Promise<FsEntry[]> =>
    isTauri
      ? invoke<FsEntry[]>("fs_search", { query })
      : Promise.resolve(mockEntries(MOCK_HOME).filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))),

  /** URL de asset para <img> (Quick Look). Fora do Tauri devolve o caminho cru. */
  fsAsset: (path: string): string => (isTauri ? convertFileSrc(path) : path),

  machineInfo: (): Promise<MachineInfo> =>
    isTauri
      ? invoke<MachineInfo>("machine_info")
      : Promise.resolve({
          os_name: "Windows 11 Home Single Language",
          os_version: "26200 (navegador)",
          kernel_version: "—",
          hostname: "GALAXY-BOOK-GO",
          arch: "arm64 (mock)",
          cpu: "Snapdragon 7c Gen 2",
          cores: 8,
          memory_gb: 3.8,
          storage_gb: 111.7,
        }),

  battery: (): Promise<BatteryInfo | null> =>
    isTauri
      ? invoke<BatteryInfo | null>("battery_status")
      : Promise.resolve({ percent: 87, plugged: false }),

  wifi: (): Promise<string | null> =>
    isTauri ? invoke<string | null>("wifi_ssid") : Promise.resolve("MinhaRede_2.4G"),

  focusCandidates: (): Promise<ProcInfo[]> =>
    isTauri
      ? invoke<ProcInfo[]>("focus_candidates")
      : Promise.resolve([
          { pid: 101, name: "chrome.exe" },
          { pid: 102, name: "discord.exe" },
          { pid: 103, name: "spotify.exe" },
        ]),

  focusEnter: (mode: FocusMode): Promise<FocusState> =>
    isTauri
      ? invoke<FocusState>("focus_enter", { mode })
      : Promise.resolve({ mode, pids: [{ pid: 101, name: "chrome.exe" }], started_at: Date.now() / 1000 }),

  focusExit: (): Promise<number> =>
    isTauri ? invoke<number>("focus_exit") : Promise.resolve(1),

  focusState: (): Promise<FocusState | null> =>
    isTauri ? invoke<FocusState | null>("focus_state") : Promise.resolve(null),

  restartApp: (): Promise<void> =>
    isTauri ? invoke<void>("restart_app") : Promise.resolve(),
};
