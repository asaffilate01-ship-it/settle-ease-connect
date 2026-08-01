import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-current-user";

const INTERNAL_ROLES: AppRole[] = [
  "admin",
  "staff",
  "case_manager",
  "senior_case_manager",
  "team_leader",
  "finance",
  "insurance_admin",
  "tax_admin",
  "benefits_admin",
  "medical_admin",
  "new_arrival_admin",
];
const EXPERT_ROLES: AppRole[] = [
  "expert",
  "lawyer",
  "accountant",
  "doctor",
  "notary",
  "translator",
  "social_worker",
  "funeral_director",
  "mosque",
  "church",
  "temple",
  "hospital",
];

export function landingForRoles(roles: AppRole[]): string {
  if (roles.includes("compliance") && !roles.some((r) => INTERNAL_ROLES.includes(r)))
    return "/portal/compliance";
  if (roles.includes("dpo") && !roles.some((r) => INTERNAL_ROLES.includes(r)))
    return "/portal/privacy";
  if (roles.includes("auditor") && !roles.some((r) => INTERNAL_ROLES.includes(r)))
    return "/portal/auditor";
  if (roles.some((r) => INTERNAL_ROLES.includes(r))) return "/portal";
  if (roles.includes("agent")) return "/agent";
  if (roles.includes("partner_admin") || roles.includes("partner_user")) return "/partner";
  if (roles.some((r) => EXPERT_ROLES.includes(r))) return "/expert";
  return "/app";
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  const priority: AppRole[] = [
    "admin",
    "staff",
    "case_manager",
    "senior_case_manager",
    "team_leader",
    "finance",
    "insurance_admin",
    "tax_admin",
    "benefits_admin",
    "medical_admin",
    "new_arrival_admin",
    "lawyer",
    "accountant",
    "doctor",
    "notary",
    "translator",
    "social_worker",
    "expert",
    "funeral_director",
    "mosque",
    "church",
    "temple",
    "hospital",
    "agent",
    "beneficiary",
    "family",
    "family_deputy",
    "compliance",
    "dpo",
    "auditor",
  ];
  for (const r of priority) if (roles.includes(r)) return r;
  return roles[0] ?? null;
}

export async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: AppRole }[]).map((r) => r.role);
}

export async function resolveLandingForCurrentUser(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return "/app";
  const roles = await fetchRolesForUser(uid);
  return landingForRoles(roles);
}
