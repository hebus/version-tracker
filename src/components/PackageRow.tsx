import { useState } from "react";
import { RefreshCw, ChevronDown, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { computeStatus, computeVersionStatus } from "../types";
import type { PackageVersions, PackageStatus, TagInfo } from "../types";

interface Props {
  versions: PackageVersions;
  isLoading: boolean;
  verdaccioUrl: string;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<PackageStatus, { label: string; className: string }> = {
  synced:            { label: "Synchronisé",         className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  "npm-ahead":       { label: "npmjs en avance",     className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  "verdaccio-ahead": { label: "Verdaccio en avance", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  "npm-only":        { label: "Absent de Verdaccio", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  "verdaccio-only":  { label: "Absent de npmjs",     className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  error:             { label: "Erreur",              className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  loading:           { label: "Chargement...",       className: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: PackageStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cn("h-auto", className)}>
      {label}
    </Badge>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function VersionCell({
  info,
  isLoading,
  url,
  registryLabel,
}: {
  info: { latest: string | null; error: string | null };
  isLoading: boolean;
  url: string;
  registryLabel: string;
}) {
  if (isLoading) return <span className="text-muted-foreground text-sm">...</span>;
  if (info.error === "not_found")
    return <span className="text-muted-foreground text-sm italic">Absent</span>;
  if (info.error)
    return (
      <span className="text-destructive text-sm" title={info.error}>
        Erreur
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-sm font-medium">{info.latest ?? "—"}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => openUrl(url)}
        className="text-muted-foreground"
        title={`Ouvrir sur ${registryLabel}`}
        aria-label={`Ouvrir sur ${registryLabel}`}
      >
        <ExternalLink />
      </Button>
    </span>
  );
}

// Row for extra tags (non-latest)
function TagRow({
  tag,
  npmTag,
  verdaccioTag,
}: {
  tag: string;
  npmTag: TagInfo | undefined;
  verdaccioTag: TagInfo | undefined;
}) {
  const status = computeVersionStatus(npmTag?.version, verdaccioTag?.version);

  return (
    <TableRow className="bg-muted/30 text-sm">
      <TableCell className="py-1.5 px-4 pl-10">
        <Badge
          variant="secondary"
          className="h-auto rounded px-1.5 font-mono text-muted-foreground"
        >
          {tag}
        </Badge>
      </TableCell>
      <TableCell className="py-1.5 px-4">
        <span className="font-mono text-xs">{npmTag?.version ?? "—"}</span>
      </TableCell>
      <TableCell className="py-1.5 px-4 text-xs text-muted-foreground">
        {formatDate(npmTag?.publishedAt ?? null)}
      </TableCell>
      <TableCell className="py-1.5 px-4">
        <span className="font-mono text-xs">{verdaccioTag?.version ?? "—"}</span>
      </TableCell>
      <TableCell className="py-1.5 px-4 text-xs text-muted-foreground">
        {formatDate(verdaccioTag?.publishedAt ?? null)}
      </TableCell>
      <TableCell className="py-1.5 px-4">
        <StatusBadge status={status} />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

export function PackageRow({ versions, isLoading, verdaccioUrl, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);

  const npmUrl = `https://www.npmjs.com/package/${versions.name}`;
  const verdaccioPackageUrl = `${verdaccioUrl.replace(/\/+$/, "")}/-/web/detail/${versions.name}`;

  const status: PackageStatus = isLoading ? "loading" : computeStatus(versions);

  // Collect all tags except "latest" from both registries
  const allTagNames = [
    ...new Set([
      ...(versions.npm.tags ?? []).filter((t) => t.tag !== "latest").map((t) => t.tag),
      ...(versions.verdaccio.tags ?? []).filter((t) => t.tag !== "latest").map((t) => t.tag),
    ]),
  ].sort();

  const hasExtraTags = allTagNames.length > 0;

  return (
    <>
      {/* Main row — latest */}
      <TableRow>
        <TableCell className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            {hasExtraTags && !isLoading && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                className="text-muted-foreground"
                title={expanded ? "Réduire" : `Voir tous les tags (${allTagNames.length} autres)`}
                aria-label={expanded ? "Réduire les tags" : "Voir tous les tags"}
              >
                <ChevronDown
                  className={cn("transition-transform duration-200", !expanded && "-rotate-90")}
                />
              </Button>
            )}
            <span className="font-mono text-sm font-medium">{versions.name}</span>
          </div>
        </TableCell>

        {/* npmjs latest */}
        <TableCell className="py-3 px-4">
          <VersionCell
            info={versions.npm}
            isLoading={isLoading}
            url={npmUrl}
            registryLabel="npmjs"
          />
        </TableCell>
        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
          {isLoading ? "" : formatDate(versions.npm.publishedAt)}
        </TableCell>

        {/* Verdaccio latest */}
        <TableCell className="py-3 px-4">
          <VersionCell
            info={versions.verdaccio}
            isLoading={isLoading}
            url={verdaccioPackageUrl}
            registryLabel="Verdaccio"
          />
        </TableCell>
        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
          {isLoading ? "" : formatDate(versions.verdaccio.publishedAt)}
        </TableCell>

        <TableCell className="py-3 px-4">
          <StatusBadge status={status} />
        </TableCell>

        <TableCell className="py-3 px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-muted-foreground"
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={cn(isLoading && "animate-spin")} />
          </Button>
        </TableCell>
      </TableRow>

      {/* Extra tag rows */}
      {expanded &&
        allTagNames.map((tag) => (
          <TagRow
            key={tag}
            tag={tag}
            npmTag={(versions.npm.tags ?? []).find((t) => t.tag === tag)}
            verdaccioTag={(versions.verdaccio.tags ?? []).find((t) => t.tag === tag)}
          />
        ))}
    </>
  );
}
