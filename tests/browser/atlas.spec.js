import { test, expect } from "@playwright/test";
test.setTimeout(180000);
async function begin(page, stage) {
  await page.locator(".game-toolbar select").selectOption(String(stage));
  await page
    .getByRole("button", { name: "Inizia partita", exact: true })
    .click();
}
async function travel(page, id) {
  await page.locator(`[data-destination="${id}"]`).click();
  await expect(page.locator(".game-hud")).toContainText(
    await page.evaluate(
      async (id) => (await import("./js/atlas-data.js")).city(id).name,
      id,
    ),
    { timeout: 6000 },
  );
  await page.waitForTimeout(100);
}
async function selectState(page, name) {
  await page.locator(`[data-state="${name}"]`).focus();
  await page.keyboard.press("Enter");
}
async function football(page, veteran) {
  await page
    .getByRole("button", { name: "Entra nel campo", exact: true })
    .click();
  await page
    .getByRole("slider", { name: "Posizione Ricevitore 1", exact: true })
    .fill(veteran ? "90" : "10");
  await page.getByRole("button", { name: "Avvia azione", exact: true }).click();
  await page
    .getByRole("button", { name: "Passa al ricevitore 1", exact: true })
    .click();
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "won",
    { timeout: 15000 },
  );
}
async function drive(page) {
  await page
    .getByRole("button", { name: "Accendi il camper", exact: true })
    .click();
  await page.waitForTimeout(500);
  for (let i = 0; i < 700; i++) {
    const data = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ehy-amico:progress")).adventures.atlas,
    );
    const stage = Object.values(data).find((s) => s.view === "drive" && !s.won);
    if (!stage) break;
    const d = stage.drive;
    if (d?.failed) throw Error("Guida fallita");
    const fuel = d?.items.find((i) => i.fuel && i.y < 0.76);
    const target = fuel?.x ?? d?.x ?? 0.5;
    const dx = target - (d?.x ?? 0.5);
    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowRight");
    if (Math.abs(dx) > 0.06)
      await page.keyboard.down(dx < 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(80);
  }
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowRight");
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "won",
    { timeout: 10000 },
  );
}
async function seed(page) {
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.goto("./#game/atlas");
}
for (const veteran of [false, true])
  test(`cinque missioni giocate nel browser · ${veteran ? "Veterano" : "Esploratore"}`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page);
    await begin(page, 1);
    if (veteran)
      await page
        .getByRole("button", { name: "Veterano NFL", exact: true })
        .click();
    for (const n of ["New Jersey", "Pennsylvania", "Connecticut"])
      await selectState(page, n);
    for (let i = 0; i < 3; i++)
      await page
        .getByRole("button", { name: "Ruota la bussola", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Pianifica Philadelphia", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pianifica Washington", exact: true })
      .click();
    await travel(page, "philly");
    await travel(page, "dc");
    await drive(page);
    await begin(page, 2);
    if (veteran)
      await page
        .getByRole("button", { name: "Veterano NFL", exact: true })
        .click();
    for (const id of ["ny", "miami", "dallas", "kc", "denver", "seattle"]) {
      await travel(page, id);
      await page
        .getByRole("button", { name: "Prendi il segnaposto", exact: true })
        .click();
      const p = await page.evaluate(async (id) => {
        const d = await import("./js/atlas-data.js");
        return d.project(d.city(id));
      }, id);
      const box = await page.locator(".atlas-map").boundingBox();
      await page.locator(".atlas-map").click({
        position: { x: (p.x / 960) * box.width, y: (p.y / 560) * box.height },
      });
      const c = await page.evaluate(
        async (id) => (await import("./js/atlas-data.js")).city(id),
        id,
      );
      await selectState(page, c.state);
      await page
        .getByRole("slider", { name: "Sintonia radio", exact: true })
        .fill("70");
      await page
        .getByRole("button", {
          name: "Collega a " + (id === "ny" ? "NFC" : c.conference),
          exact: true,
        })
        .click();
    }
    await expect(page.locator(".game-play")).toHaveAttribute(
      "data-state",
      "won",
    );
    await begin(page, 3);
    if (veteran)
      await page
        .getByRole("button", { name: "Veterano NFL", exact: true })
        .click();
    for (const id of veteran
      ? ["kc", "denver", "abq", "flagstaff"]
      : ["denver", "abq", "flagstaff"])
      await travel(page, id);
    for (let i = 0; i < 3; i++)
      await page
        .getByRole("button", { name: "Ruota la bussola", exact: true })
        .click();
    await page.getByRole("spinbutton", { name: "Ora a Flagstaff" }).fill("11");
    await page
      .getByRole("spinbutton", { name: "Ora a Flagstaff" })
      .press("Tab");
    await drive(page);
    await begin(page, 4);
    if (veteran)
      await page
        .getByRole("button", { name: "Veterano NFL", exact: true })
        .click();
    await football(page, veteran);
    await begin(page, 5);
    if (veteran)
      await page
        .getByRole("button", { name: "Veterano NFL", exact: true })
        .click();
    for (const id of ["vegas", "la", "inglewood"]) await travel(page, id);
    await football(page, veteran);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ehy-amico:progress")),
    );
    expect(saved.games.atlas.completed).toBe(5);
    expect(
      Object.values(saved.adventures.atlas).every((s) => s.won),
    ).toBeTruthy();
    expect(errors).toEqual([]);
    await page.reload();
    await page
      .getByRole("button", { name: "Inizia partita", exact: true })
      .click();
    await expect(page.locator(".atlas-finale")).toBeVisible();
    await page.goto("./#diary");
    await expect(
      page.getByRole("heading", { name: "Passaporto · Road to Los Angeles" }),
    ).toBeVisible();
  });
