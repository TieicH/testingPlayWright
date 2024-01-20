import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

const CATEGORY = process.env.CATEGORY;
const ELEMENTS_LENGTH = process.env.TOTAL_VIDEOS;
const URL_PAGE = process.env.URL;

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let elementsLenght = 0;

  await page.goto(URL_PAGE);
  await page.waitForTimeout(5000);
  const continueAsGuesstButton = await page.locator("text=Continue as Guest");
  const isVisilbe = await continueAsGuesstButton.isVisible();
  if (isVisilbe) {
    await continueAsGuesstButton?.click();
  }
  await page.waitForTimeout(1000);
  await page.getByRole("combobox", { name: /search/i }).fill(CATEGORY);
  await page.waitForTimeout(1000);
  const searchButton = await page.getByRole("button", { name: /search/i });
  await searchButton.click();
  await page.waitForTimeout(6000);

  do {
    const selector = '[data-e2e="search_top-item"] a';
    const elements = await page.locator(selector);
    const allElements = await elements.all();

    elementsLenght = allElements.length;

    await page.keyboard.press("Space");
    await page.waitForTimeout(1000);
  } while (elementsLenght < Number(ELEMENTS_LENGTH));

  await page.waitForTimeout(1000);
  // Selector para los elementos
  const selector = '[data-e2e="search_top-item"]';
  const elements = await page.locator(selector);
  const allElements = await elements.all();

  const PromiseHref = await allElements.map(async (element) => {
    const parentElementHandle = await element.evaluateHandle(
      (el) => el.parentElement
    );

    const linkVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "a"
    );
    const TitleVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "[data-e2e='search-card-video-caption']"
    );
    const viewsVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "[data-e2e='search-card-like-container'] strong"
    );
    const link = await linkVideo.getAttribute("href");
    const views = (await viewsVideo?.textContent()) || "";
    const title = (await TitleVideo?.textContent()) || "";

    return {
      link: link || "",
      views: views || "",
      title: title || "",
    };
  });

  const hrefs = await Promise.all(PromiseHref);

  await page.waitForTimeout(2000);

  // Guardar los link en un archivo JSON
  fs.writeFile(
    `./results/findByCategory-${CATEGORY}.json`,
    JSON.stringify(hrefs, null, 2),
    (err) => {
      if (err) {
        console.error("Error al escribir el archivo:", err);
      } else {
        console.log(`Archivo guardado: findByCategory-${CATEGORY}.json`);
      }
    }
  );

  await browser.close();
})();
