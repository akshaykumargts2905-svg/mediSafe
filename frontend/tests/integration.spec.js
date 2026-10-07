import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";
import { once } from "node:events";

const requireBackend = createRequire(path.resolve("../backend/package.json"));
requireBackend("dotenv").config({ path: path.resolve("../backend/.env") });
const app = requireBackend("./server");
const prisma = requireBackend("./lib/prisma");
const users = new Set();
const medicines = new Set();
const foods = new Set();
const pending = [];
let server;
const previousEditors = process.env.CATALOG_EDITOR_IDS;

test.beforeAll(async () => {
  server = app.listen(5100, "127.0.0.1");
  await once(server, "listening");
});
test.afterAll(async () => {
  await Promise.allSettled(pending);
  try {
    if (users.size) await prisma.user.deleteMany({ where: { id: { in: [...users] } } });
    if (medicines.size) await prisma.medicine.deleteMany({ where: { id: { in: [...medicines] } } });
    if (foods.size) await prisma.food.deleteMany({ where: { id: { in: [...foods] } } });
  } finally {
    if (previousEditors === undefined) delete process.env.CATALOG_EDITOR_IDS;
    else process.env.CATALOG_EDITOR_IDS = previousEditors;
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});

test("real Axios/JWT browser workflow, catalog CRUD, prescription review and expired session", async ({ page, request }) => {
  const tag = "browser-" + Date.now();
  const email = tag + "@example.com";
  const crashes = [];
  page.on("pageerror", (error) => crashes.push(error.message));
  page.on("framenavigated", (frame) => { if (frame === page.mainFrame()) console.log("Browser page:", new URL(frame.url()).pathname); });
  page.on("dialog", (dialog) => dialog.accept());
  page.on("response", (response) => {
    if (response.request().method() !== "POST" || response.status() !== 201) return;
    pending.push((async () => {
      const body = await response.json();
      if (body.user) users.add(body.user.id);
      if (body.medicine) medicines.add(body.medicine.id);
      if (body.food) foods.add(body.food.id);
    })());
  });
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Account created. Log in to continue.")).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Good to see you, Browser Test" })).toBeVisible();
  await Promise.all(pending);
  process.env.CATALOG_EDITOR_IDS = String([...users][0]);

  // CORS permits the configured browser origin without allowing arbitrary origins.
  const cors = await request.fetch("http://127.0.0.1:5100/api/users/me", { method: "OPTIONS", headers: { Origin: "http://localhost:3000", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
  expect(cors.headers()["access-control-allow-origin"]).toBe("http://localhost:3000");
  const blocked = await request.fetch("http://127.0.0.1:5100/api/users/me", { method: "OPTIONS", headers: { Origin: "https://untrusted.example", "Access-Control-Request-Method": "GET" } });
  expect(blocked.headers()["access-control-allow-origin"]).toBeUndefined();

  for (const suffix of ["A", "B"]) {
    await page.goto("/medicines");
    await page.getByRole("button", { name: "Add record" }).click();
    await page.getByLabel("Name *", { exact: true }).fill(tag + "-" + suffix);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".row-card").filter({ hasText: tag + "-" + suffix })).toBeVisible();
  }
  let row = page.locator(".row-card").filter({ hasText: tag + "-A" });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Generic name").fill("Updated generic");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row).toContainText("Updated generic");
  await page.getByLabel("Search medicines").fill(tag);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".row-card")).toHaveCount(2);
  await row.getByRole("button", { name: "Details" }).click();
  await expect(page.locator("dd").filter({ hasText: "Updated generic" })).toBeVisible();

  await page.goto("/foods");
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Name *", { exact: true }).fill(tag + "-food");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: tag + "-food" })).toBeVisible();

  await page.goto("/interactions/catalog");
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("First medicine").selectOption({ label: tag + "-A" });
  await page.getByLabel("Second medicine").selectOption({ label: tag + "-B" });
  await page.getByLabel("Severity").fill("HIGH");
  await page.getByLabel("Description").fill("Synthetic browser-test caution");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic browser-test caution" })).toBeVisible();
  await page.getByRole("button", { name: "Drug–food records" }).click();
  await expect(page.getByRole("heading", { name: "Food interaction catalog", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-A" });
  await page.getByLabel("Food *", { exact: true }).selectOption({ label: tag + "-food" });
  await page.getByLabel("Severity").fill("LOW");
  await page.getByLabel("Description").fill("Synthetic food caution");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic food caution" })).toBeVisible();

  await page.goto("/prescriptions/upload");
  await page.getByLabel("Prescription file name").fill(tag + ".txt");
  await page.getByLabel("Prescription text (optional)").fill("Original supplied text");
  await page.getByRole("button", { name: "Save prescription" }).click();
  await expect(page).toHaveURL(/\/prescriptions\/\d+$/);
  const id = page.url().split("/").pop();
  await expect(page.getByText("Original supplied text", { exact: true })).toBeVisible();
  await page.goto("/prescriptions/" + id + "/ocr");
  await page.getByLabel("Extracted text").fill("Updated supplied text");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Extracted text")).toHaveValue("Updated supplied text");

  for (const suffix of ["A", "B"]) {
    await page.goto("/prescriptions/" + id + "/medicines");
    await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-" + suffix });
    await page.getByLabel("Dosage").fill("Demo dose");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".row-card").filter({ hasText: tag + "-" + suffix })).toBeVisible();
  }
  await page.goto("/prescriptions/" + id + "/analysis");
  await page.getByRole("button", { name: "Run analysis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "HIGH RISK" })).toBeVisible();
  await page.getByRole("link", { name: "View safety report" }).click();
  await expect(page.getByText("Total medicines", { exact: true })).toBeVisible();
  await page.goto("/reports");
  await expect(page.locator(".row-card").filter({ hasText: "Prescription #" + id })).toBeVisible();

  await page.goto("/alerts");
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic browser-test caution" })).toBeVisible();
  await page.locator(".row-card").filter({ hasText: "Synthetic browser-test caution" }).getByRole("button", { name: "Mark read" }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic browser-test caution" }).getByRole("button", { name: "Mark read" })).toBeDisabled();

  await page.goto("/doctor/recommendations");
  await page.getByLabel("Prescription", { exact: true }).selectOption({ label: tag + ".txt" });
  await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-A" });
  await page.getByLabel("Reason").fill("Synthetic recommendation");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic recommendation" })).toBeVisible();
  await page.getByRole("button", { name: "Edit recommendation" }).click();
  await page.getByLabel("Status").fill("REVIEWED");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic recommendation" })).toContainText("REVIEWED");

  await page.goto("/knowledge-graph");
  await expect(page.getByText(tag + "-A ↔ " + tag + "-food", { exact: true })).toBeVisible();
  await page.goto("/languages");
  await page.getByLabel("Text *", { exact: true }).fill("Test translation");
  await page.getByLabel("Language *", { exact: true }).selectOption("hi");
  await page.getByRole("button", { name: "Preview translation" }).click();
  await expect(page.getByText("Original text (translation placeholder)", { exact: false })).toBeVisible();

  await page.goto("/profile");
  await page.getByLabel("Full name").fill("Updated Browser Test");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByLabel("Full name")).toHaveValue("Updated Browser Test");
  // A server-rejected token clears the session and visibly returns to login.
  await page.evaluate(() => sessionStorage.setItem("medisafe_token", "invalid-token"));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  await expect(page.getByText("Your session expired. Please log in again.")).toBeVisible();
  expect(crashes).toEqual([]);
});
