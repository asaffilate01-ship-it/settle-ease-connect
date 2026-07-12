import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { resolveLandingForCurrentUser } from "@/lib/role-landing";
import logoFull from "@/assets/brand/logo-full.png";


type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — BeistandPlus" },
      { name: "description", content: "Sign in to BeistandPlus to manage your case, benefits, documents and community." },
    ],
  }),
  component: AuthPage,
});

function sanitizeRedirect(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "http://x");
    const path = url.pathname + url.search + url.hash;
    if (path.startsWith("/") && !path.startsWith("//")) return path;
  } catch {}
  return null;
}


function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const explicitTarget = sanitizeRedirect(redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function goToLanding() {
    const dest = explicitTarget ?? (await resolveLandingForCurrentUser());
    navigate({ to: dest as "/app" });
  }

  useEffect(() => {
    // If already signed in, bounce to role-based landing (or explicit redirect).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goToLanding();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      await goToLanding();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        toast.success("Welcome to BeistandPlus");
        await goToLanding();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        await goToLanding();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center">
          <img src={logoFull} alt="BeistandPlus" className="h-10 w-auto" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-soft">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your case, benefits and documents."
              : "One calm place for settlement, welfare and end-of-life care in Germany."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full h-11"
            onClick={handleGoogle}
            disabled={loading}
          >
            <GoogleIcon /> <span className="ml-2">Continue with Google</span>
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Khan" required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>New to BeistandPlus?{" "}
                <button type="button" className="text-primary font-medium hover:underline" onClick={() => setMode("signup")}>Create an account</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" className="text-primary font-medium hover:underline" onClick={() => setMode("signin")}>Sign in</button>
              </>
            )}
          </p>

          <DevLoginPanel
            disabled={loading}
            onLogin={async (devEmail, devPassword) => {
              setLoading(true);
              const { error } = await supabase.auth.signInWithPassword({
                email: devEmail,
                password: devPassword,
              });
              if (error) {
                toast.error(error.message);
                setLoading(false);
                return;
              }
              await goToLanding();
            }}
          />
        </div>
      </main>
    </div>
  );
}

const DEV_ACCOUNTS: { email: string; role: string; label: string; landing: string }[] = [
  { email: "admin@beistand.de", role: "admin", label: "Admin", landing: "/portal" },
  { email: "staff@beistand.de", role: "staff", label: "Staff", landing: "/portal" },
  { email: "manager@beistand.de", role: "case_manager", label: "Case manager", landing: "/portal" },
  { email: "expert@beistand.de", role: "expert", label: "Expert", landing: "/app" },
  { email: "family@beistand.de", role: "family", label: "Family (client)", landing: "/app" },
];
const DEV_PASSWORD = "B3ist4nd_2026_Pass";

function DevLoginPanel({
  disabled,
  onLogin,
}: {
  disabled: boolean;
  onLogin: (email: string, password: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-amber-400/60 bg-amber-50/60 p-4 dark:bg-amber-950/20">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          🐞 Dev logins
          <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
            local only
          </span>
        </span>
        <span className="text-xs text-amber-800/70 dark:text-amber-200/70">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
            One-click sign-in as any seeded RLS role. Password:{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/50">
              {DEV_PASSWORD}
            </code>
          </p>
          <div className="grid gap-2">
            {DEV_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={disabled}
                onClick={() => onLogin(a.email, DEV_PASSWORD)}
                className="flex items-center justify-between rounded-lg border border-amber-300/60 bg-background/70 px-3 py-2 text-left text-sm hover:bg-background disabled:opacity-50"
              >
                <span>
                  <span className="font-medium">{a.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{a.email}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  → {a.landing}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.6 34.9 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
