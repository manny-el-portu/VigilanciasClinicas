use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use serde_json::{json, Value};
use chrono::Utc;

fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push("data");
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    path.push("vigilancias_db.json");
    Ok(path)
}

fn ensure_db_exists(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    if !path.exists() {
        let initial_db = json!({
            "patients": [],
            "surveillanceItems": [],
            "settings": {
                "autostartWindows": true,
                "startMinimizedTray": true,
                "desktopNotifications": true,
                "notificationSound": true,
                "leadDaysNotice": 30,
                "autoCheckIntervalMinutes": 60,
                "clinicalNoteTemplateFormat": "compact"
            },
            "customPresets": [],
            "lastSaved": Utc::now().to_rfc3339()
        });
        let formatted = serde_json::to_string_pretty(&initial_db).map_err(|e| e.to_string())?;
        fs::write(path, formatted).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn load_db(app: AppHandle) -> Result<Value, String> {
    let db_path = get_db_path(&app)?;
    ensure_db_exists(&db_path)?;

    match fs::read_to_string(&db_path) {
        Ok(contents) => {
            let parsed: Value = serde_json::from_str(&contents).unwrap_or(json!({}));
            Ok(json!({
                "data": parsed,
                "storagePath": db_path.to_string_lossy().to_string()
            }))
        }
        Err(e) => Err(format!("Erro ao ler ficheiro de dados: {}", e)),
    }
}

#[tauri::command]
pub async fn save_db(
    app: AppHandle,
    patients: Value,
    surveillance_items: Value,
    settings: Value,
    custom_presets: Value,
) -> Result<Value, String> {
    let db_path = get_db_path(&app)?;
    let iso_timestamp = Utc::now().to_rfc3339();

    let payload = json!({
        "patients": patients,
        "surveillanceItems": surveillance_items,
        "settings": settings,
        "customPresets": custom_presets,
        "lastSaved": iso_timestamp
    });

    let formatted = serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())?;
    fs::write(&db_path, formatted).map_err(|e| format!("Erro ao guardar dados no disco: {}", e))?;

    Ok(json!({
        "success": true,
        "lastSaved": iso_timestamp,
        "storagePath": db_path.to_string_lossy().to_string()
    }))
}
