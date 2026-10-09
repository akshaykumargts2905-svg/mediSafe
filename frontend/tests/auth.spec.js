import { test, expect } from "@playwright/test";

test("a legacy login response cannot create a token session", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({
    json: { user: { id: 42, name: "Legacy user" } },
  }));
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("medisafe_user_id", "invalid");
    sessionStorage.setItem("medisafe_token", "undefined");
  });
  await page.getByLabel("Email address").fill("legacy@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Login did not return a valid session token");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem("medisafe_token"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("medisafe_user_id"))).toBeNull();
});
