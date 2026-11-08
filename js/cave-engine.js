import {
  SYMBOLS,
  doorPuzzle,
  lightPuzzle,
  floorPuzzle,
  bridgePuzzle,
} from "./cave-data.js";
const copy = (x) => JSON.parse(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Directions E,S,W,N. At a slash E→N and S→W; at a backslash E→S and N→W.
export function traceBeam(puzzle, orientations) {
  let [x, y] = puzzle.source,
    dir = puzzle.dir;
  const points = [[x, y]],
    colors = [],
    seen = new Set();
  const delta = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  for (let steps = 0; steps < 1000; steps++) {
    const key = [x, y, dir].join(",");
    if (seen.has(key)) return { points, colors, sensor: false, stop: "loop" };
    seen.add(key);
    x += delta[dir][0];
    y += delta[dir][1];
    if (x < 0 || y < 0 || x >= puzzle.width || y >= puzzle.height)
      return { points, colors, sensor: false, stop: "edge" };
    points.push([x, y]);
    if (puzzle.walls.some((p) => p[0] === x && p[1] === y))
      return { points, colors, sensor: false, stop: "wall" };
    const crystal = puzzle.crystals.find((p) => p.x === x && p.y === y);
    if (crystal && !colors.includes(crystal.color)) colors.push(crystal.color);
    if (x === puzzle.sensor[0] && y === puzzle.sensor[1])
      return {
        points,
        colors,
        sensor: colors.length === puzzle.crystals.length,
        stop: "sensor",
      };
    const i = puzzle.mirrors.findIndex((p) => p.x === x && p.y === y);
    if (i >= 0)
      dir = orientations[i] === "/" ? [3, 2, 1, 0][dir] : [1, 0, 3, 2][dir];
  }
  return { points, colors, sensor: false, stop: "limit" };
}
export class CaveEngine {
  constructor(stage, saved = null, artifacts = {}) {
    this.stage = stage;
    this.artifacts = copy(artifacts);
    this.s = {
      mode: "explorer",
      seed: 0,
      zone: 0,
      moves: 0,
      errors: 0,
      clues: [],
      code: [],
      lightOn: false,
      mirrors: [],
      floorStep: 0,
      floorCheckpoint: 0,
      gearSlots: [],
      weights: [],
      lever: false,
      pulse: 0,
      opened: false,
      won: false,
      records: { explorer: 0, investigator: 0 },
      discovery: null,
      ...copy(saved || {}),
    };
    this.s.mode = this.s.mode === "investigator" ? "investigator" : "explorer";
    this.s.seed = Number.isInteger(this.s.seed)
      ? Math.abs(this.s.seed) % 10000
      : 0;
    this.s.zone = Number.isInteger(this.s.zone)
      ? Math.max(0, Math.min(2, this.s.zone))
      : 0;
    for (const key of ["clues", "code", "mirrors", "gearSlots", "weights"])
      if (!Array.isArray(this.s[key])) this.s[key] = [];
    this.s.records = { explorer: 0, investigator: 0, ...this.s.records };
    this.door = doorPuzzle(this.s.seed, this.hard);
    this.light = lightPuzzle(this.hard);
    this.floor = floorPuzzle(this.s.seed, this.hard);
    this.bridge = bridgePuzzle(this.hard);
    if (this.s.mirrors.length !== this.light.mirrors.length)
      this.s.mirrors = this.light.mirrors.map((m) =>
        m.goal === "/" ? "\\" : "/",
      );
    if (this.s.gearSlots.length !== this.bridge.teeth.length - 1)
      this.s.gearSlots = this.bridge.teeth.slice(1).map(() => null);
    if (this.s.weights.length !== this.bridge.targets.length)
      this.s.weights = this.bridge.targets.map(() => 0);
    this.message =
      "Ehy Amico! Osserva la grotta: qui ogni dettaglio racconta qualcosa.";
  }
  get hard() {
    return this.s.mode === "investigator";
  }
  restart(mode = this.s.mode) {
    return new CaveEngine(
      this.stage,
      {
        mode,
        seed: this.s.seed + 1,
        records: this.s.records,
        discovery: this.s.discovery,
      },
      this.artifacts,
    );
  }
  get codeAnswer() {
    if (this.stage === 1) return this.door.order;
    if (!this.hasArtifacts) return [];
    const a = this.artifacts[1].order,
      m = this.artifacts[3].motif;
    return this.hard
      ? [a[0], m[1], a.at(-1), m.at(-1)]
      : [a[0], m[1], a.at(-1)];
  }
  get hasArtifacts() {
    return [1, 2, 3, 4].every((n) => this.artifacts[n]);
  }
  get codeCorrect() {
    return (
      this.codeAnswer.length > 0 &&
      same(this.s.code, this.codeAnswer) &&
      (this.stage !== 1 || this.s.clues.length === 3)
    );
  }
  get beam() {
    return this.s.lightOn
      ? traceBeam(this.light, this.s.mirrors)
      : { points: [], colors: [], sensor: false, stop: "off" };
  }
  get pulseAnswer() {
    return this.hasArtifacts
      ? Array.from(
          { length: this.artifacts[4].gears },
          () => this.artifacts[2].colors,
        ).flat()
      : [];
  }
  get gearsWorking() {
    let teeth = this.bridge.teeth[0];
    for (let i = 0; i < this.s.gearSlots.length; i++) {
      const id = this.s.gearSlots[i];
      if (!Number.isInteger(id) || this.bridge.inventory[id] === undefined)
        return false;
      const next = this.bridge.inventory[id];
      if ((teeth + next) / 2 !== this.bridge.axes[i + 1] - this.bridge.axes[i])
        return false;
      teeth = next;
    }
    return new Set(this.s.gearSlots).size === this.s.gearSlots.length;
  }
  get transmission() {
    if (!this.gearsWorking || !this.s.lever) return 0;
    return (
      ((-1) ** this.s.gearSlots.length * this.bridge.teeth[0]) /
      this.bridge.inventory[this.s.gearSlots.at(-1)]
    );
  }
  get spareWeights() {
    return (
      this.bridge.targets.reduce((a, b) => a + b, 0) -
      this.s.weights.reduce((a, b) => a + b, 0)
    );
  }
  lift(i) {
    if (!this.transmission) return 0;
    const weight = this.s.weights[i],
      target = this.bridge.targets[i];
    return weight <= target ? weight / target : (target / weight) * 0.7;
  }
  get bridgeReady() {
    return (
      this.gearsWorking &&
      this.s.lever &&
      this.s.weights.every((w, i) => w === this.bridge.targets[i])
    );
  }
  get floorColumn() {
    return this.floor.path[this.s.floorStep];
  }
  moveZone(zone) {
    if (!Number.isInteger(zone) || zone < 0 || zone > 2 || this.s.won)
      return false;
    this.s.zone = zone;
    this.message = [
      "Guarda le pareti e cerca i dettagli luminosi.",
      "Gli oggetti evidenziati si possono manipolare.",
      "Osserva il passaggio: il meccanismo deve funzionare davvero.",
    ][zone];
    return true;
  }
  collect(index) {
    if (
      this.stage !== 1 ||
      index !== this.s.zone ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 2 ||
      this.s.won
    )
      return false;
    if (!this.s.clues.includes(index)) {
      this.s.clues.push(index);
      this.s.moves++;
    }
    this.message = "Indizio nel taccuino: " + this.door.clues[index];
    return true;
  }
  setSymbol(index, symbol) {
    if (
      ![1, 5].includes(this.stage) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.codeAnswer.length ||
      !SYMBOLS.includes(symbol) ||
      this.s.won
    )
      return false;
    this.s.code[index] = symbol;
    this.s.moves++;
    this.message = "Runa inserita. Confrontala con i calchi nel taccuino.";
    return true;
  }
  rotateMirror(index) {
    if (
      ![2, 5].includes(this.stage) ||
      !Number.isInteger(index) ||
      !this.light.mirrors[index] ||
      this.s.won
    )
      return false;
    if (this.s.zone !== 1) {
      this.message = "Raggiungi la galleria degli specchi.";
      return false;
    }
    if (this.stage === 5 && !this.codeCorrect) {
      this.message = "Prima ricomponi il codice delle rune.";
      return false;
    }
    this.s.mirrors[index] = this.s.mirrors[index] === "/" ? "\\" : "/";
    this.s.moves++;
    this.message = this.beam.sensor
      ? "Sensore acceso! Il percorso attraversa tutti i cristalli."
      : "Lo specchio cambia la direzione del raggio.";
    return true;
  }
  toggleLight() {
    if (![2, 5].includes(this.stage) || this.s.won) return false;
    if (this.stage === 5 && !this.codeCorrect) {
      this.message = "Il prisma attende il codice delle rune.";
      return false;
    }
    this.s.lightOn = !this.s.lightOn;
    this.s.moves++;
    this.message = this.beam.sensor
      ? "Il sensore e tutti i cristalli brillano!"
      : "La luce prosegue in linea retta e rimbalza sugli specchi.";
    return true;
  }
  stepFloor(col) {
    if (
      this.stage !== 3 ||
      this.s.zone !== 1 ||
      this.s.won ||
      this.s.floorStep >= this.floor.rows - 1 ||
      !Number.isInteger(col) ||
      col < 0 ||
      col >= this.floor.cols
    )
      return false;
    const step = this.s.floorStep + 1;
    if (Math.abs(col - this.floorColumn) > 1) {
      this.message =
        "Una piastrella alla volta: scegli una vicina nella riga successiva.";
      return false;
    }
    this.s.moves++;
    const target = this.floor.motif[(step - 1) % this.floor.motif.length];
    if (this.floor.tiles[step - 1][col] !== target) {
      this.s.errors++;
      this.s.floorStep = this.s.floorCheckpoint;
      this.message =
        "La pietra ti riporta al checkpoint. Nessun indizio è perso: riprendi il ritmo.";
      return false;
    }
    this.s.floorStep = step;
    if (step === 3) this.s.floorCheckpoint = step;
    this.message =
      step === this.floor.rows - 1
        ? "Sala attraversata! Raggiungi l’uscita."
        : "Passo sicuro. Il motivo si ripete: quale simbolo viene ora?";
    return true;
  }
  placeGear(slot, id) {
    if (
      this.stage !== 4 ||
      this.s.zone !== 0 ||
      this.s.won ||
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= this.s.gearSlots.length ||
      !Number.isInteger(id) ||
      id < 0 ||
      id >= this.bridge.inventory.length
    )
      return false;
    const old = this.s.gearSlots.indexOf(id);
    if (old >= 0) this.s.gearSlots[old] = null;
    this.s.gearSlots[slot] = id;
    this.s.moves++;
    this.message = this.gearsWorking
      ? "I denti combaciano: la trasmissione è collegata."
      : "Confronta denti, dimensioni e distanza tra gli assi.";
    return true;
  }
  weight(index, delta) {
    if (
      this.stage !== 4 ||
      this.s.zone !== 1 ||
      this.s.won ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.s.weights.length ||
      ![1, -1].includes(delta) ||
      this.s.weights[index] + delta < 0 ||
      (delta > 0 && this.spareWeights <= 0)
    )
      return false;
    this.s.weights[index] += delta;
    this.s.moves++;
    this.message =
      this.s.weights[index] > this.bridge.targets[index]
        ? "Troppo peso: l’argano si inclina. Sposta una pietra su un altro contrappeso."
        : "La pietra cambia il contrappeso di questa sezione.";
    return true;
  }
  toggleLever() {
    if (this.stage !== 4 || this.s.won) return false;
    this.s.lever = !this.s.lever;
    this.s.moves++;
    this.message = this.transmission
      ? "La leva avvia le ruote: ora gli argani possono sollevare il ponte."
      : "La leva muove il primo asse. Senza ruote collegate il moto non arriva agli argani.";
    return true;
  }
  pulse(color) {
    if (
      this.stage !== 5 ||
      this.s.zone !== 2 ||
      !this.codeCorrect ||
      !this.beam.sensor ||
      !this.pulseAnswer.length ||
      this.s.won
    )
      return false;
    this.s.moves++;
    if (color !== this.pulseAnswer[this.s.pulse]) {
      this.s.pulse = 0;
      this.s.errors++;
      this.message =
        "Il tempio torna in ascolto. Rileggi l’ordine dei cristalli e il numero di ruote del ponte.";
      return false;
    }
    this.s.pulse++;
    this.message =
      this.s.pulse === this.pulseAnswer.length
        ? "Il cuore della montagna risponde! Puoi aprire il santuario."
        : "Una nota luminosa è al posto giusto.";
    return true;
  }
  advance() {
    if (this.s.won) return false;
    const valid =
      this.stage === 1
        ? this.s.zone === 2 && this.codeCorrect
        : this.stage === 2
          ? this.s.zone === 2 && this.beam.sensor
          : this.stage === 3
            ? this.s.zone === 2 && this.s.floorStep === this.floor.rows - 1
            : this.stage === 4
              ? this.s.zone === 2 && this.bridgeReady
              : this.s.zone === 2 &&
                this.codeCorrect &&
                this.beam.sensor &&
                this.s.pulse === this.pulseAnswer.length &&
                this.hasArtifacts;
    if (!valid) {
      this.s.errors++;
      this.message =
        "Il passaggio è ancora chiuso. Controlla gli indizi e osserva ciò che non si è attivato.";
      return false;
    }
    if (this.stage === 5 && !this.s.opened) {
      this.s.opened = true;
      this.message =
        "Il santuario è aperto. Avvicinati al cuore luminoso e raccogli il tesoro.";
      return true;
    }
    return this.win();
  }
  win() {
    if (this.s.won) return false;
    this.s.won = true;
    this.s.opened = true;
    this.s.discovery =
      this.stage === 1
        ? { order: [...this.door.order] }
        : this.stage === 2
          ? { colors: [...this.beam.colors] }
          : this.stage === 3
            ? { motif: [...this.floor.motif] }
            : this.stage === 4
              ? { gears: this.s.gearSlots.length }
              : { sanctuary: true };
    const score = Math.max(
      100,
      2000 + (this.hard ? 500 : 0) - this.s.moves * 5 - this.s.errors * 25,
    );
    this.s.records[this.s.mode] = Math.max(this.s.records[this.s.mode], score);
    this.message =
      this.stage === 5
        ? "Ehy Amico! Hai risolto tutti gli enigmi della montagna! Io ero ancora fermo al primo lucchetto… e avevo pure perso la chiave!"
        : "Il passaggio si apre! Una nuova scoperta è nel diario.";
    return true;
  }
  export() {
    return copy(this.s);
  }
}
