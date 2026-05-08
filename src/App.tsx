import { useState, useCallback } from "react";
import { Settings as SettingsIcon, Bell } from "lucide-react";
import { SearchBar } from "./components/SearchBar";
import { PackageTable } from "./components/PackageTable";
import { Settings } from "./components/Settings";
import { ToastContainer } from "./components/ToastContainer";
import { NotificationPanel } from "./components/NotificationPanel";
import { useConfig } from "./hooks/useConfig";
import { usePackageVersions } from "./hooks/usePackageVersions";
import { useToast } from "./hooks/useToast";
import { useNotifications } from "./hooks/useNotifications";
import type { VersionEvent } from "./types";

export default function App() {
  const { config, loading, saveConfig } = useConfig();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();
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
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Version Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">@sinequa — npmjs vs Verdaccio</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onRemove={remove}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            title="Paramètres"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
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
