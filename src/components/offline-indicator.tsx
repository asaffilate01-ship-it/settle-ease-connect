import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CloudOff, CloudUpload, RefreshCw } from "lucide-react";
import { flushQueue, listQueue, subscribeQueue, type OfflineItem } from "@/lib/offline-queue";

/**
 * Small floating pill that appears when the browser is offline or has queued
 * items waiting to sync. Non-intrusive: hidden entirely when online + empty.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<OfflineItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const refresh = () => {
      listQueue().then(setItems).catch(() => setItems([]));
    };
    refresh();
    const unsub = subscribeQueue(refresh);
    const iv = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsub();
      clearInterval(iv);
    };
  }, []);

  const count = items.length;
  if (online && count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/60 bg-card/95 px-4 py-2 text-sm shadow-elevated backdrop-blur">
        {!online ? (
          <>
            <CloudOff className="h-4 w-4 text-warning" aria-hidden />
            <span className="font-medium">Offline</span>
          </>
        ) : (
          <>
            <CloudUpload className="h-4 w-4 text-primary" aria-hidden />
            <span className="font-medium">Ready to sync</span>
          </>
        )}
        {count > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {count} queued
          </span>
        )}
        {online && count > 0 && (
          <button
            type="button"
            onClick={async () => {
              setSyncing(true);
              try {
                await flushQueue();
              } finally {
                setSyncing(false);
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-semibold hover:bg-accent/10"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} /> Sync now
          </button>
        )}
        <Link
          to="/offline"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
