import { test, expect } from "@playwright/test";

const medicines = [{ id: 101, name: "Catalog medicine A" }, { id: 205, name: "Catalog medicine B" }];

test.beforeEach(async ({ page }) => {
  // These UI-state tests mock HTTP responses. integration.spec.js covers real JWT/Prisma.
  await page.addInitScript(() => {
    if (location.pathname.startsWith("/interactions")) sessionStorage.setItem("medisafe_token", "catalog.test.token");
  });
});

test("loading resolves into both medicine selectors and sends numeric IDs", async ({ page }) => {
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  await page.route("**/api/medicines", async (route) => {
    expect(route.request().headers().authorization).toBe("Bearer catalog.test.token");
    await ready;
    await route.fulfill({ json: { medicines } });
  });
  await page.route("**/api/drug-interactions/check", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ medicineAId: 101, medicineBId: 205 });
    await route.fulfill({ json: { found: false, interaction: null } });
  });
  await page.goto("/interactions/drug-drug");
  try {
    await expect(page.getByRole("status")).toHaveText("Loading medicine catalog…");
    await expect(page.getByText("No medicines have been added", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Medicine", exact: true })).toBeDisabled();
  } finally {
    release();
  }
  for (const label of ["Medicine", "Second medicine"]) {
    await expect(page.getByRole("combobox", { name: label, exact: true }).locator("option")).toHaveText([
      "Select a medicine", "Catalog medicine A", "Catalog medicine B",
    ]);
  }
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Check interaction", exact: true })).toBeDisabled();
  await page.getByRole("combobox", { name: "Medicine", exact: true }).selectOption("101");
  await page.getByRole("combobox", { name: "Second medicine", exact: true }).selectOption("205");
  await page.getByRole("button", { name: "Check interaction", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No matching interaction found" })).toBeVisible();
});

test("a successful empty response has an actionable empty state and can be refreshed", async ({ page }) => {
  let populated = false;
  await page.route("**/api/medicines", (route) => route.fulfill({ json: { medicines: populated ? medicines : [] } }));
  await page.goto("/interactions/drug-drug");
  await expect(page.getByText("No medicines have been added", { exact: false })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Medicine catalog", exact: true })).toHaveAttribute("href", "/medicines");
  await expect(page.getByRole("button", { name: "Check interaction", exact: true })).toBeDisabled();
  populated = true;
  await page.getByRole("button", { name: "Refresh catalog", exact: true }).click();
  await expect(page.getByLabel("Second medicine").locator("option")).toHaveCount(3);
  await expect(page.getByText("No medicines have been added", { exact: false })).toHaveCount(0);
});

for (const failure of [
  { name: "server failure", response: { status: 500, json: { message: "Catalog temporarily unavailable" } }, message: "Catalog temporarily unavailable" },
  { name: "malformed response", response: { json: { data: medicines } }, message: "The catalog response is invalid" },
]) {
  test(`${failure.name} is shown as an error and retry recovers`, async ({ page }) => {
    let recovered = false;
    await page.route("**/api/medicines", (route) => route.fulfill(recovered ? { json: { medicines } } : failure.response));
    await page.goto("/interactions/drug-drug");
    await expect(page.locator("main").getByRole("alert")).toContainText(failure.message);
    await expect(page.getByText("No medicines have been added", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Check interaction", exact: true })).toBeDisabled();
    recovered = true;
    await page.getByRole("button", { name: "Retry loading catalog" }).click();
    await expect(page.getByRole("combobox", { name: "Medicine", exact: true }).locator("option")).toHaveCount(3);
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  });
}

test("an expired catalog session redirects to login", async ({ page }) => {
  await page.route("**/api/medicines", (route) => route.fulfill({ status: 401, json: { message: "Invalid or expired token" } }));
  await page.goto("/interactions/drug-drug");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  expect(await page.evaluate(() => sessionStorage.getItem("medisafe_token"))).toBeNull();
});

test("drug-food check explains an empty food catalog and maps refreshed foods", async ({ page }) => {
  let populated = false;
  await page.route("**/api/medicines", (route) => route.fulfill({ json: { medicines } }));
  await page.route("**/api/foods", (route) => route.fulfill({ json: { foods: populated ? [{ id: 301, name: "Catalog food" }] : [] } }));
  await page.route("**/api/food-interactions/check", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ medicineId: 101, foodId: 301 });
    await route.fulfill({ json: { found: false, interaction: null } });
  });
  await page.goto("/interactions/drug-food");
  await expect(page.getByText("No foods have been added", { exact: false })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Medicine", exact: true }).locator("option")).toHaveCount(3);
  await expect(page.getByRole("combobox", { name: "Food", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Check interaction", exact: true })).toBeDisabled();
  populated = true;
  await page.getByRole("button", { name: "Refresh catalog", exact: true }).click();
  await page.getByRole("combobox", { name: "Medicine", exact: true }).selectOption("101");
  await page.getByRole("combobox", { name: "Food", exact: true }).selectOption("301");
  await page.getByRole("button", { name: "Check interaction", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No matching interaction found" })).toBeVisible();
});
