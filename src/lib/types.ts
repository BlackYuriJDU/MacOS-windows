export interface FsEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export interface MachineInfo {
  os_name: string;
  os_version: string;
  kernel_version: string;
  hostname: string;
  arch: string;
  cpu: string;
  cores: number;
  memory_gb: number;
  storage_gb: number;
}

export interface BatteryInfo {
  percent: number;
  plugged: boolean;
}

export interface ProcInfo {
  pid: number;
  name: string;
}

export interface FocusState {
  mode: string;
  pids: ProcInfo[];
  started_at: number;
}

export type FocusMode = "suspend" | "terminate" | "none";

export interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: true;
}

export interface AppMenu {
  title: string;
  items: MenuItem[];
}
