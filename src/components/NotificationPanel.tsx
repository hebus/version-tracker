import { useEffect, useRef } from "react";
import { X, Bell, CheckCheck, ArrowUpCircle } from "lucide-react";
import type { StoredNotification } from "../types";
import { timeAgo } from "../types";

interface Props {
  notifications: StoredNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onRemove,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
      style={{ maxHeight: "420px" }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors"
            title="Tout marquer comme lu"
          >
            <CheckCheck size={12} />
            Tout lire
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
          <Bell size={20} className="opacity-40" />
          <span className="text-xs">Aucune notification</span>
        </div>
      ) : (
        <ul className="overflow-y-auto flex-1">
          {notifications.map((n) => {
            const parts: string[] = [];
            if (n.event.npmVersion) parts.push(`npmjs → ${n.event.npmVersion}`);
            if (n.event.verdaccioVersion) parts.push(`Verdaccio → ${n.event.verdaccioVersion}`);

            return (
              <li
                key={n.id}
                onClick={() => !n.read && onMarkRead(n.id)}
                className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors group ${
                  n.read ? "" : "bg-blue-50"
                }`}
              >
                {!n.read && (
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
                {n.read && <span className="mt-1 shrink-0 w-1.5 h-1.5" />}
                <div className="mt-0.5 shrink-0 text-blue-400">
                  <ArrowUpCircle size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {n.event.packageName}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{parts.join(" | ")}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(n.id);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all mt-0.5"
                  title="Supprimer"
                >
                  <X size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
