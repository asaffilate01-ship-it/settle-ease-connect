import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/services", "/pricing", "/legal/privacy", "/auth"];

for (const route of publicRoutes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("sign-in form supports keyboard entry", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password", { exact: true }).fill("not-a-real-password");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await expect(page.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
});

test("public entry points have no serious automated accessibility violations @a11y", async ({
  page,
}) => {
  for (const route of ["/", "/auth", "/legal/privacy"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, `${route}: ${blocking.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});
