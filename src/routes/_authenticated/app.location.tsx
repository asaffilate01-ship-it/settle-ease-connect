import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, ShieldAlert, Square } from "lucide-react";
import {
  startLocationShare,
  appendLocationPoint,
  stopLocationShare,
  listMyActiveShares,
} from "@/lib/gps.functions";

export const Route = createFileRoute("/_authenticated/app/location")({
  head: () => ({
    meta: [
      { title: "Share your location — BeistandPlus" },
      { name: "description", content: "Share your live location with your case team or emergency contacts when you need help." },
    ],
  }),
  component: LocationPage,
});

function LocationPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyActiveShares);
  const startFn = useServerFn(startLocationShare);
  const appendFn = useServerFn(appendLocationPoint);
  const stopFn = useServerFn(stopLocationShare);

  const active = useQuery({ queryKey: ["location", "active"], queryFn: () => listFn() });

  const [mode, setMode] = useState<"normal" | "emergency">("normal");
  const [durationMin, setDurationMin] = useState(60);
  const [message, setMessage] = useState("");
  const [caseId, setCaseId] = useState("");

  const start = useMutation({
    mutationFn: async () =>
      startFn({
        data: {
          mode,
          case_id: caseId || undefined,
          message: message || undefined,
          duration_minutes: durationMin,
        },
      }),
    onSuccess: () => {
      toast.success(mode === "emergency" ? "Emergency location share started" : "Location share started");
      qc.invalidateQueries({ queryKey: ["location"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stop = useMutation({
    mutationFn: async (share_id: string) => stopFn({ data: { share_id } }),
    onSuccess: () => {
      toast.success("Sharing stopped");
      qc.invalidateQueries({ queryKey: ["location"] });
    },
  });

  // Live tracking watcher
  const watchIdRef = useRef<number | null>(null);
  useEffect(() => {
    const activeIds: string[] = (active.data ?? []).map((s: any) => s.id);
    if (activeIds.length === 0) {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        activeIds.forEach((share_id) => {
          appendFn({
            data: {
              share_id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy_m: pos.coords.accuracy ?? undefined,
              speed_mps: pos.coords.speed ?? undefined,
              heading: pos.coords.heading ?? undefined,
            },
          }).catch(() => undefined);
        });
      },
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active.data, appendFn]);

  const activeShares = (active.data ?? []) as any[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <MapPin className="h-4 w-4" /> Live location
        </div>
        <h1 className="display-lg mt-1 font-semibold">Share your location</h1>
        <p className="text-sm text-muted-foreground">
          Send a live pin to your case team, or trigger an emergency share so your nominated contacts and our on-call team can see where you are until you stop it.
        </p>
      </header>

      {activeShares.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Sharing live · {activeShares.length} active
          </div>
          <ul className="mt-3 space-y-2">
            {activeShares.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border bg-background/60 p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {s.mode === "emergency" ? "Emergency share" : "Case share"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires {new Date(s.expires_at).toLocaleString()}
                    {s.last_point_at && ` · last update ${new Date(s.last_point_at).toLocaleTimeString()}`}
                  </div>
                  {s.last_lat && (
                    <a
                      className="text-xs text-primary hover:underline"
                      href={`https://www.openstreetmap.org/?mlat=${s.last_lat}&mlon=${s.last_lng}#map=17/${s.last_lat}/${s.last_lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open last pin ↗
                    </a>
                  )}
                </div>
                <Button size="sm" variant="destructive" onClick={() => stop.mutate(s.id)}>
                  <Square className="mr-1 h-3 w-3" /> Stop
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Mode</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("normal")}
                className={`rounded-lg border p-3 text-left text-sm ${mode === "normal" ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4" /> Normal</div>
                <div className="mt-1 text-xs text-muted-foreground">Visible to your case team</div>
              </button>
              <button
                type="button"
                onClick={() => setMode("emergency")}
                className={`rounded-lg border p-3 text-left text-sm ${mode === "emergency" ? "border-red-500 bg-red-500/5" : ""}`}
              >
                <div className="flex items-center gap-2 font-medium text-red-600"><ShieldAlert className="h-4 w-4" /> Emergency</div>
                <div className="mt-1 text-xs text-muted-foreground">Nominated contacts + on-call team</div>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Share for</Label>
            <select
              id="duration"
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={180}>3 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours (max)</option>
            </select>
          </div>

          {mode === "normal" && (
            <div className="sm:col-span-2">
              <Label htmlFor="caseId">Case ID (optional)</Label>
              <input
                id="caseId"
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Paste a case UUID to scope this share to that case team"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <Label htmlFor="msg">Message</Label>
            <Textarea
              id="msg"
              rows={3}
              placeholder="Optional context — where you are, what's happening, when you need someone…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className={mode === "emergency" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {mode === "emergency" ? "Start emergency share" : "Start sharing"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Location updates use your device's GPS while this page is open. Close the tab or hit Stop to end the share; it will also auto-expire at the end of the selected window.
      </p>
    </div>
  );
}
