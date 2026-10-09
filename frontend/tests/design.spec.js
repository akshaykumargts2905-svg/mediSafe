import { test, expect } from "@playwright/test";

// Presentation checks use isolated browser fixtures; no real accounts or records are changed.
const prescription = { id: 42, fileName: "Review prescription.png", createdAt: "2026-01-01T12:00:00Z", medicines: [] };
const alert = { id: 1, title: "Sample review reminder", message: "Discuss your medicines with your care team.", severity: "MODERATE", isRead: false };
const fixtures = {
  "/api/users/me": { user: { id: 1, name: "Design Review", email: "review@example.com", language: "en" }, permissions: { catalogEditor: false } },
  "/api/prescriptions": { prescriptions: [prescription] },
  "/api/alerts": { alerts: [alert] },
  "/api/safety-reports": { reports: [] },
  "/api/medicines": { medicines: [{ id: 1, name: "Sample medicine", genericName: "Sample generic" }] },
  "/api/foods": { foods: [{ id: 1, name: "Sample food", description: "Sample food description." }] },
  "/api/drug-interactions": { interactions: [] },
  "/api/food-interactions": { interactions: [] },
  "/api/knowledge-graph": { medicines: [], drugInteractions: [], foodInteractions: [], alternatives: [] },
  "/api/languages": [{ code: "en", name: "English" }, { code: "hi", name: "हिंदी" }],
  "/api/care-team": { doctors: [] },
  "/api/doctor/dashboard": { users: 0, prescriptions: 0, medicines: 0, unreadAlerts: 0, pendingRecommendations: 0, patients: [] },
  "/api/doctor/prescriptions": { prescriptions: [] },
  "/api/doctor/alerts": { alerts: [] },
};

async function mockWorkspace(page) {
  await page.addInitScript(() => sessionStorage.setItem("medisafe_token", "design.test.token"));
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: fixtures[path] || {} });
  });
  await page.route("**/api-health", (route) => route.fulfill({ json: { status: "ok" } }));
}

async function expectNoHorizontalOverflow(page) {
  // Ensure the shared stylesheet has loaded before checking its responsive layout.
  if (await page.locator(".skip-link").count()) await expect(page.locator(".skip-link")).toHaveCSS("position", "fixed");
  const size = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(size.document, `Horizontal overflow at ${page.url()}`).toBeLessThanOrEqual(size.viewport + 1);
}

for (const width of [320, 390, 768, 1440]) {
  test(`public pages and workspace layouts fit a ${width}px viewport`, async ({ page }, testInfo) => {
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/", "/login", "/signup"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`${route === "/" ? "landing" : route.slice(1)}.png`), fullPage: true });
    }
    await mockWorkspace(page);
    for (const route of ["/dashboard", "/prescriptions", "/prescriptions/upload", "/interactions", "/interactions/drug-drug", "/interactions/drug-food", "/alerts", "/reports", "/medicines", "/foods", "/interactions/catalog", "/knowledge-graph", "/languages", "/care-team", "/doctor", "/doctor/prescriptions", "/doctor/alerts", "/doctor/recommendations", "/profile"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.getByRole("status")).toHaveCount(0);
      await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      if ((width === 1440 || width === 390) && ["/dashboard", "/interactions/drug-food", "/prescriptions/upload"].includes(route)) {
        await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "-").slice(1)}.png`), fullPage: true });
      }
    }
    expect(runtimeErrors).toEqual([]);
  });
}

test("mobile navigation exposes every destination and works with the keyboard", async ({ page }) => {
  await mockWorkspace(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("link")).toHaveCount(13);
  for (const link of await navigation.getByRole("link").all()) await expect(link).toBeVisible();
  await navigation.getByRole("link", { name: "Interaction catalog", exact: true }).click();
  await expect(page).toHaveURL(/\/interactions\/catalog$/);
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(navigation.locator('[aria-current="page"]')).toHaveText("Interaction catalog");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await expect(navigation).toBeHidden();
});

test("registration preserves required fields, password validation, and submission", async ({ page }) => {
  let submitted;
  await page.route("**/api/auth/register", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: { message: "Account created" } });
  });
  await page.goto("/signup");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  expect(submitted).toBeUndefined();
  await page.getByLabel("Full name").fill("Design Review");
  await page.getByLabel("Email address").fill("review@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  expect(submitted).toBeUndefined();
  await page.getByLabel("Password", { exact: true }).fill("review-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await expect(page.getByRole("status")).toHaveText("Account created. Log in to continue.");
  expect(submitted).toEqual({ name: "Design Review", email: "review@example.com", password: "review-password" });
});
