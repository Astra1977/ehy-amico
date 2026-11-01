import { GAMES, gameById } from "./catalog.js";
export const KEY = "ehy-amico:progress";
export const BACKUP = KEY + ":backup";
export const defaults = () => ({
  version: 2,
  adventures: { jurassic: {}, time: {} },
  games: Object.fromEntries(
    GAMES.map((g) => [g.id, { completed: 0, best: 0 }]),
  ),
  settings: { sound: false, difficulty: 0 },
  visited: [],
});
export function normalize(raw) {
  const out = defaults();
  if (!raw || typeof raw !== "object") return out;
  if (raw.version > 2)
    throw new Error(
      "Salvataggio di una versione più recente: aggiornare l’app.",
    );
  const bound = (n, max) =>
    Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
  for (const g of GAMES) {
    const v = raw.games?.[g.id];
    out.games[g.id] = {
      completed: bound(v?.completed, 5),
      best: bound(v?.best, Number.MAX_SAFE_INTEGER),
    };
  }
  for (const id of ["jurassic", "time"])
    for (let stage = 1; stage <= 5; stage++) {
      const value = raw.adventures?.[id]?.[stage];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const text = JSON.stringify(value);
        if (text.length < 32000) out.adventures[id][stage] = JSON.parse(text);
      }
    }
  out.settings = {
    sound: raw.settings?.sound === true,
    difficulty: bound(raw.settings?.difficulty, 2),
  };
  out.visited = Array.isArray(raw.visited)
    ? [...new Set(raw.visited.filter((id) => gameById(id)))]
    : [];
  return out;
}
export function totals(data) {
  const values = Object.values(data.games);
  return {
    rewards: values.reduce((sum, g) => sum + g.completed, 0),
    fragments: values.filter((g) => g.completed === 5).length,
  };
}
export function complete(data, id, mission, score = 0) {
  if (
    !gameById(id) ||
    !Number.isInteger(mission) ||
    mission < 1 ||
    mission > 5 ||
    !Number.isFinite(score) ||
    score < 0
  )
    return false;
  const game = data.games[id];
  if (mission > game.completed + 1) return false;
  game.completed = Math.max(game.completed, mission);
  game.best = Math.max(game.best, score);
  return true;
}
export function createStore(storage) {
  let data = defaults(),
    warning = "",
    locked = false;
  try {
    const raw = storage.getItem(KEY);
    if (raw !== null) {
      try {
        data = normalize(JSON.parse(raw));
      } catch (e) {
        if (e.message.includes("più recente")) {
          locked = true;
          warning = e.message;
        } else {
          const backup = storage.getItem(BACKUP);
          if (backup) {
            data = normalize(JSON.parse(backup));
            warning = "Recuperato il salvataggio di sicurezza.";
          } else {
            locked = true;
            warning =
              "Salvataggio non leggibile: conservato senza sovrascriverlo.";
          }
        }
      }
    }
  } catch {
    warning =
      "Salvataggi non disponibili: i progressi restano solo in questa sessione.";
  }
  return {
    get data() {
      return data;
    },
    get warning() {
      return warning;
    },
    save() {
      if (locked) return false;
      try {
        const previous = storage.getItem(KEY);
        if (previous !== null) storage.setItem(BACKUP, previous);
        storage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch {
        warning =
          "Spazio non disponibile: i progressi restano solo in questa sessione.";
        return false;
      }
    },
    visit(id) {
      if (gameById(id) && !data.visited.includes(id)) {
        data.visited.push(id);
        this.save();
      }
    },
    saveAdventure(id, stage, value) {
      if (
        locked ||
        !["jurassic", "time"].includes(id) ||
        !Number.isInteger(stage) ||
        stage < 1 ||
        stage > 5
      )
        return false;
      const text = JSON.stringify(value);
      if (text.length > 32000) return false;
      data.adventures[id][stage] = JSON.parse(text);
      return this.save();
    },
    complete(id, mission, score) {
      if (locked) return false;
      const ok = complete(data, id, mission, score);
      if (ok) this.save();
      return ok;
    },
  };
}
