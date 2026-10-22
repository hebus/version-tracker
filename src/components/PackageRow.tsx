import { useState } from "react";
import { RefreshCw, ChevronDown, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { computeStatus, computeVersionStatus } from "../types";
import type { PackageVersions, PackageStatus, TagInfo } from "../types";

interface Props {
  versions: PackageVersions;
  isLoading: boolean;
  verdaccioUrl: string;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<PackageStatus, { label: string; className: string }> = {
  synced:            { label: "Synchronisé",         className: "bg-green-100 text-green-700" },
  "npm-ahead":       { label: "npmjs en avance",     className: "bg-orange-100 text-orange-700" },
  "verdaccio-ahead": { label: "Verdaccio en avance", className: "bg-blue-100 text-blue-700" },
  "npm-only":        { label: "Absent de Verdaccio", className: "bg-yellow-100 text-yellow-700" },
  "verdaccio-only":  { label: "Absent de npmjs",     className: "bg-purple-100 text-purple-700" },
  error:             { label: "Erreur",              className: "bg-red-100 text-red-700" },
  loading:           { label: "Chargement...",       className: "bg-gray-100 text-gray-500" },
};

function StatusBadge({ status }: { status: PackageStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
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
  if (isLoading) return <span className="text-gray-400 text-sm">...</span>;
  if (info.error === "not_found")
    return <span className="text-gray-400 text-sm italic">Absent</span>;
  if (info.error)
    return (
      <span className="text-red-500 text-sm" title={info.error}>
        Erreur
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-sm font-medium text-gray-900">
        {info.latest ?? "—"}
      </span>
      <button
        onClick={() => openUrl(url)}
        className="text-gray-300 hover:text-blue-600 transition-colors"
        title={`Ouvrir sur ${registryLabel}`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
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
    <tr className="border-b border-gray-50 bg-gray-50/40 text-sm">
      <td className="py-1.5 px-4 pl-10">
        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono text-xs">
          {tag}
        </span>
      </td>
      <td className="py-1.5 px-4">
        <span className="font-mono text-xs text-gray-600">{npmTag?.version ?? "—"}</span>
      </td>
      <td className="py-1.5 px-4 text-xs text-gray-400">
        {formatDate(npmTag?.publishedAt ?? null)}
      </td>
      <td className="py-1.5 px-4">
        <span className="font-mono text-xs text-gray-600">{verdaccioTag?.version ?? "—"}</span>
      </td>
      <td className="py-1.5 px-4 text-xs text-gray-400">
        {formatDate(verdaccioTag?.publishedAt ?? null)}
      </td>
      <td className="py-1.5 px-4">
        <StatusBadge status={status} />
      </td>
      <td />
    </tr>
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
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            {hasExtraTags && !isLoading && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                title={expanded ? "Réduire" : `Voir tous les tags (${allTagNames.length} autres)`}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
                />
              </button>
            )}
            <span className="font-mono text-sm font-medium text-gray-800">
              {versions.name}
            </span>
          </div>
        </td>

        {/* npmjs latest */}
        <td className="py-3 px-4">
          <VersionCell
            info={versions.npm}
            isLoading={isLoading}
            url={npmUrl}
            registryLabel="npmjs"
          />
        </td>
        <td className="py-3 px-4 text-sm text-gray-400">
          {isLoading ? "" : formatDate(versions.npm.publishedAt)}
        </td>

        {/* Verdaccio latest */}
        <td className="py-3 px-4">
          <VersionCell
            info={versions.verdaccio}
            isLoading={isLoading}
            url={verdaccioPackageUrl}
            registryLabel="Verdaccio"
          />
        </td>
        <td className="py-3 px-4 text-sm text-gray-400">
          {isLoading ? "" : formatDate(versions.verdaccio.publishedAt)}
        </td>

        <td className="py-3 px-4">
          <StatusBadge status={status} />
        </td>

        <td className="py-3 px-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </td>
      </tr>

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
