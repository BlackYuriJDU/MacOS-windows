use serde::Serialize;

use crate::proc::hidden_command;

#[derive(Serialize)]
pub struct MachineInfo {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub hostname: String,
    pub arch: String,
    pub cpu: String,
    pub cores: usize,
    pub memory_gb: f64,
    pub storage_gb: f64,
}

#[tauri::command]
pub fn machine_info() -> Result<MachineInfo, String> {
    let sys = sysinfo::System::new_all();
    let cpus = sys.cpus();
    let disks = sysinfo::Disks::new_with_refreshed_list();
    Ok(MachineInfo {
        os_name: sysinfo::System::name().unwrap_or_default(),
        os_version: sysinfo::System::long_os_version().unwrap_or_default(),
        kernel_version: sysinfo::System::kernel_version().unwrap_or_default(),
        hostname: sysinfo::System::host_name().unwrap_or_default(),
        arch: std::env::consts::ARCH.to_string(),
        cpu: cpus
            .first()
            .map(|c| c.brand().trim().to_string())
            .unwrap_or_default(),
        cores: cpus.len(),
        memory_gb: sys.total_memory() as f64 / 1073741824.0,
        storage_gb: disks
            .iter()
            .map(|d| d.total_space() as f64 / 1073741824.0)
            .sum(),
    })
}

/* --------------------------------- bateria -------------------------------- */

#[derive(Serialize)]
pub struct BatteryInfo {
    pub percent: u8,
    pub plugged: bool,
}

#[cfg(windows)]
mod power {
    #[repr(C)]
    pub struct SystemPowerStatus {
        pub ac_line_status: u8,
        pub battery_flag: u8,
        pub battery_life_percent: u8,
        pub reserved1: u8,
        pub battery_life_time: u32,
        pub battery_full_life_time: u32,
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GetSystemPowerStatus(info: *mut SystemPowerStatus) -> i32;
    }

    /// (percentual, plugado) — None quando não há bateria (desktops).
    pub fn get() -> Option<(u8, bool)> {
        unsafe {
            let mut s: SystemPowerStatus = std::mem::zeroed();
            if GetSystemPowerStatus(&mut s) != 0 && s.battery_life_percent <= 100 {
                Some((s.battery_life_percent, s.ac_line_status == 1))
            } else {
                None
            }
        }
    }
}

#[cfg(not(windows))]
mod power {
    pub fn get() -> Option<(u8, bool)> {
        None
    }
}

#[tauri::command]
pub fn battery_status() -> Result<Option<BatteryInfo>, String> {
    Ok(power::get().map(|(percent, plugged)| BatteryInfo { percent, plugged }))
}

/* ----------------------------------- Wi-Fi --------------------------------- */

#[tauri::command]
pub fn wifi_ssid() -> Result<Option<String>, String> {
    let out = hidden_command("netsh")
        .args(["wlan", "show", "interfaces"])
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&out.stdout);
    for line in text.lines() {
        let t = line.trim();
        if let Some(rest) = t.strip_prefix("SSID") {
            let rest = rest.trim_start();
            if let Some(v) = rest.strip_prefix(':') {
                let v = v.trim();
                if !v.is_empty() && !v.eq_ignore_ascii_case("BSSID") {
                    return Ok(Some(v.to_string()));
                }
            }
        }
    }
    Ok(None)
}

/* --------------------------------- reiniciar ------------------------------- */

#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

/* ------------------------------ brilho (WMI) ------------------------------- */

/// Brilho via WMI (WmiMonitorBrightness). Funciona em telas internas de laptop;
/// monitores externos/desktop geralmente não expõem o método — retorna erro e o
/// frontend degrada o slider para "não suportado".
/// Brilho via WMI (WmiMonitorBrightness), orquestrado por PowerShell para não
/// depender da API exata do crate wmi. Funciona em telas internas de laptop;
/// monitores externos/desktop geralmente não expõem o método — retorna erro e o
/// frontend degrada o slider para "não suportado".
#[cfg(windows)]
mod brightness {
    use crate::proc::hidden_command;

