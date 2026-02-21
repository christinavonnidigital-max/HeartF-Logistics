import React, { useMemo, useState } from "react";
import { BellIcon } from "./icons/lucide";
import { ShellCard, StatusPill } from "./UiKit";
import { useData } from "../contexts/DataContext";

const NotificationsBell: React.FC = () => {
  const { notifications } = useData();
  const [open, setOpen] = useState(false);

  const queuedCount = useMemo(
    () => notifications.filter((n: any) => n.status === "queued").length,
    [notifications]
  );
  const latest = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted/60"
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className="h-4 w-4 text-foreground" />
        {queuedCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
            {queuedCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-40">
          <ShellCard className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Notifications</div>
              {queuedCount > 0 && <StatusPill tone="info" label={`${queuedCount} queued`} />}
            </div>
            {latest.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {latest.map((n: any) => (
                  <div key={n.id} className="rounded-lg border border-border px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                      <span>{n.type}</span>
                      <StatusPill
                        tone={n.status === "sent" ? "success" : n.status === "failed" ? "danger" : "info"}
                        label={n.status}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {n.payload?.booking_number || n.payload?.invoice_number || n.entity_id || "Item"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ShellCard>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
