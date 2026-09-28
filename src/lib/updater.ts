import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ipc } from "./ipc";
import { notify, useDownloadProgress } from "../store/notifications";

/** Verifica atualização no GitHub e oferece instalar. Silencioso se não houver.
 *  Mostra uma barra de progresso com "%" durante o download (estilo macOS). */
export async function checkForUpdates(manual = false): Promise<void> {
  if (!ipc.isTauri) {
    if (manual) notify("settings", "Ajustes", "Modo navegador", "A verificação de atualização só funciona no app instalado.");
    return;
  }
  const progress = useDownloadProgress.getState();
  try {
    const update = await check();
    if (!update) {
      if (manual) notify("settings", "Ajustes", "Você está atualizado", "Esta é a versão mais recente do Mac OS.");
      return;
    }
    notify("settings", "Ajustes", `Mac OS ${update.version} disponível`, "Baixando a atualização…");

    // Barra de progresso com % durante o download.
    progress.start(`Baixando Mac OS ${update.version}`);
    let downloaded = 0;
    let total = 0;
    await update.downloadAndInstall((event) => {
      const p = useDownloadProgress.getState();
      switch (event.event) {
        case "Started":
          total = event.data.contentLength ?? 0;
          p.update(0, total);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          p.update(downloaded, total);
          break;
        case "Finished":
          p.update(total, total);
          break;
      }
    });
    useDownloadProgress.getState().finish();

    notify("settings", "Ajustes", "Atualização instalada", "O Mac OS será reiniciado para concluir.");
    await relaunch();
  } catch (e) {
    useDownloadProgress.getState().finish();
    if (manual) notify("settings", "Ajustes", "Erro ao verificar", "Não foi possível verificar atualizações agora.");
    console.error("updater:", e);
  }
}
