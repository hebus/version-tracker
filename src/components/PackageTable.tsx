import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, RefreshCw } from "lucide-react";
import { PackageRow } from "./PackageRow";
import type { PackageGroup, PackageVersions, Config } from "../types";
import type { VersionQueryMap } from "../hooks/usePackageVersions";

const EMPTY_VERSIONS = (name: string): PackageVersions => ({
  name,
  npm: { latest: null, publishedAt: null, tags: [], error: null },
  verdaccio: { latest: null, publishedAt: null, tags: [], error: null },
});

interface GroupSectionProps {
  group: PackageGroup;
  queryMap: VersionQueryMap;
  verdaccioUrl: string;
  search: string;
  onRefresh: (pkg: string) => void;
}

function GroupSection({ group, queryMap, search, onRefresh }: GroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const filtered = group.packages.filter(
    (pkg) => !search || pkg.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0 && search) return null;

  return (
    <>
      <tr className="bg-blue-50/60 border-y border-blue-100">
        <td colSpan={7} className="py-2 px-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
            />
            {group.name}
            <span className="font-normal text-blue-400">
              ({filtered.length} package{filtered.length > 1 ? "s" : ""})
            </span>
          </button>
        </td>
      </tr>

      {!collapsed &&
        filtered.map((pkg) => {
          const query = queryMap.get(pkg);
          return (
            <PackageRow
              key={pkg}
              versions={query?.data ?? EMPTY_VERSIONS(pkg)}
              isLoading={query?.isFetching ?? true}
              onRefresh={() => onRefresh(pkg)}
            />
          );
        })}
    </>
  );
}

interface Props {
  queryMap: VersionQueryMap;
  config: Config;
  search: string;
}

export function PackageTable({ queryMap, config, search }: Props) {
  const queryClient = useQueryClient();

  const refetchAll = () => {
    config.groups.forEach((group) =>
      group.packages.forEach((pkg) =>
        queryClient.invalidateQueries({
          queryKey: ["package", pkg, config.verdaccioUrl],
        }),
      ),
    );
  };

  const totalPackages = (config.groups ?? []).reduce((n, g) => n + (g.packages?.length ?? 0), 0);

  if (totalPackages === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">Aucun package configuré</p>
        <p className="text-sm mt-1">
          Ouvre les paramètres pour ajouter des groupes et des packages à surveiller.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm text-gray-500">
          {config.groups.length} groupe{config.groups.length > 1 ? "s" : ""} —{" "}
          {totalPackages} package{totalPackages > 1 ? "s" : ""}
        </span>
        <button
          onClick={refetchAll}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tout rafraîchir
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
            <th className="py-2 px-4 text-left font-medium">Package</th>
            <th className="py-2 px-4 text-left font-medium">npmjs</th>
            <th className="py-2 px-4 text-left font-medium">Publié</th>
            <th className="py-2 px-4 text-left font-medium">Verdaccio</th>
            <th className="py-2 px-4 text-left font-medium">Publié</th>
            <th className="py-2 px-4 text-left font-medium">Statut</th>
            <th className="py-2 px-4" />
          </tr>
        </thead>
        <tbody>
          {(config.groups ?? []).map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              queryMap={queryMap}
              verdaccioUrl={config.verdaccioUrl}
              search={search}
              onRefresh={(pkg) =>
                queryClient.invalidateQueries({
                  queryKey: ["package", pkg, config.verdaccioUrl],
                })
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
