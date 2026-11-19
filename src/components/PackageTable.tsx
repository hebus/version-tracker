import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
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

function GroupSection({ group, queryMap, verdaccioUrl, search, onRefresh }: GroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const filtered = group.packages.filter(
    (pkg) => !search || pkg.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0 && search) return null;

  return (
    <>
      <TableRow className="bg-muted/60 hover:bg-muted/60">
        <TableCell colSpan={7} className="py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            className="h-auto -ml-2 px-2 py-1 gap-2 font-semibold"
          >
            <ChevronDown
              className={cn("transition-transform duration-200", collapsed && "-rotate-90")}
            />
            {group.name}
            <span className="font-normal text-muted-foreground">
              ({filtered.length} package{filtered.length > 1 ? "s" : ""})
            </span>
          </Button>
        </TableCell>
      </TableRow>

      {!collapsed &&
        filtered.map((pkg) => {
          const query = queryMap.get(pkg);
          return (
            <PackageRow
              key={pkg}
              versions={query?.data ?? EMPTY_VERSIONS(pkg)}
              isLoading={query?.isFetching ?? true}
              verdaccioUrl={verdaccioUrl}
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
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Aucun package configuré</p>
        <p className="text-sm mt-1">
          Ouvre les paramètres pour ajouter des groupes et des packages à surveiller.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
        <span className="text-sm text-muted-foreground">
          {config.groups.length} groupe{config.groups.length > 1 ? "s" : ""} —{" "}
          {totalPackages} package{totalPackages > 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetchAll}
          className="text-muted-foreground"
        >
          <RefreshCw />
          Tout rafraîchir
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="text-xs text-muted-foreground uppercase tracking-wide bg-muted/20 hover:bg-muted/20">
            <TableHead className="h-auto py-2 px-4 font-medium">Package</TableHead>
            <TableHead className="h-auto py-2 px-4 font-medium">npmjs</TableHead>
            <TableHead className="h-auto py-2 px-4 font-medium">Publié</TableHead>
            <TableHead className="h-auto py-2 px-4 font-medium">Verdaccio</TableHead>
            <TableHead className="h-auto py-2 px-4 font-medium">Publié</TableHead>
            <TableHead className="h-auto py-2 px-4 font-medium">Statut</TableHead>
            <TableHead className="h-auto py-2 px-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </div>
  );
}
