use serde::Serialize;

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
    let out = std::process::Command::new("netsh")
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
