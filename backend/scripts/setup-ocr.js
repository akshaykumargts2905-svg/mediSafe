require("dotenv").config();
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { gunzipSync } = require("node:zlib");
const directory = path.resolve(process.env.OCR_DATA_DIR || path.join(__dirname, "../.cache/tessdata"));

(async () => {
  await fs.mkdir(directory, { recursive: true });
  for (const language of ["eng", "hin"]) {
    const target = path.join(directory, language + ".traineddata");
    try { if ((await fs.stat(target)).size > 100000) { console.log(language + " model already installed"); continue; } } catch {}
    // Models are versioned npm dependencies; setup does not need a second download service.
    const model = require("@tesseract.js-data/" + language);
    const bytes = gunzipSync(await fs.readFile(path.join(path.dirname(model.langPath), "4.0.0_best_int", language + ".traineddata.gz")));
    if (bytes.length < 100000 || bytes.length > 20000000) throw new Error("Invalid model download");
    await fs.writeFile(target + ".tmp", bytes);
    await fs.rename(target + ".tmp", target);
    console.log(language + " installed; SHA-256 " + createHash("sha256").update(bytes).digest("hex"));
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
