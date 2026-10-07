const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
process.env.JWT_SECRET = require("node:crypto").randomBytes(48).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.CATALOG_EDITOR_IDS = "1";
const app = require("../server");
const { signToken } = require("../lib/auth");
const prisma = require("../lib/prisma");

const originalFindUser = prisma.user.findUnique;
let server;
let base;
before(async () => {
  prisma.user.findUnique = async () => ({ id: 1 });
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  prisma.user.findUnique = originalFindUser;
  await prisma.$disconnect();
});

async function request(method, url, body, headers = {}) {
  const response = await fetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + signToken(1), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

test("every route has one handler, try/catch, and one unique method/path", () => {
  const source = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  const mounts = [...source.matchAll(/app\.use\(\s*"([^"]+)"\s*,\s*require\("\.\/routes\/([^"]+)"\),?\s*\);/g)];
  assert.equal(mounts.length, 60);
  const endpoints = new Set();
  for (const [, url, file] of mounts) {
    const route = fs.readFileSync(path.join(__dirname, "../routes", file + ".js"), "utf8");
    const handlers = [...route.matchAll(/router\.(get|post|put|patch|delete)\("/g)];
    assert.equal(handlers.length, 1, file);
    assert.match(route, /async \(req, res\)/);
    assert.match(route, /try \{/);
    assert.match(route, /catch \(error\)/);
    const endpoint = handlers[0][1] + " " + url;
    assert.ok(!endpoints.has(endpoint), endpoint);
    endpoints.add(endpoint);
  }
});

test("health, languages, translation and JSON 404", async () => {
  assert.equal((await request("GET", "/")).status, 200);
  const languages = await request("GET", "/api/languages");
  assert.deepEqual(languages.body.map((language) => language.code), ["en", "hi"]);
  const translated = await request("POST", "/api/translate", { text: "Hello", language: "hi" });
  assert.equal(translated.body.translatedText, "Hello");
  assert.equal(translated.body.placeholder, true);
  assert.equal((await request("POST", "/api/translate", { text: "Hello", language: "xx" })).status, 400);
  assert.equal((await request("GET", "/missing")).status, 404);
});

test("required fields, field types, IDs and empty updates return 400 before database access", async () => {
  const cases = [
    ["POST", "/api/auth/register", {}],
    ["POST", "/api/auth/register", { name: "A", email: "bad", password: "p" }],
    ["POST", "/api/auth/login", { email: "a@b.com" }],
    ["POST", "/api/prescriptions", { userId: true, fileName: "a.txt" }],
    ["GET", "/api/prescriptions?userId=nope"],
    ["GET", "/api/prescriptions/not-an-id"],
    ["POST", "/api/ocr/process/1", { extractedText: "test", confidence: 3 }],
    ["PUT", "/api/ocr/1", {}],
    ["POST", "/api/medicines", { name: 1 }],
    ["PUT", "/api/medicines/1", { unknown: "field" }],
    ["GET", "/api/medicines/search?q="],
    ["GET", "/api/medicines/2147483648"],
    ["DELETE", "/api/medicines/1e2"],
    ["POST", "/api/prescriptions/1/medicines", {}],
    ["PUT", "/api/prescriptions/1/medicines/2", { dosage: false }],
    ["POST", "/api/drug-interactions/check", { medicineAId: 1, medicineBId: 1 }],
    ["POST", "/api/food-interactions/check", { medicineId: 1 }],
    ["POST", "/api/alerts", { prescriptionId: 1, type: "MANUAL", severity: "LOW", title: "A", message: "B", isRead: "false" }],
    ["POST", "/api/safety-reports/generate/nope", {}],
    ["POST", "/api/doctor/recommendations", {}],
    ["POST", "/api/analyze/1", { foodIds: "bad" }],
    ["POST", "/api/analyze/1", []],
    ["GET", "/api/knowledge-graph/medicine/nope"],
  ];
  for (const [method, url, body, headers] of cases) {
    const response = await request(method, url, body, headers);
    assert.equal(response.status, 400, method + " " + url);
    assert.equal(typeof response.body.message, "string");
  }
});

test("malformed JSON returns a JSON error", async () => {
  const response = await fetch(base + "/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad",
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid JSON/);
});

test("Prisma failures are mapped without exposing internal error messages", async () => {
  const original = prisma.medicine.findUnique;
  try {
    for (const [code, status] of [["P2002", 409], ["P2003", 409], ["P2025", 404], ["P2034", 409], ["P1001", 500]]) {
      prisma.medicine.findUnique = async () => {
        const error = new Error("sensitive database information");
        error.code = code;
        throw error;
      };
      const response = await request("GET", "/api/medicines/1");
      assert.equal(response.status, status);
      assert.ok(!JSON.stringify(response.body).includes("sensitive"));
    }
    prisma.medicine.findUnique = async () => {
      const error = new Error('PostgresError { code: "23001", message: "restricted delete" }');
      error.name = "PrismaClientUnknownRequestError";
      throw error;
    };
    assert.equal((await request("GET", "/api/medicines/1")).status, 409);
  } finally {
    prisma.medicine.findUnique = original;
  }
});
