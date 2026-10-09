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
  page.on("requestfailed", (request) => { if (new URL(request.url()).pathname.startsWith("/api/") && request.failure()?.errorText !== "net::ERR_ABORTED") console.log("API transport failure:", new URL(request.url()).pathname, request.failure()?.errorText); });
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
  await page.evaluate(() => localStorage.setItem("medisafe_user_id", "invalid"));
  const profileRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/users/me");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Your dashboard · Browser Test" })).toBeVisible();
  const headers = (await profileRequest).headers();
  expect(headers.authorization).toMatch(/^Bearer /);
  expect(headers["x-user-id"]).toBeUndefined();
  expect(await page.evaluate(() => localStorage.getItem("medisafe_user_id"))).toBeNull();
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
  await page.getByLabel("Severity", { exact: false }).selectOption("HIGH");
  await page.getByLabel("Description *", { exact: true }).fill("Synthetic browser-test caution");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: tag + "-A" })).toBeVisible();
  await page.getByRole("button", { name: "Drug–food records" }).click();
  await expect(page.getByRole("heading", { name: "Food interaction catalog", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-A" });
  await page.getByLabel("Food *", { exact: true }).selectOption({ label: tag + "-food" });
  await page.getByLabel("Severity", { exact: false }).selectOption("LOW");
  await page.getByLabel("Description *", { exact: true }).fill("Synthetic food caution");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: tag + "-food" })).toBeVisible();

  // Ordinary authenticated users can load both dropdowns and run checks via the proxy.
  process.env.CATALOG_EDITOR_IDS = "";
  await page.goto("/interactions/drug-drug");
  for (const label of ["Medicine", "Second medicine"]) {
    for (const suffix of ["A", "B"]) {
      await expect(page.getByRole("combobox", { name: label, exact: true }).locator("option").filter({ hasText: tag + "-" + suffix })).toHaveCount(1);
    }
  }
  await page.getByRole("combobox", { name: "Medicine", exact: true }).selectOption({ label: tag + "-A" });
  await page.getByRole("combobox", { name: "Second medicine", exact: true }).selectOption({ label: tag + "-B" });
  await page.getByRole("button", { name: "Check interaction", exact: true }).click();
  await expect(page.locator(".clinical-result").filter({hasText:"Synthetic browser-test caution"})).toBeVisible();
  await page.goto("/interactions/drug-food");
  await page.getByRole("combobox", { name: "Medicine", exact: true }).selectOption({ label: tag + "-A" });
  await page.getByRole("combobox", { name: "Food", exact: true }).selectOption({ label: tag + "-food" });
  await page.getByRole("button", { name: "Check interaction", exact: true }).click();
  await expect(page.locator(".clinical-result").filter({hasText:"Synthetic food caution"})).toBeVisible();
  process.env.CATALOG_EDITOR_IDS = String([...users][0]);

  await page.goto("/prescriptions/upload");
  await page.getByLabel("Prescription file name").fill(tag + ".txt");
  await page.getByLabel("Prescription text (optional)").fill("Original supplied text");
  await page.getByRole("button", { name: "Save prescription" }).click();
  await expect(page).toHaveURL(/\/prescriptions\/\d+\/ocr$/);
  const id = page.url().split("/").at(-2);
  await expect(page.getByLabel("Extracted text")).toHaveValue("Original supplied text");
  await page.goto("/prescriptions/" + id + "/ocr");
  await page.getByLabel("Extracted text").fill("Updated supplied text");
  await page.getByRole("button", { name: "Save corrected text", exact: true }).click();
  await expect(page.getByLabel("Extracted text")).toHaveValue("Updated supplied text");

  for (const suffix of ["A", "B"]) {
    await page.goto("/prescriptions/" + id + "/medicines");
    await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-" + suffix });
    await page.getByLabel("Dosage").fill("Demo dose");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".row-card").filter({ hasText: tag + "-" + suffix })).toBeVisible();
  }
  await page.goto("/prescriptions/" + id + "/ocr");
  await page.getByRole("button", {name:"Confirm medicines",exact:true}).click();
  await expect(page.getByText("Medicines confirmed.",{exact:false})).toBeVisible();
  await page.goto("/prescriptions/" + id + "/analysis");
  await page.getByRole("button", { name: "Run analysis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "HIGH RISK" })).toBeVisible();
  await page.getByRole("link", { name: "View safety report" }).click();
  await expect(page.getByText("Total medicines", { exact: true })).toBeVisible();
  await page.goto("/reports");
  await expect(page.locator(".row-card").filter({ hasText: "Prescription #" + id })).toBeVisible();

  await page.goto("/alerts");
  const drugAlert = page.locator(".row-card").filter({ hasText: tag + "-A" }).filter({ hasText: "Synthetic browser-test caution" });
  await expect(drugAlert).toBeVisible();
  await drugAlert.getByRole("button", { name: "Mark read" }).click();
  await expect(drugAlert.getByRole("button", { name: "Mark read" })).toBeDisabled();

  await prisma.user.update({where:{id:[...users][0]},data:{role:"DOCTOR"}});
  await page.goto("/doctor/recommendations");
  await page.getByLabel("Prescription", { exact: true }).selectOption({ label: tag + ".txt" });
  await page.getByLabel("Medicine *", { exact: true }).selectOption({ label: tag + "-A" });
  await page.getByLabel("Reason *",{exact:true}).fill("Synthetic recommendation");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic recommendation" })).toBeVisible();
  await page.getByRole("button", { name: "Edit recommendation" }).click();
  await page.getByLabel("Status").fill("REVIEWED");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".row-card").filter({ hasText: "Synthetic recommendation" })).toContainText("REVIEWED");

  await page.goto("/knowledge-graph");
  await expect(page.getByRole("heading",{name:tag + "-A + " + tag + "-food",exact:false})).toBeVisible();
  await page.goto("/languages");
  await page.getByLabel("Text *", { exact: true }).fill("Test translation");
  await page.getByLabel("Source language *", { exact: true }).selectOption("en");
  await page.getByLabel("Target language *", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByRole("status").filter({hasText:"Test translation"})).toBeVisible();

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

