// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::panic;

#[cfg(windows)]
fn show_error_dialog(title: &str, message: &str) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    let title_w: Vec<u16> = OsStr::new(title).encode_wide().chain(std::iter::once(0)).collect();
    let msg_w: Vec<u16> = OsStr::new(message).encode_wide().chain(std::iter::once(0)).collect();
    extern "system" {
        fn MessageBoxW(hwnd: *mut std::ffi::c_void, text: *const u16, caption: *const u16, utype: u32) -> i32;
    }
    unsafe {
        MessageBoxW(std::ptr::null_mut(), msg_w.as_ptr(), title_w.as_ptr(), 0x00000010);
    }
}

fn main() {
    panic::set_hook(Box::new(|info| {
        let msg = info.to_string();
        #[cfg(windows)]
        show_error_dialog("Vigilâncias - Erro Grave", &msg);
        #[cfg(not(windows))]
        eprintln!("Panic: {}", msg);
    }));

    if let Err(e) = vigilancias::run() {
        let err_msg = format!("Erro ao iniciar a aplicação: {}", e);
        #[cfg(windows)]
        show_error_dialog("Vigilâncias - Erro de Inicialização", &err_msg);
        #[cfg(not(windows))]
        eprintln!("{}", err_msg);
    }
}
