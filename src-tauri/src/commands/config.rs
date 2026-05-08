use serde::{Deserialize, Serialize};
use tauri::command;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PackageGroup {
    pub id: String,
    pub name: String,
    pub packages: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    #[serde(rename = "verdaccioUrl")]
    pub verdaccio_url: String,
    #[serde(rename = "refreshInterval")]
    pub refresh_interval: u64,
    pub groups: Vec<PackageGroup>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            verdaccio_url: "https://npm.sinequa.com".to_string(),
            refresh_interval: 3600,
            groups: vec![PackageGroup {
                id: "default".to_string(),
                name: "Général".to_string(),
                packages: vec![],
            }],
        }
    }
}

#[command]
pub fn get_config(app: tauri::AppHandle) -> Result<Config, String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    let config = store
        .get("config")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(config)
}

#[command]
pub fn save_config(app: tauri::AppHandle, config: Config) -> Result<(), String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    store.set(
        "config",
        serde_json::to_value(&config).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}
