import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { resolveLandingForCurrentUser } from "@/lib/role-landing";
import logoFull from "@/assets/brand/logo-full.png";

type Search = { redirect?: string };
type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — BeistandPlus" },
      {
        name: "description",
        content: "Sign in to BeistandPlus to manage your case, benefits, documents and community.",
      },
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

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function goToLanding() {
    const dest = explicitTarget ?? (await resolveLandingForCurrentUser());
    navigate({ to: dest as "/app" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goToLanding();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 12) {
          toast.error("Use at least 12 characters for a new password.");
          setLoading(false);
          return;
        }
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
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        await goToLanding();
      } else {
        // forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("If an account exists, a reset link has been sent.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";
  const subheading =
    mode === "signin"
      ? "Sign in to manage your case, benefits and documents."
      : mode === "signup"
        ? "One calm place for settlement, welfare and end-of-life care in Germany."
        : "Enter your email and we'll send you a secure link to set a new password.";

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/" className="inline-flex items-center">
          <img src={logoFull} alt="BeistandPlus" className="h-9 w-auto sm:h-10" />
        </Link>
        <Link
          to="/"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-terracotta"
        >
          ← Home
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmed Khan"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 12 characters" : "Your password"}
                    required
                    minLength={mode === "signup" ? 12 : undefined}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                New to BeistandPlus?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setMode("signin")}
              >
                ← Back to sign in
              </button>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
