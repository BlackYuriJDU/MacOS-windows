import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ipc } from "./ipc";
import { notify } from "../store/notifications";

/** Verifica atualização no GitHub e oferece instalar. Silencioso se não houver. */
export async function checkForUpdates(manual = false): Promise<void> {
  if (!ipc.isTauri) {
    if (manual) notify("settings", "Ajustes", "Modo navegador", "A verificação de atualização só funciona no app instalado.");
    return;
  }
  try {
    const update = await check();
    if (!update) {
      if (manual) notify("settings", "Ajustes", "Você está atualizado", "Esta é a versão mais recente do Mac OS.");
      return;
    }
    notify("settings", "Ajustes", `Mac OS ${update.version} disponível`, "Baixando e instalando a atualização…");
    await update.downloadAndInstall();
    notify("settings", "Ajustes", "Atualização instalada", "O Mac OS será reiniciado para concluir.");
    await relaunch();
  } catch (e) {
    if (manual) notify("settings", "Ajustes", "Erro ao verificar", "Não foi possível verificar atualizações agora.");
    console.error("updater:", e);
  }
}
