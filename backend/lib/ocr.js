const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const { badRequest } = require("./validation");
const dataDirectory = () => path.resolve(process.env.OCR_DATA_DIR || path.join(__dirname, "../.cache/tessdata"));
const fail = (status, message) => Object.assign(new Error(message), { status });
let activeJobs = 0;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, fieldSize: 1024, parts: 4 },
  fileFilter(req, file, callback) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) return callback(fail(415, "Upload a PNG, JPEG or WebP image"));
    callback(null, true);
  },
}).single("image");

async function validateImage(file) {
  if (!file?.buffer?.length) throw badRequest("A prescription image is required");
  try {
    const image = sharp(file.buffer, { limitInputPixels: 16000000, animated: false });
    const metadata = await image.metadata();
    const mime = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" }[metadata.format];
    if (!mime || mime !== file.mimetype || metadata.pages > 1) throw new Error("Unsupported image");
    const buffer = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).flatten({ background: "white" }).png().toBuffer();
    if (buffer.length > 8 * 1024 * 1024) throw new Error("Image too large");
    return buffer;
  } catch {
    throw fail(422, "The image could not be read. Use a clear, single-page PNG, JPEG or WebP image up to 16 megapixels.");
  }
}

async function recognizeImage(buffer, language = "en") {
  if (!["en", "hi"].includes(language)) throw badRequest("language must be en or hi");
  const languages = language === "hi" ? ["eng", "hin"] : ["eng"];
  if (languages.some((name) => !fs.existsSync(path.join(dataDirectory(), name + ".traineddata")))) {
    throw fail(503, "Image recognition is unavailable. Enter the prescription text manually or try again later.");
  }
  if (activeJobs >= 2) throw fail(429, "Image recognition is busy. Please try again shortly.");
  activeJobs++;
  let worker;
  let timeout;
  let expired = false;
  try {
    const work = (async () => {
      worker = await createWorker(languages, 1, { langPath: dataDirectory(), gzip: false, cacheMethod: "none", errorHandler: () => {} });
      if (expired) { await worker.terminate(); throw fail(504, "Image recognition timed out. Try a smaller, clearer image."); }
      const { data } = await worker.recognize(buffer);
      return { extractedText: data.text.trim().slice(0, 50000), confidence: Math.max(0, Math.min(1, (Number(data.confidence) || 0) / 100)), language };
    })();
    return await Promise.race([work, new Promise((_, reject) => {
      timeout = setTimeout(() => { expired = true; reject(fail(504, "Image recognition timed out. Try a smaller, clearer image.")); }, 90000);
    })]);
  } catch (error) {
    if (error.status) throw error;
    throw fail(503, "Image recognition failed. Try a clearer image or enter its text manually.");
  } finally {
    clearTimeout(timeout);
    if (worker) await worker.terminate().catch(() => {});
    activeJobs--;
  }
}

module.exports = { upload, validateImage, recognizeImage, dataDirectory, fail };