test("touch, pausa, ripresa, riduzione animazioni e offline", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await seed(page);
  await begin(page, 1);
  await page
    .getByRole("button", { name: "Ruota la bussola", exact: true })
    .tap();
  await page.getByRole("button", { name: "Pausa", exact: true }).tap();
  await expect(page.locator(".game-play")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Riprendi", exact: true }).tap();
  await page
    .getByRole("button", { name: "Ruota la bussola", exact: true })
    .tap();
  await page.reload();
  await page.getByRole("button", { name: "Inizia partita", exact: true }).tap();
  await expect(page.locator(".atlas-task")).toContainText("SUD");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Inizia partita", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Inizia partita", exact: true }).tap();
  await expect(page.locator(".atlas-map")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await context.close();
});
test("touch sui minigiochi, checkpoint, radio contestuale e premi non duplicati", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("./");
  await page.evaluate(async () => {
    const { defaults, KEY } = await import("./js/progress.js");
    const { AtlasEngine, DriveEngine } = await import("./js/atlas-engine.js");
    const s = defaults(),
      e = new AtlasEngine(1);
    for (const state of ["New Jersey", "Pennsylvania", "Connecticut"])
      e.state(state);
    e.plan("philly");
    e.plan("dc");
    e.orient(3);
    for (const id of ["philly", "dc"]) {
      e.depart(id);
      for (let i = 0; i < 30; i++) e.tick(0.05);
    }
    s.adventures.atlas[1] = {
      ...e.export(),
      view: "drive",
      drive: new DriveEngine().export(),
    };
    localStorage.setItem(KEY, JSON.stringify(s));
  });
  await page.reload();
  await page.goto("./#game/atlas");
  await begin(page, 1);
  const right = page.getByRole("button", {
    name: "Sterza a destra",
    exact: true,
  });
  await right.scrollIntoViewIfNeeded();
  const b = await right.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
  });
  await page.waitForTimeout(1200);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByRole("button", { name: "Pausa", exact: true }).tap();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("ehy-amico:progress")).adventures
        .atlas[1],
  );
  expect(saved.drive.x).toBeGreaterThan(0.7);
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ehy-amico:progress")).adventures
          .atlas[1].drive.distance,
    ),
  ).toBe(saved.drive.distance);
  await page.reload();
  await page.getByRole("button", { name: "Inizia partita", exact: true }).tap();
  await expect(page.locator(".atlas-canvas")).toBeVisible();
  await page
    .getByRole("button", { name: "Chiedi allo Zio", exact: true })
    .tap();
  await expect(page.locator("#hint")).toContainText("taniche");
  await page
    .getByRole("button", { name: "Chiudi la radio", exact: true })
    .tap();
  await page.goto("./#home");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("ehy-amico:progress"));
    s.games.atlas.completed = 3;
    localStorage.setItem("ehy-amico:progress", JSON.stringify(s));
  });
  await page.reload();
  await page.goto("./#game/atlas");
  await begin(page, 4);
  await page
    .getByRole("button", { name: "Entra nel campo", exact: true })
    .tap();
  await page
    .getByRole("slider", { name: "Posizione Ricevitore 1", exact: true })
    .fill("90");
  await page.getByRole("button", { name: "Avvia azione", exact: true }).tap();
  await page
    .getByRole("button", { name: "Passa al ricevitore 1", exact: true })
    .tap();
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "won",
    { timeout: 15000 },
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ehy-amico:progress")).games.atlas
          .completed,
    ),
  ).toBe(4);
  await page.getByRole("button", { name: "Riprova", exact: true }).tap();
  await page
    .getByRole("button", { name: "Entra nel campo", exact: true })
    .tap();
  await page
    .getByRole("slider", { name: "Posizione Ricevitore 1", exact: true })
    .fill("90");
  await page.getByRole("button", { name: "Avvia azione", exact: true }).tap();
  await page
    .getByRole("button", { name: "Passa al ricevitore 1", exact: true })
    .tap();
  await expect(page.locator(".game-play")).toHaveAttribute(
    "data-state",
    "won",
    { timeout: 15000 },
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ehy-amico:progress")).games.atlas
          .completed,
    ),
  ).toBe(4);
  await context.close();
});
test("zoom e pan mantengono leggibili le città senza alterare la geografia", async ({
  page,
}) => {
  await seed(page);
  await begin(page, 1);
  const city = page.locator('[data-city="ny"] text');
  const before = await city.evaluate((n) => n.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Zoom +", exact: true }).click();
  const after = await city.evaluate((n) => n.getBoundingClientRect().width);
  expect(Math.abs(after - before)).toBeLessThan(1);
  await page.getByRole("button", { name: "Sposta est", exact: true }).click();
  expect(await page.locator(".atlas-map").getAttribute("viewBox")).not.toBe(
    "0 0 960 560",
  );
  await page.getByRole("button", { name: "Centra mappa", exact: true }).click();
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "viewBox",
    "0 0 960 560",
  );
});
