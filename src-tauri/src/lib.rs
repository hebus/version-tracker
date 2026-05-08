mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::fetch_versions::fetch_package_versions,
            commands::config::get_config,
            commands::config::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
