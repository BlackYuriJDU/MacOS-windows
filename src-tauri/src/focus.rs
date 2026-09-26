use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

/// Info de um processo alvo do Modo Foco.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProcInfo {
    pub pid: u32,
    pub name: String,
}

/// Estado persistido do Modo Foco (usado na retomada e na recuperação de crash).
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FocusState {
    pub mode: String,
    pub pids: Vec<ProcInfo>,
    pub started_at: u64,
}

/* ------------------------------- FFI Windows ------------------------------- */

#[cfg(windows)]
mod nt {
    use core::ffi::c_void;

    const PROCESS_SUSPEND_RESUME: u32 = 0x0800;
    const PROCESS_TERMINATE: u32 = 0x0001;

    #[link(name = "kernel32")]
    extern "system" {
        fn OpenProcess(desired_access: u32, inherit_handle: i32, process_id: u32) -> *mut c_void;
        fn CloseHandle(handle: *mut c_void) -> i32;
        fn TerminateProcess(handle: *mut c_void, exit_code: u32) -> i32;
    }

    // NtSuspendProcess/NtResumeProcess: as mesmas funções que alimentam o
    // Process Explorer e o Resource Monitor (API não documentada, exportada pela ntdll).
    #[link(name = "ntdll")]
    extern "system" {
        fn NtSuspendProcess(process: *mut c_void) -> i32;
        fn NtResumeProcess(process: *mut c_void) -> i32;
    }

    pub fn suspend(pid: u32) -> bool {
        with_handle(pid, PROCESS_SUSPEND_RESUME, |h| unsafe {
            NtSuspendProcess(h) >= 0
        })
    }

    pub fn resume(pid: u32) -> bool {
        with_handle(pid, PROCESS_SUSPEND_RESUME, |h| unsafe {
            NtResumeProcess(h) >= 0
        })
    }

    pub fn terminate(pid: u32) -> bool {
        with_handle(pid, PROCESS_TERMINATE, |h| unsafe { TerminateProcess(h, 1) != 0 })
    }

    fn with_handle(pid: u32, access: u32, f: impl FnOnce(*mut c_void) -> bool) -> bool {
        let h = unsafe { OpenProcess(access, 0, pid) };
        if h.is_null() {
            return false;
        }
        let ok = f(h);
        unsafe { CloseHandle(h) };
        ok
    }
}

#[cfg(not(windows))]
mod nt {
    pub fn suspend(_pid: u32) -> bool {
        false
    }
    pub fn resume(_pid: u32) -> bool {
        false
    }
    pub fn terminate(_pid: u32) -> bool {
        false
    }
}

/* ---------------------------- proteção do sistema --------------------------- */

