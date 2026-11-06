import { Download, RefreshCw, X } from "lucide-react";
import type { UpdaterStatus } from "../hooks/useUpdater";

interface Props {
  status: UpdaterStatus;
  version: string | null;
  progress: number | null;
  error: string | null;
  onInstall: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ status, version, progress, error, onInstall, onDismiss }: Props) {
  if (status === "idle") return null;

  const installing = status === "installing";
  const failed = status === "error";

  return (
    <div
      className={`flex items-center justify-between gap-3 px-6 py-2 border-b text-xs ${
        failed
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-blue-50 border-blue-200 text-blue-700"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {installing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">
          {installing
            ? `Téléchargement de la version ${version}${progress !== null ? ` — ${progress} %` : "…"}`
            : failed
              ? `Échec de la mise à jour vers ${version} : ${error}`
              : `La version ${version} est disponible.`}
        </span>
      </div>

      {!installing && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onInstall}
            className="px-2.5 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {failed ? "Réessayer" : "Installer et redémarrer"}
          </button>
          <button
            onClick={onDismiss}
            title="Plus tard"
            className="p-1 rounded hover:bg-blue-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
