import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Config } from "../types";

const DEFAULT_CONFIG: Config = {
  verdaccioUrl: "https://npm.sinequa.com",
  refreshInterval: 3600,
  groups: [{ id: "default", name: "Général", packages: [] }],
};

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<Config>("get_config")
      .then((c) => setConfig(c))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveConfig = async (newConfig: Config) => {
    await invoke("save_config", { config: newConfig });
    setConfig(newConfig);
  };

  return { config, loading, saveConfig };
}