fn protected_names() -> HashSet<String> {
    let mut set: HashSet<String> = [
        "system",
        "registry",
        "smss.exe",
        "csrss.exe",
        "wininit.exe",
        "winlogon.exe",
        "services.exe",
        "lsass.exe",
        "svchost.exe",
        "dwm.exe",
        "fontdrvhost.exe",
        "explorer.exe",
        "ctfmon.exe",
        "textinputhost.exe",
        "startmenuexperiencehost.exe",
        "searchhost.exe",
        "searchindexer.exe",
        "runtimebroker.exe",
        "sihost.exe",
        "taskhostw.exe",
        "applicationframehost.exe",
        "conhost.exe",
        "openconsole.exe",
        "msedgewebview2.exe", // a própria interface deste app roda em WebView2
        "widgetservice.exe",
        "phoneexperiencehost.exe",
        "spoolsv.exe",
        "audiodg.exe",
        "msmpeng.exe",
        "securityhealthservice.exe",
        "securityhealthsystray.exe",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();

    // Em builds de dev, protege a toolchain (node/vite/cargo) para não congelar o próprio dev server
    #[cfg(debug_assertions)]
    {
        for name in [
            "node.exe",
            "cargo.exe",
            "rustup.exe",
            "link.exe",
            "cl.exe",
            "powershell.exe",
            "pwsh.exe",
            "cmd.exe",
            "git.exe",
            "tsc.exe",
        ] {
            set.insert(name.to_string());
        }
    }
    set
}

fn state_path() -> PathBuf {
    let base = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(base).join("macos-windows").join("focus-state.json")
}

fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// Processos candidatos ao Modo Foco: do próprio usuário, fora da lista de
/// proteção, e não somos nós mesmos. Processos de sistema rodam como SYSTEM e
/// já caem fora pelo critério de dono.
fn candidates() -> Vec<ProcInfo> {
    let sys = sysinfo::System::new_all();
    let me = std::process::id();
    let my_uid = sys
        .process(sysinfo::Pid::from_u32(me))
        .and_then(|p| p.user_id().cloned());

    let Some(my_uid) = my_uid else {
        return Vec::new(); // sem saber nosso próprio dono, não mexe em nada
    };

    let protected = protected_names();
    let mut out = Vec::new();
    for (pid, p) in sys.processes() {
        if pid.as_u32() == me {
            continue;
        }
        let name = p.name().to_string_lossy().to_lowercase();
        if name.is_empty() || protected.contains(&name) {
            continue;
        }
        if p.user_id() != Some(&my_uid) {
            continue;
        }
        out.push(ProcInfo {
            pid: pid.as_u32(),
            name,
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name).then(a.pid.cmp(&b.pid)));
    out
}

/* --------------------------------- comandos -------------------------------- */

#[tauri::command]
pub fn focus_candidates() -> Result<Vec<ProcInfo>, String> {
    Ok(candidates())
}

#[tauri::command]
pub fn focus_enter(mode: String, pids: Option<Vec<u32>>) -> Result<FocusState, String> {
    let all = candidates();
    // Se o frontend mandou uma seleção, restringe a ela (validando contra os candidatos).
    let list: Vec<ProcInfo> = match pids {
        Some(sel) => {
            let sel: HashSet<u32> = sel.into_iter().collect();
            all.into_iter().filter(|p| sel.contains(&p.pid)).collect()
        }
        None => all,
    };
    let affected: Vec<ProcInfo> = match mode.as_str() {
        "suspend" => list.into_iter().filter(|p| nt::suspend(p.pid)).collect(),
        "terminate" => list.into_iter().filter(|p| nt::terminate(p.pid)).collect(),
        _ => Vec::new(),
    };

    let state = FocusState {
        mode: mode.clone(),
        pids: affected,
        started_at: now_secs(),
    };

    // O arquivo de estado só existe enquanto há processos congelados esperando retomada.
    if mode == "suspend" && !state.pids.is_empty() {
        if let Some(dir) = state_path().parent() {
            let _ = fs::create_dir_all(dir);
        }
        let json = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
        fs::write(state_path(), json).map_err(|e| e.to_string())?;
    }
    Ok(state)
}

#[tauri::command]
pub fn focus_exit() -> Result<usize, String> {
    resume_from_file()
}

#[tauri::command]
pub fn focus_state() -> Result<Option<FocusState>, String> {
    if let Ok(raw) = fs::read_to_string(state_path()) {
        if let Ok(state) = serde_json::from_str::<FocusState>(&raw) {
            return Ok(Some(state));
        }
    }
    Ok(None)
}

/// Retoma o que estiver registrado no arquivo de estado, validando o nome de
/// cada PID antes (PIDs são reutilizados pelo Windows — nunca retoma às cegas).
fn resume_from_file() -> Result<usize, String> {
    let path = state_path();
    let raw = match fs::read_to_string(&path) {
        Ok(r) => r,
        Err(_) => return Ok(0),
    };
    let state: FocusState = match serde_json::from_str(&raw) {
        Ok(s) => s,
        Err(_) => {
            let _ = fs::remove_file(&path);
            return Ok(0);
        }
    };

    let sys = sysinfo::System::new_all();
    let mut resumed = 0usize;
    for p in &state.pids {
        let current = sys
            .process(sysinfo::Pid::from_u32(p.pid))
            .map(|pr| pr.name().to_string_lossy().to_lowercase());
        if current.as_deref() == Some(p.name.as_str()) && nt::resume(p.pid) {
            resumed += 1;
        }
    }
    let _ = fs::remove_file(&path);
    Ok(resumed)
}

/// Chamado no RunEvent::Exit — retomada de emergência se o app fechar fora do fluxo normal.
pub fn emergency_resume() {
    let _ = resume_from_file();
}
