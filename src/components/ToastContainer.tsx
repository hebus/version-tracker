import { useState, useEffect } from "react";
import { X, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Toast } from "../hooks/useToast";

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const parts: string[] = [];
  if (toast.npmVersion) parts.push(`npmjs → ${toast.npmVersion}`);
  if (toast.verdaccioVersion) parts.push(`Verdaccio → ${toast.verdaccioVersion}`);

  return (
    <div
      role="status"
      style={{
        transform: visible ? "translateX(0)" : "translateX(calc(100% + 1rem))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
      }}
      className="w-72 bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-3 flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0 text-blue-500">
          <ArrowUpCircle size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">
            Nouvelle version
            <span className="font-normal text-muted-foreground"> · {toast.packageName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {parts.join(" | ")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          aria-label="Fermer"
          className="shrink-0 -mt-0.5 -mr-1 text-muted-foreground"
        >
          <X />
        </Button>
      </div>
      <div className="h-0.5 bg-muted">
        <div
          className="h-full bg-blue-500"
          style={{ animation: "toastProgress 5s linear forwards" }}
        />
      </div>
    </div>
  );
}

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
