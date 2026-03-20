/* eslint-disable @typescript-eslint/no-unused-vars */
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

async function launchBrowser(opts: Parameters<typeof puppeteer.launch>[0], retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await puppeteer.launch(opts);
        } catch (err: unknown) {
            const isETXTBSY = err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ETXTBSY";
            if (!isETXTBSY || i === retries - 1) throw err;
            console.log(`ETXTBSY on attempt ${i + 1}, retrying in 1s...`);
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    throw new Error("Failed to launch browser");
}

async function downloadFile(): Promise<void> {
    const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY;

    const executablePath = isServerless ? await chromium.executablePath() : undefined;

    const browser = await launchBrowser({
        headless: isServerless ? chromium.headless : true,
        args: [...chromium.args, "--disable-blink-features=AutomationControlled", `--user-agent=${CHROME_UA}`],
        executablePath,
        channel: isServerless ? undefined : "chrome",
    });

    const [page] = await browser.pages();
    await page.setUserAgent(CHROME_UA);

    // Visit the download page
    await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp", {
        waitUntil: "networkidle2",
    });

    // Interact with the form to establish a valid session
    await page.select("#cmb_estado", "RJ");

    // Set up response listener BEFORE clicking
    const csvResponsePromise = page.waitForResponse(
        (res) => res.url().includes("Lista_imoveis") && res.url().endsWith(".csv"),
        { timeout: 10000 },
    );

    await page.click("#btn_next1");

    let csvContent: string;
    try {
        const csvResponse = await csvResponsePromise;
        const csvBuffer = await csvResponse.buffer();
        csvContent = csvBuffer.toString("latin1");
    } catch {
        console.log("Failed to capture CSV response, falling back to page fetch method.");
        // If waitForResponse times out, the button may have triggered a navigation
        // or the download works differently — fall back to fetch from page context
        csvContent = await page.evaluate(async (csvUrl: string) => {
            const response = await fetch(csvUrl, { credentials: "include" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        }, url);
    }

    const parsedCsv = csvContent.split("\n").slice(4).join("\n");

    // console.log(parsedCsv);
    writeFileSync(PROPERTIES_RAW_PATH, parsedCsv, { encoding: "latin1" });

    return browser.close();
}

export default downloadFile;

downloadFile();
