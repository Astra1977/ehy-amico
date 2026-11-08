import { test } from "node:test";
import assert from "node:assert/strict";
import { CaveEngine, traceBeam } from "../js/cave-engine.js";
import { lightPuzzle } from "../js/cave-data.js";
import { createStore, KEY, totals } from "../js/progress.js";
function solveLight(e) {
  e.moveZone(1);
  e.toggleLight();
  for (let i = 0; i < e.light.mirrors.length; i++)
    if (e.s.mirrors[i] !== e.light.mirrors[i].goal) e.rotateMirror(i);
  assert(e.beam.sensor);
}
export function solve(e) {
  if (e.stage === 1) {
    for (let i = 0; i < 3; i++) {
      e.moveZone(i);
      e.collect(i);
    }
    e.codeAnswer.forEach((s, i) => e.setSymbol(i, s));
  }
  if (e.stage === 2) solveLight(e);
  if (e.stage === 3) {
    e.moveZone(1);
    for (let i = 1; i < e.floor.rows; i++) assert(e.stepFloor(e.floor.path[i]));
  }
  if (e.stage === 4) {
    e.moveZone(0);
    const used = new Set();
    for (let i = 0; i < e.s.gearSlots.length; i++) {
      const id = e.bridge.inventory.findIndex(
        (t, j) => !used.has(j) && t === e.bridge.teeth[i + 1],
      );
      used.add(id);
      e.placeGear(i, id);
    }
    assert(e.gearsWorking);
    e.moveZone(1);
    for (let i = 0; i < e.s.weights.length; i++)
      for (let n = 0; n < e.bridge.targets[i]; n++) e.weight(i, 1);
    e.toggleLever();
    assert(e.bridgeReady);
  }
  if (e.stage === 5) {
    e.codeAnswer.forEach((s, i) => e.setSymbol(i, s));
    solveLight(e);
    e.moveZone(2);
    for (const color of e.pulseAnswer) e.pulse(color);
  }
  e.moveZone(2);
  assert(e.advance());
  if (e.stage === 5) {
    assert(e.s.opened);
    assert(!e.s.won);
    assert(e.advance());
  }
  assert(e.s.won);
  return e.s.discovery;
}
test("Grotta: cinque enigmi reali, due difficoltà, otto configurazioni e indizi riutilizzati nel tempio", () => {
  for (const mode of ["explorer", "investigator"])
    for (let seed = 0; seed < 8; seed++) {
      const artifacts = {};
      for (let stage = 1; stage <= 5; stage++) {
        const e = new CaveEngine(stage, { mode, seed }, artifacts);
        assert(!e.advance());
        artifacts[stage] = solve(e);
        assert(e.s.records[mode] > 0);
        assert.deepEqual(
          new CaveEngine(stage, e.export(), artifacts).export(),
          e.export(),
        );
      }
    }
});
test("Luce: riflessioni coerenti nei quattro versi, ostacoli, bordi, cristalli e loop", () => {
  const p = {
    width: 5,
    height: 5,
    source: [0, 2],
    dir: 0,
    mirrors: [{ x: 2, y: 2 }],
    walls: [],
    crystals: [],
    sensor: [2, 0],
  };
  assert(traceBeam(p, ["/"]).sensor);
  assert(traceBeam({ ...p, sensor: [2, 4] }, ["\\"]).sensor);
  assert(
    traceBeam({ ...p, source: [2, 4], dir: 3, sensor: [4, 2] }, ["/"]).sensor,
  );
  assert(
    traceBeam({ ...p, source: [2, 0], dir: 1, sensor: [0, 2] }, ["/"]).sensor,
  );
  assert.equal(traceBeam({ ...p, walls: [[1, 2]] }, ["/"]).stop, "wall");
  assert.equal(traceBeam(p, ["\\"]).stop, "edge");
  assert(
    !traceBeam({ ...p, crystals: [{ x: 4, y: 4, color: "ambra" }] }, ["/"])
      .sensor,
  );
  const loop = {
    width: 5,
    height: 5,
    source: [1, 1],
    dir: 0,
    mirrors: [
      { x: 3, y: 1 },
      { x: 3, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 1 },
    ],
    walls: [],
    crystals: [],
    sensor: [4, 4],
  };
  assert.equal(traceBeam(loop, ["\\", "/", "\\", "/"]).stop, "loop");
  for (const hard of [false, true]) {
    const puzzle = lightPuzzle(hard),
      correct = puzzle.mirrors.map((m) => m.goal);
    assert(traceBeam(puzzle, correct).sensor);
    for (let i = 0; i < correct.length; i++) {
      const wrong = [...correct];
      wrong[i] = wrong[i] === "/" ? "\\" : "/";
      assert(!traceBeam(puzzle, wrong).sensor);
    }
  }
});
test("Ingresso: indizi raccolti fisicamente, ordine verificato e nessuna apertura anticipata", () => {
  const e = new CaveEngine(1);
  assert(!e.collect(2));
  for (let i = 0; i < 3; i++) {
    e.moveZone(i);
    e.collect(i);
    e.collect(i);
  }
  assert.equal(e.s.clues.length, 3);
  e.codeAnswer.forEach((s, i) => e.setSymbol(i, s));
  assert(e.codeCorrect);
  e.setSymbol(0, "luna");
  assert(!e.advance());
  e.setSymbol(0, e.codeAnswer[0]);
  assert(e.advance());
});
test("Pavimento: adiacenza, pattern, errori, checkpoint e rigiocabilità", () => {
  const layouts = new Set();
  for (let seed = 0; seed < 6; seed++) {
    const e = new CaveEngine(3, { seed });
    layouts.add(JSON.stringify(e.floor));
    e.moveZone(1);
    assert(!e.stepFloor(4));
    for (let step = 1; step <= 3; step++)
      assert(e.stepFloor(e.floor.path[step]));
    assert.equal(e.s.floorCheckpoint, 3);
    assert(e.stepFloor(e.floor.path[4]));
    const wrong = [0, 1, 2, 3, 4].find(
      (c) => Math.abs(c - e.floorColumn) <= 1 && c !== e.floor.path[5],
    );
    assert(!e.stepFloor(wrong));
    assert.equal(e.s.floorStep, 3);
    assert.equal(e.s.errors, 1);
    assert.equal(e.restart().s.seed, seed + 1);
  }
  assert(layouts.size > 1);
});
test("Ponte: denti e distanze, niente ruote duplicate, leva e contrappesi causali", () => {
  const e = new CaveEngine(4);
  e.moveZone(0);
  e.placeGear(0, 2);
  e.placeGear(1, 1);
  assert(!e.gearsWorking);
  e.toggleLever();
  assert.equal(e.lift(0), 0);
  e.placeGear(0, 0);
  assert(e.gearsWorking);
  e.moveZone(1);
  e.weight(0, 1);
  assert.equal(e.lift(0), 0.5);
  e.weight(0, 1);
  assert.equal(e.lift(0), 1);
  e.weight(0, 1);
  assert(e.lift(0) < 1);
  e.weight(0, -1);
  for (let i = 0; i < 3; i++) e.weight(1, 1);
  assert(e.bridgeReady);
  assert.equal(e.transmission, 2);
  e.toggleLever();
  assert(!e.bridgeReady);
  assert.equal(e.lift(0), 0);
  e.moveZone(0);
  e.placeGear(1, 0);
  assert.equal(e.s.gearSlots[0], null);
  assert(!e.gearsWorking);
});
test("Tempio: richiede quattro reperti, codice, riflessioni e ritmo, poi raccolta esplicita", () => {
  const missing = new CaveEngine(5);
  assert(!missing.advance());
  assert(!missing.toggleLight());
  const artifacts = {};
  for (let i = 1; i <= 4; i++)
    artifacts[i] = solve(
      new CaveEngine(i, { mode: "investigator" }, artifacts),
    );
  const e = new CaveEngine(5, null, artifacts);
  e.codeAnswer.forEach((s, i) => e.setSymbol(i, s));
  solveLight(e);
  e.moveZone(2);
  assert(!e.pulse("verde"));
  assert.equal(e.s.pulse, 0);
  for (const c of e.pulseAnswer) e.pulse(c);
  assert(e.advance());
  assert(!e.s.won);
  assert(e.advance());
  assert(e.s.won);
  assert.equal(e.s.discovery.sanctuary, true);
});
test("Salvataggi v2: Grotta non duplica ricompense né cancella Atlante, scoperte e record", () => {
  const values = new Map(),
    storage = {
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => values.set(k, v),
    };
  let store = createStore(storage);
  store.complete("atlas", 1, 987);
  store.saveAdventure("atlas", 1, { mode: "veteran", souvenirs: ["ny"] });
  const artifacts = {};
  for (let stage = 1; stage <= 5; stage++) {
    let e = new CaveEngine(stage, null, artifacts);
    artifacts[stage] = solve(e);
    store.saveAdventure("cave", stage, e.export());
    store.complete("cave", stage, 1000);
    e = e.restart("investigator");
    assert.deepEqual(e.s.discovery, artifacts[stage]);
    solve(e);
    store.saveAdventure("cave", stage, e.export());
    store.complete("cave", stage, 1200);
    store = createStore(storage);
  }
  assert.deepEqual(totals(store.data), { rewards: 6, fragments: 1 });
  assert.equal(store.data.games.atlas.best, 987);
  assert.deepEqual(store.data.adventures.atlas[1].souvenirs, ["ny"]);
  assert.equal(store.data.games.cave.completed, 5);
  assert(store.data.adventures.cave[5].records.explorer > 0);
  assert(store.data.adventures.cave[5].records.investigator > 0);
  assert(values.get(KEY));
});
test("Il tempio usa i reperti effettivi anche mescolando difficoltà e configurazioni", () => {
  const artifacts = {};
  for (let stage = 1; stage <= 4; stage++)
    artifacts[stage] = solve(
      new CaveEngine(
        stage,
        { mode: stage % 2 ? "investigator" : "explorer", seed: stage + 2 },
        artifacts,
      ),
    );
  for (const mode of ["explorer", "investigator"]) {
    const e = new CaveEngine(5, { mode, seed: 19 }, artifacts);
    assert.equal(
      e.pulseAnswer.length,
      artifacts[2].colors.length * artifacts[4].gears,
    );
    assert.equal(e.codeAnswer[0], artifacts[1].order[0]);
    assert.equal(e.codeAnswer[1], artifacts[3].motif[1]);
    solve(e);
    assert(e.s.won);
  }
});
