import { expect, test, type Page } from "@playwright/test";

const accounts = [
  {
    role: "member",
    email: process.env.E2E_MEMBER_EMAIL!,
    password: process.env.E2E_MEMBER_PASSWORD!,
    landing: "/app",
  },
  {
    role: "staff",
    email: process.env.E2E_STAFF_EMAIL!,
    password: process.env.E2E_STAFF_PASSWORD!,
    landing: "/portal",
  },
  {
    role: "agent",
    email: process.env.E2E_AGENT_EMAIL!,
    password: process.env.E2E_AGENT_PASSWORD!,
    landing: "/agent",
  },
  {
    role: "expert",
    email: process.env.E2E_EXPERT_EMAIL!,
    password: process.env.E2E_EXPERT_PASSWORD!,
    landing: "/expert",
  },
] as const;

for (const account of accounts) {
  test(`${account.role} can authenticate and reach the correct workspace`, async ({ page }) => {
    await signIn(page, account.email, account.password, account.landing);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /HTTPError|Internal Server Error|Application error/i,
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("member sessions cannot enter workforce workspaces", async ({ page }) => {
  const member = accounts[0];
  await signIn(page, member.email, member.password, member.landing);

  for (const protectedWorkspace of ["/portal", "/agent", "/expert"]) {
    await page.goto(protectedWorkspace);
    await page.waitForURL(
      (url) =>
        url.pathname === member.landing || url.pathname.startsWith(`${member.landing}/`),
      { timeout: 30_000 },
    );
    expect(new URL(page.url()).pathname).not.toBe(protectedWorkspace);
  }
});

async function signIn(page: Page, email: string, password: string, landing: string) {
  const response = await page.goto("/auth");
  expect(response?.ok()).toBeTruthy();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(
    (url) => url.pathname === landing || url.pathname.startsWith(`${landing}/`),
    { timeout: 30_000 },
  );
}
