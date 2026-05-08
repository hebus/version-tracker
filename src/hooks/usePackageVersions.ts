import { useEffect, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import type { Config, PackageVersions, VersionEvent } from "../types";
import { allPackages } from "../types";

export type VersionQueryMap = Map<string, UseQueryResult<PackageVersions>>;

export function usePackageVersions(
  config: Config,
  onEvent: (event: VersionEvent) => void,
): VersionQueryMap {
  const packages = allPackages(config);
  const prevRef = useRef<Record<string, { npm: string | null; verdaccio: string | null }>>({});

  const queries = useQueries({
    queries: packages.map((pkg) => ({
      queryKey: ["package", pkg, config.verdaccioUrl],
      queryFn: () =>
        invoke<PackageVersions>("fetch_package_versions", {
          package: pkg,
          verdaccioUrl: config.verdaccioUrl,
        }),
      refetchInterval: config.refreshInterval * 1000,
      staleTime: 0,
    })),
  });

  const updatedAtKey = queries.map((q) => q.dataUpdatedAt).join(",");

  useEffect(() => {
    queries.forEach((query) => {
      if (!query.data || query.isFetching) return;
      const { name, npm, verdaccio } = query.data;
      const prev = prevRef.current[name];

      if (prev) {
        const npmChanged = prev.npm !== npm.latest && npm.latest !== null;
        const verdaccioChanged =
          prev.verdaccio !== verdaccio.latest && verdaccio.latest !== null;

        if (npmChanged || verdaccioChanged) {
          onEvent({
            type: "new_version",
            packageName: name,
            npmVersion: npmChanged ? npm.latest : null,
            verdaccioVersion: verdaccioChanged ? verdaccio.latest : null,
          });
        }
      }

      prevRef.current[name] = { npm: npm.latest, verdaccio: verdaccio.latest };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedAtKey]);

  const map: VersionQueryMap = new Map();
  packages.forEach((pkg, i) => map.set(pkg, queries[i]));
  return map;
}
