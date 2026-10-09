const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../server");
const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");

// Run explicitly: this suite creates temporary records in DATABASE_URL and removes them.
test("all endpoints against PostgreSQL, including analysis and cascading deletes", { timeout: 900000 }, async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  const tag = "api-test-" + Date.now() + "-" + process.pid;
  let userId;
  let otherUserId;
  let token;
  const originalEditors = process.env.CATALOG_EDITOR_IDS;
  const medicineIds = [];
  const foodIds = [];
  const seen = new Set();

  async function call(method, url, body, expected = 200, headers = {}) {
    const response = await fetch(base + url, {
      method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    assert.equal(response.status, expected, method + " " + url + ": " + JSON.stringify(data));
    assert.ok(!JSON.stringify(data).includes('"password":'), "Password leaked");
    seen.add(method + " " + url);
    return data;
  }

  try {
    await call("GET", "/");
    await call("GET", "/api/users/me", undefined, 401);
    const credentials = { name: tag, email: tag + "@example.com", password: "demo-password" };
    const registered = await call("POST", "/api/auth/register", credentials, 201);
    userId = registered.user.id;
    await call("POST", "/api/auth/register", credentials, 409);
    token = (await call("POST", "/api/auth/login", credentials)).token;
    assert.equal(typeof token, "string");
    const storedUser = await prisma.user.findUnique({ where: { id: userId } });
    assert.notEqual(storedUser.password, credentials.password);
    assert.equal(await bcrypt.compare(credentials.password, storedUser.password), true);
    assert.equal(bcrypt.getRounds(storedUser.password), 12);
    const payload = jwt.decode(token);
    assert.deepEqual(Object.keys(payload).sort(), ["aud", "exp", "iat", "iss", "userId"].sort());
    const hashBeforeLogin = storedUser.password;
    await call("POST", "/api/auth/login", credentials);
    assert.equal((await prisma.user.findUnique({ where: { id: userId } })).password, hashBeforeLogin);
    process.env.CATALOG_EDITOR_IDS = String(userId);
    await call("GET", "/api/languages");
    await call("POST", "/api/translate", { text: "Hello", language: "en", source: "en" });
    await call("POST", "/api/auth/login", { ...credentials, password: "wrong" }, 401);
    const userHeaders = { "x-user-id": "2147483647" }; // Spoofed legacy header must be ignored.
    assert.equal((await call("GET", "/api/users/me", undefined, 200, userHeaders)).user.id, userId);
    await call("PUT", "/api/users/me", { name: tag + "-updated" }, 200, userHeaders);
    const { prescription } = await call("POST", "/api/prescriptions", { userId, fileName: tag + ".txt" }, 201);
    const pid = prescription.id;
    await call("GET", "/api/prescriptions?userId=" + userId);
    await call("GET", "/api/prescriptions/" + pid);
    await call("GET", "/api/ocr/" + pid, undefined, 404);
    await call("POST", "/api/ocr/process/" + pid, { extractedText: "Demo text", confidence: 0.9 });
    await call("PUT", "/api/ocr/" + pid, { extractedText: "Updated demo text", language: "en" });
    assert.equal((await call("GET", "/api/ocr/" + pid)).ocrResult.extractedText, "Updated demo text");
    assert.equal((await call("GET", "/api/prescriptions/" + pid)).prescription.ocrText, "Updated demo text");

    for (let i = 0; i < 2; i++) {
      const { medicine } = await call("POST", "/api/medicines", { name: tag + "-medicine-" + i }, 201);
      medicineIds.push(medicine.id);
    }
    const [a, b] = medicineIds;
    await call("GET", "/api/medicines");
    await call("GET", "/api/medicines/" + a);
    await call("PUT", "/api/medicines/" + a, { genericName: "Demo generic", brandName: null });
    const search = await call("GET", "/api/medicines/search?q=" + tag);
    assert.equal(search.medicines.length, 2);
    for (const medicineId of medicineIds) {
      await call("POST", "/api/prescriptions/" + pid + "/medicines", { medicineId, dosage: "Demo only" }, 201);
    }
    await call("POST", "/api/prescriptions/" + pid + "/medicines", { medicineId: a }, 409);
    await call("PUT", "/api/prescriptions/" + pid + "/medicines/" + a, { frequency: "Demo frequency" });
    assert.equal((await call("GET", "/api/prescriptions/" + pid + "/medicines")).medicines.length, 2);
    await call("DELETE", "/api/medicines/" + a, undefined, 409);

    const { interaction: drug } = await call("POST", "/api/drug-interactions", {
      medicineAId: b, medicineBId: a, severity: "HIGH", description: "Synthetic test interaction",
    }, 201);
    await call("POST", "/api/drug-interactions", {
      medicineAId: a, medicineBId: b, severity: "HIGH", description: "Duplicate",
    }, 409);
    await call("GET", "/api/drug-interactions");
    await call("GET", "/api/drug-interactions/" + drug.id);
    await call("PUT", "/api/drug-interactions/" + drug.id, { recommendation: "Synthetic recommendation" });
    const reverse = await call("POST", "/api/drug-interactions/check", { medicineAId: b, medicineBId: a });
    assert.equal(reverse.interaction.id, drug.id);

    const { food } = await call("POST", "/api/foods", { name: tag + "-food" }, 201);
    foodIds.push(food.id);
    await call("GET", "/api/foods");
    await call("GET", "/api/foods/" + food.id);
    await call("PUT", "/api/foods/" + food.id, { name: tag + "-food-updated" });
    const { interaction: foodInteraction } = await call("POST", "/api/food-interactions", {
      medicineId: a, foodId: food.id, severity: "LOW", description: "Synthetic food caution",
    }, 201);
    await call("GET", "/api/food-interactions");
    await call("GET", "/api/food-interactions/" + foodInteraction.id);
    await call("PUT", "/api/food-interactions/" + foodInteraction.id, { recommendation: "Demo only" });
    assert.equal((await call("POST", "/api/food-interactions/check", { medicineId: a, foodId: food.id })).found, true);
    assert.equal((await call("POST", "/api/food-interactions/check", { medicineId: b, foodId: food.id })).found, false);

    const { alert } = await call("POST", "/api/alerts", {
      prescriptionId: pid, type: "MANUAL", severity: "LOW", title: "Demo", message: "Synthetic manual alert",
    }, 201);
    await call("GET", "/api/alerts?prescriptionId=" + pid);
    await call("GET", "/api/alerts/" + alert.id);
    assert.equal((await call("PATCH", "/api/alerts/" + alert.id + "/read")).alert.isRead, true);
    await call("POST", "/api/analyze/" + pid, {}, 422);
    const review = (await call("GET", "/api/ocr/" + pid)).ocrResult;
    await call("POST", "/api/ocr/" + pid + "/confirm", { medicineIds, reviewVersion: review.reviewVersion });
    const first = await call("POST", "/api/analyze/" + pid, { foodIds: [food.id] });
    assert.equal(first.report.totalMedicines, 2);
    assert.equal(first.report.totalAlerts, 3);
    assert.equal(first.report.highRiskCount, 1);
    assert.equal(first.report.overallStatus, "HIGH_RISK");
    const second = await call("POST", "/api/analyze/" + pid, { foodIds: [food.id] });
    assert.equal(second.report.id, first.report.id);
    assert.equal(second.alerts.length, 3, "Repeated analysis must not accumulate alerts");
    assert.equal(second.alerts.find((item) => item.id === alert.id).isRead, true);
    const withoutFoods = await call("POST", "/api/analyze/" + pid, { foodIds: [] });
    assert.equal(withoutFoods.foodInteractions.length, 0);
    assert.equal(withoutFoods.report.totalAlerts, 2);
    const allFoods = await call("POST", "/api/analyze/" + pid);
    assert.equal(allFoods.foodInteractions.length, 1);
    await call("POST", "/api/safety-reports/generate/" + pid);
    assert.equal((await call("GET", "/api/safety-reports/" + pid)).report.totalAlerts, 3);
    assert.equal((await call("GET", "/api/safety-reports?prescriptionId=" + pid)).reports.length, 1);

    await call("GET", "/api/doctor/dashboard", undefined, 403);
    await prisma.user.update({ where: { id: userId }, data: { role: "DOCTOR" } });
    await call("GET", "/api/doctor/dashboard");
    await call("GET", "/api/doctor/prescriptions?userId=" + userId);
    await call("GET", "/api/doctor/prescriptions/" + pid);
    await call("GET", "/api/doctor/alerts?prescriptionId=" + pid);
    const { recommendation } = await call("POST", "/api/doctor/recommendations", {
      prescriptionId: pid, medicineId: a, reason: "Synthetic recommendation", alternative: "Demo alternative",
    }, 201);
    await call("PUT", "/api/doctor/recommendations/" + recommendation.id, { status: "REVIEWED" });
    assert.equal((await call("GET", "/api/doctor/recommendations/" + pid)).recommendations.length, 1);
    console.log("CRUD and analysis checks passed; checking isolation between two users.");
    const { user: otherUser } = await call("POST", "/api/auth/register", {
      name: tag + "-other", email: tag + "-other@example.com", password: "other-password",
    }, 201);
    otherUserId = otherUser.id;
    await prisma.user.update({ where: { id: otherUserId }, data: { role: "DOCTOR" } });
    const otherToken = (await call("POST", "/api/auth/login", {
      email: otherUser.email, password: "other-password",
    })).token;
    const otherHeaders = { Authorization: "Bearer " + otherToken, "x-user-id": String(userId) };
    assert.equal((await call("GET", "/api/users/me", undefined, 200, otherHeaders)).user.id, otherUserId);
    // Every private route family must reject another user's resource IDs.
    const denied = [
      ["GET", "/api/prescriptions/" + pid],
      ["DELETE", "/api/prescriptions/" + pid],
      ["GET", "/api/prescriptions/" + pid + "/medicines"],
      ["POST", "/api/prescriptions/" + pid + "/medicines", { medicineId: a }],
      ["PUT", "/api/prescriptions/" + pid + "/medicines/" + a, { dosage: "tamper" }],
      ["DELETE", "/api/prescriptions/" + pid + "/medicines/" + a],
      ["GET", "/api/ocr/" + pid],
      ["POST", "/api/ocr/process/" + pid, { extractedText: "tamper" }],
      ["PUT", "/api/ocr/" + pid, { extractedText: "tamper" }],
      ["GET", "/api/alerts/" + alert.id],
      ["PATCH", "/api/alerts/" + alert.id + "/read"],
      ["DELETE", "/api/alerts/" + alert.id],
      ["POST", "/api/alerts", { prescriptionId: pid, type: "MANUAL", severity: "LOW", title: "tamper", message: "tamper" }],
      ["GET", "/api/safety-reports/" + pid],
      ["POST", "/api/safety-reports/generate/" + pid],
      ["POST", "/api/analyze/" + pid],
      ["GET", "/api/doctor/prescriptions/" + pid],
      ["GET", "/api/doctor/recommendations/" + pid],
      ["POST", "/api/doctor/recommendations", { prescriptionId: pid, medicineId: a, reason: "tamper" }],
      ["PUT", "/api/doctor/recommendations/" + recommendation.id, { reason: "tamper" }],
    ];
    for (const [method, url, body] of denied) await call(method, url, body, 404, otherHeaders);
    await call("POST", "/api/prescriptions", { userId, fileName: "tamper.txt" }, 403, otherHeaders);
    for (const url of ["/api/prescriptions", "/api/doctor/prescriptions"]) {
      assert.equal((await call("GET", url, undefined, 200, otherHeaders)).prescriptions.length, 0);
      await call("GET", url + "?userId=" + userId, undefined, url.startsWith("/api/doctor") ? 200 : 403, otherHeaders);
    }
    for (const url of ["/api/alerts", "/api/doctor/alerts", "/api/safety-reports"]) {
      const data = await call("GET", url + "?prescriptionId=" + pid, undefined, 200, otherHeaders);
      assert.equal((data.alerts || data.reports).length, 0);
    }
    const dashboard = await call("GET", "/api/doctor/dashboard", undefined, 200, otherHeaders);
    assert.equal(dashboard.prescriptions, 0);
    assert.equal(dashboard.unreadAlerts, 0);
    for (const url of ["/api/medicines", "/api/foods", "/api/drug-interactions", "/api/food-interactions"]) {
      await call("POST", url, {}, 403, otherHeaders);
    }
    await call("DELETE", "/api/medicines/" + a, undefined, 403, otherHeaders);
    await call("PUT", "/api/users/me", { password: "changed-password" }, 200, otherHeaders);
    await call("POST", "/api/auth/login", { email: otherUser.email, password: "other-password" }, 401);
    await call("POST", "/api/auth/login", { email: otherUser.email, password: "changed-password" });
    const updatedUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    assert.equal(await bcrypt.compare("changed-password", updatedUser.password), true);
    await call("GET", "/api/users/me", undefined, 401, { Authorization: "Bearer " + token + "tampered" });
    const expiredToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      algorithm: "HS256", expiresIn: -1, issuer: "medisafe-api", audience: "medisafe-client",
    });
    await call("GET", "/api/users/me", undefined, 401, { Authorization: "Bearer " + expiredToken });
    await call("GET", "/api/knowledge-graph");
    assert.equal((await call("GET", "/api/knowledge-graph/medicine/" + a)).medicine.foodInteractions.length, 1);
    assert.equal((await call("GET", "/api/knowledge-graph/medicine/" + b)).medicine.interactionsAsB.length, 1);


    // Real image OCR, catalog normalization, review and consent boundaries.
    const image = await sharp(Buffer.from('<svg width="1200" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" font-size="54" fill="black"><text x="60" y="100">SYNTHETIC OCR TEST</text><text x="60" y="230">Aspirin 100 mg</text><text x="60" y="350">Ibuprofen 200 mg</text></g></svg>')).png().toBuffer();
    async function uploadImage(bytes, type, status) {
      const body = new FormData(); body.set("image", new Blob([bytes], { type }), "test.png"); body.set("language", "en");
      const response = await fetch(base + "/api/prescriptions/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body });
      const data = await response.json();
      assert.equal(response.status, status, JSON.stringify(data));
      seen.add("POST /api/prescriptions/upload"); return data;
    }
    await uploadImage(Buffer.from("not an image"), "image/png", 422);
    await uploadImage(image, "application/pdf", 415);
    await uploadImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413);
    const uploaded = (await uploadImage(image, "image/png", 201)).prescription;
    const imageId = uploaded.id;
    assert.equal(uploaded.ocrResult.inputMethod, "IMAGE");
    assert.ok(uploaded.ocrResult.confidence > .5);
    assert.equal(uploaded.ocrResult.status, "REVIEW_REQUIRED");
    const detected = uploaded.ocrResult.candidates.matches;
    assert.ok(detected.some(row => row.rxCui === "1191"), "Aspirin must match RxNorm");
    assert.ok(detected.some(row => row.rxCui === "5640"), "Ibuprofen must match RxNorm");
    assert.equal((await call("GET", "/api/prescriptions/" + imageId + "/medicines")).medicines.length, 0);
    await call("POST", "/api/analyze/" + imageId, {}, 422);
    const imageResponse = await fetch(base + "/api/prescriptions/" + imageId + "/image", { headers: { Authorization: "Bearer " + token } });
    assert.equal(imageResponse.status, 200); assert.equal(imageResponse.headers.get("content-type"), "image/png"); assert.ok((await imageResponse.arrayBuffer()).byteLength > 0);
    seen.add("GET /api/prescriptions/" + imageId + "/image");
    await call("GET", "/api/prescriptions/" + imageId + "/image", undefined, 404, otherHeaders);
    const selected = detected.filter(row => ["1191","5640"].includes(row.rxCui)).map(row => row.medicineId);
    await call("POST", "/api/ocr/" + imageId + "/confirm", {medicineIds:selected,reviewVersion:999}, 409);
    await call("POST", "/api/ocr/" + imageId + "/confirm", {medicineIds:selected,reviewVersion:1}, 404, otherHeaders);
    await call("POST", "/api/ocr/" + imageId + "/confirm", {medicineIds:selected,reviewVersion:1});
    const analyzed = await call("POST", "/api/analyze/" + imageId, {}, 200, {"Accept-Language":"hi"});
    assert.equal(analyzed.report.highRiskCount, 1);
    assert.match(analyzed.alerts[0].display.message, /[\u0900-\u097F]/);
    assert.ok(analyzed.alternatives.length > 0);
    const english = analyzed.alerts[0].message;
    const hindi = await call("POST", "/api/translate", {text:english,source:"en",language:"hi"});
    assert.equal(hindi.translatedText, analyzed.alerts[0].messageHi);
    await call("POST", "/api/translate", {text:"unconfigured provider test " + tag,source:"en",language:"hi"}, 503);
    await call("PUT", "/api/users/me", {language:"hi",role:"PATIENT"});
    assert.equal((await call("GET", "/api/users/me")).user.role, "DOCTOR", "Profile must not change role");
    assert.equal((await call("GET", "/api/users/me")).user.language, "hi");
    await call("PUT", "/api/users/me", {language:"en"});
    assert.equal((await call("GET", "/api/care-team")).doctors.length, 0);
    await call("POST", "/api/care-team", {email:otherUser.email}, 201);
    assert.equal((await call("GET", "/api/care-team")).doctors[0].doctorId, otherUserId);
    assert.equal((await call("GET", "/api/doctor/prescriptions/" + imageId, undefined, 200, otherHeaders)).prescription.user.id, userId);
    await call("GET", "/api/prescriptions/" + imageId, undefined, 404, otherHeaders);
    await call("DELETE", "/api/care-team/" + otherUserId);
    await call("GET", "/api/doctor/prescriptions/" + imageId, undefined, 404, otherHeaders);
    await call("PUT", "/api/ocr/" + imageId, {extractedText:"Aspirin 100 mg",language:"en"});
    assert.equal((await call("GET", "/api/ocr/" + imageId)).ocrResult.inputMethod,"IMAGE");
    assert.equal((await call("GET", "/api/alerts?prescriptionId=" + imageId)).alerts.length,0);
    await call("GET", "/api/safety-reports/" + imageId, undefined, 404);
    await call("POST", "/api/analyze/" + imageId, {}, 422);
    await call("POST", "/api/safety-reports/generate/" + imageId, {}, 422);
    await call("DELETE", "/api/prescriptions/" + imageId);
    assert.equal(await prisma.prescriptionImage.count({where:{prescriptionId:imageId}}),0);
    console.log("Real image OCR, Hindi, review, private images and revocable doctor consent passed.");

    await call("DELETE", "/api/alerts/" + alert.id);
    await call("GET", "/api/alerts/" + alert.id, undefined, 404);
    await call("DELETE", "/api/drug-interactions/" + drug.id);
    assert.equal((await call("POST", "/api/drug-interactions/check", { medicineAId: a, medicineBId: b })).found, false);
    await call("DELETE", "/api/food-interactions/" + foodInteraction.id);
    await call("DELETE", "/api/prescriptions/" + pid + "/medicines/" + b);
    await call("DELETE", "/api/prescriptions/" + pid);
    await call("GET", "/api/prescriptions/" + pid, undefined, 404);
    await call("GET", "/api/ocr/" + pid, undefined, 404);
    assert.equal(await prisma.alert.count({ where: { prescriptionId: pid } }), 0);
    assert.equal(await prisma.safetyReport.count({ where: { prescriptionId: pid } }), 0);
    assert.equal(await prisma.doctorRecommendation.count({ where: { prescriptionId: pid } }), 0);
    for (const id of medicineIds) await call("DELETE", "/api/medicines/" + id);
    await call("DELETE", "/api/foods/" + food.id);
    await call("DELETE", "/api/users/me", undefined, 200, userHeaders);
    await call("GET", "/api/users/me", undefined, 401, userHeaders);
    const source = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    const mounts = [...source.matchAll(/app\.use\(\s*"([^"]+)"\s*,\s*require\("\.\/routes\/([^"]+)"\),?\s*\);/g)];
    for (const [, url, file] of mounts) {
      const route = fs.readFileSync(path.join(__dirname, "../routes", file + ".js"), "utf8");
      const method = route.match(/router\.(get|post|put|patch|delete)\("/)[1].toUpperCase();
      const pattern = new RegExp("^" + method + " " + url.replace(/:[^/]+/g, "[^/]+") + "$");
      assert.ok([...seen].some((request) => pattern.test(request.split("?")[0])), "Untested endpoint: " + method + " " + url);
    }
    console.log("Verified all " + mounts.length + " endpoints through HTTP.");
  } finally {
    // Delete only records created by this test, even after a failed assertion.
    try {
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
      if (otherUserId) await prisma.user.deleteMany({ where: { id: otherUserId } });
      if (medicineIds.length) await prisma.medicine.deleteMany({ where: { id: { in: medicineIds } } });
      if (foodIds.length) await prisma.food.deleteMany({ where: { id: { in: foodIds } } });
    } finally {
      if (originalEditors === undefined) delete process.env.CATALOG_EDITOR_IDS;
      else process.env.CATALOG_EDITOR_IDS = originalEditors;
      await new Promise((resolve) => server.close(resolve));
      await prisma.$disconnect();
    }
  }
});
