import { timeTasks, TIME_DESTINATIONS } from "./education-data.js";
const integer = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
const copy = (value) => JSON.parse(JSON.stringify(value));
export function initialTask(task) {
  if (task.type === "circuit") return { slots: task.signs.map(() => null) };
  if (task.type === "groups") return { groups: [] };
  if (task.type === "tank") return { level: task.start || 0 };
  if (task.type === "clock") return { minutes: task.start };
  if (task.type === "order") return { slots: task.values.map(() => null) };
  return { x: task.start[0], y: task.start[1] };
}
export function validTaskState(task, state) {
  if (!state || typeof state !== "object") return false;
  if (task.type === "circuit" || task.type === "order") {
    const values = task.values,
      slots = state.slots;
    if (
      !Array.isArray(slots) ||
      slots.length !== (task.signs?.length || values.length)
    )
      return false;
    const ids = slots.filter((v) => v !== null);
    return (
      ids.every((v) => integer(v, values.length - 1)) &&
      new Set(ids).size === ids.length
    );
  }
  if (task.type === "groups")
    return (
      Array.isArray(state.groups) &&
      state.groups.length <= 8 &&
      state.groups.every((n) => integer(n, 10)) &&
      state.groups.reduce((a, b) => a + b, 0) <= task.total
    );
  if (task.type === "tank")
    return integer(state.level, task.capacity) && state.level % 250 === 0;
  if (task.type === "clock") return integer(state.minutes, 1439);
  return integer(state.x, task.size - 1) && integer(state.y, task.size - 1);
}
export function taskValue(task, state) {
  if (!validTaskState(task, state)) return 0;
  if (task.type === "circuit")
    return state.slots.reduce(
      (sum, id, i) => sum + (id === null ? 0 : task.values[id] * task.signs[i]),
      0,
    );
  if (task.type === "groups") return state.groups.reduce((a, b) => a + b, 0);
  if (task.type === "tank") return state.level;
  if (task.type === "clock") return state.minutes;
  return 0;
}
export function validateTask(task, state) {
  if (!validTaskState(task, state)) return false;
  switch (task.type) {
    case "circuit":
      return (
        state.slots.every((n) => n !== null) &&
        taskValue(task, state) === task.target
      );
    case "groups":
      return (
        state.groups.length >= 2 &&
        (!task.count || state.groups.length === task.count) &&
        state.groups.every((n) => n >= 2 && n === state.groups[0]) &&
        taskValue(task, state) === task.total
      );
    case "tank":
      return state.level === task.target;
    case "clock":
      return state.minutes === task.target;
    case "order":
      return (
        state.slots.every((n) => n !== null) &&
        state.slots.every(
          (n, i) => i === 0 || task.values[state.slots[i - 1]] < task.values[n],
        )
      );
    case "coords":
      return state.x === task.target[0] && state.y === task.target[1];
    default:
      return false;
  }
}
export class TimeEngine {
  constructor(stage = 1, difficulty = 0, saved = null) {
    this.stage = stage;
    const valid =
      saved?.stage === stage && !saved.done && integer(saved.difficulty, 2);
    this.difficulty = valid ? saved.difficulty : difficulty;
    this.tasks = timeTasks(stage, this.difficulty);
    this.history = [];
    if (valid && Array.isArray(saved.history))
      for (
        let i = 0;
        i < Math.min(saved.history.length, this.tasks.length);
        i++
      ) {
        if (!validateTask(this.tasks[i], saved.history[i])) break;
        this.history.push(copy(saved.history[i]));
      }
    this.index = this.history.length;
    this.current = this.task
      ? valid && validTaskState(this.task, saved.current)
        ? copy(saved.current)
        : initialTask(this.task)
      : null;
    this.errors = valid && integer(saved.errors, 999) ? saved.errors : 0;
    this.done = false;
    this.feedback =
      "Costruisci la soluzione con i comandi: il motore aspetta te!";
    this.hintLevel = 0;
    this.hintTask = -1;
  }
  get task() {
    return this.tasks[this.index] || null;
  }
  connect(item, slot) {
    const t = this.task,
      s = this.current;
    if (
      !t ||
      !["circuit", "order"].includes(t.type) ||
      !integer(item, t.values.length - 1) ||
      !integer(slot, s.slots.length - 1)
    )
      return false;
    const old = s.slots.indexOf(item);
    if (old >= 0) s.slots[old] = null;
    s.slots[slot] = item;
    this.feedback = "Collegamento inserito. Osserva come cambia il cruscotto.";
    return true;
  }
  remove(slot) {
    if (!this.current?.slots || !integer(slot, this.current.slots.length - 1))
      return false;
    this.current.slots[slot] = null;
    return true;
  }
  group(action, index) {
    if (this.task?.type !== "groups") return false;
    const g = this.current.groups;
    if (action === "new" && g.length < 8) g.push(0);
    else if (action === "remove" && g.length) g.pop();
    else if (
      action === "add" &&
      integer(index, g.length - 1) &&
      taskValue(this.task, this.current) < this.task.total &&
      g[index] < 10
    )
      g[index]++;
    else if (action === "take" && integer(index, g.length - 1) && g[index] > 0)
      g[index]--;
    else return false;
    this.feedback = "Ogni cristallo conta: confronta le ruote.";
    return true;
  }
  pour(amount) {
    if (this.task?.type !== "tank" || ![250, 500, -250, -500].includes(amount))
      return false;
    const next = this.current.level + amount;
    if (next < 0 || next > this.task.capacity) {
      this.feedback =
        "Il serbatoio non può andare oltre le tacche. Puoi svuotare e riprovare.";
      return false;
    }
    this.current.level = next;
    this.feedback = "Il livello si muove: leggi la tacca in millilitri.";
    return true;
  }
  turn(minutes) {
    if (this.task?.type !== "clock" || ![-60, -5, 5, 60].includes(minutes))
      return false;
    this.current.minutes = (this.current.minutes + minutes + 1440) % 1440;
    this.feedback = "Lancette in movimento: leggi ora e minuti.";
    return true;
  }
  move(dx, dy) {
    if (
      this.task?.type !== "coords" ||
      !Number.isInteger(dx) ||
      !Number.isInteger(dy) ||
      Math.abs(dx) + Math.abs(dy) !== 1
    )
      return false;
    const x = this.current.x + dx,
      y = this.current.y + dy;
    if (x < 0 || y < 0 || x >= this.task.size || y >= this.task.size) {
      this.feedback =
        "Il cursore è al bordo della mappa. Prova un’altra direzione.";
      return false;
    }
    this.current = { x, y };
    this.feedback = "Cursore spostato: conta i passi della rotta.";
    return true;
  }
  verify() {
    if (!this.task || !validateTask(this.task, this.current)) {
      this.errors++;
      this.feedback =
        this.task?.type === "groups"
          ? "Controlla: tutti i cristalli devono formare gruppi uguali."
          : this.task?.type === "tank"
            ? "Leggi la tacca: confronta il livello con la quantità richiesta."
            : this.task?.type === "clock"
              ? "Riparti dall’orario iniziale e conta i minuti del viaggio."
              : "Il motore non è ancora in equilibrio. Puoi spostare i pezzi e riprovare.";
      return false;
    }
    this.history.push(copy(this.current));
    this.index++;
    this.current = this.task ? initialTask(this.task) : null;
    this.feedback = this.task
      ? "Meccanismo riparato! Ora il prossimo elemento."
      : "Tutti i meccanismi sono pronti: puoi avviare il portale!";
    return true;
  }
  travel() {
    if (
      this.done ||
      this.history.length !== this.tasks.length ||
      !this.history.every((state, i) => validateTask(this.tasks[i], state))
    )
      return false;
    this.done = true;
    this.feedback =
      this.stage === 5
        ? "Salto riuscito! Lo Zio è arrivato con tutti i calzini… questa volta!"
        : "Atterraggio riuscito, Ehy Amico!";
    return true;
  }
  get destination() {
    return TIME_DESTINATIONS[this.stage - 1];
  }
  get points() {
    return Math.max(25, this.stage * 350 - this.errors * 3);
  }
  hint(level) {
    if (this.hintTask !== this.index) this.hintLevel = 0;
    this.hintTask = this.index;
    this.hintLevel = Math.max(this.hintLevel, level);
  }
  get visualHint() {
    return this.hintTask === this.index ? this.hintLevel : 0;
  }
  export() {
    return {
      stage: this.stage,
      difficulty: this.difficulty,
      history: copy(this.history),
      current: copy(this.current),
      errors: this.errors,
      done: this.done,
    };
  }
}
export function solutionHint(task) {
  if (!task) return "Il portale aspetta soltanto il tuo comando di partenza.";
  if (task.type === "circuit") {
    let result = null;
    const find = (ids) => {
      if (result) return;
      if (ids.length === task.signs.length) {
        if (
          ids.reduce(
            (sum, id, i) => sum + task.values[id] * task.signs[i],
            0,
          ) === task.target
        )
          result = ids;
        return;
      }
      for (let i = 0; i < task.values.length; i++)
        if (!ids.includes(i)) find([...ids, i]);
    };
    find([]);
    return (
      "Prova a collegare, nell’ordine: " +
      result.map((id) => task.values[id]).join(", ") +
      ". Costruisci tu il circuito!"
    );
  }
  if (task.type === "groups") {
    const n =
      task.count ||
      Array.from({ length: 7 }, (_, i) => i + 2).find(
        (n) =>
          task.total % n === 0 && task.total / n <= 10 && task.total / n >= 2,
      );
    return (
      "Puoi costruire " +
      n +
      " ruote con " +
      task.total / n +
      " cristalli ciascuna."
    );
  }
  if (task.type === "tank" && task.start > task.target)
    return (
      "Dal livello iniziale di " +
      task.start +
      " mL togli " +
      (task.start - task.target) +
      " mL. Il traguardo è " +
      task.target +
      " mL: puoi usare Scarica 250 mL."
    );
  if (task.type === "tank")
    return (
      "Prova " +
      Math.floor(task.target / 500) +
      " dosi da 500 mL" +
      (task.target % 500 ? " e una da 250 mL" : "") +
      ". Se superi la tacca puoi scaricare."
    );
  if (task.type === "clock")
    return (
      "Il traguardo dell’orologio è " +
      String(Math.floor(task.target / 60)).padStart(2, "0") +
      ":" +
      String(task.target % 60).padStart(2, "0") +
      ". Muovi ancora le lancette tu."
    );
  if (task.type === "order")
    return (
      "Confronta questa sequenza: " +
      [...task.values].sort((a, b) => a - b).join(", ") +
      ". Ora ricostruiscila."
    );
  return (
    "La rotta porta al punto (" +
    task.target.join(", ") +
    "). Muovi il cursore fino a lì."
  );
}
