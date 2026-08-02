import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("workflow and navigation UX", () => {
  it("replaces decorative header inputs with command search", () => {
    const app = source("src/routes/_authenticated/app.tsx");
    const portal = source("src/routes/_authenticated/portal.tsx");
    const command = source("src/components/global-command-search.tsx");
    expect(app).toContain('<GlobalCommandSearch mode="client"');
    expect(portal).toContain('<GlobalCommandSearch mode="staff"');
    expect(command).toContain("metaKey || event.ctrlKey");
    expect(command).toContain("searchWorkspace");
    expect(app).not.toContain("Search cases, documents, providers, benefits");
  });

  it("searches only records returned through the authenticated RLS client", () => {
    const search = source("src/lib/search.functions.ts");
    expect(search).toContain(".middleware([requireSupabaseAuth])");
    expect(search).toContain('from("cases")');
    expect(search).toContain("internal && hasAal2");
    expect(search).not.toContain("supabaseAdmin");
  });

  it("makes case search controlled and provides a mobile card layout", () => {
    const cases = source("src/routes/_authenticated/app.cases.tsx");
    expect(cases).toContain("value={query}");
    expect(cases).toContain("filteredCases.map");
    expect(cases).toContain('className="grid gap-3 md:hidden"');
    expect(cases).toContain("<CaseResponsibility");
  });

  it("shows responsibility in plain language", () => {
    const responsibility = source("src/components/cases/case-responsibility.tsx");
    expect(responsibility).toContain("Waiting for you");
    expect(responsibility).toContain("With BeistandPlus");
    expect(responsibility).toContain("With a provider");
  });

  it("enforces staff-only AAL2 operational updates and internal notes", () => {
    const cases = source("src/lib/cases.functions.ts");
    const migration = source("supabase/migrations/20260802202000_case_workflow_security.sql");
    expect(cases).toContain("updateCaseStatus = createServerFn");
    expect(cases).toContain(".middleware([requireSupabaseAal2])");
    expect(cases).toContain("Only assigned staff can change case status");
    expect(cases).toContain("Internal notes are available to staff only");
    expect(migration).toContain("auth.jwt()->>'aal' = 'aal2'");
    expect(migration).toContain("internal_note");
  });

  it("keeps the core sidebar short and places secondary tools behind disclosure", () => {
    const sidebar = source("src/components/app-sidebar.tsx");
    expect(sidebar).toContain("const coreOrder");
    expect(sidebar).toContain("More tools");
    expect(sidebar).toContain("renderNavItems(coreNav)");
  });
});
