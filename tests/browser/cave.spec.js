import { test, expect } from "@playwright/test";
test.setTimeout(90000);
const progress = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("ehy-amico:progress")));
const state = async (page, stage) =>
  (await progress(page)).adventures.cave[stage];
async function seed(page) {
  await page.goto("./");
  await page.evaluate(async () => {
    const { defaults, KEY } = await import("./js/progress.js");
    const s = defaults();
    s.games.atlas = { completed: 5, best: 777 };
    s.adventures.atlas[1] = { souvenirs: ["ny"], mode: "veteran" };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.reload();
  await page.goto("./#game/cave");
}
async function begin(page, stage, hard = false) {
  await page.locator(".game-toolbar select").selectOption(String(stage));
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
  if (hard)
    await page
      .getByRole("button", { name: "Investigatore", exact: true })
      .click();
}
async function zone(page, n) {
  await page.locator(`button[data-zone="${n}"]`).click();
}
async function code(page, answer) {
  for (const [i, name] of answer.entries()) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.locator(`[data-slot="${i}"]`).click();
  }
}
async function beam(page, hard, stage) {
  await zone(page, 1);
  if (!(await state(page, stage)).lightOn)
    await page
      .getByRole("button", { name: "Accendi la torcia", exact: true })
      .click();
  const p = await page.evaluate(
    async (hard) => (await import("./js/cave-data.js")).lightPuzzle(hard),
    hard,
  );
  for (let i = 0; i < p.mirrors.length; i++) {
    if ((await state(page, stage)).mirrors[i] !== p.mirrors[i].goal)
      await page
        .getByRole("button", { name: "Ruota specchio " + (i + 1), exact: true })
        .click();
  }
  await expect(page.locator('[aria-label="Sensore attivo"]')).toBeVisible();
  if (stage === 2)
    await page.locator(".cave-scene").screenshot({
      path: `docs/screenshots/grotta/cristalli-${hard ? "investigatore" : "esploratore"}.png`,
    });
}
async function finish(page, stage, hard = false) {
  if (stage === 1) {
    for (let i = 0; i < 3; i++) {
      await zone(page, i);
      await page.locator(`[data-clue="${i}"]`).click();
    }
    const s = await state(page, stage),
      answer = await page.evaluate(
        async ({ seed, hard }) =>
          (await import("./js/cave-data.js")).doorPuzzle(seed, hard).order,
        { seed: s.seed, hard },
      );
    await code(page, answer);
    await page
      .getByRole("button", { name: "Aziona il portone", exact: true })
      .click();
  }
  if (stage === 2) {
    await beam(page, hard, stage);
    await zone(page, 2);
    await page
      .getByRole("button", {
        name: "Attraversa la porta luminosa",
        exact: true,
      })
      .click();
  }
  if (stage === 3) {
    await zone(page, 1);
    const s = await state(page, stage),
      p = await page.evaluate(
        async ({ seed, hard }) =>
          (await import("./js/cave-data.js")).floorPuzzle(seed, hard),
        { seed: s.seed, hard },
      );
    for (let i = s.floorStep + 1; i < p.rows; i++)
      await page.locator(`[data-step="${i}"][data-col="${p.path[i]}"]`).click();
    await zone(page, 2);
    await page
      .getByRole("button", {
        name: "Esci dalla sala delle piastrelle",
        exact: true,
      })
      .click();
  }
  if (stage === 4) {
    await zone(page, 0);
    const p = await page.evaluate(
        async (hard) => (await import("./js/cave-data.js")).bridgePuzzle(hard),
        hard,
      ),
      used = new Set();
    for (let i = 0; i < p.teeth.length - 1; i++) {
      const id = p.inventory.findIndex(
        (t, j) => !used.has(j) && t === p.teeth[i + 1],
      );
      used.add(id);
      await page.locator(`[data-gear="${id}"]`).click();
      await page.locator(`[data-gear-slot="${i}"]`).click();
    }
    await zone(page, 1);
    for (let i = 0; i < p.targets.length; i++)
      for (let n = 0; n < p.targets[i]; n++)
        await page
          .getByRole("button", {
            name: "Aggiungi pietra " + (i + 1),
            exact: true,
          })
          .click();
    await page
      .getByRole("button", { name: "Solleva la leva", exact: true })
      .click();
    await zone(page, 2);
    await page.locator(".cave-game").screenshot({
      path: `docs/screenshots/grotta/ponte-${hard ? "investigatore" : "esploratore"}.png`,
    });
    await page
      .getByRole("button", { name: "Attraversa il ponte", exact: true })
      .click();
  }
  if (stage === 5) {
    const p = await progress(page),
      a = p.adventures.cave[1].discovery.order,
      m = p.adventures.cave[3].discovery.motif,
      answer = hard ? [a[0], m[1], a.at(-1), m.at(-1)] : [a[0], m[1], a.at(-1)];
    await code(page, answer);
    await beam(page, hard, stage);
    await zone(page, 2);
    const d = p.adventures.cave;
    for (let n = 0; n < d[4].discovery.gears; n++)
      for (const color of d[2].discovery.colors)
        await page
          .getByRole("button", { name: "Suona " + color, exact: true })
          .click();
    await page
      .getByRole("button", { name: "Apri il santuario", exact: true })
      .click();
    expect((await state(page, 5)).won).toBe(false);
    await page
      .getByRole("button", { name: "Recupera il quinto tesoro", exact: true })
      .click();
  }
  await expect(page.locator(".game-play")).toHaveAttribute("data-state", "won");
}
for (const hard of [false, true])
  test(`cinque missioni completate realmente · ${hard ? "Investigatore" : "Esploratore"}`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page);
    for (let stage = 1; stage <= 5; stage++) {
      await begin(page, stage, hard);
      await finish(page, stage, hard);
    }
    await page.locator(".cave-victory").screenshot({
      path: `docs/screenshots/grotta/tempio-${hard ? "investigatore" : "esploratore"}.png`,
    });
    const s = await progress(page);
    expect(s.games.cave.completed).toBe(5);
    expect(Object.values(s.adventures.cave).every((p) => p.won)).toBeTruthy();
    expect(s.games.atlas).toEqual({ completed: 5, best: 777 });
    expect(s.adventures.atlas[1].souvenirs).toEqual(["ny"]);
    expect(errors).toEqual([]);
    await page.reload();
    await page
      .getByRole("button", { name: "Inizia partita", exact: true })
      .click();
    await expect(page.locator(".cave-victory")).toBeVisible();
    await page.goto("./#diary");
    await expect(
      page.getByRole("heading", {
        name: "Taccuino del Mistero della Grotta",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cuore della montagna", exact: true }),
    ).toBeVisible();
  });
test("indizi, tastiera, radio progressiva, salvataggio e ripristino parziale", async ({
  page,
}) => {
  await seed(page);
  await begin(page, 1);
  await page.locator('[data-clue="0"]').focus();
  await page.keyboard.press("Enter");
  expect((await state(page, 1)).clues).toEqual([0]);
  await page
    .getByRole("button", { name: "Chiedi allo Zio", exact: true })
    .click();
  const first = await page.locator("#hint").textContent();
  await page
    .getByRole("button", { name: "Un altro indizio", exact: true })
    .click();
  const second = await page.locator("#hint").textContent();
  await page
    .getByRole("button", { name: "Un altro indizio", exact: true })
    .click();
  expect(await page.locator("#hint").textContent()).not.toBe(second);
  expect(second).not.toBe(first);
  await page
    .getByRole("button", { name: "Chiudi la radio", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Riprendi", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
  expect((await state(page, 1)).clues).toEqual([0]);
  await finish(page, 1);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await page
    .getByRole("button", { name: "Investigatore", exact: true })
    .click();
  await finish(page, 1, true);
  expect((await progress(page)).games.cave.completed).toBe(1);
  const s = await state(page, 1);
  expect(s.records.explorer).toBeGreaterThan(0);
  expect(s.records.investigator).toBeGreaterThan(0);
});
test("pavimento: errore, checkpoint e controlli cardinali reali", async ({
  page,
}) => {
  await seed(page);
  await begin(page, 1);
  await finish(page, 1);
  await begin(page, 2);
  await finish(page, 2);
  await begin(page, 3);
  await zone(page, 1);
  const p = await page.evaluate(async () =>
    (await import("./js/cave-data.js")).floorPuzzle(0, false),
  );
  for (let i = 1; i <= 4; i++)
    await page.locator(`[data-step="${i}"][data-col="${p.path[i]}"]`).click();
  const wrong = [0, 1, 2, 3, 4].find(
    (c) => Math.abs(c - p.path[4]) <= 1 && c !== p.path[5],
  );
  await page.locator(`[data-step="5"][data-col="${wrong}"]`).click();
  expect((await state(page, 3)).floorStep).toBe(3);
  expect((await state(page, 3)).floorCheckpoint).toBe(3);
  await finish(page, 3);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await zone(page, 1);
  const next = await page.evaluate(async () =>
    (await import("./js/cave-data.js")).floorPuzzle(1, false),
  );
  let col = 2;
  for (let i = 1; i < next.rows; i++) {
    while (col !== next.path[i]) {
      await page.keyboard.press(
        col < next.path[i] ? "ArrowRight" : "ArrowLeft",
      );
      col += col < next.path[i] ? 1 : -1;
    }
    await page.keyboard.press("ArrowUp");
  }
  expect((await state(page, 3)).floorStep).toBe(next.rows - 1);
});
test("touch, animazioni ridotte e avvio offline con gli asset della grotta", async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
    }),
    page = await context.newPage();
  await seed(page);
  await begin(page, 1);
  for (let i = 0; i < 3; i++) {
    await page.locator(`button[data-zone="${i}"]`).tap();
    await page.locator(`[data-clue="${i}"]`).tap();
  }
  await page
    .locator(".cave-game")
    .screenshot({ path: "docs/screenshots/grotta/ingresso-smartphone.png" });
  await code(page, ["sole", "onda", "foglia"]);
  await page
    .getByRole("button", { name: "Aziona il portone", exact: true })
    .tap();
  await expect(page.locator(".cave-victory")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.locator(".game-toolbar select").selectOption("1");
  await page.getByRole("button", { name: "Inizia partita", exact: true }).tap();
  await expect(page.locator(".cave-victory-art")).toBeVisible();
  await page.locator(".game-toolbar select").selectOption("2");
  await page.getByRole("button", { name: "Inizia partita", exact: true }).tap();
  await page.locator('button[data-zone="1"]').tap();
  await page
    .getByRole("button", { name: "Accendi la torcia", exact: true })
    .tap();
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: "Ruota specchio " + i, exact: true })
      .tap();
  await expect(page.locator('[aria-label="Sensore attivo"]')).toBeVisible();
  await page
    .locator(".cave-game")
    .screenshot({ path: "docs/screenshots/grotta/cristalli-smartphone.png" });
  await context.close();
});
test("riflessioni persistenti e ponte: nessuna scorciatoia attraverso una leva", async ({
  page,
}) => {
  await seed(page);
  await begin(page, 1);
  await finish(page, 1);
  await begin(page, 2);
  await zone(page, 1);
  await page
    .getByRole("button", { name: "Accendi la torcia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ruota specchio 1", exact: true })
    .click();
  const saved = await state(page, 2);
  await page.reload();
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
  expect((await state(page, 2)).mirrors).toEqual(saved.mirrors);
  expect((await state(page, 2)).lightOn).toBe(true);
  await finish(page, 2);
  await begin(page, 3);
  await finish(page, 3);
  await begin(page, 4);
  await page
    .getByRole("button", { name: "Solleva la leva", exact: true })
    .click();
  await zone(page, 2);
  await page
    .getByRole("button", { name: "Attraversa il ponte", exact: true })
    .click();
  expect((await progress(page)).games.cave.completed).toBe(3);
  await zone(page, 1);
  await page
    .getByRole("button", { name: "Aggiungi pietra 1", exact: true })
    .click();
  const partial = await state(page, 4);
  await page.reload();
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
  expect((await state(page, 4)).weights).toEqual(partial.weights);
  expect((await state(page, 4)).lever).toBe(true);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await finish(page, 4);
});
test("tablet touch: cristalli, pavimento e ponte manipolati senza overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      hasTouch: true,
      isMobile: true,
    }),
    page = await context.newPage();
  await seed(page);
  await begin(page, 1, true);
  await finish(page, 1, true);
  await begin(page, 2, true);
  await page.locator('button[data-zone="1"]').tap();
  await page
    .getByRole("button", { name: "Accendi la torcia", exact: true })
    .tap();
  for (let i = 1; i <= 4; i++)
    await page
      .getByRole("button", { name: "Ruota specchio " + i, exact: true })
      .tap();
  await expect(page.locator('[aria-label="Sensore attivo"]')).toBeVisible();
  await page.locator('button[data-zone="2"]').tap();
  await page
    .getByRole("button", { name: "Attraversa la porta luminosa", exact: true })
    .tap();
  await begin(page, 3, true);
  await page.locator('button[data-zone="1"]').tap();
  const floor = await page.evaluate(async () =>
    (await import("./js/cave-data.js")).floorPuzzle(0, true),
  );
  for (let step = 1; step < floor.rows; step++)
    await page
      .locator(`[data-step="${step}"][data-col="${floor.path[step]}"]`)
      .tap();
  await page
    .locator(".cave-game")
    .screenshot({ path: "docs/screenshots/grotta/pavimento-tablet.png" });
  await page.locator('button[data-zone="2"]').tap();
  await page
    .getByRole("button", {
      name: "Esci dalla sala delle piastrelle",
      exact: true,
    })
    .tap();
  await begin(page, 4, true);
  for (const [slot, id] of [0, 1, 3].entries()) {
    await page.locator(`[data-gear="${id}"]`).tap();
    await page.locator(`[data-gear-slot="${slot}"]`).tap();
  }
  await page.locator('button[data-zone="1"]').tap();
  for (let i = 0; i < 3; i++)
    for (let n = 0; n < i + 2; n++)
      await page
        .getByRole("button", {
          name: "Aggiungi pietra " + (i + 1),
          exact: true,
        })
        .tap();
  await page
    .getByRole("button", { name: "Solleva la leva", exact: true })
    .tap();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator(".cave-game")
    .screenshot({ path: "docs/screenshots/grotta/ponte-tablet.png" });
  await page.locator('button[data-zone="2"]').tap();
  await page
    .getByRole("button", { name: "Attraversa il ponte", exact: true })
    .tap();
  expect((await progress(page)).games.cave.completed).toBe(4);
  await context.close();
});
