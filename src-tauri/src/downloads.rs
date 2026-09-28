use serde::Serialize;
use std::path::PathBuf;

use crate::proc::hidden_command;

/// Download real de um arquivo para a pasta Downloads do Windows, via PowerShell.
/// Evita a dependência nativa de TLS (ring/clang) — funciona em qualquer Windows.
/// Grava em `<nome>.download` e renomeia ao concluir (download atômico).

#[derive(Serialize, Clone)]
pub struct DownloadResult {
    pub path: String,
    pub bytes: u64,
}

fn downloads_dir() -> PathBuf {
    let home = std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join("Downloads")
}

fn filename_from_url(url: &str) -> String {
    url::Url::parse(url)
        .ok()
        .and_then(|u| {
            u.path_segments()
                .and_then(|s| s.filter(|p| !p.is_empty()).last().map(|p| p.to_string()))
        })
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| "download.bin".to_string())
}

fn ps_escape(s: &str) -> String {
    s.replace('\'', "''")
}

#[tauri::command]
pub fn download_file(app: tauri::AppHandle, url: String) -> Result<DownloadResult, String> {
    use tauri::Emitter;

    let fname = filename_from_url(&url);
    let dir = downloads_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let final_path = dir.join(&fname);
    let tmp_path = dir.join(format!("{fname}.download"));

    let url_e = ps_escape(&url);
    let tmp_e = ps_escape(&tmp_path.to_string_lossy());

    // Download síncrono via PowerShell (Invoke-WebRequest grava direto no disco).
    // O Tauri já roda comandos fora do thread principal da UI.
    let script = format!(
        "$ProgressPreference='SilentlyContinue'; \
         Invoke-WebRequest -Uri '{url_e}' -OutFile '{tmp_e}' -UseBasicParsing -ErrorAction Stop; \
         (Get-Item '{tmp_e}').Length"
    );

    let out = hidden_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("powershell: {e}"))?;

    if !out.status.success() {
        let _ = std::fs::remove_file(&tmp_path);
        return Err(format!("download falhou: {}", String::from_utf8_lossy(&out.stderr)));
    }

    let bytes = std::fs::metadata(&tmp_path).map(|m| m.len()).unwrap_or(0);
    std::fs::rename(&tmp_path, &final_path).map_err(|e| e.to_string())?;

    let _ = app.emit(
        "download-complete",
        serde_json::json!({ "url": url, "path": final_path.to_string_lossy(), "bytes": bytes }),
    );

    Ok(DownloadResult {
        path: final_path.to_string_lossy().to_string(),
        bytes,
    })
}