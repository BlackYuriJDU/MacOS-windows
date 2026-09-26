import { getCurrentWindow } from "@tauri-apps/api/window";
import { ipc } from "./ipc";
import { useSession } from "../store/session";
import type { FocusMode } from "./types";

/**
 * Orquestração da sessão: entrada (fullscreen + Modo Foco) e saída
 * (retoma tudo que foi congelado e devolve o Windows intacto).
 */
export const sessionFlow = {
  async enter(mode: FocusMode, pids?: number[]) {
    const s = useSession.getState();
    let frozen = 0;
    if (mode !== "none") {
      try {
        const st = await ipc.focusEnter(mode, pids);
        frozen = st.pids.length;
      } catch (e) {
        console.error("focus_enter falhou", e);
      }
    }
    if (ipc.isTauri) {
      try {
        await getCurrentWindow().setFullscreen(true);
      } catch (e) {
        console.error("setFullscreen falhou", e);
      }
    }
    s.setFocusMode(mode);
    s.setFocusActive(mode === "suspend", frozen);
    s.setPhase("desktop");
  },

  /** Sair do Modo Foco mas continuar no ambiente (retoma processos, sai do fullscreen). */
  async leaveFocus() {
    const s = useSession.getState();
    if (s.focusActive) {
      try {
        const resumed = await ipc.focusExit();
        console.log(`retomados ${resumed} processos`);
      } catch (e) {
        console.error("focus_exit falhou", e);
      }
      s.setFocusActive(false, 0);
    }
    if (ipc.isTauri) {
      try {
        await getCurrentWindow().setFullscreen(false);
      } catch {
        /* ignora */
      }
    }
  },

  async shutdown() {
    await sessionFlow.leaveFocus();
    if (ipc.isTauri) {
      try {
        await getCurrentWindow().destroy();
      } catch {
        /* ignora */
      }
    }
  },

  async restart() {
    await sessionFlow.leaveFocus();
    if (ipc.isTauri) {
      try {
        await ipc.restartApp();
      } catch {
        /* ignora */
      }
    }
  },
};
