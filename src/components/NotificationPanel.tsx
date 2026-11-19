import { X, Bell, CheckCheck, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { StoredNotification } from "../types";
import { timeAgo } from "../types";

interface Props {
  notifications: StoredNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRemove: (id: string) => void;
}

/**
 * Contenu du popover de notifications. Le `<Popover>` et son déclencheur
 * sont dans App.tsx (gestion du focus, Échap et clic extérieur par Base UI).
 */
export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onRemove,
}: Props) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className="w-80 max-h-[420px] gap-0 p-0 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          Notifications
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            >
              {unreadCount}
            </Badge>
          )}
        </span>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onMarkAllRead}
            title="Tout marquer comme lu"
            className="text-muted-foreground"
          >
            <CheckCheck />
            Tout lire
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
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
                className={cn(
                  "flex items-start gap-2.5 px-3 py-2.5 border-b last:border-0 cursor-pointer hover:bg-muted/60 transition-colors group",
                  !n.read && "bg-blue-50 dark:bg-blue-950/30",
                )}
              >
                {!n.read ? (
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                ) : (
                  <span className="mt-1 shrink-0 w-1.5 h-1.5" />
                )}
                <div className="mt-0.5 shrink-0 text-blue-400">
                  <ArrowUpCircle size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{n.event.packageName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{parts.join(" | ")}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(n.id);
                  }}
                  title="Supprimer"
                  aria-label="Supprimer"
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </PopoverContent>
  );
}