test("real image upload, confirmed medicines, bilingual alerts, doctor consent, graph and logout", async ({ page, request, browser }) => {
  const tag = "ocr-browser-" + Date.now();
  const password = "image-test-password";
  const accounts = {};
  for (const role of ["patient","doctor"]) {
    const email = tag + "-" + role + "@example.com";
    const response = await request.post("/api/auth/register", {data:{name:tag+" "+role,email,password}});
    expect(response.status()).toBe(201);
    const {user} = await response.json(); users.add(user.id);
    if (role === "doctor") await prisma.user.update({where:{id:user.id},data:{role:"DOCTOR"}});
    accounts[role] = {id:user.id,email};
  }
  const crashes=[];
  page.on("pageerror",error=>crashes.push(error.message));
  async function login(tab,email) {
    await tab.goto("/login"); await tab.getByLabel("Email address").fill(email);
    await tab.getByLabel("Password",{exact:true}).fill(password);
    await tab.getByRole("button",{name:"Log in",exact:true}).click();
    await expect(tab).toHaveURL(/\/dashboard/);
    await expect(tab.locator(".stat-grid")).toBeVisible();
  }
  await login(page,accounts.patient.email);
  // Seeded catalogs are real database records, and ordinary patients can read both.
  await page.goto("/medicines"); await expect(page.locator(".row-card").filter({hasText:"Aspirin"})).toBeVisible();
  await page.goto("/foods"); await expect(page.locator(".row-card").filter({hasText:"Grapefruit juice"})).toBeVisible();
  await page.goto("/doctor"); await expect(page.locator("main").getByRole("alert")).toContainText("verified doctor");
  await page.goto("/interactions/drug-food");
  await page.getByRole("combobox",{name:"Medicine",exact:true}).selectOption({label:"Simvastatin"});
  await page.getByRole("combobox",{name:"Food",exact:true}).selectOption({label:"Grapefruit juice"});
  await page.getByRole("button",{name:"Check interaction",exact:true}).click();
  await expect(page.locator(".clinical-result")).toContainText("HIGH");

  const image = await requireBackend("sharp")(Buffer.from('<svg width="1200" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" font-size="54" fill="black"><text x="60" y="100">SYNTHETIC OCR TEST</text><text x="60" y="230">Aspirin 100 mg</text><text x="60" y="350">Ibuprofen 200 mg</text></g></svg>')).png().toBuffer();
  await page.goto("/prescriptions/upload");
  await page.getByLabel("Prescription image",{exact:true}).setInputFiles({name:tag+".png",mimeType:"image/png",buffer:image});
  await page.getByRole("button",{name:"Extract medicines",exact:true}).click();
  await expect(page).toHaveURL(/\/prescriptions\/\d+\/ocr$/, {timeout:120000});
  const id=Number(page.url().split("/").at(-2));
  await expect(page.getByLabel("Extracted text")).toHaveValue(/Aspirin/);
  const aspirin=page.locator("main").getByRole("checkbox",{name:/^Aspirin/});
  const ibuprofen=page.locator("main").getByRole("checkbox",{name:/^Ibuprofen/});
  await expect(aspirin).not.toBeChecked(); await expect(ibuprofen).not.toBeChecked();
  await expect(page.getByRole("button",{name:"Confirm medicines",exact:true})).toBeDisabled();
  await page.locator("summary").filter({hasText:"Prescription image"}).click();
  await expect(page.locator("img.prescription-image")).toBeVisible();
  await aspirin.check(); await ibuprofen.check();
  await page.getByRole("button",{name:"Confirm medicines",exact:true}).click();
  await expect(page.getByText("Medicines confirmed.",{exact:false})).toBeVisible();
  await page.reload();
  await expect(aspirin).toBeChecked(); await expect(ibuprofen).toBeChecked();
  await page.getByRole("link",{name:"Run analysis",exact:false}).click();
  await page.getByRole("button",{name:"Run analysis",exact:true}).click();
  await expect(page.getByRole("heading",{name:"HIGH RISK",exact:true})).toBeVisible();
  await expect(page.locator(".clinical-result")).toContainText("Aspirin + Ibuprofen");
  await expect(page.getByRole("heading",{name:"For clinician review",exact:true})).toBeVisible();
  await page.getByRole("combobox",{name:"Language / भाषा"}).selectOption("hi");
  await expect(page.getByRole("heading",{name:"सुरक्षा विश्लेषण"})).toBeVisible();
  await expect(page.locator(".clinical-result")).toContainText("संभावित खतरा");
  await expect(page.locator(".clinical-result")).toContainText(/[\u0900-\u097F]/);
  expect(await prisma.user.findUnique({where:{id:accounts.patient.id},select:{language:true}})).toEqual({language:"hi"});
  await page.reload();
  await expect(page.getByRole("heading",{name:"सुरक्षा विश्लेषण"})).toBeVisible();
  await page.getByRole("button",{name:"सुरक्षा जाँचें",exact:true}).click();
  await expect(page.locator(".clinical-result")).toContainText("Aspirin + Ibuprofen");
  await page.getByRole("link",{name:"सुरक्षा रिपोर्ट देखें"}).click();
  await expect(page.getByText("2 जुड़ी दवाएँ;",{exact:false})).toBeVisible();
  await page.goto("/alerts");
  await expect(page.locator(".row-card").filter({hasText:"Aspirin + Ibuprofen"})).toContainText(/[\u0900-\u097F]/);
  await page.locator(".row-card").filter({hasText:"Aspirin + Ibuprofen"}).getByRole("button",{name:"विवरण",exact:true}).click();
  await expect(page.locator(".clinical-result")).toContainText("क्या करें");
  // Exercise the installed browser's voice implementation; preserve a record of availability.
  const voices=await page.evaluate(()=>window.speechSynthesis?.getVoices().map(v=>v.lang) || []);
  console.log("Available browser voices:",JSON.stringify(voices));
  await page.locator(".clinical-result").getByRole("button",{name:"सुनें",exact:true}).click();
  if(!voices.some(lang=>lang.toLowerCase().startsWith("hi"))) await expect(page.locator(".clinical-result")).toContainText("इस भाषा की आवाज़ उपलब्ध नहीं है");
  await page.getByRole("combobox",{name:"Language / भाषा"}).selectOption("en");

  const doctorContext=await browser.newContext();
  const doctor=await doctorContext.newPage();
  doctor.on("pageerror",error=>crashes.push(error.message));
  try {
    await login(doctor,accounts.doctor.email);
    await doctor.goto("/doctor/prescriptions/"+id);
    await expect(doctor.locator("main").getByRole("alert")).toContainText("not found");
    await page.goto("/care-team");
    await page.getByLabel("Doctor email").fill(accounts.doctor.email);
    await page.getByRole("button",{name:"Grant access",exact:true}).click();
    await expect(page.locator(".row-card").filter({hasText:accounts.doctor.email})).toBeVisible();
    await doctor.goto("/doctor");
    await expect(doctor.getByRole("heading",{name:tag+" patient · "+accounts.patient.email,exact:true})).toBeVisible();
    await doctor.getByRole("link",{name:tag+".png",exact:true}).click();
    await expect(doctor.locator(".clinical-result")).toContainText("Aspirin + Ibuprofen");
    await expect(doctor.getByText("OCR confidence",{exact:true})).toBeVisible();
    await expect(doctor.getByRole("heading",{name:"For clinician review",exact:true})).toBeVisible();
    for (const path of ["/doctor/prescriptions","/doctor/alerts","/doctor/recommendations"]) {
      await doctor.goto(path); await expect(doctor.locator("main h1")).toBeVisible(); await expect(doctor.getByRole("status")).toHaveCount(0);
      await expect(doctor.locator("main").getByRole("alert")).toHaveCount(0);
    }
    await doctor.goto("/doctor/recommendations");
    await doctor.getByLabel("Prescription",{exact:true}).selectOption(String(id));
    const medicineId=(await prisma.medicine.findUnique({where:{rxCui:"1191"}})).id;
    await doctor.getByLabel("Medicine *",{exact:true}).selectOption(String(medicineId));
    await doctor.getByLabel("Reason *",{exact:true}).fill("Discuss this combination during your medicine review.");
    await doctor.getByLabel("Reason (Hindi)",{exact:true}).fill("दवाओं की समीक्षा के समय इस संयोजन पर चर्चा करें।");
    await doctor.getByRole("button",{name:"Save",exact:true}).click();
    await expect(doctor.locator(".row-card")).toContainText("Discuss this combination");
    await page.goto("/prescriptions/"+id);
    await expect(page.getByText("Discuss this combination during your medicine review.",{exact:true})).toBeVisible();
    await page.goto("/care-team");
    await page.getByRole("button",{name:"Revoke access",exact:true}).click();
    await expect(page.getByText("No doctors have access to your records.")).toBeVisible();
    await doctor.goto("/doctor/prescriptions/"+id);
    await expect(doctor.locator("main").getByRole("alert")).toContainText("not found");
  } finally {await doctorContext.close();}
  for (const path of ["/prescriptions","/interactions","/profile","/reports","/knowledge-graph","/languages"]) {
    await page.goto(path); await expect(page.locator("main h1")).toBeVisible(); await expect(page.getByText("Loading MediSafe data?",{exact:true})).toHaveCount(0);
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  }
  await page.goto("/knowledge-graph");
  await page.getByRole("link",{name:"Ibuprofen ↗",exact:true}).click();
  await expect(page.getByRole("heading",{name:"For clinician review",exact:true})).toBeVisible();
  const aspirinId=(await prisma.medicine.findUnique({where:{rxCui:"1191"}})).id;
  await page.goto("/medicines/"+aspirinId);
  await expect(page.getByRole("heading",{name:"Aspirin",exact:true})).toBeVisible();
  for (const [alias,target] of [["/interaction","/interactions"],["/prescription","/prescriptions/upload"],["/results","/prescriptions"]]) {
    await page.goto(alias); await expect(page).toHaveURL(new RegExp(target+"$"));
  }
  await page.getByRole("button",{name:"Log out",exact:true}).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(()=>sessionStorage.getItem("medisafe_token"))).toBeNull();
  await page.goto("/prescriptions/"+id);
  await expect(page).toHaveURL(/\/login/);
  expect(crashes).toEqual([]);
});
