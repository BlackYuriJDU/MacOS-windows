import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSession } from "./store/session";
import { useSettings } from "./store/settings";
import { useSystem } from "./store/system";
import { useWindows } from "./store/windows";
import { useOverlays, useContextMenu } from "./store/ui";
import { ipc } from "./lib/ipc";
import { sessionFlow } from "./lib/session-flow";
import BootScreen from "./shell/BootScreen";
import ConfirmFocus from "./shell/ConfirmFocus";
import MenuBar from "./shell/MenuBar";
import Desktop from "./shell/Desktop";
import WindowManager from "./shell/WindowManager";
import Dock from "./shell/Dock";
import Spotlight from "./shell/Spotlight";
import Launchpad from "./shell/Launchpad";
import ControlCenter from "./shell/ControlCenter";
import LockScreen from "./shell/LockScreen";
import ContextMenu from "./shell/ContextMenu";
import NotificationBanner from "./shell/NotificationBanner";
import NotificationCenter from "./shell/NotificationCenter";
import { openApp } from "./apps/registry";

export default function App() {
  const phase = useSession((s) => s.phase);
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const spotlight = useOverlays((s) => s.spotlight);
  const launchpad = useOverlays((s) => s.launchpad);
  const controlCenter = useOverlays((s) => s.controlCenter);
  const notifCenter = useOverlays((s) => s.notifCenter);
  const locked = useSession((s) => s.locked);

  /* Tema claro/escuro/automático */
  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (theme === "auto") {
      const mq = matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  /* Accent color do Tahoe (aplicado via data-accent no <html>) */
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  /* Status do sistema (bateria/wifi) */
  useEffect(() => {
    useSystem.getState().refresh();
    const t = setInterval(() => useSystem.getState().refresh(), 30000);
    return () => clearInterval(t);
  }, []);

  /* Atalho ⌘, abre os Ajustes (disparado pelo handler de teclado global) */
  useEffect(() => {
    const open = () => openApp("settings");
    window.addEventListener("macos:open-settings", open);
    return () => window.removeEventListener("macos:open-settings", open);
  }, []);

  /* Atalho global do Spotlight vem do Tauri (Ctrl+Space, registrado em Rust) */
  useEffect(() => {
    if (!ipc.isTauri) return;
    const p = listen("spotlight-toggle", () => {
      useOverlays.getState().setSpotlight(!useOverlays.getState().spotlight);
    });
    return () => {
      p.then((u) => u());
    };
  }, []);

  /* Saída segura: se fecharem a janela com processos congelados, retoma tudo antes */
  useEffect(() => {
    if (!ipc.isTauri) return;
    const w = getCurrentWindow();
    const p = w.onCloseRequested(async (e) => {
      e.preventDefault();
      await sessionFlow.shutdown();
    });
    return () => {
      p.then((u) => u());
    };
  }, []);

  /* Teclado global do ambiente (Cmd = Ctrl no Windows) */
  useEffect(() => {
    if (phase !== "desktop") return;
    const onKey = (e: KeyboardEvent) => {
      if (useSession.getState().locked) return;
      const mod = e.ctrlKey || e.metaKey;
      const overlays = useOverlays.getState();
      if (e.key === "Escape") {
        overlays.closeAll();
        useContextMenu.getState().hide();
        return;
      }
      // No Tauri o Ctrl+Space chega via evento global; no navegador, tratamos aqui.
      if (!ipc.isTauri && mod && e.code === "Space") {
        e.preventDefault();
        overlays.setSpotlight(!overlays.spotlight);
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        overlays.setLaunchpad(!overlays.launchpad);
        return;
      }
      const win = useWindows.getState().focused();
      const ws = useWindows.getState();
      if (mod && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (win) ws.close(win.id);
        return;
      }
      if (mod && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (win) ws.minimize(win.id);
        return;
      }
      if (mod && e.key.toLowerCase() === "q") {
        e.preventDefault();
        if (win) ws.closeAllOfApp(win.appId);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        // Abre Ajustes (evita import circular: usa evento customizado no DOM)
        window.dispatchEvent(new CustomEvent("macos:open-settings"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  return (
    <div className="mac-cursor fixed inset-0 overflow-hidden bg-black">
      {phase === "boot" && <BootScreen />}
      {phase === "confirm" && <ConfirmFocus />}
      {phase === "desktop" && (
        <>
          <Desktop />
          <MenuBar />
          <WindowManager />
          <Dock />
          {spotlight && <Spotlight />}
          {launchpad && <Launchpad />}
          {controlCenter && <ControlCenter />}
          <NotificationBanner />
          {notifCenter && <NotificationCenter />}
          {locked && <LockScreen />}
        </>
      )}
      <ContextMenu />
    </div>
  );
}
