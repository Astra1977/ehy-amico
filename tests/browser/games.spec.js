import { test, expect } from "@playwright/test";
async function enter(page, id) {
  await page.goto("./#game/" + id);
  await expect(
    page.getByRole("button", { name: "Inizia partita" }),
  ).toBeVisible();
}
const state = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("ehy-amico:progress")));
test("cucaracha: 35 secondi reali simulati, tastiera, errori, vittoria e persistenza", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.7;
  });
  await enter(page, "roach");
  expect((await state(page)).games.roach.completed).toBe(0);
  await page.getByRole("button", { name: "Inizia partita" }).click();
  const target = page
    .getByRole("button", { name: "Cucaracha", exact: true })
    .first();
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".game-hud")).toContainText("Catture 1/8");
  for (let n = 0; n < 57; n++) {
    await page.clock.runFor(600);
    const targets = page.locator('[data-target="roach"]');
    while (await targets.count()) await targets.last().click();
  }
  await page.clock.runFor(1000);
  await expect(page.locator(".game-play")).toHaveAttribute("data-state", "won");
  expect((await state(page)).games.roach.completed).toBe(1);
  expect((await state(page)).games.roach.best).toBeGreaterThan(0);
  await page.reload();
  expect((await state(page)).games.roach.completed).toBe(1);
  await page.getByRole("button", { name: "Inizia partita" }).click();
  await page.clock.runFor(35100);
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "over",
  );
  expect((await state(page)).games.roach.completed).toBe(1);
  expect(errors).toEqual([]);
});
test("runner: spazio, collisione, pausa, riavvio e uscita pulita", async ({
  page,
}) => {
  await page.clock.install();
  await enter(page, "runner");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  await page.clock.runFor(100);
  const before = await page.locator("canvas").evaluate((c) => c.toDataURL());
  await page.keyboard.press("Space");
  await page.clock.runFor(200);
  expect(await page.locator("canvas").evaluate((c) => c.toDataURL())).not.toBe(
    before,
  );
  await page.getByRole("button", { name: "Pausa", exact: true }).click();
  const paused = await page.locator(".game-hud").textContent();
  await page.clock.runFor(2000);
  await expect(page.locator(".game-hud")).toHaveText(paused);
  await page.getByRole("button", { name: "Riprendi" }).click();
  await page.clock.runFor(8000);
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "over",
  );
  expect((await state(page)).games.runner.completed).toBe(0);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "playing",
  );
  await page.getByRole("link", { name: "Torna alla mappa" }).click();
  await page.clock.runFor(15000);
  expect((await state(page)).games.runner.completed).toBe(0);
});
// Fixture vicine al traguardo: usano i motori reali e l’azione finale nel browser.
async function nearGoal(page, id) {
  await page.evaluate(async (id) => {
    if (id === "roach") {
      const { RoachEngine, ROACH_GOALS } =
        await import("./js/arcade-engines.js");
      const tick = RoachEngine.prototype.tick;
      RoachEngine.prototype.tick = function (dt) {
        if (!this.fixture) {
          this.fixture = true;
          this.time = 34.7;
          this.captures = ROACH_GOALS[this.stage - 1];
          this.defeated = 1;
        }
        return tick.call(this, dt);
      };
    }
    if (id === "runner") {
      const { RunnerEngine, RUNNER_DURATIONS } =
        await import("./js/arcade-engines.js");
      const tick = RunnerEngine.prototype.tick;
      RunnerEngine.prototype.tick = function (dt) {
        if (!this.fixture) {
          this.fixture = true;
          this.time = RUNNER_DURATIONS[this.stage - 1] - 0.3;
          this.spawnAt = 100;
          this.obstacles = [];
          this.points = 12;
        }
        return tick.call(this, dt);
      };
    }
    if (id === "tetris") {
      const { TetrisEngine } = await import("./js/tetris-engine.js");
      const spawn = TetrisEngine.prototype.spawn;
      TetrisEngine.prototype.spawn = function () {
        spawn.call(this);
        if (!this.fixture) {
          this.fixture = true;
          const select = document.querySelector(".game-toolbar select");
          this.lines = Number(select.value) * 10 - 1;
          this.board[19] = Array(10)
            .fill(1)
            .map((v, x) => (x >= 3 && x <= 6 ? 0 : v));
          this.piece = { kind: 0, matrix: [[1, 1, 1, 1]], x: 3, y: 0 };
        }
      };
    }
  }, id);
}
test("15 tesori, tre frammenti, record e diario: flusso di completamento con fixture", async ({
  page,
}) => {
  await page.clock.install();
  for (const id of ["roach", "runner", "tetris"]) {
    await enter(page, id);
    await nearGoal(page, id);
    for (let n = 1; n <= 5; n++) {
      await page.locator(".game-toolbar select").selectOption(String(n));
      await page
        .getByRole("button", { name: "Inizia partita", exact: true })
        .click();
      if (id === "tetris") await page.keyboard.press("Space");
      else await page.clock.runFor(500);
      expect((await state(page)).games[id].completed).toBe(n);
    }
  }
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("15/60");
  await expect(page.locator(".fragment.earned")).toHaveCount(3);
  await expect(page.locator(".medal.earned")).toHaveCount(15);
  await page.reload();
  await expect(page.locator(".stats")).toContainText("15/60");
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText(
    "Acchiappa la Cucaracha",
  );
  await expect(page.locator(".notebook")).toContainText("Salta la Cacca");
  await expect(page.locator(".notebook")).toContainText("Tetris");
});
test("Tetris: comandi reali, righe eliminate, tastiera, game over e riavvio", async ({
  page,
}) => {
  await page.clock.install();
  await enter(page, "tetris");
  await nearGoal(page, "tetris");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  const board = page.locator(".tetris-board");
  const a = await board.evaluate((c) => c.toDataURL());
  await page.keyboard.press("ArrowLeft");
  expect(await board.evaluate((c) => c.toDataURL())).not.toBe(a);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(page.locator(".tetris-sidebar")).toContainText("Righe 10");
  expect((await state(page)).games.tetris.completed).toBe(1);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowDown");
  for (let n = 0; n < 40; n++) await page.keyboard.press("Space");
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "over",
  );
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "playing",
  );
});
test("boss: touch sullo stesso bersaglio, coccinelle amiche, radio e pausa", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 768, height: 1024 },
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.goto("http://127.0.0.1:8000/ehy-amico/#game/roach");
  await page.getByRole("button", { name: "Inizia partita" }).tap();
  for (let hp = 5; hp > 0; hp--)
    await page
      .getByRole("button", { name: "Boss: " + hp + " colpi rimasti" })
      .tap();
  await expect(page.locator(".game-hud")).toContainText("Catture 1/8");
  await page.clock.runFor(650);
  await page.clock.runFor(650);
  const decoy = page.locator('[data-target="decoy"]').first();
  await expect(decoy).toBeVisible();
  await decoy.tap();
  await expect(page.locator(".game-hud")).toContainText("Errori 1/4");
  await page.getByRole("button", { name: "Chiedi allo Zio" }).tap();
  await expect(page.locator("#hint")).toContainText("coccinelle");
  await page.getByRole("button", { name: "Chiudi la radio" }).tap();
  await expect(page.getByRole("button", { name: "Riprendi" })).toBeVisible();
  await context.close();
});
for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
])
  test("touch, responsive e offline " + viewport.width, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:8000/ehy-amico/");
    await expect(page.locator("#offline")).toContainText("Zaino pronto");
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await context.setOffline(true);
    for (const id of ["roach", "runner", "tetris"]) {
      await page.goto("http://127.0.0.1:8000/ehy-amico/#game/" + id);
      await page.reload();
      await page.getByRole("button", { name: "Inizia partita" }).tap();
      if (id === "runner")
        await page.getByRole("button", { name: "Salta", exact: true }).tap();
      if (id === "tetris") {
        await page.getByRole("button", { name: "Ruota", exact: true }).tap();
        await page.getByRole("button", { name: "Sinistra", exact: true }).tap();
        await page
          .getByRole("button", { name: "Giù subito", exact: true })
          .tap();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "work/" + id + "-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await page.getByRole("button", { name: "Pausa", exact: true }).tap();
      await expect(
        page.getByRole("button", { name: "Riprendi" }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    await context.close();
  });
