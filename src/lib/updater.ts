import { ipc } from "./ipc";
import { notify } from "../store/notifications";

/** Verifica se há atualização no GitHub e oferece instalar. Só roda no Tauri. */
export async function checkForUpdates() {
  if (!ipc.isTauri) {
    notify("settings", "Ajustes", "Atualizações", "A verificação de atualizações só funciona no app instalado.");
    return;
  }
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) {
      notify("settings", "Ajustes", "Você está atualizado", "Esta é a versão mais recente do Mac OS.");
      return;
    }
    notify(
      "settings",
      "Ajustes",
      `Nova versão ${update.version} disponível`,
      "Baixando e instalando… o app reinicia ao concluir."
    );
    await update.downloadAndInstall();
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (e) {
    console.error("updater falhou", e);
    notify("settings", "Ajustes", "Erro ao atualizar", "Não foi possível verificar atualizações agora.");
  }
}
