import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const htmlPath = resolve(repositoryRoot, "resume.html");
const outputPath = resolve(repositoryRoot, "Max_Leone_Resume.pdf");
const browserCandidates = [
  process.env.RESUME_CHROME_PATH,
  chromium.executablePath(),
  ...(process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      ]
    : []),
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage({
    viewport: { width: 816, height: 1056 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts?.ready);
  await page.pdf({
    path: outputPath,
    displayHeaderFooter: false,
    preferCSSPageSize: true,
    printBackground: true,
  });
} finally {
  await browser.close();
}

console.log(`Rendered ${outputPath}`);
