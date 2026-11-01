import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  RoachEngine,
  RunnerEngine,
  ROACH_GOALS,
  RUNNER_DURATIONS,
} from "../js/arcade-engines.js";
import { TetrisEngine } from "../js/tetris-engine.js";
test("motore Tetris identico al blob sorgente verificato", async () => {
  const b = await readFile("js/tetris-engine.js");
  assert.equal(
    createHash("sha1")
      .update("blob " + b.length + "\0")
      .update(b)
      .digest("hex"),
    "b1741583aa0fee3730c086ee67e847012b33b4e3",
  );
});
test("cucaracha: boss persistente 5 colpi, combo, penalità e bersagli rimossi", () => {
  const e = new RoachEngine(1, 0, () => 0.1),
    boss = e.targets[0];
  assert.equal(boss.type, "boss");
  for (let n = 0; n < 4; n++) e.hit(boss.id);
  assert.equal(e.targets[0], boss);
  assert.equal(e.captures, 0);
  e.hit(boss.id);
  assert.equal(e.captures, 1);
  assert.equal(e.defeated, 1);
  assert.equal(e.points, 150);
  assert.equal(e.hit(boss.id), false);
  e.targets.push({ id: 99, type: "decoy", hp: 1, life: 1 });
  e.hit(99);
  assert.equal(e.errors, 1);
  assert.equal(e.combo, 0);
  assert.equal(e.points, 135);
});
test("cucaracha: cinque obiettivi richiedono il timer e condizioni complete", () => {
  for (let stage = 1; stage <= 5; stage++) {
    const e = new RoachEngine(stage, 0, () => 0.7);
    e.captures = ROACH_GOALS[stage - 1];
    e.errors = 5 - stage;
    e.defeated = 1;
    e.tick(34.9);
    assert.equal(e.state, "playing");
    e.tick(0.1);
    assert.equal(e.state, "won");
    const failed = new RoachEngine(stage);
    failed.captures = ROACH_GOALS[stage - 1];
    failed.errors = 6 - stage;
    failed.defeated = 1;
    failed.tick(35);
    assert.equal(failed.state, "over");
  }
  const e = new RoachEngine(5);
  e.captures = 24;
  e.tick(35);
  assert.equal(e.state, "over");
});
test("runner: collisione vera, salto al picco, punti dopo sorpasso e niente punti in collisione", () => {
  const e = new RunnerEngine();
  e.spawnAt = 100;
  e.obstacles = [{ x: e.width * 0.12 + 40, size: 60, passed: false }];
  e.tick(0.01);
  assert.equal(e.state, "over");
  assert.equal(e.points, 0);
  const safe = new RunnerEngine();
  safe.spawnAt = 100;
  safe.jump();
  safe.jumpTime = 0.35;
  safe.obstacles = [{ x: safe.width * 0.12 + 40, size: 75, passed: false }];
  safe.tick(0.01);
  assert.equal(safe.state, "playing");
  safe.obstacles[0].x = 80;
  safe.tick(0.01);
  assert.equal(safe.points, 8);
  safe.tick(0.01);
  assert.equal(safe.points, 8);
});
test("runner: durata dei cinque percorsi, velocità crescente e salto non ripetibile subito", () => {
  for (let stage = 1; stage <= 5; stage++) {
    const e = new RunnerEngine(stage);
    e.spawnAt = 100;
    e.tick(RUNNER_DURATIONS[stage - 1]);
    assert.equal(e.state, "won");
  }
  const e = new RunnerEngine();
  assert(e.jump());
  assert(!e.jump());
  const speed = e.speed;
  e.spawnAt = 100;
  e.tick(3);
  assert(e.speed > speed);
});
test("Tetris: 7-bag, muri, rotazione, caduta e game over", () => {
  const e = new TetrisEngine(() => 0.5);
  const kinds = [
    e.piece.kind,
    e.next,
    ...Array.from({ length: 5 }, () => e.take()),
  ];
  assert.equal(new Set(kinds).size, 7);
  while (e.move(-1)) {}
  assert(!e.move(-1));
  assert(e.rotate());
  const old = e.piece;
  e.hardDrop();
  assert.notEqual(e.piece, old);
  assert(e.score > 0);
  e.board = Array.from({ length: 20 }, () => Array(10).fill(1));
  e.spawn();
  assert.equal(e.state, "over");
});
test("Tetris: cancellazione simultanea di quattro righe, compressione e tutte le soglie", () => {
  const e = new TetrisEngine();
  e.board = Array.from({ length: 20 }, () => Array(10).fill(0));
  for (let y = 16; y < 20; y++)
    e.board[y] = Array(10)
      .fill(2)
      .map((v, x) => (x === 5 ? 0 : v));
  e.piece = { kind: 0, matrix: [[1], [1], [1], [1]], x: 5, y: 16 };
  e.lock();
  assert.equal(e.lines, 4);
  assert.equal(e.score, 800);
  assert(e.board.every((row) => row.every((v) => v === 0)));
  for (const n of [9, 19, 29, 39, 49]) {
    const f = new TetrisEngine();
    f.lines = n;
    f.board[19] = Array(10).fill(1);
    f.piece = { kind: 3, matrix: [[1]], x: 0, y: 0 };
    f.lock();
    assert.equal(f.lines, n + 1);
    assert.equal(Math.floor(f.lines / 10), (n + 1) / 10);
    if (n === 49) assert.equal(f.state, "won");
  }
});
test("runner: cinque percorsi simulati integralmente con salti temporizzati e difficoltà", () => {
  for (let stage = 1; stage <= 5; stage++)
    for (let difficulty = 0; difficulty < 3; difficulty++) {
      const e = new RunnerEngine(stage, difficulty, () => 0.5);
      for (let step = 0; step < 6000 && e.state === "playing"; step++) {
        const hero = e.width * 0.12 + 40;
        const next = e.obstacles.find((o) => !o.passed && o.x > hero);
        if (next && (next.x - hero) / e.speed < 0.36 && e.jumpTime >= 0.5)
          e.jump();
        e.tick(1 / 120);
      }
      assert.equal(
        e.state,
        "won",
        "percorso " + stage + " difficoltà " + difficulty,
      );
      assert(e.points > 0);
    }
});
