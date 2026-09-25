import fs from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

async function resolveExecutablePath(): Promise<string> {
  if (process.env.VERCEL) return chromium.executablePath();
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) {
    throw new Error("Chrome não encontrado localmente. Defina PUPPETEER_EXECUTABLE_PATH no .env.local.");
  }
  return found;
}

async function launchBrowser(): Promise<Browser> {
  const executablePath = await resolveExecutablePath();
  return puppeteer.launch({
    args: process.env.VERCEL ? chromium.args : [],
    executablePath,
    headless: true,
  });
}

export async function renderPagePdf(url: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1200 });
    await page.emulateMediaType("print");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const bodyHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const pdf = await page.pdf({
      width: "1000px",
      height: `${bodyHeight}px`,
      printBackground: true,
      pageRanges: "1",
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
