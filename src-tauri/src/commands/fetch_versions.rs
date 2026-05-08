use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TagInfo {
    pub tag: String,
    pub version: String,
    #[serde(rename = "publishedAt")]
    pub published_at: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VersionInfo {
    pub latest: Option<String>,
    #[serde(rename = "publishedAt")]
    pub published_at: Option<String>,
    pub tags: Vec<TagInfo>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PackageVersions {
    pub name: String,
    pub npm: VersionInfo,
    pub verdaccio: VersionInfo,
}

#[derive(Deserialize)]
struct NpmRegistryResponse {
    #[serde(rename = "dist-tags")]
    dist_tags: Option<HashMap<String, String>>,
    time: Option<serde_json::Value>,
}

async fn fetch_from_registry(base_url: &str, package: &str) -> VersionInfo {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return VersionInfo {
                latest: None,
                published_at: None,
                tags: vec![],
                error: Some(e.to_string()),
            }
        }
    };

    let url = format!("{}/{}", base_url.trim_end_matches('/'), package);

    match client.get(&url).send().await {
        Ok(resp) => {
            if resp.status() == 404 {
                return VersionInfo {
                    latest: None,
                    published_at: None,
                    tags: vec![],
                    error: Some("not_found".to_string()),
                };
            }
            if !resp.status().is_success() {
                return VersionInfo {
                    latest: None,
                    published_at: None,
                    tags: vec![],
                    error: Some(format!("HTTP {}", resp.status())),
                };
            }
            match resp.json::<NpmRegistryResponse>().await {
                Ok(data) => {
                    let dist_tags = data.dist_tags.unwrap_or_default();
                    let latest = dist_tags.get("latest").cloned();

                    let pub_date_for = |version: &str| -> Option<String> {
                        data.time.as_ref()?.get(version)?.as_str().map(|s| s.to_string())
                    };

                    let published_at = latest.as_deref().and_then(pub_date_for);

                    // Build tags list: "latest" first, then others sorted alphabetically
                    let mut tags: Vec<TagInfo> = Vec::new();

                    if let Some(ref v) = latest {
                        tags.push(TagInfo {
                            tag: "latest".to_string(),
                            version: v.clone(),
                            published_at: pub_date_for(v),
                        });
                    }

                    let mut other_tags: Vec<(&String, &String)> = dist_tags
                        .iter()
                        .filter(|(k, _)| k.as_str() != "latest")
                        .collect();
                    other_tags.sort_by_key(|(k, _)| k.as_str());

                    for (tag_name, version) in other_tags {
                        tags.push(TagInfo {
                            tag: tag_name.clone(),
                            version: version.clone(),
                            published_at: pub_date_for(version),
                        });
                    }

                    VersionInfo {
                        latest,
                        published_at,
                        tags,
                        error: None,
                    }
                }
                Err(e) => VersionInfo {
                    latest: None,
                    published_at: None,
                    tags: vec![],
                    error: Some(e.to_string()),
                },
            }
        }
        Err(e) => VersionInfo {
            latest: None,
            published_at: None,
            tags: vec![],
            error: Some(e.to_string()),
        },
    }
}

#[command]
pub async fn fetch_package_versions(
    package: String,
    verdaccio_url: String,
) -> Result<PackageVersions, String> {
    let (npm, verdaccio) = tokio::join!(
        fetch_from_registry("https://registry.npmjs.org", &package),
        fetch_from_registry(&verdaccio_url, &package),
    );
    Ok(PackageVersions {
        name: package,
        npm,
        verdaccio,
    })
}
