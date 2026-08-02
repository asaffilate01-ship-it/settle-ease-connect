import { expect, test } from "@playwright/test";

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
    const response = await page.goto("/auth");
    expect(response?.ok()).toBeTruthy();

    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(
      (url) =>
        url.pathname === account.landing || url.pathname.startsWith(`${account.landing}/`),
      { timeout: 30_000 },
    );
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
