import { test, expect } from "@playwright/test";
const data = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("ehy-amico:progress")));
async function seed(page, extra = {}) {
  await page.goto("./");
  await page.evaluate((extra) => {
    const games = Object.fromEntries(
      ["roach", "runner", "tetris", "maze", "memory", "car"].map((id) => [
        id,
        { completed: 5, best: 1357 },
      ]),
    );
    Object.assign(games, extra);
    localStorage.setItem(
      "ehy-amico:progress",
      JSON.stringify({
        version: 1,
        games,
        settings: { sound: false, difficulty: 0 },
      }),
    );
  }, extra);
  await page.reload();
}
async function begin(page, id, stage) {
  await page.goto("./#game/" + id);
  await page.locator(".game-toolbar select").selectOption(String(stage));
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
}
export async function digAll(page, stage) {
  const mission = await page.evaluate(
    async (stage) =>
      (await import("./js/education-data.js")).JURASSIC_MISSIONS[stage - 1],
    stage,
  );
  for (const [site, name] of mission.sites.entries()) {
    if (!(await page.locator(".dig-field").count())) break;
    await page.getByRole("button", { name, exact: true }).click();
    if (mission.trace) {
      const trace = page.getByRole("button", {
        name: "Osserva la traccia",
        exact: true,
      });
      if (await trace.count()) await trace.click();
    }
    await page
      .getByRole("button", { name: "Piccola pala", exact: true })
      .click();
    while (await page.locator(".dig-patch.depth-2").count())
      await page.locator(".dig-patch.depth-2").first().click();
    await page.getByRole("button", { name: "Pennello", exact: true }).click();
    while (await page.locator(".dig-patch.depth-1").count())
      await page.locator(".dig-patch.depth-1").first().click();
  }
}
export async function finishJurassic(page, stage) {
  const mission = await page.evaluate(
    async (stage) =>
      (await import("./js/education-data.js")).JURASSIC_MISSIONS[stage - 1],
    stage,
  );
  if (mission.assemble)
    for (const part of mission.parts) {
      await page.locator('[data-drag="' + part.id + '"]').click();
      await page.locator('[data-drop="' + part.id + '"]').click();
    }
  for (const label of mission.labels) {
    await page.locator('[data-drag="label:' + label.answer + '"]').click();
    await page.locator('[data-drop="' + label.specimen + '"]').click();
  }
  await page
    .getByRole("button", { name: "Concludi la spedizione", exact: true })
    .click();
  await expect(page.locator(".game-play")).toHaveAttribute("data-state", "won");
}
async function drag(page, source, target) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const a = await source.boundingBox(),
    b = await target.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
}
async function tasks(page, stage) {
  return page.evaluate(
    async (stage) =>
      (await import("./js/education-data.js")).timeTasks(stage, 0),
    stage,
  );
}
export async function construct(page, task) {
  if (task.type === "circuit") {
    let found;
    function find(ids) {
      if (found) return;
      if (ids.length === task.signs.length) {
        if (
          ids.reduce(
            (sum, id, i) => sum + task.values[id] * task.signs[i],
            0,
          ) === task.target
        )
          found = ids;
        return;
      }
      for (let i = 0; i < task.values.length; i++)
        if (!ids.includes(i)) find([...ids, i]);
    }
    find([]);
    for (const [slot, id] of found.entries()) {
      await page.locator('[data-drag="item:' + id + '"]').click();
      await page.locator('[data-drop="slot:' + slot + '"]').click();
    }
  } else if (task.type === "groups") {
    const n =
      task.count ||
      Array.from({ length: 7 }, (_, i) => i + 2).find(
        (n) =>
          task.total % n === 0 && task.total / n >= 2 && task.total / n <= 10,
      );
    for (let i = 0; i < n; i++) {
      await page
        .getByRole("button", { name: "Aggiungi una ruota", exact: true })
        .click();
      for (let j = 0; j < task.total / n; j++)
        await page
          .locator(".gear-group")
          .nth(i)
          .getByRole("button", { name: "+ un cristallo", exact: true })
          .click();
    }
  } else if (task.type === "tank") {
    let level = Number(
      await page.locator(".fuel-tank").getAttribute("aria-valuenow"),
    );
    while (level > task.target) {
      await page
        .getByRole("button", { name: "Scarica 250 mL", exact: true })
        .click();
      level -= 250;
    }
    const remaining = task.target - level;
    for (let n = 0; n < Math.floor(remaining / 500); n++)
      await page
        .getByRole("button", { name: "Versa 500 mL", exact: true })
        .click();
    if (remaining % 500)
      await page
        .getByRole("button", { name: "Versa 250 mL", exact: true })
        .click();
  } else if (task.type === "clock") {
    let delta = (task.target - task.start + 1440) % 1440;
    while (delta >= 60) {
      await page.getByRole("button", { name: "+ un’ora", exact: true }).click();
      delta -= 60;
    }
    while (delta > 0) {
      await page
        .getByRole("button", { name: "+ 5 minuti", exact: true })
        .click();
      delta -= 5;
    }
  } else if (task.type === "order") {
    const ids = [...task.values.keys()].sort(
      (a, b) => task.values[a] - task.values[b],
    );
    for (const [slot, id] of ids.entries()) {
      await page.locator('[data-drag="item:' + id + '"]').click();
      await page.locator('[data-drop="slot:' + slot + '"]').click();
    }
  } else {
    for (let n = task.start[0]; n < task.target[0]; n++)
      await page.getByRole("button", { name: "Est", exact: true }).click();
    for (let n = task.start[1]; n < task.target[1]; n++)
      await page.getByRole("button", { name: "Nord", exact: true }).click();
  }
}
export async function finishTime(page, stage) {
  for (const task of await tasks(page, stage)) {
    await construct(page, task);
    if ([2, 3, 4].includes(stage))
      await page.screenshot({
        path: "work/time-detail-" + stage + ".png",
        fullPage: true,
        animations: "disabled",
      });
    await page
      .getByRole("button", { name: "Prova il meccanismo", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Avvia il portale", exact: true })
    .click();
  await expect(page.locator(".game-play")).toHaveAttribute("data-state", "won");
}
test("Jurassic: cinque spedizioni intere, museo e progressi precedenti", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page);
  for (let stage = 1; stage <= 5; stage++) {
    await begin(page, "jurassic", stage);
    expect((await data(page)).games.jurassic.completed).toBe(stage - 1);
    await digAll(page, stage);
    await finishJurassic(page, stage);
    expect((await data(page)).games.jurassic.completed).toBe(stage);
  }
  await page
    .getByRole("link", { name: "Visita il Museo del Tempo", exact: true })
    .click();
  await expect(page.locator(".museum-card")).toHaveCount(5);
  await page.screenshot({
    path: "work/jurassic-museum.png",
    fullPage: true,
    animations: "disabled",
  });
  await expect(page.locator(".museum-grid")).toContainText("non un dinosauro");
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText(
    "Pterosauri e dinosauri",
  );
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("35/60");
  await page.reload();
  expect((await data(page)).games.car.best).toBe(1357);
  expect(errors).toEqual([]);
});
test("Jurassic: scavo trascinato, strumenti sbagliati, incastri e drag reale", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 1600 });
  await seed(page, { jurassic: { completed: 1, best: 300 } });
  await begin(page, "jurassic", 2);
  await page.getByRole("button", { name: "Pennello", exact: true }).click();
  await page.locator(".dig-patch").first().click();
  await expect(page.locator(".edu-feedback")).toContainText("compatto");
  await page.getByRole("button", { name: "Piccola pala", exact: true }).click();
  const boxes = await page.locator(".dig-patch").evaluateAll((nodes) =>
    nodes.slice(0, 3).map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }),
  );
  await page.mouse.move(boxes[0].x, boxes[0].y);
  await page.mouse.down();
  for (const p of boxes.slice(1)) await page.mouse.move(p.x, p.y, { steps: 8 });
  await page.mouse.up();
  expect(
    Object.values((await data(page)).adventures.jurassic[2].depth).filter(
      (v) => v === 1,
    ).length,
  ).toBeGreaterThanOrEqual(3);
  await digAll(page, 2);
  const first = page.locator('[data-drag="s-cranio"]'),
    wrong = page.locator('[data-drop="s-coda"]');
  await first.click();
  await wrong.click();
  await expect(page.locator(".edu-feedback")).toContainText("non combacia");
  await drag(page, first, page.locator('[data-drop="s-cranio"]'));
  await page.screenshot({
    path: "work/jurassic-assembly.png",
    fullPage: true,
    animations: "disabled",
  });
  expect((await data(page)).adventures.jurassic[2].placed).toContain(
    "s-cranio",
  );
  await page
    .getByRole("button", { name: "Chiedi allo Zio", exact: true })
    .click();
  await page.getByRole("button", { name: "Un altro indizio" }).click();
  await expect(page.locator(".suggested")).toHaveCount(1);
});
test("Macchina: cinque viaggi costruiti, 40 tesori e destinazioni nel Diario", async ({
  page,
}) => {
  test.setTimeout(180000);
  await seed(page, { jurassic: { completed: 5, best: 1500 } });
  for (let stage = 1; stage <= 5; stage++) {
    await begin(page, "time", stage);
    expect((await data(page)).games.time.completed).toBe(stage - 1);
    await finishTime(page, stage);
    expect((await data(page)).games.time.completed).toBe(stage);
    if (stage === 5)
      await page.screenshot({
        path: "work/time-arrival.png",
        fullPage: true,
        animations: "disabled",
      });
  }
  await page
    .getByRole("button", { name: "Chiedi allo Zio", exact: true })
    .click();
  await expect(page.locator("#hint")).toContainText("calzini");
  await page.keyboard.press("Escape");
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("40/60");
  await expect(page.locator(".fragment.earned")).toHaveCount(8);
  await page.reload();
  await expect(page.locator(".stats")).toContainText("40/60");
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText("Isola dell’Alba");
  expect((await data(page)).games.car.best).toBe(1357);
  await begin(page, "time", 1);
  await expect(page.locator(".energy-slot").first()).toContainText("vuoto");
  await finishTime(page, 1);
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("40/60");
});
test("Macchina: collegamento trascinato, tentativo errato e ripresa da salvataggio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1600 });
  await seed(page);
  await begin(page, "time", 1);
  await page.getByRole("button", { name: "Prova il meccanismo" }).click();
  await expect(page.locator(".edu-feedback")).toContainText("non è ancora");
  await drag(
    page,
    page.locator('[data-drag="item:0"]'),
    page.locator('[data-drop="slot:0"]'),
  );
  expect((await data(page)).adventures.time[1].current.slots[0]).toBe(0);
  await page.goto("./#map");
  await page.goto("./#game/time");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  await expect(page.locator('[data-drop="slot:0"]')).toContainText("3");
  expect((await data(page)).games.time.completed).toBe(0);
  await page.getByRole("button", { name: "Riprova", exact: true }).click();
  await expect(page.locator('[data-drop="slot:0"]')).toContainText("vuoto");
});
test("Macchina: dosatore trascinato, misura errata e coordinate con tastiera", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1600 });
  await seed(page, { time: { completed: 3, best: 900 } });
  await begin(page, "time", 3);
  await drag(
    page,
    page.locator('[data-drag="pour:250"]'),
    page.locator('[data-drop="tank"]'),
  );
  await expect(page.locator(".fuel-tank")).toHaveAttribute(
    "aria-valuenow",
    "250",
  );
  await page.getByRole("button", { name: "Prova il meccanismo" }).click();
  await expect(page.locator(".edu-feedback")).toContainText("tacca");
  await page.goto("./#game/time");
  await page.locator(".game-toolbar select").selectOption("4");
  await page.getByRole("button", { name: "Inizia partita" }).click();
  const list = await tasks(page, 4);
  for (const task of list.slice(0, 2)) {
    await construct(page, task);
    await page.getByRole("button", { name: "Prova il meccanismo" }).click();
  }
  await page.locator("main").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".coordinate-grid")).toHaveAttribute(
    "aria-label",
    "Coordinate: x 2, y 2",
  );
});
for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
])
  test(
    "Educativi touch, tastiera e offline " + viewport.width,
    async ({ browser }) => {
      test.setTimeout(90000);
      const context = await browser.newContext({ viewport, hasTouch: true }),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("http://127.0.0.1:8000/ehy-amico/");
      await expect(page.locator("#offline")).toContainText("Zaino pronto");
      await expect
        .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
        .toBe(true);
      await context.setOffline(true);
      await page.goto("http://127.0.0.1:8000/ehy-amico/#game/jurassic");
      await page.reload();
      await page.getByRole("button", { name: "Inizia partita" }).tap();
      const patch = page.locator(".dig-patch").first();
      await patch.tap();
      await page.getByRole("button", { name: "Pennello", exact: true }).tap();
      await patch.tap();
      expect((await data(page)).adventures.jurassic[1].depth["s-cranio"]).toBe(
        0,
      );
      await page.screenshot({
        path: "work/jurassic-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      await page.goto("http://127.0.0.1:8000/ehy-amico/#game/time");
      await page.getByRole("button", { name: "Inizia partita" }).tap();
      const task = (await tasks(page, 1))[0];
      await construct(page, task);
      await page.getByRole("button", { name: "Prova il meccanismo" }).tap();
      expect((await data(page)).adventures.time[1].history.length).toBe(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "work/time-" + viewport.width + ".png",
        fullPage: true,
        animations: "disabled",
      });
      expect(errors).toEqual([]);
      await context.close();
    },
  );
test("Jurassic: tastiera, reperto parziale nel museo e ripresa senza tesoro", async ({
  page,
}) => {
  await seed(page);
  await begin(page, "jurassic", 1);
  await page.locator(".dig-patch").first().focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Pennello", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.locator(".dig-patch").first().focus();
  await page.keyboard.press("Enter");
  expect((await data(page)).adventures.jurassic[1].depth["s-cranio"]).toBe(0);
  await page.goto("./#diary");
  await expect(page.locator(".notebook")).toContainText(
    "In studio: Stegosauro",
  );
  await page.goto("./#museum");
  await expect(page.locator(".museum-grid")).toContainText(
    "Ipotesi: Stegosauro",
  );
  await page.goto("./#game/jurassic");
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pennello", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await data(page)).games.jurassic.completed).toBe(0);
  await expect(page.locator(".dig-patch.depth-0")).toHaveCount(1);
});
