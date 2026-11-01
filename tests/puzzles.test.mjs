import { test } from "node:test";
import assert from "node:assert/strict";
import { createMaze, MazeEngine, MemoryEngine } from "../js/puzzle-engines.js";
function path(map) {
  const q = [[1, 1, []]],
    seen = new Set(["1,1"]);
  for (let i = 0; i < q.length; i++) {
    const [x, y, p] = q[i];
    if (map[y][x] === "E") return p;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = x + dx,
        b = y + dy,
        k = a + "," + b;
      if (map[b]?.[a] && map[b][a] !== "#" && !seen.has(k)) {
        seen.add(k);
        q.push([a, b, [...p, [dx, dy]]]);
      }
    }
  }
  return null;
}
test("500 templi: tutte le uscite raggiungibili e pareti esterne chiuse", () => {
  for (let i = 0; i < 500; i++) {
    const n = 9 + 2 * (i % 7),
      m = createMaze(n);
    assert(path(m)?.length > 0);
    assert(m[0].every((v) => v === "#"));
    assert(m[n - 1].every((v) => v === "#"));
    assert(m.every((r) => r[0] === "#" && r[n - 1] === "#"));
  }
});
test("cinque missioni del labirinto: pareti, mosse, cronometro e solo uscita vincente", () => {
  for (let stage = 1; stage <= 5; stage++) {
    const e = new MazeEngine(stage);
    assert.equal(e.size, 7 + 2 * stage);
    assert(!e.move(-1, 0));
    assert(!e.move(2, 0));
    assert.equal(e.moves, 0);
    assert.equal(e.blocked, 1);
    e.tick(1.25);
    assert.equal(e.time, 1.25);
    assert.equal(e.state, "playing");
    const solution = path(e.map);
    for (const d of solution) assert(e.move(...d));
    assert.equal(e.state, "won");
    assert.equal(e.moves, solution.length);
    assert(e.points >= 20);
    assert(!e.move(-1, 0));
    const time = e.time;
    e.tick(10);
    assert.equal(e.time, time);
  }
});
test("Memory: doppio tap ignorato, errore, input bloccati e tempo di verifica", () => {
  const e = new MemoryEngine(1);
  const a = 0,
    b = e.cards.findIndex((c) => c.symbol !== e.cards[0].symbol);
  assert(e.flip(a));
  assert(!e.flip(a));
  assert.equal(e.moves, 0);
  assert(e.flip(b));
  assert.equal(e.moves, 1);
  assert(e.wait > 0);
  const c = e.cards.findIndex((_, i) => i !== a && i !== b);
  assert(!e.flip(c));
  e.tick(0.1);
  assert(e.cards[a].face);
  e.tick(2);
  assert(!e.cards[a].face);
  assert(!e.cards[b].face);
  assert(e.flip(c));
});
test("Memory: cinque mazzi completi, coppie mantenute visibili e punteggi", () => {
  for (let stage = 1; stage <= 5; stage++) {
    const e = new MemoryEngine(stage);
    assert.equal(e.cards.length, [8, 12, 16, 20, 24][stage - 1]);
    const pairs = new Map();
    e.cards.forEach((c, i) => {
      pairs.set(c.symbol, [...(pairs.get(c.symbol) || []), i]);
    });
    for (const indices of pairs.values()) {
      assert.equal(indices.length, 2);
      e.flip(indices[0]);
      e.flip(indices[1]);
      assert(e.cards[indices[0]].matched);
      assert(!e.flip(indices[0]));
    }
    assert.equal(e.state, "won");
    assert.equal(e.moves, e.pairs);
    assert.equal(e.matched, e.pairs);
    assert.equal(e.points, stage * 300 - e.pairs * 3);
  }
});
test("Memory: i mazzi vengono rimescolati a ogni partita e difficoltà graduata", () => {
  const decks = new Set(
    Array.from({ length: 10 }, () =>
      new MemoryEngine(5).cards.map((c) => c.symbol).join(","),
    ),
  );
  assert(decks.size > 1);
  assert(new MemoryEngine(1, 0).delay > new MemoryEngine(1, 2).delay);
});
