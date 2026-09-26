// Evita janela de console extra em release no Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    macos_windows_lib::run()
}
