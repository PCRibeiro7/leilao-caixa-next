import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import "dotenv/config";
import { writeFileSync } from "fs";

import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const puppeteer = addExtra(puppeteerCore as never);
puppeteer.use(StealthPlugin());

const CHROME_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv";

async function downloadFile(): Promise<void> {
    const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY;
    console.log("[puppeteer] Starting downloadFile", { isServerless });

    console.log("[puppeteer] Resolving executablePath...");
    const executablePath = isServerless ? await chromium.executablePath() : undefined;
    console.log("[puppeteer] executablePath:", executablePath);
    console.log("[puppeteer] chromium.args:", chromium.args);

    console.log("[puppeteer] Launching browser...");
    const browser = await puppeteer.launch({
        headless: true,
        args: [...chromium.args, "--disable-blink-features=AutomationControlled", `--user-agent=${CHROME_UA}`],
        executablePath,
        channel: isServerless ? undefined : "chrome",
    });
    console.log("[puppeteer] Browser launched successfully");

    const [page] = await browser.pages();
    await page.setUserAgent(CHROME_UA);
    console.log("[puppeteer] User agent set");

    // Visit the download page
    console.log("[puppeteer] Navigating to download page...");
    await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp", {
        waitUntil: "networkidle2",
    });
    console.log("[puppeteer] Download page loaded, current URL:", page.url());

    // Log the page title to verify we're not on a CAPTCHA page
    const title = await page.title();
    console.log("[puppeteer] Page title:", title);

    // Interact with the form to establish a valid session
    console.log("[puppeteer] Selecting state RJ...");
    await page.select("#cmb_estado", "RJ");
    console.log("[puppeteer] State selected");

    // Set up response listener BEFORE clicking
    console.log("[puppeteer] Setting up response listener and clicking btn_next1...");
    const csvResponsePromise = page.waitForResponse(
        (res) => {
            const match = res.url().includes("Lista_imoveis") && res.url().endsWith(".csv");
            if (match) console.log("[puppeteer] Matched CSV response:", res.url(), "status:", res.status());
            return match;
        },
        { timeout: 10000 },
    );

    await page.click("#btn_next1");
    console.log("[puppeteer] Button clicked");

    let csvContent: string;
    try {
        const csvResponse = await csvResponsePromise;
        console.log("[puppeteer] CSV response captured, status:", csvResponse.status(), "url:", csvResponse.url());
        const csvBuffer = await csvResponse.buffer();
        console.log("[puppeteer] CSV buffer size:", csvBuffer.length);
        csvContent = csvBuffer.toString("latin1");
    } catch (err) {
        console.log("[puppeteer] waitForResponse failed:", err instanceof Error ? err.message : err);
        console.log("[puppeteer] Falling back to page.evaluate fetch...");
        csvContent = await page.evaluate(async (csvUrl: string) => {
            const response = await fetch(csvUrl, { credentials: "include" });
            console.log("In-page fetch status:", response.status);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        }, url);
        console.log("[puppeteer] Fallback fetch completed, content length:", csvContent.length);
    }

    const parsedCsv = csvContent.split("\n").slice(4).join("\n");
    console.log("[puppeteer] Parsed CSV lines:", parsedCsv.split("\n").length);
    console.log("[puppeteer] First 200 chars:", parsedCsv.substring(0, 200));

    writeFileSync(PROPERTIES_RAW_PATH, parsedCsv, { encoding: "latin1" });
    console.log("[puppeteer] CSV written to", PROPERTIES_RAW_PATH);

    await browser.close();
    console.log("[puppeteer] Browser closed, done");
}

export default downloadFile;

downloadFile();
