import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockDocs } from "@/lib/mock-data";
import { FileText, Upload, Download, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Document vault</h1>
          <p className="text-sm text-muted-foreground">Encrypted, GDPR-first, and always to hand.</p>
        </div>
        <Button className="bg-gradient-primary">
          <Upload className="mr-1 h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Documents stored" value="6" />
        <Stat label="Expiring this year" value="2" tone="warning" />
        <Stat label="Vault used" value="6.2 MB / 5 GB" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-parchment/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Document</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-left">Expires</th>
              <th className="px-5 py-3 text-left">Size</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mockDocs.map((d) => (
              <tr key={d.id} className="hover:bg-parchment/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="font-medium">{d.name}</div>
                  </div>
                </td>
                <td className="px-5 py-4 capitalize text-muted-foreground">{d.type}</td>
                <td className="px-5 py-4">
                  {d.expires ? (
                    <span className="inline-flex items-center gap-1">
                      {d.expires}
                      {d.expires.includes("2027") && (
                        <Badge className="bg-warning/20 text-warning-foreground border border-warning/40">Soon</Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{d.size}</td>
                <td className="px-5 py-4 text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-foreground" />
          <div>
            <div className="font-medium">Your Blue Card expires in 10 months</div>
            <p className="text-sm text-muted-foreground">
              Beistand will remind you 90 days before and pre-fill the renewal application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${tone === "warning" ? "border-warning/40 bg-warning/10" : "border-border/60 bg-card"}`}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
