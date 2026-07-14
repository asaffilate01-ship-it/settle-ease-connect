import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, roles, loading } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [lang, setLang] = useState("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCity(profile.city ?? "");
      setLang(profile.preferred_language ?? "en");
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, city, preferred_language: lang })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your account…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, language, and role.</p>
      </div>

      {/* Profile edit */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold">Your profile</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
          </div>
          <div>
            <Label htmlFor="lang">Preferred language</Label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="ur">اردو</option>
              <option value="hi">हिन्दी</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
              <option value="ar">العربية</option>
              <option value="ku">Kurdî</option>
              <option value="ru">Русский</option>
              <option value="uk">Українська</option>
              <option value="fa">فارسی</option>
              <option value="pl">Polski</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
          </Button>
        </div>
      </div>

      {/* Roles */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold">Your roles</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles unlock portal workspaces. New portals for mosques, churches, temples, hospitals and admins arrive in the next release.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.length === 0 ? (
            <span className="text-sm text-muted-foreground">No roles assigned yet.</span>
          ) : (
            roles.map((r) => (
              <Badge key={r} variant="outline" className="capitalize border-primary/40 text-primary">
                {r.replace("_", " ")}
              </Badge>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
