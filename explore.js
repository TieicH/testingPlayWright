import "dotenv/config";
import { chromium } from "playwright";
import fs from "fs";

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
  const exploreButton = await page.getByRole("link", {
    name: /Explore/i,
  });
  const foryouButton = await page.locator('[data-e2e="nav-foryou"]');

  await exploreButton.click();
  await page.waitForTimeout(500);
  await foryouButton.click();
  await page.waitForTimeout(500);
  await exploreButton.click();

  do {
    const selector = '[data-e2e="explore-item"] a';
    const elements = await page.locator(selector);
    const allElements = await elements.all();

    elementsLenght = allElements.length;

    await page.keyboard.press("Space");
    await page.waitForTimeout(1000);
  } while (elementsLenght < Number(ELEMENTS_LENGTH));

  // Selector para los elementos
  const selector = '[data-e2e="explore-item"]';
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
    const viewsVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "a strong"
    );
    const TitleVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "[data-e2e='explore-card-video-caption'] > div"
    );
    const LikesVideo = await parentElementHandle.evaluateHandle(
      (parent, selector) => {
        return parent.querySelector(selector);
      },
      "[data-e2e='explore-card-like-container'] strong"
    );
    const link = await linkVideo.getAttribute("href");
    const views = await viewsVideo.textContent();
    const title = await TitleVideo.textContent();
    const likes = await LikesVideo.textContent();

    return {
      link: link || "",
      views: views || "",
      title: title || "",
      likes: likes || "",
    };
  });

  const hrefs = await Promise.all(PromiseHref);

  await page.waitForTimeout(2000);

  // Guardar los links en un archivo JSON
  fs.writeFile("exploreVideos.json", JSON.stringify(hrefs, null, 2), (err) => {
    if (err) {
      console.error("Error al escribir el archivo:", err);
    } else {
      console.log("Archivo guardado: hrefs.json");
    }
  });

  await browser.close();
})();
