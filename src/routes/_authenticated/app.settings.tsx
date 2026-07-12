import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { roles } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, subscription, language, security, and role.</p>
      </div>

      {/* Role switcher */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold">Role & portal switcher</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Beistand supports every stakeholder in a case. Preview how the platform looks in another role.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Link
              key={r.id}
              to={r.homePath}
              className="group rounded-2xl border border-border/60 bg-background/60 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div className="font-display text-lg font-semibold">{r.label}</div>
                {r.id === "family" && <Badge className="bg-success/15 text-success border-success/40" variant="outline">You</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 text-xs text-primary group-hover:underline">Open workspace →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Profile</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Name" value="Ahmed Khan" />
            <Row label="Email" value="ahmed.khan@example.com" />
            <Row label="Phone" value="+49 151 2345 6789" />
            <Row label="Language" value="English (Urdu secondary)" />
            <Row label="City" value="Berlin" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Subscription</h2>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-primary p-5 text-primary-foreground">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">Current plan</div>
              <div className="font-display text-2xl font-semibold">Premium · €12/mo</div>
            </div>
            <button className="rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm">Manage</button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div>Next invoice: 12 Nov · €12.00</div>
            <div>Included: unlimited AI, document vault, expiry reminders, translations.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
