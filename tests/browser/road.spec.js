import { test, expect } from "@playwright/test";
async function init(page) {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.requestAnimationFrame = (fn) =>
      setTimeout(() => fn(performance.now()), 50);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  });
}
const progress = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("ehy-amico:progress")));
test("Out Run: cinque checkpoint originali, 30 tesori, record car e persistenza", async ({
  page,
}) => {
  test.setTimeout(120000);
  await init(page);
  await page.goto("./");
  await page.evaluate(() =>
    localStorage.setItem(
      "ehy-amico:progress",
      JSON.stringify({
        version: 1,
        games: Object.fromEntries(
          ["roach", "runner", "tetris", "maze", "memory"].map((id) => [
            id,
            { completed: 5, best: 1500 },
          ]),
        ),
      }),
    ),
  );
  await page.reload();
  await page.goto("./#game/car");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  expect((await progress(page)).games.car.completed).toBe(0);
  await page.locator('[data-vehicle="auto"]').click();
  await page.clock.runFor(95000);
  expect((await progress(page)).games.car.completed).toBe(5);
  expect((await progress(page)).games.car.best).toBeGreaterThan(500);
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("30/60");
  await expect(page.locator(".fragment.earned")).toHaveCount(6);
  await page.reload();
  await expect(page.locator(".stats")).toContainText("30/60");
  for (const id of ["roach", "runner", "tetris"])
    expect((await progress(page)).games[id].best).toBe(1500);
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText("Out Run");
});
test("Out Run: tastiera, fuori pista, scadenza reale e riavvio senza premi", async ({
  page,
}) => {
  test.setTimeout(90000);
  await init(page);
  await page.goto("./#game/car");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  await page.locator('[data-vehicle="auto"]').click();
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(41000);
  await page.keyboard.up("ArrowLeft");
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "over",
  );
  await expect(page.locator(".road-overlay")).toContainText("Tempo scaduto");
  expect((await progress(page)).games.car.completed).toBe(0);
  expect((await progress(page)).games.car.best).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.locator('[data-vehicle="camion"]')).toBeVisible();
});
for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
])
  test(
    "Out Run touch, pausa, resize e offline " + viewport.width,
    async ({ browser }) => {
      test.setTimeout(60000);
      const context = await browser.newContext({ hasTouch: true, viewport }),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await init(page);
      await page.goto("http://127.0.0.1:8000/ehy-amico/");
      await expect(page.locator("#offline")).toContainText("Zaino pronto");
      await expect
        .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
        .toBe(true);
      await context.setOffline(true);
      await page.goto("http://127.0.0.1:8000/ehy-amico/#game/car");
      await page.reload();
      await page.getByRole("button", { name: "Inizia partita" }).tap();
      await page.locator('[data-vehicle="auto"]').tap();
      await page.clock.runFor(4200);
      const cancelled=await page.locator('.road-canvas').evaluate(canvas=>{
        let count=0;const listener=()=>count++;
        canvas.addEventListener('pointercancel',listener);
        canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:333,clientX:20,clientY:20}));
        canvas.dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:333}));
        canvas.removeEventListener('pointercancel',listener);
        return count;
      });
      expect(cancelled).toBe(1);
      const left = page.getByRole("button", { name: "Sterza a sinistra" });
      await left.scrollIntoViewIfNeeded();
      const b = await left.boundingBox(),
        cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
      });
      await page.clock.runFor(700);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.getByRole("button", { name: "Pausa", exact: true }).tap();
      const before = await page
        .locator(".road-canvas")
        .evaluate((c) => c.toDataURL());
      await page.clock.runFor(3000);
      expect(
        await page.locator(".road-canvas").evaluate((c) => c.toDataURL()),
      ).toBe(before);
      await page.getByRole("button", { name: "Riprendi" }).tap();
      await page.clock.runFor(300);
      await page.screenshot({
        path: "work/car-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({
        width: viewport.height,
        height: viewport.width,
      });
      await page.clock.runFor(200);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.getByRole("link", { name: "Torna alla mappa" }).click();
      expect(errors).toEqual([]);
      await context.close();
    },
  );
