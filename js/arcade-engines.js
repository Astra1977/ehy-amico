// Adattamento delle regole di roach e del ramo runner del progetto sorgente.
export const ROACH_GOALS = [8, 12, 16, 20, 24];
export const RUNNER_DURATIONS = [12, 18, 24, 30, 36];
export const TETRIS_GOALS = [10, 20, 30, 40, 50];
export class RoachEngine {
  constructor(stage = 1, difficulty = 0, random = Math.random) {
    Object.assign(this, {
      stage,
      difficulty,
      random,
      time: 0,
      spawnAt: 0,
      points: 0,
      captures: 0,
      errors: 0,
      combo: 0,
      defeated: 0,
      targets: [],
      serial: 0,
      state: "playing",
    });
    this.spawn();
  }
  spawn() {
    const boss = this.targets.some((t) => t.type === "boss");
    const roll = this.random();
    const type =
      !boss &&
      ((this.stage === 5 && this.defeated === 0 && this.serial === 0) ||
        roll < 0.22)
        ? "boss"
        : roll < 0.49
          ? "decoy"
          : "roach";
    this.targets.push({
      id: ++this.serial,
      type,
      hp: type === "boss" ? 5 : 1,
      x: 14 + this.random() * 72,
      y: 16 + this.random() * 65,
      penalty: type === "decoy" ? (this.random() < 1 / 3 ? 30 : 15) : 0,
      life:
        Math.max(0.65, 1.4 - this.time * 0.018) * (1 - this.difficulty * 0.1),
    });
    this.spawnAt = this.time + 0.6 - this.difficulty * 0.05;
  }
  hit(id) {
    if (this.state !== "playing") return false;
    const t = this.targets.find((t) => t.id === id);
    if (!t) return false;
    if (t.type === "decoy") {
      this.errors++;
      this.points = Math.max(0, this.points - (t.penalty || 15) * this.stage);
      this.combo = 0;
    } else if (t.type === "boss") {
      t.hp--;
      this.combo++;
      this.points += 10;
      if (t.hp === 0) {
        this.points += 100;
        this.defeated++;
        this.captures++;
      }
    } else {
      t.hp = 0;
      this.captures++;
      this.combo++;
      this.points += 10 + Math.min(20, Math.floor(this.combo / 3) * 5);
    }
    if (t.type === "decoy" || t.hp === 0)
      this.targets = this.targets.filter((o) => o !== t);
    return true;
  }
  tick(dt) {
    if (this.state !== "playing") return;
    this.time = Math.min(35, this.time + dt);
    for (const t of this.targets) if (t.type !== "boss") t.life -= dt;
    this.targets = this.targets.filter((t) => t.type === "boss" || t.life > 0);
    if (this.time >= 35) {
      this.state =
        this.captures >= ROACH_GOALS[this.stage - 1] &&
        this.errors <= 5 - this.stage &&
        (this.stage < 5 || this.defeated > 0)
          ? "won"
          : "over";
      this.targets = [];
      return;
    }
    if (this.time >= this.spawnAt) this.spawn();
  }
}
export class RunnerEngine {
  constructor(stage = 1, difficulty = 0, random = Math.random) {
    Object.assign(this, {
      stage,
      difficulty,
      random,
      time: 0,
      spawnAt: 1,
      points: 0,
      jumpTime: Infinity,
      obstacles: [],
      state: "playing",
      serial: 0,
      width: 900,
    });
  }
  get lift() {
    return this.jumpTime < 0.72
      ? Math.sin((Math.PI * this.jumpTime) / 0.72) * 125
      : 0;
  }
  get speed() {
    return (
      160 +
      this.stage * 15 +
      Math.min(170, this.time * 3) +
      this.difficulty * 20
    );
  }
  jump() {
    if (this.state !== "playing" || this.jumpTime < 0.5) return false;
    this.jumpTime = 0;
    return true;
  }
  tick(dt) {
    if (this.state !== "playing") return;
    this.time += dt;
    this.jumpTime += dt;
    if (this.time >= this.spawnAt) {
      const size = [32, 45, 60, 75][Math.floor(this.random() * 4)];
      this.obstacles.push({
        id: ++this.serial,
        x: this.width + 30,
        size,
        passed: false,
      });
      this.spawnAt =
        this.time +
        (0.85 + this.random() * 0.7) * Math.max(0.65, 1 - this.time / 180);
    }
    const heroX = this.width * 0.12 + 40;
    for (const o of this.obstacles) {
      o.x -= this.speed * dt;
      if (
        Math.abs(o.x - heroX) < o.size * 0.28 + 18 &&
        this.lift < o.size * 0.7
      ) {
        this.state = "over";
        return;
      }
      if (!o.passed && o.x < heroX - 45) {
        o.passed = true;
        this.points += Math.round(o.size / 10);
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x >= -90);
    if (this.time >= RUNNER_DURATIONS[this.stage - 1]) this.state = "won";
  }
}
