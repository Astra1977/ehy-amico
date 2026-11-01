import { test } from "node:test";
import assert from "node:assert/strict";
import { JurassicEngine } from "../js/jurassic-engine.js";
import { TimeEngine, validateTask, solutionHint } from "../js/time-engine.js";
import { JURASSIC_MISSIONS, timeTasks } from "../js/education-data.js";
import { createStore, normalize, KEY } from "../js/progress.js";
export function excavate(engine) {
  for (let site = 0; site < engine.mission.sites.length; site++) {
    engine.selectSite(site);
    if (engine.mission.trace) engine.trace();
    for (const p of engine.mission.parts.filter((p) => p.site === site)) {
      while (engine.depth[p.id] > 1) engine.dig(p.id, "shovel");
      engine.dig(p.id, "brush");
    }
  }
}
export function repair(engine) {
  const t = engine.task;
  assert(t);
  if (t.type === "circuit") {
    const find = (ids) => {
      if (ids.length === t.signs.length) {
        const s = { slots: ids };
        return validateTask(t, s) ? ids : null;
      }
      for (let i = 0; i < t.values.length; i++)
        if (!ids.includes(i)) {
          const found = find([...ids, i]);
          if (found) return found;
        }
      return null;
    };
    const ids = find([]);
    assert(ids, "circuito risolvibile");
    ids.forEach((id, i) => engine.connect(id, i));
  } else if (t.type === "groups") {
    const n =
      t.count ||
      Array.from({ length: 7 }, (_, i) => i + 2).find(
        (n) => t.total % n === 0 && t.total / n >= 2 && t.total / n <= 10,
      );
    for (let i = 0; i < n; i++) {
      engine.group("new");
      for (let k = 0; k < t.total / n; k++) engine.group("add", i);
    }
  } else if (t.type === "tank") {
    while (engine.current.level > t.target) engine.pour(-250);
    while (engine.current.level < t.target) engine.pour(250);
  } else if (t.type === "clock") {
    let delta = (t.target - engine.current.minutes + 1440) % 1440;
    while (delta >= 60) {
      engine.turn(60);
      delta -= 60;
    }
    while (delta > 0) {
      engine.turn(5);
      delta -= 5;
    }
  } else if (t.type === "order") {
    [...t.values.keys()]
      .sort((a, b) => t.values[a] - t.values[b])
      .forEach((id, i) => engine.connect(id, i));
  } else {
    while (engine.current.x < t.target[0]) engine.move(1, 0);
    while (engine.current.y < t.target[1]) engine.move(0, 1);
  }
  assert(validateTask(t, engine.current));
}
test("Jurassic: strumenti, scoperta progressiva e recupero da un uso sbagliato", () => {
  const e = new JurassicEngine(1);
  const p = e.mission.parts[0];
  assert.equal(e.phase, "dig");
  assert(!e.conclude());
  assert(!e.place(p.id, p.id));
  e.dig(p.id, "brush");
  assert.equal(e.depth[p.id], 2);
  assert.equal(e.errors, 1);
  e.dig(p.id, "shovel");
  assert.equal(e.depth[p.id], 1);
  e.dig(p.id, "shovel");
  assert.equal(e.depth[p.id], 0);
  assert(!e.used.brush);
  e.dig(p.id, "brush");
  assert(e.used.brush);
  assert.equal(e.recovered.length, 1);
});
test("Jurassic: tutte le cinque missioni, incastri reali e identificazioni ai tre livelli", () => {
  for (let stage = 1; stage <= 5; stage++)
    for (let difficulty = 0; difficulty < 3; difficulty++) {
      const e = new JurassicEngine(stage, difficulty);
      assert(!e.conclude());
      excavate(e);
      if (e.mission.assemble) {
        assert.equal(e.phase, "assemble");
        const first = e.mission.parts[0];
        assert(!e.place(first.id, "slot-errato"));
        assert.equal(e.placed.length, 0);
        for (const p of e.mission.parts) assert(e.place(p.id, p.id));
      }
      for (const label of e.mission.labels) {
        assert.equal(e.phase, "identify");
        assert(!e.assign(label.specimen, "etichetta errata"));
        assert(e.assign(label.specimen, label.answer));
      }
      assert.equal(e.phase, "ready");
      assert(e.conclude());
      assert.equal(e.phase, "won");
      assert(e.points >= 25);
      assert(!e.conclude());
      if (stage >= 4) assert.equal(e.traces.length, 3);
    }
});
test("Jurassic: tracce obbligatorie, checkpoint parziale e rigiocabilità", () => {
  const e = new JurassicEngine(4);
  const p = e.mission.parts[0];
  e.selectSite(p.site);
  assert(!e.dig(p.id, "shovel"));
  e.trace();
  e.dig(p.id, "shovel");
  const resumed = new JurassicEngine(4, 2, e.export());
  assert.equal(resumed.depth[p.id], 1);
  assert.equal(resumed.difficulty, 0);
  assert(resumed.traces.includes(p.site));
  const malformed = new JurassicEngine(4, 0, {
    stage: 4,
    depth: { [p.id]: "bad" },
  });
  assert.equal(malformed.depth[p.id], 2);
  const won = new JurassicEngine(1);
  excavate(won);
  won.conclude();
  assert.equal(new JurassicEngine(1, 0, won.export()).phase, "dig");
});
test("Macchina: tutte le cinque missioni ai tre livelli richiedono costruzioni corrette", () => {
  for (let stage = 1; stage <= 5; stage++)
    for (let d = 0; d < 3; d++) {
      const e = new TimeEngine(stage, d);
      assert(!e.travel());
      assert(!e.verify());
      while (e.task) {
        const before = e.index;
        assert(solutionHint(e.task).length > 10);
        repair(e);
        assert(e.verify());
        assert.equal(e.index, before + 1);
      }
      assert(e.history.length >= 3);
      if (stage === 5) assert(new Set(e.tasks.map((t) => t.type)).size >= 3);
      assert(!e.done);
      assert(e.travel());
      assert(!e.travel());
      assert(e.points > 0);
    }
});
test("Macchina: pile non duplicabili, errori, gruppi, capacità, orologio e coordinate", () => {
  const circuit = new TimeEngine(1);
  circuit.connect(0, 0);
  circuit.connect(0, 1);
  assert.equal(circuit.current.slots[0], null);
  assert(!circuit.verify());
  assert(!circuit.connect(99, 0));
  const gears = new TimeEngine(2);
  gears.group("new");
  gears.group("add", 0);
  assert(!gears.verify());
  const tank = new TimeEngine(3);
  assert(!tank.pour(-250));
  for (let i = 0; i < 10; i++) assert(tank.pour(250));
  assert(!tank.pour(500));
  assert(!tank.verify());
  tank.pour(-250);
  const clock = new TimeEngine(4);
  assert(!clock.verify());
  assert(clock.turn(60));
  assert.equal(clock.current.minutes, 600);
  const cTask = timeTasks(4)[2];
  assert(!validateTask(cTask, { x: 99, y: 0 }));
});
test("Macchina: ripresa a metà viaggio e rifiuto di cronologie non valide", () => {
  const e = new TimeEngine(5);
  repair(e);
  e.verify();
  e.group("new");
  e.group("add", 0);
  const resumed = new TimeEngine(5, 2, e.export());
  assert.equal(resumed.index, 1);
  assert.deepEqual(resumed.current.groups, [1]);
  assert.equal(resumed.difficulty, 0);
  const bad = new TimeEngine(5, 0, {
    stage: 5,
    difficulty: 0,
    history: [{ slots: [0, 0] }],
    current: {},
  });
  assert.equal(bad.index, 0);
  assert(!bad.travel());
});
test("Migrazione v1→v2: trenta tesori e car intatti, salvataggi intermedi nella stessa chiave", () => {
  const map = new Map(),
    storage = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => map.set(k, v),
    };
  const games = Object.fromEntries(
    ["roach", "runner", "tetris", "maze", "memory", "car"].map((id) => [
      id,
      { completed: 5, best: 987 },
    ]),
  );
  storage.setItem(
    KEY,
    JSON.stringify({
      version: 1,
      games,
      settings: { sound: true, difficulty: 1 },
    }),
  );
  const store = createStore(storage);
  assert.equal(store.data.version, 2);
  for (const id of Object.keys(games))
    assert.deepEqual(store.data.games[id], games[id]);
  const e = new JurassicEngine(1);
  e.dig(e.mission.parts[0].id, "shovel");
  store.saveAdventure("jurassic", 1, e.export());
  const restored = createStore(storage);
  assert.equal(restored.data.games.car.best, 987);
  assert.equal(
    restored.data.adventures.jurassic[1].depth[e.mission.parts[0].id],
    1,
  );
  assert.equal(restored.data.settings.sound, true);
  assert.equal(normalize({ version: 1 }).version, 2);
});
