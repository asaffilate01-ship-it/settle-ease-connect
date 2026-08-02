import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  clearQueue,
  flushQueue,
  listQueue,
  removeItem,
  subscribeQueue,
  type OfflineItem,
} from "@/lib/offline-queue";
import {
  CloudOff,
  CloudUpload,
  RefreshCw,
  Trash2,
  WifiOff,
  HardDriveDownload,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "Offline mode & sync queue — BeistandPlus" },
      {
        name: "description",
        content:
          "BeistandPlus keeps working without a connection. Fill forms, take notes and draft uploads offline — everything syncs automatically the moment you're back on Wi-Fi or mobile data.",
      },
      { property: "og:title", content: "Offline mode & sync queue — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Designed for camps, rural areas and prepaid SIMs: your forms and drafts stay safe on-device and sync when you reconnect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OfflinePage,
});

function OfflinePage() {
  const [items, setItems] = useState<OfflineItem[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const refresh = () =>
      listQueue()
        .then(setItems)
        .catch(() => setItems([]));
    refresh();
    const unsub = subscribeQueue(refresh);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      unsub();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await flushQueue();
      if (res.ok > 0) toast.success(`Synced ${res.ok} item${res.ok === 1 ? "" : "s"}.`);
      if (res.failed > 0)
        toast.error(`${res.failed} item${res.failed === 1 ? "" : "s"} still pending — will retry.`);
      if (res.ok === 0 && res.failed === 0) toast.message("Nothing to sync right now.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_15%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            <WifiOff className="h-3.5 w-3.5" /> Built for weak signal
          </div>
          <h1 className="display-hero text-balance mt-4 font-semibold">
            Works offline. <span className="text-teal">Syncs when you're back.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            You should not have to lose a form because the Bürgeramt has no Wi-Fi, the camp router
            is down, or your prepaid data ran out. BeistandPlus keeps your work on-device and pushes
            it up the moment you reconnect.
          </p>
        </div>
      </section>

      {/* Queue status */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            {online ? (
              <CloudUpload className="h-5 w-5 text-primary" />
            ) : (
              <CloudOff className="h-5 w-5 text-warning" />
            )}
            <div>
              <div className="font-display text-base font-semibold">
                {online ? "Online" : "Offline"} · {items.length} item{items.length === 1 ? "" : "s"}{" "}
                queued
              </div>
              <p className="text-xs text-muted-foreground">
                Everything below is stored only on this device until it syncs.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!online || syncing || items.length === 0}
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={items.length === 0}
              onClick={async () => {
                await clearQueue();
                toast.success("Queue cleared.");
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-parchment/40 p-8 text-center text-sm text-muted-foreground">
            No queued items. When you submit a form without a connection, it will appear here.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {item.kind.replace(/_/g, " ")}
                    </span>
                    <span className="font-display text-sm font-semibold">{item.label}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Saved {new Date(item.createdAt).toLocaleString()}
                    {item.attempts > 0 &&
                      ` · ${item.attempts} retry attempt${item.attempts === 1 ? "" : "s"}`}
                  </div>
                  {item.lastError && (
                    <div className="mt-1 text-xs text-destructive">
                      Last error: {item.lastError}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 rounded-full border border-border/60 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove from queue"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How it works */}
      <section className="bg-parchment/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
            How it works
          </div>
          <h2 className="display-lg text-balance mt-3 font-semibold">
            Your data stays with you until it's safe to send.
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Feature icon={HardDriveDownload} title="Stored on-device">
              Forms, notes and drafts are written to encrypted browser storage (IndexedDB) — never
              to a shared cache.
            </Feature>
            <Feature icon={RefreshCw} title="Auto-sync on reconnect">
              The moment your device reports a connection, the queue drains in the background.
              You'll see a green pill confirming success.
            </Feature>
            <Feature icon={ShieldCheck} title="Fails safely">
              If a sync fails, the item stays in the queue with the error message. Nothing is
              silently dropped.
            </Feature>
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="font-display text-base font-semibold">What works offline today</div>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>· Insurance callback requests</li>
              <li>· Case notes and messages to your case manager</li>
              <li>· Benefit-eligibility drafts</li>
              <li>· Document metadata for vault uploads (files upload on reconnect)</li>
              <li>· Life-admin checklists and playbook progress</li>
              <li>· Reading the last-viewed knowledge articles</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Large file uploads (passports, X-rays, PDFs &gt; 5 MB) wait for a real connection to
              avoid draining prepaid data.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              See what's included in each plan
            </Link>
            <Link
              to="/trust"
              className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-accent/10"
            >
              How we protect your data
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-sm font-semibold">{title}</div>
      <p className="mt-1.5 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
