import { useState, useCallback } from "react";
import { Settings as SettingsIcon, Bell } from "lucide-react";
import { SearchBar } from "./components/SearchBar";
import { PackageTable } from "./components/PackageTable";
import { Settings } from "./components/Settings";
import { ToastContainer } from "./components/ToastContainer";
import { NotificationPanel } from "./components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useConfig } from "./hooks/useConfig";
import { usePackageVersions } from "./hooks/usePackageVersions";
import { useToast } from "./hooks/useToast";
import { useNotifications } from "./hooks/useNotifications";
import { useUpdater } from "./hooks/useUpdater";
import { UpdateBanner } from "./components/UpdateBanner";
import type { VersionEvent } from "./types";

export default function App() {
  const { config, loading, saveConfig } = useConfig();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();
  const updater = useUpdater();
  const { notifications, addNotification, markRead, markAllRead, remove, unreadCount } =
    useNotifications();

  const handleVersionEvent = useCallback(
    (event: VersionEvent) => {
      addToast(event);
      addNotification(event);
    },
    [addToast, addNotification],
  );

  const queryMap = usePackageVersions(config, handleVersionEvent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!updater.dismissed && (
        <UpdateBanner
          status={updater.status}
          version={updater.version}
          progress={updater.progress}
          error={updater.error}
          onInstall={updater.install}
          onDismiss={updater.dismiss}
        />
      )}
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Version Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">@sinequa — npmjs vs Verdaccio</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />

          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground"
                  title="Notifications"
                  aria-label="Notifications"
                />
              }
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </PopoverTrigger>
            <NotificationPanel
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onRemove={remove}
            />
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground"
            title="Paramètres"
            aria-label="Paramètres"
          >
            <SettingsIcon className="size-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 py-6">
        <PackageTable queryMap={queryMap} config={config} search={search} />
      </main>

      {showSettings && (
        <Settings
          config={config}
          onSave={saveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
