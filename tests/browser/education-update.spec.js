import { test, expect } from "@playwright/test";
import { readFile, writeFile, utimes } from "node:fs/promises";
import { execFileSync } from "node:child_process";
test("aggiornamento reale archivio v1 e worker: conserva trenta tesori e riprende lo scavo", async ({
  page,
}) => {
  test.setTimeout(60000);
  const current = await readFile("js/progress.js", "utf8"),
    worker = await readFile("sw.js", "utf8");
  const old = execFileSync("git", ["show", "origin/main:js/progress.js"], {
    encoding: "utf8",
  });
  try {
    await writeFile("js/progress.js", old);
    execFileSync(process.execPath, ["scripts/build.mjs"]);
    await page.goto("./#rewards");
    await page.evaluate(() =>
      localStorage.setItem(
        "ehy-amico:progress",
        JSON.stringify({
          version: 1,
          games: Object.fromEntries(
            ["roach", "runner", "tetris", "maze", "memory", "car"].map((id) => [
              id,
              { completed: 5, best: 2468 },
            ]),
          ),
          settings: { sound: true, difficulty: 1 },
        }),
      ),
    );
    await page.reload();
    await expect(page.locator(".stats")).toContainText("30/60");
    await expect(page.locator("#offline")).toContainText("Zaino pronto");
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await writeFile("js/progress.js", current);
    execFileSync(process.execPath, ["scripts/build.mjs"]);
    // Il server Python confronta Last-Modified al secondo: forza due versioni distinte.
    const newer = new Date(Date.now() + 5000);
    await utimes("js/progress.js", newer, newer);
    await utimes("sw.js", newer, newer);
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.ready;
      await r.update();
    });
    await expect(page.locator("#update")).toBeVisible();
    await page.locator("#update").click();
    await expect(page.locator("#update")).toBeHidden();
    await expect(page.locator(".stats")).toContainText("30/60");
    await page.goto("./#game/jurassic");
    await page.getByRole("button", { name: "Inizia partita" }).click();
    await page.locator(".dig-patch").first().click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ehy-amico:progress")),
    );
    expect(saved.version).toBe(2);
    expect(saved.games.car.best).toBe(2468);
    expect(saved.adventures.jurassic[1].depth["s-cranio"]).toBe(2);
    await page.reload();
    await page.getByRole("button", { name: "Inizia partita" }).click();
    const resumed = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ehy-amico:progress")),
    );
    expect(resumed.adventures.jurassic[1].depth["s-cranio"]).toBe(2);
    expect(resumed.games.tetris.completed).toBe(5);
  } finally {
    await writeFile("js/progress.js", current);
    await writeFile("sw.js", worker);
  }
});
