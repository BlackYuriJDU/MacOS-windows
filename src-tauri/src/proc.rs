//! Helper para spawnar processos de console (powershell, winget, netsh) sem abrir
//! uma janela de terminal visível.
//!
//! No Windows, quando um app GUI (windows_subsystem = "windows") cria um processo
//! de console sem o flag CREATE_NO_WINDOW, o sistema abre uma janela de console
//! visível — era a causa dos "terminais abrindo do nada". Centralizamos aqui.

use std::process::Command;

/// Cria um `Command` que NÃO abre janela de console no Windows.
/// Em outras plataformas, equivale a `Command::new` normal.
pub fn hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}
