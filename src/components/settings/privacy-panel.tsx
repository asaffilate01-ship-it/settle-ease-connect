import { Link } from "@tanstack/react-router";
import { Download, FileLock2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * A single entry point for verified privacy requests. Export and deletion are
 * processed through the same DPO workflow so identity checks, legal holds and
 * fulfilment are not split across incompatible request formats.
 */
export function PrivacyPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-3xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" /> Access or portability
          </CardTitle>
          <CardDescription>
            Request a copy of your data or a portable export. We verify identity and prepare the
            applicable records through the privacy workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/app/privacy-requests">Start verified request</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/30 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4 text-destructive" /> Erasure or restriction
          </CardTitle>
          <CardDescription>
            Ask us to erase or restrict processing. The privacy team will identify any records
            subject to a legal hold or mandatory retention before acting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/app/privacy-requests">Open privacy centre</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-soft lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> One auditable request history
          </CardTitle>
          <CardDescription>
            Access, correction, erasure, portability, restriction, objection and consent withdrawal
            all use the same verified case history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost">
            <Link to="/app/privacy-requests">
              <FileLock2 className="mr-2 h-4 w-4" /> View requests and target dates
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
