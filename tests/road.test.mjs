import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { registerRoad } from "../js/road-original.js";
test("corpo del motore di guida identico al sorgente autorizzato", async () => {
  const text = await readFile("js/road-original.js", "utf8");
  const raw = text.slice(
    text.indexOf("'use strict';"),
    text.lastIndexOf("\n}") + 1,
  );
  assert.equal(
    createHash("sha1")
      .update("blob " + Buffer.byteLength(raw) + "\0")
      .update(raw)
      .digest("hex"),
    "4b88da0d15b44b3d66fb4208ad5c22762a1df829",
  );
});
function simulate(lane, vehicle = "auto") {
  const before = {
    window: globalThis.window,
    document: globalThis.document,
    random: Math.random,
  };
  Math.random = () => 0;
  const paint = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    { get: (obj, k) => obj[k] ?? (() => {}) },
  );
  class Canvas extends EventTarget {
    getContext() {
      return paint;
    }
    setPointerCapture() {}
  }
  globalThis.window = new EventTarget();
  globalThis.document = { createElement: () => new Canvas() };
  let definition,
    pending,
    end,
    points = 0,
    levels = [],
    popups = [];
  const canvas = new Canvas();
  let now = performance.now();
  try {
    registerRoad(
      {
        register(d) {
          definition = d;
        },
      },
      {
        rand: (a, b) => a,
        pick: (arr) =>
          typeof arr[0] === "number" && arr.includes(lane) ? lane : arr[0],
        ri: (a) => a,
        vibrate() {},
      },
      { tone() {}, bad() {}, win() {} },
      (fn) => fn(),
      (fn) => (pending = fn),
      () => (pending = null),
    );
    const game = definition.start({
      canvas: () => ({
        c: canvas,
        g: paint,
        W: 800,
        H: 450,
        pos: (e) => ({ x: e.x }),
        dispose() {},
      }),
      intro: (_, start) => start(vehicle),
      info: (s) => levels.push(Number(s.match(/Livello (\d+)/)?.[1])),
      add: (n) => (points += n),
      popup: (s) => popups.push(s),
      begin() {},
      end: (r) => (end = r),
    });
    now = performance.now();
    for (
      let i = 0;
      i < 12000 && pending && !end && (lane === 0 || Math.max(...levels) < 6);
      i++
    ) {
      const fn = pending;
      pending = null;
      now += 50;
      fn(now);
    }
    game.stop();
    return { points, levels, end, popups, stopped: pending === null };
  } finally {
    globalThis.window = before.window;
    globalThis.document = before.document;
    Math.random = before.random;
  }
}
test("guida originale: cinque checkpoint reali con bonus, punteggio e tre veicoli", () => {
  for (const vehicle of ["moto", "auto", "camion"]) {
    const result = simulate(-0.66, vehicle);
    assert(result.levels.includes(6), vehicle);
    assert(result.points >= 500);
    assert(result.popups.filter((s) => s.includes("CHECKPOINT")).length >= 5);
    assert(result.stopped);
  }
});
test("guida originale: collisioni con traffico, penalità e termine per tempo scaduto", () => {
  const result = simulate(0);
  assert(result.popups.some((s) => s.includes("Bump")));
  assert(result.end);
  assert.match(result.end.title, /Tempo scaduto/);
  assert(result.points >= 0);
});
