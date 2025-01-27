/* eslint-disable @typescript-eslint/no-unused-vars */
import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { writeFileSync } from "fs";
import "dotenv/config";

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv";
async function downloadFile(): Promise<void> {
    const outputPath = PROPERTIES_RAW_PATH;

    // await headlessFalse();
    await headlessTrue();
}

const headlessFalse = async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    const res = await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp");
    console.log("Page loaded");

    await page.select("#cmb_estado", "RJ");

    const clickResult = await page.click("#btn_next1");

    console.log(clickResult);

    console.log(res);

    // sleep for 5 seconds using promises
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return browser.close();
};

const headlessTrue = async () => {
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath:
            // process.env.CHROME_EXECUTABLE_PATH ||
            await chromium.executablePath("/var/task/node_modules/@sparticuz/chromium/bin"),
        headless: false,
    });

    const [page] = await browser.pages();

    await page.goto("https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp");

    const csvContent = await page.evaluate(async () => {
        const response = await fetch("https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv", {
            method: "GET",
            credentials: "include",
        });
        return await response.text();
    });
    console.log(csvContent);
    writeFileSync(PROPERTIES_RAW_PATH, csvContent);

    return browser.close();
};

export default downloadFile;