    fn run(script: &str) -> Result<String, String> {
        let out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .output()
            .map_err(|e| format!("powershell: {e}"))?;
        if out.status.success() {
            Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
        } else {
            Err(format!("wmi brilho: {}", String::from_utf8_lossy(&out.stderr)))
        }
    }

    pub fn get() -> Result<u8, String> {
        let text = run("(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction Stop | Select-Object -First 1).CurrentBrightness")?;
        text.parse::<u8>().map_err(|_| "nenhum monitor com controle de brilho".to_string())
    }

    pub fn set(level: u8) -> Result<(), String> {
        run(&format!(
            "$m = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightnessMethods -ErrorAction Stop | Select-Object -First 1; Invoke-CimMethod -InputObject $m -MethodName WmiSetBrightness -Arguments @{{ Timeout = 0; Brightness = {level} }} -ErrorAction Stop | Out-Null"
        ))?;
        Ok(())
    }
}

#[tauri::command]
pub fn get_brightness() -> Result<u8, String> {
    #[cfg(windows)]
    {
        brightness::get()
    }
    #[cfg(not(windows))]
    {
        Err("brilho só é suportado no Windows".into())
    }
}

#[tauri::command]
pub fn set_brightness(level: u8) -> Result<(), String> {
    #[cfg(windows)]
    {
        brightness::set(level.min(100))
    }
    #[cfg(not(windows))]
    {
        let _ = level;
        Err("brilho só é suportado no Windows".into())
    }
}

/* ------------------------- Safari: webview dedicada ------------------------ */

/// Abre uma URL numa janela webview dedicada (navegação real, sem o limite de
/// X-Frame-Options do iframe). Reutiliza a janela "browser" se já estiver aberta.
#[tauri::command]
pub fn open_browser(app: tauri::AppHandle, url: String, title: Option<String>) -> Result<(), String> {
    use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

    let parsed = url::Url::parse(&url).map_err(|e| format!("URL inválida: {e}"))?;

    // Reutiliza a janela se já existe — só navega para a nova URL.
    if let Some(win) = app.get_webview_window("browser") {
        let _ = win.eval(&format!("window.location.href = {}", serde_json::to_string(&url).unwrap()));
        let _ = win.set_focus();
        return Ok(());
    }

    WebviewWindowBuilder::new(&app, "browser", WebviewUrl::External(parsed))
        .title(title.unwrap_or_else(|| "Safari".to_string()))
        .inner_size(1080.0, 700.0)
        .center()
        .build()
        .map_err(|e| format!("abrir navegador: {e}"))?;
    Ok(())
}

/* --------------------------- volume (Core Audio) --------------------------- */

#[cfg(windows)]
mod volume {
    use windows::core::Result;
    use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
    use windows::Win32::Media::Audio::{eConsole, eRender, IMMDeviceEnumerator, MMDeviceEnumerator};
    use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED};

    unsafe fn endpoint() -> Result<IAudioEndpointVolume> {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
        device.Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None)
    }

    pub fn get() -> Result<u8> {
        unsafe {
            let ep = endpoint()?;
            let v = ep.GetMasterVolumeLevelScalar()?;
            Ok((v * 100.0).round() as u8)
        }
    }

    pub fn set(level: u8) -> Result<()> {
        unsafe {
            let ep = endpoint()?;
            ep.SetMasterVolumeLevelScalar(level.min(100) as f32 / 100.0, std::ptr::null())
        }
    }
}

#[tauri::command]
pub fn get_volume() -> Result<u8, String> {
    #[cfg(windows)]
    {
        volume::get().map_err(|e| format!("volume: {e}"))
    }
    #[cfg(not(windows))]
    {
        Err("volume só é suportado no Windows".into())
    }
}

#[tauri::command]
pub fn set_volume(level: u8) -> Result<(), String> {
    #[cfg(windows)]
    {
        volume::set(level).map_err(|e| format!("volume: {e}"))
    }
    #[cfg(not(windows))]
    {
        let _ = level;
        Err("volume só é suportado no Windows".into())
    }
}
