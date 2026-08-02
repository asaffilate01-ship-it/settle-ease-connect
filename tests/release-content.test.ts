import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("public release content boundaries", () => {
  it("does not publish fixed benefit amounts or an entitlement promise", () => {
    const home = source("src/routes/index.tsx");
    expect(home).not.toContain("Know exactly what you're entitled to");
    expect(home).not.toMatch(/Kindergeld[^\n]+€\d/);
    expect(home).not.toMatch(/Bürgergeld[^\n]+€\d/);
  });

  it("publishes the student discount consistently", () => {
    const students = source("src/routes/students.tsx");
    expect(students).toContain("20% off eligible tiers");
    expect(students).toContain(">€8<");
    expect(students).not.toContain(">€7<");
  });

  it("keeps leaving-Germany guidance source led", () => {
    const leaving = source("src/routes/leaving-germany.tsx");
    expect(leaving).toContain("A case record, not a generic legal checklist");
    expect(leaving).not.toContain("Your Krankenkasse membership ends the day");
    expect(leaving).not.toContain("triggers a deemed-sale tax");
  });

  it("does not present invoice records as escrow payouts", () => {
    const expert = source("src/routes/_authenticated/expert.cases.$caseId.tsx");
    expect(expert).toContain("This creates an invoice record only");
    expect(expert).not.toContain("balance is your payout after escrow release");
  });
});
