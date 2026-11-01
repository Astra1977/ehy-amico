import { test, expect } from "@playwright/test";
test("navigazione, dodici schede, radio, tastiera, preferenze e offline", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator(".card")).toHaveCount(12);
  await expect(page.locator("#offline")).toContainText("Zaino pronto");
  await page
    .getByRole("button", { name: "Chiedi allo Zio", exact: true })
    .click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  const ids = await page
    .locator(".card")
    .evaluateAll((nodes) => nodes.map((n) => n.hash));
  for (const id of ids) {
    await page.goto("./" + id);
    await expect(page.locator("main")).toContainText(
      "Lo Zio Inventore sta preparando",
    );
    await page.getByRole("link", { name: "Torna alla mappa" }).click();
    await expect(page.locator(".card")).toHaveCount(12);
  }
  await page.goto("./#settings");
  await page.getByRole("button", { name: "Audio: disattivato" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Audio: attivo" }),
  ).toBeVisible();
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("0/60");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("La collezione dei tesori");
  await page.getByRole("link", { name: "Diario", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Diario delle Scoperte");
  expect(errors).toEqual([]);
});
for (const width of [360, 768, 1280])
  test("responsive " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "work/home-" + width + ".png",
      fullPage: true,
      animations: "disabled",
    });
  });
test("aggiornamento cache conserva progressi e cache di altre app", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#offline")).toContainText("Zaino pronto");
  await page.evaluate(async () => {
    localStorage.setItem(
      "ehy-amico:progress",
      JSON.stringify({
        version: 1,
        games: { maze: { completed: 1, best: 40 } },
      }),
    );
    await caches.open("sala-giochi:test");
    await caches.open("ehy-amico:/ehy-amico/:obsolete");
  });
  await page.reload();
  await page.goto("./#rewards");
  await expect(page.locator(".stats")).toContainText("1/60");
  expect(await page.evaluate(() => caches.has("sala-giochi:test"))).toBe(true);
});
test("aggiornamento reale del worker con conferma e migrazione della cache", async ({
  page,
}) => {
  const { readFile, writeFile } = await import("node:fs/promises");
  const original = await readFile("sw.js", "utf8");
  try {
    await page.goto("./");
    await expect(page.locator("#offline")).toContainText("Zaino pronto");
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await page.reload();
    await page.evaluate(async () => {
      localStorage.setItem(
        "ehy-amico:progress",
        JSON.stringify({
          version: 1,
          games: { maze: { completed: 2, best: 80 } },
        }),
      );
      await caches.open("sala-giochi:unrelated");
    });
    const changed = original.replace(
      /CACHE=PREFIX\+'[^']+'/,
      "CACHE=PREFIX+'update-test'",
    );
    await writeFile("sw.js", changed);
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.ready;
      await r.update();
    });
    await expect(page.locator("#update")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          async () => (await navigator.serviceWorker.ready).waiting?.state,
        ),
      )
      .toBe("installed");
    await page.locator("#update").click();
    await expect(page.locator("#update")).toBeHidden();
    await page.goto("./#rewards");
    await expect(page.locator(".stats")).toContainText("2/60");
    const keys = await page.evaluate(() => caches.keys());
    expect(keys.filter((k) => k.startsWith("ehy-amico:/ehy-amico/:"))).toEqual([
      "ehy-amico:/ehy-amico/:update-test",
    ]);
    expect(keys).toContain("sala-giochi:unrelated");
  } finally {
    await writeFile("sw.js", original);
  }
});
test("touch e ridimensionamento dopo ripresa", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8000/ehy-amico/");
  await page.getByRole("link", { name: "Inizia l’avventura" }).tap();
  await expect(page.locator(".card")).toHaveCount(12);
  await page.setViewportSize({ width: 844, height: 390 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
test("percorso, griglia, Out Run e frammenti preservano i salvataggi", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() =>
    localStorage.setItem(
      "ehy-amico:progress",
      JSON.stringify({
        version: 1,
        games: { car: { completed: 5, best: 1234 } },
        settings: { sound: true, difficulty: 2 },
        visited: ["car"],
      }),
    ),
  );
  await page.goto("./#map");
  await page.reload();
  await expect(page.locator(".map-stop")).toHaveCount(12);
  await expect(page.locator(".adventure-path")).toBeVisible();
  await page.getByRole("button", { name: "Griglia accessibile" }).click();
  await expect(page.locator(".adventure-path")).toBeHidden();
  await expect(page.locator("#accessible-grid")).toBeVisible();
  await page.getByRole("link", { name: /Out Run/ }).click();
  await expect(page.locator("h1")).toHaveText("Out Run");
  await page.goto("./#rewards");
  await expect(page.locator(".fragment")).toHaveCount(12);
  await expect(page.locator(".fragment.earned")).toHaveCount(1);
  await expect(page.locator(".medal.earned")).toHaveCount(5);
  await expect(page.locator(".stats")).toContainText("5/60");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ehy-amico:progress")).games.car.best,
    ),
  ).toBe(1234);
  await page.goto("./#settings");
  await expect(
    page.getByRole("button", { name: "Audio: attivo" }),
  ).toBeVisible();
  await expect(page.locator("select")).toHaveValue("2");
});
for (const width of [360, 768, 1024])
  test("schermate restyling " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    for (const route of ["map", "diary", "rewards"]) {
      await page.goto("./#" + route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "work/" + route + "-" + width + ".png",
        fullPage: true,
        animations: "disabled",
      });
    }
  });

test('nuove illustrazioni e percorso disponibili offline', async ({page,context}) => {
 await page.goto('./');
 await expect(page.locator('#offline')).toContainText('Zaino pronto');
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 expect(await page.evaluate(async()=>!!await caches.match(new URL('./assets/adventure-atlas.webp',location.href).href))).toBe(true);
 await context.setOffline(true);
 await page.reload();
 await page.getByRole('link',{name:'Inizia l’avventura'}).click();
 await expect(page.locator('.map-stop')).toHaveCount(12);
 await expect(page.locator('.map-stop').first()).toBeVisible();
 await page.getByRole('link',{name:'Tesori',exact:true}).click();
 await expect(page.locator('.fragment')).toHaveCount(12);
});
