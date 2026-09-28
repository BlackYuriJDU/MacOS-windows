use serde::{Deserialize, Serialize};

use crate::proc::hidden_command;

/// Entrada da Lixeira do Windows.
#[derive(Serialize, Deserialize, Clone)]
pub struct TrashEntry {
    pub name: String,
    pub original_path: String,
    pub size: u64,
    pub is_dir: bool,
}

/// Lista o conteúdo da Lixeira real do Windows via Shell.Application (COM),
/// orquestrado por PowerShell para não precisar de COM manual no Rust.
#[tauri::command]
pub fn trash_list() -> Result<Vec<TrashEntry>, String> {
    list_impl()
}

#[cfg(windows)]
fn list_impl() -> Result<Vec<TrashEntry>, String> {
    // Namespace 0xA = Recycle Bin. Colunas: 0=nome, 1=caminho original, 2=tamanho.
    let script = r#"
$shell = New-Object -ComObject Shell.Application
$bin = $shell.Namespace(0xA)
$items = @()
foreach ($item in $bin.Items()) {
  $items += [PSCustomObject]@{
    name = $item.Name
    original_path = $bin.GetDetailsOf($item, 1)
    size = [int64]($bin.GetDetailsOf($item, 2) -replace '[^\d]','')
    is_dir = $item.IsFolder
  }
}
$items | ConvertTo-Json -Compress
"#;
    let out = hidden_command("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output()
        .map_err(|e| format!("powershell: {e}"))?;
    let text = String::from_utf8_lossy(&out.stdout);
    let text = text.trim();
    if text.is_empty() {
        return Ok(vec![]);
    }
    // Um único item vira objeto (não array) no ConvertTo-Json — normaliza.
    let normalized = if text.starts_with('{') {
        format!("[{text}]")
    } else {
        text.to_string()
    };
    serde_json::from_str::<Vec<TrashEntry>>(&normalized).map_err(|e| format!("parse lixeira: {e}"))
}

#[cfg(not(windows))]
fn list_impl() -> Result<Vec<TrashEntry>, String> {
    Ok(vec![])
}

/// Move um arquivo/pasta real para a Lixeira (com undo), via FileIO do .NET.
#[tauri::command]
pub fn trash_move(path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        let is_dir = std::path::Path::new(&path).is_dir();
        let escaped = path.replace('\'', "''");
        let op = if is_dir {
            format!("[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory('{escaped}','OnlyErrorDialogs','SendToRecycleBin')")
        } else {
            format!("[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('{escaped}','OnlyErrorDialogs','SendToRecycleBin')")
        };
        let script = format!(
            "Add-Type -AssemblyName Microsoft.VisualBasic; {op}"
        );
        let out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| format!("powershell: {e}"))?;
        if out.status.success() {
            Ok(())
        } else {
            Err(format!(
                "mover para a lixeira falhou: {}",
                String::from_utf8_lossy(&out.stderr)
            ))
        }
    }
    #[cfg(not(windows))]
    {
        let _ = path;
        Err("lixeira só é suportada no Windows".into())
    }
}

/// Esvazia a Lixeira real do Windows.
#[tauri::command]
pub fn trash_empty() -> Result<(), String> {
    #[cfg(windows)]
    {
        let out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", "Clear-RecycleBin -Force -ErrorAction Stop"])
            .output()
            .map_err(|e| format!("powershell: {e}"))?;
        if out.status.success() {
            Ok(())
        } else {
            Err(format!(
                "esvaziar lixeira falhou: {}",
                String::from_utf8_lossy(&out.stderr)
            ))
        }
    }
    #[cfg(not(windows))]
    {
        Err("lixeira só é suportada no Windows".into())
    }
}
