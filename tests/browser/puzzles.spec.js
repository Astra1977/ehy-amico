import { test, expect } from "@playwright/test";
const progress = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("ehy-amico:progress")));
async function enter(page, id) {
  await page.goto("./#game/" + id);
  await page.getByRole("button", { name: "Inizia partita" }).click();
}
async function solveMaze(page, touch = false) {
  const solution = await page.locator(".temple-grid").evaluate((grid) => {
    const nodes = [...grid.children],
      size = Math.sqrt(nodes.length),
      tiles = nodes.map((c) => c.dataset.tile),
      q = [[1, 1, []]],
      seen = new Set(["1,1"]);
    for (let i = 0; i < q.length; i++) {
      const [x, y, p] = q[i];
      if (tiles[y * size + x] === "exit") return p;
      for (const [dx, dy, key] of [
        [1, 0, "Destra"],
        [-1, 0, "Sinistra"],
        [0, 1, "Giù"],
        [0, -1, "Su"],
      ]) {
        const a = x + dx,
          b = y + dy,
          k = a + "," + b;
        if (
          a >= 0 &&
          b >= 0 &&
          a < size &&
          b < size &&
          tiles[b * size + a] !== "wall" &&
          !seen.has(k)
        ) {
          seen.add(k);
          q.push([a, b, [...p, key]]);
        }
      }
    }
    throw Error("uscita irraggiungibile");
  });
  const keys = {
    Destra: "ArrowRight",
    Sinistra: "ArrowLeft",
    Su: "ArrowUp",
    Giù: "ArrowDown",
  };
  for (const d of solution) {
    if (touch) await page.getByRole("button", { name: d, exact: true }).tap();
    else await page.keyboard.press(keys[d]);
  }
}
async function solveMemory(page, touch = false) {
  const pairs = await page.locator(".memory-card").evaluateAll((nodes) => {
    const out = {};
    nodes.forEach((b, i) => {
      const a = b.firstChild;
      const key =
        a.style.getPropertyValue("--col") +
        "," +
        a.style.getPropertyValue("--row");
      (out[key] ??= []).push(i);
    });
    return Object.values(out);
  });
  for (const [a, b] of pairs) {
    const first = page.locator(".memory-card").nth(a),
      second = page.locator(".memory-card").nth(b);
    if (touch) {
      await first.tap();
      await second.tap();
    } else {
      await first.focus();
      await page.keyboard.press("Enter");
      await second.focus();
      await page.keyboard.press("Enter");
    }
  }
}
test("Labirinto: parete, tastiera, vittoria reale e cinque tesori persistenti", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("./#game/maze");
  expect((await progress(page)).games.maze.completed).toBe(0);
  await page.getByRole("button", { name: "Inizia partita" }).click();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".game-hud")).toContainText("Pareti incontrate 1");
  await expect(page.locator(".game-hud")).toContainText("Passi 0");
  await solveMaze(page);
  await expect(page.locator(".game-play")).toHaveAttribute("data-state", "won");
  for (let n = 2; n <= 5; n++) {
    await page.locator(".game-toolbar select").selectOption(String(n));
    await page.getByRole("button", { name: "Inizia partita" }).click();
    await solveMaze(page);
  }
  expect((await progress(page)).games.maze.completed).toBe(5);
  await page.reload();
  expect((await progress(page)).games.maze.completed).toBe(5);
});
test("Memory: coppia sbagliata, blocco input, pausa, riavvio e nessun premio", async ({
  page,
}) => {
  await page.clock.install();
  await enter(page, "memory");
  const ids = await page
    .locator(".memory-card")
    .evaluateAll((nodes) => nodes.map((n) => n.firstChild.style.cssText));
  const other = ids.findIndex((v) => v !== ids[0]);
  await page.locator(".memory-card").nth(0).click();
  await page.locator(".memory-card").nth(other).click();
  await expect(page.locator(".memory-card:disabled")).toHaveCount(8);
  await page.getByRole("button", { name: "Pausa", exact: true }).click();
  await page.clock.runFor(2000);
  await expect(page.locator(".memory-card.revealed")).toHaveCount(2);
  await page.getByRole("button", { name: "Riprendi" }).click();
  await page.clock.runFor(1100);
  await expect(page.locator(".memory-card.revealed")).toHaveCount(0);
  await expect(page.locator(".game-hud")).toContainText("Mosse 1");
  expect((await progress(page)).games.memory.completed).toBe(0);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.locator(".game-hud")).toContainText("Mosse 0");
  await page.getByRole("button", { name: "Chiedi allo Zio" }).click();
  await expect(page.locator("#hint")).toContainText("ricordo");
});
test("Memory: tutte le cinque missioni, 25 tesori totali, compatibilità car e diario", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("./");
  await page.evaluate(() =>
    localStorage.setItem(
      "ehy-amico:progress",
      JSON.stringify({
        version: 1,
        games: {
          roach: { completed: 5, best: 100 },
          runner: { completed: 5, best: 100 },
          tetris: { completed: 5, best: 100 },
          maze: { completed: 5, best: 100 },
          car: { completed: 0, best: 987 },
        },
      }),
    ),
  );
  await page.reload();
  await page.goto("./#game/memory");
  for (let n = 1; n <= 5; n++) {
    await page.locator(".game-toolbar select").selectOption(String(n));
    await page.getByRole("button", { name: "Inizia partita" }).click();
    await solveMemory(page);
    await expect(page.locator(".game-play")).toHaveAttribute(
      "data-state",
      "won",
    );
    await expect(page.locator(".memory-card.matched")).toHaveCount(
      [8, 12, 16, 20, 24][n - 1],
    );
  }
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("25/60");
  await expect(page.locator(".fragment.earned")).toHaveCount(5);
  await page.reload();
  await expect(page.locator(".stats")).toContainText("25/60");
  expect((await progress(page)).games.car.best).toBe(987);
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText("Memory");
});
for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
])
  test("puzzle touch e offline " + viewport.width, async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({ hasTouch: true, viewport });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:8000/ehy-amico/");
    await expect(page.locator("#offline")).toContainText("Zaino pronto");
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await context.setOffline(true);
    for (const id of ["maze", "memory"]) {
      await page.goto("http://127.0.0.1:8000/ehy-amico/#game/" + id);
      await page.reload();
      await page.getByRole("button", { name: "Inizia partita" }).tap();
      if (id === "maze") await solveMaze(page, true);
      else await solveMemory(page, true);
      await expect(page.locator(".game-play")).toHaveAttribute(
        "data-state",
        "won",
      );
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
    }
    expect(errors).toEqual([]);
    await context.close();
  });
