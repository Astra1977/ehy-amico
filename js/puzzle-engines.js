// Adattati da createMaze/maze (exploration.js) e memory (challenges.js) del sorgente verificato.
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function createMaze(size, random = Math.random) {
  const map = Array.from({ length: size }, () => Array(size).fill("#"));
  const inside = (x, y) => x > 0 && y > 0 && x < size - 1 && y < size - 1;
  const carve = (x, y) => {
    map[y][x] = ".";
    for (const [dx, dy] of shuffle(
      [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ],
      random,
    )) {
      const nx = x + dx,
        ny = y + dy;
      if (inside(nx, ny) && map[ny][nx] === "#") {
        map[y + dy / 2][x + dx / 2] = ".";
        carve(nx, ny);
      }
    }
  };
  carve(1, 1);
  map[size - 2][size - 2] = "E";
  return map;
}
export class MazeEngine {
  constructor(stage = 1, difficulty = 0, random = Math.random) {
    this.stage = stage;
    this.size = 7 + stage * 2 + difficulty * 2;
    this.map = createMaze(this.size, random);
    this.x = 1;
    this.y = 1;
    this.moves = 0;
    this.blocked = 0;
    this.time = 0;
    this.state = "playing";
    this.points = 0;
  }
  move(dx, dy) {
    if (
      this.state !== "playing" ||
      !Number.isInteger(dx) ||
      !Number.isInteger(dy) ||
      Math.abs(dx) + Math.abs(dy) !== 1
    )
      return false;
    const x = this.x + dx,
      y = this.y + dy;
    if (!this.map[y] || !this.map[y][x] || this.map[y][x] === "#") {
      this.blocked++;
      return false;
    }
    this.x = x;
    this.y = y;
    this.moves++;
    if (this.map[y][x] === "E") {
      this.state = "won";
      this.points = Math.max(20, this.stage * 300 - this.moves * 2);
    }
    return true;
  }
  tick(dt) {
    if (this.state === "playing") this.time += dt;
  }
}
export const MEMORY_PAIRS = [4, 6, 8, 10, 12];
export class MemoryEngine {
  constructor(stage = 1, difficulty = 0, random = Math.random) {
    this.stage = stage;
    this.pairs = MEMORY_PAIRS[stage - 1];
    this.cards = shuffle(
      shuffle(
        Array.from({ length: 12 }, (_, i) => i),
        random,
      )
        .slice(0, this.pairs)
        .flatMap((symbol) => [symbol, symbol]),
      random,
    ).map((symbol) => ({ symbol, face: false, matched: false }));
    this.open = [];
    this.moves = 0;
    this.matched = 0;
    this.wait = 0;
    this.time = 0;
    this.state = "playing";
    this.points = 0;
    this.delay = [0.95, 0.75, 0.55][difficulty];
  }
  flip(index) {
    const card = this.cards[index];
    if (
      this.state !== "playing" ||
      this.wait > 0 ||
      !card ||
      card.face ||
      card.matched
    )
      return false;
    card.face = true;
    this.open.push(index);
    if (this.open.length === 2) {
      this.moves++;
      const [a, b] = this.open.map((i) => this.cards[i]);
      if (a.symbol === b.symbol) {
        a.matched = b.matched = true;
        this.matched++;
        this.open = [];
        if (this.matched === this.pairs) {
          this.state = "won";
          this.points = Math.max(1, this.stage * 300 - this.moves * 3);
        }
      } else this.wait = this.delay;
    }
    return true;
  }
  tick(dt) {
    if (this.state !== "playing") return;
    this.time += dt;
    if (this.wait > 0) {
      this.wait = Math.max(0, this.wait - dt);
      if (this.wait === 0) {
        for (const i of this.open) this.cards[i].face = false;
        this.open = [];
      }
    }
  }
}
