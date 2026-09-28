use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::proc::hidden_command;

/// App instalado no Windows (aba "Instalados").
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstalledApp {
    pub name: String,
    pub id: String,        // exe path ou AppUserModelID (UWP)
    pub publisher: String,
    pub is_uwp: bool,
}

/// Resultado de busca no catálogo winget (aba "Descobrir").
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StoreResult {
    pub name: String,
    pub id: String,
    pub version: String,
}

fn ps(script: &str) -> Result<String, String> {
    let out = hidden_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("powershell: {e}"))?;
    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    } else {
        Err(format!("ps: {}", String::from_utf8_lossy(&out.stderr)))
    }
}

#[tauri::command]
pub fn winget_available() -> bool {
    hidden_command("winget")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn is_winget() -> bool {
    winget_available()
}

/// Lista apps instalados: registry Uninstall (Win32) + Get-StartApps (UWP).
#[tauri::command]
pub fn list_installed_apps() -> Result<Vec<InstalledApp>, String> {
    let script = r#"
$paths = @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$win32 = Get-ItemProperty $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -and -not $_.SystemComponent -and -not $_.ParentKeyName } |
  ForEach-Object {
    $exe = ''
    if ($_.DisplayIcon) { $exe = ($_.DisplayIcon -split ',')[0].Trim('"') }
    elseif ($_.InstallLocation) { $exe = $_.InstallLocation }
    [PSCustomObject]@{ name=$_.DisplayName; id=$exe; publisher=($_.Publisher -as [string]); is_uwp=$false }
  }
$uwp = Get-StartApps -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{ name=$_.Name; id=$_.AppID; publisher=''; is_uwp=$true }
}
$all = @($win32) + @($uwp) | Where-Object { $_.name } | Sort-Object name -Unique
$all | Select-Object -First 400 | ConvertTo-Json -Compress
"#;
    let text = ps(script)?;
    if text.is_empty() {
        return Ok(vec![]);
    }
    let normalized = if text.starts_with('[') { text } else { format!("[{text}]") };
    serde_json::from_str::<Vec<InstalledApp>>(&normalized).map_err(|e| format!("parse apps: {e}"))
}

/// Busca no catálogo winget.
#[tauri::command]
pub fn store_search(query: String) -> Result<Vec<StoreResult>, String> {
    if !is_winget() {
        return Err("winget não está instalado. Instale o 'App Installer' pela Microsoft Store.".into());
    }
    let script = format!(
        "winget search --query \"{}\" --source winget --accept-source-agreements --disable-interactivity 2>$null | ConvertTo-Json -Compress",
        query.replace('"', "")
    );
    // winget não tem saída JSON nativa estável; parse da tabela é frágil.
    // Usamos uma abordagem mais robusta: winget search com colunas fixas.
    let out = hidden_command("winget")
        .args(["search", "--query", &query, "--source", "winget", "--accept-source-agreements", "--disable-interactivity"])
        .output()
        .map_err(|e| format!("winget: {e}"))?;
    let _ = script; // parse via tabela abaixo
    let text = String::from_utf8_lossy(&out.stdout);
    Ok(parse_winget_table(&text))
}

/// Parse da saída tabular do winget search (Name / Id / Version).
fn parse_winget_table(text: &str) -> Vec<StoreResult> {
    let mut out = Vec::new();
    let lines: Vec<&str> = text.lines().collect();
    // Acha o cabeçalho (linha com "Name" e "Id") e a linha de traços seguinte.
    let mut start = None;
    for (i, l) in lines.iter().enumerate() {
        if l.contains("Name") && l.contains("Id") && i + 1 < lines.len() && lines[i + 1].trim_start().starts_with('-') {
            start = Some(i + 2);
            break;
        }
    }
    let Some(start) = start else { return out };
    // Detecta posições das colunas pelo cabeçalho.
    let header = lines[start - 2];
    let id_pos = header.find("Id").unwrap_or(30);
    let ver_pos = header.find("Version").unwrap_or(id_pos + 30);
    for l in lines.iter().skip(start) {
        if l.trim().is_empty() { continue; }
        let name = l.get(..id_pos).unwrap_or("").trim().to_string();
        let id = l.get(id_pos..ver_pos.min(l.len())).unwrap_or("").trim().to_string();
        let version = if l.len() > ver_pos { l[ver_pos..].trim().to_string() } else { String::new() };
        if !name.is_empty() && !id.is_empty() {
            out.push(StoreResult { name, id, version });
        }
        if out.len() >= 40 { break; }
    }
    out
}

/// Instala um app do catálogo winget (silencioso quando o instalador permite).
#[tauri::command]
pub fn store_install(id: String) -> Result<String, String> {
    if !is_winget() {
        return Err("winget não está instalado.".into());
    }
    let out = hidden_command("winget")
        .args([
            "install", "--id", &id, "-e", "--silent",
            "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity",
        ])
        .output()
        .map_err(|e| format!("winget install: {e}"))?;
    let text = format!("{}{}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
    if out.status.success() {
        Ok("installed".into())
    } else {
        Err(format!("falha ao instalar {id}: {}", text.chars().take(400).collect::<String>()))
    }
}

/// Desinstala um app pelo id winget.
#[tauri::command]
pub fn store_uninstall(id: String) -> Result<String, String> {
    let out = hidden_command("winget")
        .args(["uninstall", "--id", &id, "-e", "--silent", "--disable-interactivity"])
        .output()
        .map_err(|e| format!("winget uninstall: {e}"))?;
    if out.status.success() {
        Ok("uninstalled".into())
    } else {
        Err(format!("falha ao desinstalar {id}"))
    }
}

/// Abre um app instalado (exe ou UWP AppUserModelID).
#[tauri::command]
pub fn launch_app(id: String, is_uwp: bool) -> Result<(), String> {
    if is_uwp {
        // UWP: shell:AppsFolder\<AppUserModelID>
        Command::new("explorer")
            .arg(format!("shell:AppsFolder\\{id}"))
            .spawn()
            .map_err(|e| format!("launch uwp: {e}"))?;
    } else {
        // Win32: exe path ou diretório de instalação
        let p = std::path::Path::new(&id);
        let target = if p.is_dir() {
            // tenta achar um exe dentro
            std::fs::read_dir(p)
                .ok()
                .and_then(|rd| {
                    rd.flatten()
                        .map(|e| e.path())
                        .find(|f| f.extension().map(|x| x == "exe").unwrap_or(false))
                })
                .unwrap_or_else(|| p.to_path_buf())
        } else {
            p.to_path_buf()
        };
        Command::new(target)
            .spawn()
            .map_err(|e| format!("launch {id}: {e}"))?;
    }
    Ok(())
}

/// Extrai o ícone real de um exe como data-url PNG (via PowerShell + System.Drawing).
#[tauri::command]
pub fn app_icon(path: String) -> Result<Option<String>, String> {
    if path.is_empty() || !std::path::Path::new(&path).exists() {
        return Ok(None);
    }
    let p = path.replace('\'', "''");
    let script = format!(
        "Add-Type -AssemblyName System.Drawing; \
         $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('{p}'); \
         if ($null -eq $icon) {{ exit 1 }}; \
         $bmp = $icon.ToBitmap(); \
         $ms = New-Object System.IO.MemoryStream; \
         $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
         [Convert]::ToBase64String($ms.ToArray())"
    );
    let out = hidden_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("icon: {e}"))?;
    if out.status.success() {
        let b64 = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !b64.is_empty() {
            return Ok(Some(format!("data:image/png;base64,{b64}")));
        }
    }
    Ok(None)
}
