import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type {
  BatteryInfo,
  FocusMode,
  FocusState,
  FsEntry,
  InstalledApp,
  MachineInfo,
  ProcInfo,
  StorePackage,
  TrashEntry,
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

  focusEnter: (mode: FocusMode, pids?: number[]): Promise<FocusState> =>
    isTauri
      ? invoke<FocusState>("focus_enter", { mode, pids: pids ?? null })
      : Promise.resolve({ mode, pids: [{ pid: 101, name: "chrome.exe" }], started_at: Date.now() / 1000 }),

  focusExit: (): Promise<number> =>
    isTauri ? invoke<number>("focus_exit") : Promise.resolve(1),

  focusState: (): Promise<FocusState | null> =>
    isTauri ? invoke<FocusState | null>("focus_state") : Promise.resolve(null),

  restartApp: (): Promise<void> =>
    isTauri ? invoke<void>("restart_app") : Promise.resolve(),

  /* ------------------------------ v0.2: hardware ------------------------------ */

  getBrightness: (): Promise<number> =>
    isTauri ? invoke<number>("get_brightness") : Promise.resolve(80),

  setBrightness: (level: number): Promise<void> =>
    isTauri ? invoke<void>("set_brightness", { level }) : Promise.resolve(),

  getVolume: (): Promise<number> =>
    isTauri ? invoke<number>("get_volume") : Promise.resolve(60),

  setVolume: (level: number): Promise<void> =>
    isTauri ? invoke<void>("set_volume", { level }) : Promise.resolve(),

  /* ------------------------------- v0.2: lixeira ------------------------------ */

  trashList: (): Promise<TrashEntry[]> =>
    isTauri
      ? invoke<TrashEntry[]>("trash_list")
      : Promise.resolve([
          { name: "relatorio-antigo.docx", original_path: "C:\\Users\\Arthur\\Documents", size: 48211, is_dir: false },
          { name: "fotos-2024", original_path: "C:\\Users\\Arthur\\Pictures", size: 0, is_dir: true },
        ]),

  trashMove: (path: string): Promise<void> =>
    isTauri ? invoke<void>("trash_move", { path }) : Promise.resolve(),

  trashEmpty: (): Promise<void> =>
    isTauri ? invoke<void>("trash_empty") : Promise.resolve(),

  /* --------------------------- v0.2: navegador real --------------------------- */

  openBrowser: (url: string, title?: string): Promise<void> =>
    isTauri
      ? invoke<void>("open_browser", { url, title: title ?? null })
      : Promise.resolve(window.open(url, "_blank") as unknown as void),

  /* ------------------------------ v0.3: app store ----------------------------- */

  wingetAvailable: (): Promise<boolean> =>
    isTauri ? invoke<boolean>("winget_available") : Promise.resolve(false),

  storeSearch: (query: string): Promise<StorePackage[]> =>
    isTauri
      ? invoke<StorePackage[]>("store_search", { query })
      : Promise.resolve([
          { id: "Google.Chrome", name: "Google Chrome", version: "131.0" },
          { id: "Mozilla.Firefox", name: "Mozilla Firefox", version: "133.0" },
        ]),

  storeInstall: (id: string): Promise<void> =>
    isTauri ? invoke<void>("store_install", { id }) : new Promise((r) => setTimeout(r, 2000)),

  listInstalledApps: (): Promise<InstalledApp[]> =>
    isTauri
      ? invoke<InstalledApp[]>("list_installed_apps")
      : Promise.resolve([
          { name: "Google Chrome", path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", publisher: "Google" },
          { name: "Discord", path: "C:\\Users\\Arthur\\AppData\\Local\\Discord\\app.exe", publisher: "Discord" },
        ]),

  appIcon: (path: string): Promise<string | null> =>
    isTauri ? invoke<string | null>("app_icon", { path }) : Promise.resolve(null),

  launchApp: (path: string): Promise<void> =>
    isTauri ? invoke<void>("launch_app", { path }) : Promise.resolve(),

  /* ------------------------------ v0.3: downloads ----------------------------- */

  downloadFile: (url: string): Promise<{ path: string; bytes: number }> =>
    isTauri
      ? invoke<{ path: string; bytes: number }>("download_file", { url })
      : new Promise((r) => setTimeout(() => r({ path: "C:\\Users\\Arthur\\Downloads\\arquivo.bin", bytes: 1024 }), 1500)),
};
