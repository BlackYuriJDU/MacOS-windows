mod appstore;
mod downloads;
mod focus;
mod fs_cmds;
mod sysinfo_cmds;
mod trash;

#[cfg(desktop)]
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ctrl+Espaço abre o Spotlight de qualquer lugar (registrado aqui, o evento chega ao frontend)
    let builder = match tauri_plugin_global_shortcut::Builder::new().with_shortcuts(["Control+Space"]) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("atalho global indisponível (outra aplicação o usa?): {e}");
            tauri_plugin_global_shortcut::Builder::new()
        }
    };
    let global_shortcut = builder
        .with_handler(|app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                #[cfg(desktop)]
                let _ = app.emit("spotlight-toggle", ());
            }
        })
        .build();

    tauri::Builder::default()
        .plugin(global_shortcut)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fs_cmds::fs_list,
            fs_cmds::fs_read_text,
            fs_cmds::fs_search,
            fs_cmds::home_dir,
            focus::focus_candidates,
            focus::focus_enter,
            focus::focus_exit,
            focus::focus_state,
            sysinfo_cmds::machine_info,
            sysinfo_cmds::battery_status,
            sysinfo_cmds::wifi_ssid,
            sysinfo_cmds::restart_app,
            sysinfo_cmds::get_brightness,
            sysinfo_cmds::set_brightness,
            sysinfo_cmds::get_volume,
            sysinfo_cmds::set_volume,
            sysinfo_cmds::open_browser,
            trash::trash_list,
            trash::trash_move,
            trash::trash_empty,
            appstore::winget_available,
            appstore::store_search,
            appstore::store_install,
            appstore::list_installed_apps,
            appstore::app_icon,
            appstore::launch_app,
            downloads::download_file,
        ])
        .build(tauri::generate_context!())
        .expect("erro ao construir a aplicação Tauri")
        .run(|_app, event| {
            // Rede de segurança: se o app fechar com processos congelados (sem passar pelo
            // fluxo normal de saída), retoma o que puder antes de encerrar.
            if let tauri::RunEvent::Exit = event {
                focus::emergency_resume();
            }
        });
}
