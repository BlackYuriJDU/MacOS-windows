import { useEffect, useState } from "react";
import { useOverlays } from "../store/ui";
import { useSettings } from "../store/settings";
import { useSession } from "../store/session";
import { useSystem } from "../store/system";
import { ipc } from "../lib/ipc";
import { BatteryIcon, WifiIcon } from "../components/icons";

export default function ControlCenter() {
  const setControlCenter = useOverlays((s) => s.setControlCenter);
  const cfg = useSettings();
  const focusActive = useSession((s) => s.focusActive);
  const frozenCount = useSession((s) => s.frozenCount);
  const battery = useSystem((s) => s.battery);
  const wifi = useSystem((s) => s.wifi);
  const [brightness, setBrightnessState] = useState(80);
  const [volume, setVolumeState] = useState(60);
  const [brightnessOk, setBrightnessOk] = useState(true);
  const [volumeOk, setVolumeOk] = useState(true);

  /* Lê o estado real do hardware ao abrir; se o monitor/áudio não expuser
     controle, degrada o slider para "não suportado" em vez de mentir. */
  useEffect(() => {
    ipc.getBrightness().then(setBrightnessState).catch(() => setBrightnessOk(false));
    ipc.getVolume().then(setVolumeState).catch(() => setVolumeOk(false));
  }, []);

  const setBrightness = (v: number) => {
    setBrightnessState(v);
    ipc.setBrightness(v).catch(() => setBrightnessOk(false));
  };
  const setVolume = (v: number) => {
    setVolumeState(v);
    ipc.setVolume(v).catch(() => setVolumeOk(false));
  };

  return (
    <div className="fixed inset-0 z-[7000]" onPointerDown={() => setControlCenter(false)}>
      <div
        className="glass-strong absolute right-2 top-[34px] w-[310px] rounded-2xl border border-white/40 p-3 text-black shadow-2xl dark:border-white/10 dark:text-white"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Wi-Fi + Bluetooth */}
        <div className="grid grid-cols-2 gap-2">
          <Tile on={!!wifi} label="Wi-Fi" sub={wifi ?? "Desligado"}>
            <WifiIcon className="h-5 w-5" />
          </Tile>
          <Tile on={false} label="Bluetooth" sub="Indisponível">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m7 7 10 10-5 4V3l5 4L7 17" />
            </svg>
          </Tile>
        </div>

        {/* Modo Foco (estado da sessão) + Escuro */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Tile
            on={focusActive}
            label="Modo Foco"
            sub={focusActive ? `${frozenCount} congelados` : "Inativo"}
            onClick={() => {}}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v10m0 0 3-3m-3 3-3-3" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </Tile>
          <Tile
            on={cfg.theme === "dark"}
            label="Escuro"
            sub={cfg.theme === "auto" ? "Automático" : ""}
            onClick={() => cfg.set({ theme: cfg.theme === "dark" ? "light" : "dark" })}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
            </svg>
          </Tile>
        </div>

        {/* Brilho e volume — controle real do hardware (WMI + Core Audio) */}
        <Panel>
          <Slider
            label="Brilho"
            supported={brightnessOk}
            icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>}
            value={brightness}
            onChange={setBrightness}
          />
          <Slider
            label="Som"
            supported={volumeOk}
            icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>}
            value={volume}
            onChange={setVolume}
          />
        </Panel>

        {/* Bateria */}
        {battery && (
          <Panel>
            <div className="flex items-center gap-2 text-[13px]">
              <BatteryIcon className="h-4 w-8" />
              <span className="tabular-nums">{battery.percent}%</span>
              <span className="ml-auto text-[12px] opacity-50">
                {battery.plugged ? "Carregando" : "Bateria"}
              </span>
            </div>
          </Panel>
        )}

      </div>
    </div>
  );
}

function Tile({
  on,
  label,
  sub,
  children,
  onClick,
}: {
  on: boolean;
  label: string;
  sub?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-2xl bg-black/5 p-2.5 text-left dark:bg-white/10"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          on ? "bg-accent text-white" : "bg-black/15 dark:bg-white/20"
        }`}
      >
        {children}
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold leading-tight">{label}</span>
        {sub && <span className="block truncate text-[11px] opacity-55">{sub}</span>}
      </span>
    </button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 rounded-2xl bg-black/5 p-2.5 dark:bg-white/10">{children}</div>;
}

function Slider({
  icon,
  label,
  value,
  onChange,
  supported,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  supported: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1" title={supported ? label : `${label} não suportado neste dispositivo`}>
      <span className="opacity-60">{icon}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={!supported}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#0a84ff] disabled:opacity-30"
      />
      {!supported && <span className="shrink-0 text-[10px] opacity-40">n/d</span>}
    </div>
  );
}
