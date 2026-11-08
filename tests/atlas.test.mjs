import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AtlasEngine,
  DriveEngine,
  FootballEngine,
} from "../js/atlas-engine.js";
import { CITIES, city, project } from "../js/atlas-data.js";
import { STATES } from "../js/atlas-states.js";
import { createStore, totals, KEY } from "../js/progress.js";
function arrive(e, id) {
  assert.equal(e.depart(id), true);
  for (let i = 0; i < 40; i++) e.tick(0.05);
  assert.equal(e.location, id);
}
function drive(veteran) {
  const d = new DriveEngine(veteran);
  for (let i = 0; i < 2400 && !d.done && !d.failed; i++) {
    const item = d.items.find((i) => i.fuel && i.y < 0.82);
    const target = item?.x ?? d.x;
    d.step(0.05, Math.abs(target - d.x) < 0.015 ? 0 : Math.sign(target - d.x));
  }
  return d;
}
function football(veteran) {
  const f = new FootballEngine(veteran);
  f.position(0, veteran ? 90 : 10);
  f.start();
  f.pass(0);
  for (let i = 0; i < 250 && f.phase !== "won" && f.phase !== "lost"; i++)
    f.step(0.05);
  return f;
}
test("Atlante: tutti i 50 Stati + DC, geografia coerente e comuni degli stadi", () => {
  assert.equal(STATES.length, 51);
  for (const c of CITIES) {
    assert(STATES.some((s) => s.name === c.state));
    const p = project(c);
    assert(p.x > 0 && p.x < 960 && p.y > 0 && p.y < 560);
  }
  assert(city("ny").lon > city("dallas").lon);
  assert(city("seattle").lat > city("la").lat);
  assert(city("inglewood").lat < city("la").lat);
  assert.equal(city("kc").state, "Missouri");
  assert.match(city("dallas").stadium, /Arlington/);
  assert.match(city("miami").stadium, /Miami Gardens/);
  assert.match(city("ny").stadium, /East Rutherford/);
  assert.match(city("inglewood").stadium, /Inglewood/);
});
test("Guida: raccolta, sterzo, collisioni e checkpoint in entrambe le modalità", () => {
  for (const veteran of [false, true]) {
    const d = drive(veteran);
    assert(d.done);
    assert(d.pickups >= 3);
    assert(d.distance >= 1000);
    const crash = new DriveEngine(veteran);
    crash.items = [{ x: 0.5, y: 0.81, fuel: false }];
    crash.step(0.05, 0);
    assert.equal(crash.hits, 1);
    assert(crash.fuel < 60);
    const fuel = new DriveEngine(veteran);
    fuel.items = [{ x: 0.5, y: 0.81, fuel: true }];
    fuel.step(0.05, 0);
    assert.equal(fuel.pickups, 1);
    assert(fuel.fuel > 80);
    const resume = new DriveEngine(
      veteran,
      JSON.parse(JSON.stringify(d.export())),
    );
    assert.deepEqual(resume.export(), d.export());
  }
});
test("Football: movimento, traiettorie, passaggio, touchdown e intercetto veri", () => {
  for (const veteran of [false, true]) {
    const f = football(veteran);
    assert.equal(f.phase, "won");
    assert(f.yards >= 80);
    const lost = new FootballEngine(veteran);
    lost.start();
    lost.pass(0);
    lost.defenders = [{ ...lost.qb }];
    lost.step(0.05);
    assert.equal(lost.phase, "lost");
    const miss = new FootballEngine(veteran);
    miss.start();
    for (let i = 0; i < 230; i++) miss.step(0.05);
    assert.equal(miss.phase, "lost");
  }
});
test("Cinque missioni complete, due modalità, ricompense idempotenti e salvataggio", () => {
  for (const mode of ["explorer", "veteran"]) {
    let text = null;
    const storage = {
      getItem: (k) => (k === KEY ? text : null),
      setItem: (k, v) => {
        if (k === KEY) text = v;
      },
    };
    let store = createStore(storage);
    store.complete("car", 1, 1234);
    for (let stage = 1; stage <= 5; stage++) {
      let e = new AtlasEngine(stage);
      e.setMode(mode);
      assert(!e.finish());
      if (stage === 1) {
        assert(!e.depart("philly"));
        for (const state of ["New Jersey", "Pennsylvania", "Connecticut"])
          e.state(state);
        e.orient(3);
        e.plan("philly");
        e.plan("dc");
      }
      if (stage === 2) {
        while (e.target) {
          arrive(e, e.target);
          const id = e.radioTarget;
          assert.equal(e.location, id);
          assert(!e.signal("AFC", 70));
          assert(!e.place(id, { x: 0, y: 0 }));
          assert(e.place(id, project(city(id))));
          assert(!e.state("Alaska"));
          assert(e.state(city(id).state));
          assert(!e.signal(id === "dallas" ? "NFC" : "AFC", 10));
          assert(e.signal(id === "ny" ? "NFC" : city(id).conference, 70));
        }
      } else {
        assert(!e.depart("ny"));
        while (e.target) arrive(e, e.target);
      }
      if ([1, 3].includes(stage)) {
        if (stage === 3) {
          assert(!e.readyForDrive);
          e.orient(3);
          e.s.clock = 11;
        }
        assert(e.readyForDrive);
        const d = drive(e.veteran);
        assert(d.done);
        e.s.driveWon = d.done;
      }
      if ([4, 5].includes(stage)) {
        assert(e.readyForFootball);
        const f = football(e.veteran);
        e.s.footballWon = f.phase === "won";
      }
      assert(e.finish());
      store.saveAdventure("atlas", stage, e.export());
      assert(store.complete("atlas", stage, 1000));
      assert(store.complete("atlas", stage, 1000));
      store = createStore(storage);
      e = new AtlasEngine(stage, store.data.adventures.atlas[stage]);
      assert(e.s.won);
      assert.equal(e.s.mode, mode);
    }
    assert.equal(store.data.games.atlas.completed, 5);
    assert.deepEqual(totals(store.data), { rewards: 6, fragments: 1 });
    assert.equal(store.data.games.car.best, 1234);
  }
});
test("Rotta errata, viaggio intermedio e souvenir: nessuna ricompensa anticipata", () => {
  const e = new AtlasEngine(3);
  assert(!e.depart("miami"));
  assert(!e.finish());
  assert(e.depart("denver"));
  e.tick(0.05);
  assert.equal(e.location, "seattle");
  const restored = new AtlasEngine(3, e.export());
  assert.equal(restored.location, "seattle");
  arrive(restored, "denver");
  assert.deepEqual(restored.s.souvenirs, ["seattle", "denver"]);
  assert(!restored.finish());
});

test("Football: passaggi profondi premiano il tempismo e producono record distinti", () => {
  const quick = new FootballEngine(true),
    deep = new FootballEngine(true);
  for (const f of [quick, deep]) {
    f.position(0, 90);
    f.start();
  }
  quick.pass(0);
  for (let i = 0; i < 40; i++) deep.step(0.05);
  deep.pass(0);
  assert(deep.airYards > quick.airYards);
  for (const f of [quick, deep]) {
    for (let i = 0; i < 250 && !["won", "lost"].includes(f.phase); i++)
      f.step(0.05);
    assert.equal(f.phase, "won");
  }
});
