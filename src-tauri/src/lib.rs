use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState},
    Manager, WindowEvent,
};

fn toggle_main_window(app_handle: &tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        let is_minimized = window.is_minimized().unwrap_or(false);

        if is_visible && !is_minimized {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
    }
}

fn toggle_widget_window(app_handle: &tauri::AppHandle) {
    if let Some(widget) = app_handle.get_webview_window("widget") {
        let is_visible = widget.is_visible().unwrap_or(false);
        let is_minimized = widget.is_minimized().unwrap_or(false);

        if is_visible && !is_minimized {
            let _ = widget.hide();
        } else {
            let _ = widget.show();
            let _ = widget.unminimize();
            let _ = widget.set_focus();
        }
    } else {
        let _ = tauri::WebviewWindowBuilder::new(
            app_handle,
            "widget",
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title("Widget Secretária - Vigilâncias")
        .inner_size(400.0, 520.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(true)
        .center()
        .build();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let toggle = MenuItem::with_id(app, "toggle", "Mostrar / Ocultar App Completa", true, None::<&str>)?;
            let toggle_widget = MenuItem::with_id(app, "toggle_widget", "Mostrar / Ocultar Widget Flutuante", true, None::<&str>)?;
            let always_top = MenuItem::with_id(app, "always_top", "Fixar App Completa por Cima", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Sair de Vigilâncias", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &toggle_widget, &always_top, &quit])?;

            let tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app_handle, event| {
                    match event.id.as_ref() {
                        "toggle" => {
                            toggle_main_window(app_handle);
                        }
                        "toggle_widget" => {
                            toggle_widget_window(app_handle);
                        }
                        "always_top" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let is_top = window.is_always_on_top().unwrap_or(false);
                                let _ = window.set_always_on_top(!is_top);
                            }
                        }
                        "quit" => {
                            app_handle.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        toggle_main_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                let _ = tray_builder.icon(icon.clone()).build(app)?;
            } else {
                let _ = tray_builder.build(app)?;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Ao fechar a janela, oculta para a barra de tarefas (system tray)
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())?;
    Ok(())
}

