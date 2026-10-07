const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { once } = require("node:events");
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = require("../server");
const prisma = require("../lib/prisma");
const { signToken, getAuthConfig } = require("../lib/auth");
const { hashPassword } = require("../lib/passwords");
const hashExistingPasswords = require("../scripts/hash-existing-passwords");

let server;
let base;
const original = {};
const account = { id: 1, name: "Test", email: "test@example.com", password: null, createdAt: new Date() };
function select(user, fields) {
  if (!user) return null;
  return fields ? Object.fromEntries(Object.keys(fields).map((key) => [key, user[key]])) : { ...user };
}

before(async () => {
  account.password = await hashPassword("test-password");
  for (const name of ["findUnique", "findMany", "create", "update", "updateMany"]) original[name] = prisma.user[name];
  prisma.user.findUnique = async ({ where, select: fields }) =>
    select(where.id === account.id || where.email === account.email ? account : null, fields);
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  Object.assign(prisma.user, original);
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function request(method, path, body, token, headers = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

test("all protected endpoint families reject missing tokens and x-user-id spoofing", async () => {
  for (const url of ["/api/users/me", "/api/prescriptions", "/api/ocr/1", "/api/alerts",
    "/api/safety-reports", "/api/doctor/dashboard", "/api/doctor/recommendations/1",
    "/api/medicines", "/api/foods", "/api/knowledge-graph", "/api/languages"]) {
    assert.equal((await request("GET", url, undefined, undefined, { "x-user-id": "1" })).status, 401, url);
  }
});

test("invalid signatures, modified IDs, expired tokens, wrong algorithms/claims and deleted users are rejected", async () => {
  const options = { algorithm: "HS256", expiresIn: "1h", issuer: "medisafe-api", audience: "medisafe-client" };
  const good = signToken(1);
  const parts = good.split(".");
  parts[1] = Buffer.from(JSON.stringify({ ...jwt.decode(good), userId: 2 })).toString("base64url");
  const tokens = [
    "not-a-token",
    parts.join("."),
    jwt.sign({ userId: 1 }, randomBytes(48), options),
    jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { ...options, expiresIn: -1 }),
    jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { ...options, algorithm: "HS384" }),
    jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { ...options, audience: "other-app" }),
    jwt.sign({ userId: "1" }, process.env.JWT_SECRET, options),
    jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { algorithm: "HS256", issuer: "medisafe-api", audience: "medisafe-client" }),
    signToken(999),
  ];
  for (const token of tokens) {
    assert.equal((await request("GET", "/api/users/me", undefined, token)).status, 401);
  }
  const valid = await request("GET", "/api/users/me", undefined, good, { "x-user-id": "999" });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.user.id, 1);
  assert.equal(valid.body.user.password, undefined);
});

test("login compares bcrypt hashes, uses generic failures, and returns minimal signed claims", async () => {
  const response = await request("POST", "/api/auth/login", { email: account.email, password: "test-password" });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.password, undefined);
  const payload = jwt.verify(response.body.token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  assert.equal(payload.userId, 1);
  assert.equal(payload.exp - payload.iat, 3600);
  assert.deepEqual(Object.keys(payload).sort(), ["userId", "exp", "iat", "iss", "aud"].sort());
  const wrong = await request("POST", "/api/auth/login", { email: account.email, password: "wrong-password" });
  const missing = await request("POST", "/api/auth/login", { email: "missing@example.com", password: "wrong-password" });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong, missing);
  const saved = account.password;
  account.password = "legacy-plaintext";
  assert.equal((await request("POST", "/api/auth/login", { email: account.email, password: account.password })).status, 401);
  account.password = saved;
});

test("register and password changes store bcrypt hashes without returning them", async () => {
  let saved;
  prisma.user.create = async ({ data, select: fields }) => {
    saved = data;
    return select({ ...account, ...data, id: 2 }, fields);
  };
  const registration = await request("POST", "/api/auth/register", {
    name: "New", email: "new@example.com", password: "new-password",
  });
  assert.equal(registration.status, 201);
  assert.equal(await bcrypt.compare("new-password", saved.password), true);
  assert.equal(bcrypt.getRounds(saved.password), 12);
  assert.equal(registration.body.user.password, undefined);
  assert.equal((await request("POST", "/api/auth/register", {
    name: "Duplicate", email: account.email, password: "new-password",
  })).status, 409);
  for (const password of ["short", "a".repeat(73), "é".repeat(37)]) {
    assert.equal((await request("POST", "/api/auth/register", {
      name: "Invalid", email: "new@example.com", password,
    })).status, 400);
  }
  prisma.user.update = async ({ data, where, select: fields }) => {
    assert.equal(where.id, 1);
    saved = data;
    return select({ ...account, ...data }, fields);
  };
  const update = await request("PUT", "/api/users/me", { password: "updated-password", userId: 999 }, signToken(1));
  assert.equal(update.status, 200);
  assert.equal(await bcrypt.compare("updated-password", saved.password), true);
  assert.equal(update.body.user.password, undefined);
});

test("catalog writes require trusted IDs; reads and checks remain authenticated", async () => {
  process.env.CATALOG_EDITOR_IDS = "";
  for (const [method, path] of [
    ["POST", "/api/medicines"], ["PUT", "/api/medicines/1"], ["DELETE", "/api/medicines/1"],
    ["POST", "/api/foods"], ["POST", "/api/drug-interactions"], ["POST", "/api/food-interactions"],
  ]) {
    assert.equal((await request(method, path, {}, signToken(1))).status, 403);
  }
  assert.equal((await request("POST", "/api/drug-interactions/check", {}, signToken(1))).status, 400);
  process.env.CATALOG_EDITOR_IDS = "1";
  assert.equal((await request("POST", "/api/medicines", {}, signToken(1))).status, 400);
});

test("password upgrade preserves existing bcrypt hashes and is idempotent", async () => {
  const hashed = await hashPassword("existing-password");
  const users = [{ id: 20, password: "old-password" }, { id: 21, password: hashed }];
  prisma.user.findMany = async ({ where }) => users.filter((user) => user.id > where.id.gt).map((user) => ({ ...user }));
  prisma.user.updateMany = async ({ where, data }) => {
    const user = users.find((item) => item.id === where.id && item.password === where.password);
    if (user) user.password = data.password;
    return { count: user ? 1 : 0 };
  };
  assert.deepEqual(await hashExistingPasswords(), { updated: 1, skipped: 1, requiresReset: 0 });
  assert.equal(users[1].password, hashed);
  assert.equal(await bcrypt.compare("old-password", users[0].password), true);
  assert.deepEqual(await hashExistingPasswords(), { updated: 0, skipped: 2, requiresReset: 0 });
});

test("missing or placeholder secrets fail configuration checks", () => {
  const saved = process.env.JWT_SECRET;
  try {
    for (const secret of ["", "short", "your-long-random-secret".repeat(3)]) {
      process.env.JWT_SECRET = secret;
      assert.throws(getAuthConfig);
    }
  } finally {
    process.env.JWT_SECRET = saved;
  }
});
