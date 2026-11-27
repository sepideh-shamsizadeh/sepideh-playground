const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

const base = process.env.PLAYGROUND_TEST_URL || "http://127.0.0.1:4178";
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  try {
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: "dark" });
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("requestfailed", request => { if (request.url().startsWith(base)) errors.push(request.url()); });
      assert.equal((await page.goto(base + "/")).status(), 200);
      const home = page.getByRole("heading", { name: "Engineering Playground" });
      assert.ok(await home.isVisible());
      if (process.env.PLAYGROUND_SCREENSHOTS && width === 1280) {
        await page.screenshot({ path: process.env.PLAYGROUND_SCREENSHOTS + "/playground-desktop.png", fullPage: true });
      }
      await page.getByRole("link", { name: "Explore the Lab", exact: true }).click();
      await page.getByRole("heading", { name: "Applied AI & Robotics Lab" }).waitFor();
      const search = page.getByRole("searchbox", { name: "Search experiments" });
      const visibleCards = page.locator(".experiment:visible");
      assert.equal(await visibleCards.count(), 16);
      assert.equal(await page.locator(".metrics dd").first().innerText(), "16");
      await page.getByText("Progress by domain", { exact: true }).click();
      assert.ok(await page.locator(".domain-progress progress").first().isVisible());
      await page.getByText("Progress by domain", { exact: true }).click();
      await search.fill("kalman numpy");
      assert.equal(await visibleCards.count(), 2);
      await page.getByLabel("Domain", { exact: true }).selectOption("State Estimation & Sensor Fusion");
      await page.getByLabel("Status", { exact: true }).selectOption("Done");
      assert.equal(await visibleCards.count(), 0);
      assert.ok(await page.getByText("No experiments match these filters.").isVisible());
      await page.getByRole("button", { name: "Clear filters" }).click();
      assert.equal(await visibleCards.count(), 16);
      await page.getByLabel("Sort").selectOption("latest");
      assert.equal(await visibleCards.first().getAttribute("data-id"), "LAB-016");
      await page.reload();
      assert.equal(await visibleCards.first().getAttribute("data-id"), "LAB-016");
      await page.getByRole("button", { name: "Light mode" }).click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (process.env.PLAYGROUND_SCREENSHOTS && width === 390) {
        await page.screenshot({ path: process.env.PLAYGROUND_SCREENSHOTS + "/lab-mobile.png" });
        await page.locator("#experiments").scrollIntoViewIfNeeded();
        await page.screenshot({ path: process.env.PLAYGROUND_SCREENSHOTS + "/experiments-mobile.png" });
      }
      await visibleCards.first().getByRole("link", { name: "Experiment details" }).click();
      await page.getByRole("heading", { name: "Nav2 & Path Planning" }).waitFor();
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
      assert.match(await page.getByRole("link", { name: "GitHub issue" }).getAttribute("href"), /issues\/16$/);
      assert.ok(await page.getByRole("heading", { name: "Evaluation plan" }).isVisible());
      assert.equal(await page.getByRole("link", { name: "Source code", exact: true }).count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`Browser checks passed at ${width}px.`);
    }
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const page = await noScript.newPage();
    await page.goto(base + "/lab/");
    assert.equal(await page.locator(".experiment").count(), 16);
    assert.equal(await page.locator("#filters").isVisible(), false);
    console.log("All 16 experiments remain available without JavaScript.");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
