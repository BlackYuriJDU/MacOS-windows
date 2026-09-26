use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone)]
pub struct FsEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
}

fn to_entry(p: &Path, is_dir: bool) -> FsEntry {
    FsEntry {
        name: p
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default(),
        path: p.to_string_lossy().to_string(),
        is_dir,
        size: if is_dir {
            0
        } else {
            p.metadata().map(|m| m.len()).unwrap_or(0)
        },
        modified: p
            .metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0),
    }
}

#[tauri::command]
pub fn home_dir() -> Result<String, String> {
    std::env::var("USERPROFILE").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_list(path: String) -> Result<Vec<FsEntry>, String> {
    let mut out: Vec<FsEntry> = Vec::new();
    let rd = std::fs::read_dir(&path).map_err(|e| format!("{path}: {e}"))?;
    for e in rd.flatten() {
        let p = e.path();
        let is_dir = p.is_dir();
        out.push(to_entry(&p, is_dir));
    }
    // pastas primeiro, depois nome (o padrão de ordenação do Finder)
    out.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(out)
}

#[tauri::command]
pub fn fs_read_text(path: String) -> Result<String, String> {
    use std::io::Read;
    let mut f = std::fs::File::open(&path).map_err(|e| format!("{path}: {e}"))?;
    let mut buf = vec![0u8; 8192];
    let n = f.read(&mut buf).map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&buf[..n]).to_string())
}

/// Busca de arquivos para o Spotlight: BFS rasa a partir da pasta pessoal,
/// ignorando pontos de montagem invisíveis. Limitada para responder rápido.
#[tauri::command]
pub fn fs_search(query: String) -> Result<Vec<FsEntry>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(vec![]);
    }
    let home = PathBuf::from(std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string()));
    let mut out = Vec::new();
    let mut stack: Vec<(PathBuf, u8)> = vec![(home, 0)];
    let mut visited = 0usize;

    while let Some((dir, depth)) = stack.pop() {
        if visited > 400 || out.len() >= 12 {
            break;
        }
        let rd = match std::fs::read_dir(&dir) {
            Ok(r) => r,
            Err(_) => continue,
        };
        for e in rd.flatten() {
            visited += 1;
            let p = e.path();
            let name = p
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            if name.starts_with('.') {
                continue;
            }
            let is_dir = p.is_dir();
            if name.to_lowercase().contains(&q) {
                out.push(to_entry(&p, is_dir));
                if out.len() >= 12 {
                    break;
                }
            }
            if is_dir && depth < 2 {
                let nl = name.to_lowercase();
                if nl != "appdata" && nl != "$recycle.bin" && nl != "node_modules" {
                    stack.push((p, depth + 1));
                }
            }
        }
    }
    Ok(out)
}
