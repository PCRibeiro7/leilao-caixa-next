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

async function downloadFile(): Promise<void> {
    const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY;

    const browser = await puppeteer.launch({
        headless: true,
        args: [...chromium.args, "--disable-blink-features=AutomationControlled", `--user-agent=${CHROME_UA}`],
        executablePath: isServerless ? await chromium.executablePath() : undefined,
        channel: isServerless ? undefined : "chrome",
    });

    const [page] = await browser.pages();
    await page.setUserAgent(CHROME_UA);

    // First visit the download page to establish session cookies
    await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp", {
        waitUntil: "networkidle2",
    });

    // Fetch the CSV from within the page context (session cookies are inherited)
    // Using page.goto would fail with ERR_ABORTED since the server sends it as a download
    const csvContent = await page.evaluate(async (csvUrl: string) => {
        const response = await fetch(csvUrl, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    }, url);

    const parsedCsv = csvContent.split("\n").slice(4).join("\n");

    console.log(parsedCsv);
    writeFileSync(PROPERTIES_RAW_PATH, parsedCsv, { encoding: "latin1" });

    return browser.close();
}

export default downloadFile;
