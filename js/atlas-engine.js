import { ROUTES, RADIO_CITIES, city, project } from "./atlas-data.js";
const copy = (x) => JSON.parse(JSON.stringify(x));
export class AtlasEngine {
  constructor(stage = 1, saved = null) {
    this.stage = stage;
    this.s = {
      mode: "explorer",
      routeIndex: 0,
      compass: 0,
      plan: [],
      neighbors: [],
      signals: [],
      souvenirs: [],
      placed: [],
      associated: [],
      clock: 12,
      driveWon: false,
      footballWon: false,
      formation: false,
      records: { explorer: 0, veteran: 0 },
      won: false,
      ...copy(saved || {}),
    };
    this.s.mode = this.s.mode === "veteran" ? "veteran" : "explorer";
    this.s.routeIndex = Math.max(
      0,
      Math.min(
        this.route.length - 1,
        Number.isInteger(this.s.routeIndex) ? this.s.routeIndex : 0,
      ),
    );
    for (const key of [
      "plan",
      "neighbors",
      "signals",
      "souvenirs",
      "placed",
      "associated",
    ])
      if (!Array.isArray(this.s[key])) this.s[key] = [];
    this.s.records = { explorer: 0, veteran: 0, ...this.s.records };
    this.collect(this.location);
    this.travel = null;
    this.message = "Ehy Amico! La strada si scopre una tappa alla volta.";
  }
  get route() {
    return this.stage === 3 && this.veteran
      ? ["seattle", "kc", "denver", "abq", "flagstaff"]
      : ROUTES[this.stage - 1];
  }
  get location() {
    return this.route[Math.min(this.s.routeIndex, this.route.length - 1)];
  }
  get target() {
    return this.route[this.s.routeIndex + 1];
  }
  get veteran() {
    return this.s.mode === "veteran";
  }
  get radioTarget() {
    return RADIO_CITIES.find((id) => !this.s.signals.includes(id));
  }
  get prepared() {
    return (
      this.stage !== 1 ||
      (this.s.plan.join(",") === "philly,dc" &&
        this.s.compass === 3 &&
        ["New Jersey", "Pennsylvania", "Connecticut"].every((n) =>
          this.s.neighbors.includes(n),
        ))
    );
  }
  plan(id) {
    if (this.stage !== 1 || this.s.routeIndex > 0) return false;
    if (id === "clear") {
      this.s.plan = [];
      return true;
    }
    if (
      this.s.plan.length < 2 &&
      ["philly", "dc"].includes(id) &&
      !this.s.plan.includes(id)
    )
      this.s.plan.push(id);
    this.message =
      this.s.plan.length === 2
        ? this.s.plan.join(",") === "philly,dc"
          ? "Itinerario pronto! Prima Philadelphia, poi Washington."
          : "Controlla la mappa: Philadelphia si trova tra New York e Washington. Riordina le tappe."
        : "Aggiungi la seconda tappa al navigatore.";
    return true;
  }
  setMode(mode) {
    if (
      this.s.routeIndex === 0 &&
      !this.travel &&
      ["explorer", "veteran"].includes(mode)
    )
      this.s.mode = mode;
  }
  state(name) {
    if (
      this.stage === 1 &&
      ["New Jersey", "Pennsylvania", "Connecticut"].includes(name)
    ) {
      if (!this.s.neighbors.includes(name)) this.s.neighbors.push(name);
      this.message = "Confine trovato! " + name;
      return true;
    }
    if (
      this.stage === 2 &&
      this.s.placed.includes(this.radioTarget) &&
      name === city(this.radioTarget).state
    ) {
      if (!this.s.associated.includes(this.radioTarget))
        this.s.associated.push(this.radioTarget);
      this.message = name + ": collegamento geografico riuscito.";
      return true;
    }
    this.message = "Osserva i confini e segui l’indizio dello Zio.";
    return false;
  }
  orient(delta) {
    this.s.compass = (this.s.compass + delta + 4) % 4;
  }
  place(id, p) {
    if (this.stage !== 2 || id !== this.radioTarget || this.location !== id)
      return false;
    const q = project(city(id));
    if (Math.hypot(p.x - q.x, p.y - q.y) > (this.veteran ? 20 : 38)) {
      this.message =
        "Segnale lontano: sposta il segnaposto verso " + city(id).name + ".";
      return false;
    }
    if (!this.s.placed.includes(id)) this.s.placed.push(id);
    this.message = "Città localizzata. Ora tocca il suo Stato.";
    return true;
  }
  signal(conference, tuning) {
    const id = this.radioTarget;
    if (!id || this.location !== id || !this.s.associated.includes(id))
      return false;
    const expected = id === "ny" ? "NFC" : city(id).conference;
    if (
      conference !== expected ||
      Math.abs(tuning - 70) > (this.veteran ? 3 : 9)
    ) {
      this.message =
        "Sintonizza sul faro 70 e porta la scheda nella conference giusta.";
      return false;
    }
    this.s.signals.push(id);
    this.collect(id);
    this.message =
      "Segnale recuperato! AFC e NFC sono le due conference della NFL.";
    return true;
  }
  collect(id) {
    if (!this.s.souvenirs.includes(id)) this.s.souvenirs.push(id);
  }
  depart(id) {
    if (this.s.won || this.travel) return false;
    if (!this.prepared) {
      this.message =
        "Prima della partenza: pianifica le due tappe, trova i vicini di New York e orienta la bussola a ovest.";
      return false;
    }
    if (
      this.stage === 2 &&
      RADIO_CITIES.includes(this.location) &&
      !this.s.signals.includes(this.location)
    ) {
      this.message = "Recupera il segnale radio prima di ripartire.";
      return false;
    }
    if (id !== this.target) {
      this.message =
        "Rotta fuori itinerario. La prossima tappa è " +
        (city(this.target)?.name || "qui") +
        ".";
      return false;
    }
    this.travel = { from: this.location, to: id, t: 0 };
    return true;
  }
  tick(dt) {
    if (!this.travel) return false;
    this.travel.t += Math.min(dt, 0.05) / 1.3;
    if (this.travel.t >= 1) {
      this.s.routeIndex++;
      this.collect(this.location);
      this.travel = null;
      this.message =
        "Benvenuto a " +
        city(this.location).name +
        "! " +
        city(this.location).fact;
      return true;
    }
    return false;
  }
  get arrived() {
    return this.s.routeIndex === this.route.length - 1;
  }
  get readyForDrive() {
    return (
      this.arrived &&
      [1, 3].includes(this.stage) &&
      (this.stage !== 3 || (this.s.compass === 3 && this.s.clock === 11))
    );
  }
  get readyForFootball() {
    return [4, 5].includes(this.stage) && this.arrived;
  }
  finish() {
    const ok =
      this.stage === 1
        ? this.arrived && this.prepared && this.s.driveWon
        : this.stage === 2
          ? this.arrived && this.s.signals.length === 6
          : this.stage === 3
            ? this.readyForDrive && this.s.driveWon
            : this.readyForFootball && this.s.footballWon;
    if (ok) {
      this.s.won = true;
      this.s.records[this.s.mode] = Math.max(this.s.records[this.s.mode], 1000);
      return true;
    }
    return false;
  }
  export() {
    return copy(this.s);
  }
}
export class DriveEngine {
  constructor(veteran = false, saved = null) {
    this.veteran = veteran;
    Object.assign(
      this,
      {
        x: 0.5,
        distance: 0,
        fuel: 65,
        pickups: 0,
        hits: 0,
        items: [],
        spawn: 0,
        done: false,
        failed: false,
        serial: 0,
      },
      copy(saved || {}),
    );
  }
  step(dt, steer) {
    if (this.done || this.failed) return;
    dt = Math.min(0.05, dt);
    this.x = Math.max(0.1, Math.min(0.9, this.x + steer * dt * 0.8));
    this.distance += dt * (this.veteran ? 38 : 30);
    this.fuel -= dt * 1.1;
    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.spawn = 1.5;
      const lane = [0.2, 0.5, 0.8][this.serial % 3];
      this.items.push({ x: lane, y: -0.1, fuel: this.serial % 2 === 0 });
      this.serial++;
    }
    for (const item of this.items) {
      const before = item.y;
      item.y += dt * 0.42;
      if (
        before < 0.82 &&
        item.y >= 0.82 &&
        Math.abs(item.x - this.x) < (this.veteran ? 0.14 : 0.12)
      ) {
        if (item.fuel) {
          this.fuel = Math.min(100, this.fuel + 22);
          this.pickups++;
        } else {
          this.hits++;
          this.fuel -= 10;
          this.distance = Math.max(0, this.distance - 22);
        }
        item.y = 2;
      }
    }
    this.items = this.items.filter((i) => i.y < 1.2);
    this.failed = this.fuel <= 0;
    this.done = this.distance >= 1000 && this.pickups >= 3 && !this.failed;
  }
  export() {
    return copy(
      Object.fromEntries(Object.entries(this).filter(([k]) => k !== "veteran")),
    );
  }
}
export class FootballEngine {
  constructor(veteran = false, final = false) {
    this.veteran = veteran;
    this.final = final;
    this.reset();
  }
  reset() {
    this.phase = "setup";
    this.t = 0;
    this.ball = null;
    this.receiver = null;
    this.yards = 0;
    this.qb = { x: 50, y: 87 };
    this.receivers = [
      { x: 22, y: 78, route: "straight" },
      { x: 78, y: 78, route: "cross" },
    ];
    this.defenders = (
      this.veteran
        ? [
            { x: 43, y: 50 },
            { x: 58, y: 35 },
            { x: 30, y: 22 },
          ]
        : [{ x: 50, y: 40 }]
    ).map((p) => ({ ...p }));
    this.message =
      "Posiziona QB e ricevitori, scegli le traiettorie, poi avvia.";
  }
  position(index, x) {
    if (this.phase !== "setup") return;
    const p = index === -1 ? this.qb : this.receivers[index];
    if (p) p.x = Math.max(10, Math.min(90, x));
  }
  route(index) {
    if (this.phase === "setup")
      this.receivers[index].route =
        this.receivers[index].route === "straight" ? "cross" : "straight";
  }
  start() {
    if (this.phase !== "setup") return false;
    this.phase = "running";
    return true;
  }
  pass(index) {
    if (this.phase !== "running" || this.ball) return false;
    const r = this.receivers[index];
    if (!r) return false;
    this.receiver = index;
    this.ball = { x: this.qb.x, y: this.qb.y };
    return true;
  }
  step(dt) {
    if (!["running", "flight", "caught"].includes(this.phase)) return;
    dt = Math.min(0.05, dt);
    this.t += dt;
    for (const [i, r] of this.receivers.entries()) {
      r.y = Math.max(5, r.y - dt * (this.veteran ? 8 : 10));
      if (r.route === "cross")
        r.x = Math.max(9, Math.min(91, r.x + dt * (i === 0 ? 5 : -5)));
    }
    const target =
      this.receiver === null ? this.qb : this.receivers[this.receiver];
    for (const d of this.defenders) {
      const dx = target.x - d.x,
        dy = target.y - d.y,
        n = Math.hypot(dx, dy) || 1;
      const speed = this.veteran ? 7 : 4;
      d.x += (dx / n) * dt * speed;
      d.y += (dy / n) * dt * speed;
      if (
        this.ball &&
        Math.hypot(d.x - this.ball.x, d.y - this.ball.y) <
          (this.veteran ? 4 : 3)
      ) {
        this.phase = "lost";
        this.message =
          "Intercetto! Allarga la formazione o anticipa il passaggio.";
        return;
      }
      if (
        this.phase === "caught" &&
        Math.hypot(d.x - target.x, d.y - target.y) < 4
      ) {
        this.phase = "lost";
        this.message = "Placcaggio! Prova la traiettoria esterna.";
        return;
      }
    }
    if (this.ball && this.phase !== "caught") {
      this.phase = "flight";
      const dx = target.x - this.ball.x,
        dy = target.y - this.ball.y,
        n = Math.hypot(dx, dy);
      const speed = dt * 65;
      if (n <= speed) {
        this.phase = "caught";
        this.message = "Ricezione! Corri verso la zona blu.";
        this.ball = { x: target.x, y: target.y };
      } else {
        this.ball.x += (dx / n) * speed;
        this.ball.y += (dy / n) * speed;
      }
    }
    if (this.phase === "caught") {
      this.ball = { x: target.x, y: target.y };
      this.yards = Math.round(87 - target.y);
      if (target.y <= 7) {
        this.phase = "won";
        this.message = "TOUCHDOWN! " + this.yards + " yard di gioco.";
      }
    }
    if (this.t > 11 && this.phase === "running") {
      this.phase = "lost";
      this.message =
        "La difesa chiude lo spazio: scegli un ricevitore e passa.";
    }
  }
}
