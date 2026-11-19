import { Download, RefreshCw, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <Alert
      variant={failed ? "destructive" : "default"}
      className={cn(
        "flex items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-6 py-2 text-xs",
        !failed && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300",
      )}
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
          <Button size="xs" onClick={onInstall}>
            {failed ? "Réessayer" : "Installer et redémarrer"}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            title="Plus tard"
            aria-label="Plus tard"
          >
            <X />
          </Button>
        </div>
      )}
    </Alert>
  );
}
