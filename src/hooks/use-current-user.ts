import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  preferred_language: string;
  city: string | null;
  avatar_url: string | null;
};

export type AppRole =
  | "family"
  | "case_manager"
  | "funeral_director"
  | "mosque"
  | "church"
  | "temple"
  | "hospital"
  | "admin";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load(sessionUser: User | null) {
      if (!sessionUser) {
        if (!alive) return;
        setUser(null); setProfile(null); setRoles([]); setLoading(false);
        return;
      }
      setUser(sessionUser);
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", sessionUser.id),
      ]);
      if (!alive) return;
      setProfile((p as Profile) ?? null);
      setRoles(((r ?? []) as { role: AppRole }[]).map((row) => row.role));
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, roles, loading };
}

export async function signOutAndRedirect(navigate: (to: string) => void) {
  await supabase.auth.signOut();
  navigate("/auth");
}
