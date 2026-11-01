import { JURASSIC_MISSIONS } from "./education-data.js";
const int = (n, max) =>
  Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
export class JurassicEngine {
  constructor(stage = 1, difficulty = 0, saved = null) {
    this.stage = stage;
    this.mission = JURASSIC_MISSIONS[stage - 1];
    const valid = saved?.stage === stage && !saved.done;
    this.difficulty = valid ? int(saved.difficulty, 2) : difficulty;
    this.depth = Object.fromEntries(
      this.mission.parts.map((p) => [
        p.id,
        valid && Number.isInteger(saved.depth?.[p.id])
          ? int(saved.depth[p.id], 2 + this.difficulty)
          : 2 + this.difficulty,
      ]),
    );
    this.placed =
      valid && Array.isArray(saved.placed)
        ? [
            ...new Set(
              saved.placed.filter(
                (id) =>
                  this.mission.parts.some((p) => p.id === id) &&
                  this.depth[id] === 0,
              ),
            ),
          ]
        : [];
    this.labels = {};
    if (valid)
      for (const label of this.mission.labels)
        if (saved.labels?.[label.specimen] === label.answer)
          this.labels[label.specimen] = label.answer;
    this.traces =
      valid && Array.isArray(saved.traces)
        ? [
            ...new Set(
              saved.traces.filter(
                (n) =>
                  Number.isInteger(n) &&
                  n >= 0 &&
                  n < this.mission.sites.length,
              ),
            ),
          ]
        : [];
    this.used = {
      shovel: valid && saved.used?.shovel === true,
      brush: valid && saved.used?.brush === true,
    };
    this.site = valid ? int(saved.site, this.mission.sites.length - 1) : 0;
    this.errors = valid ? int(saved.errors, 999) : 0;
    this.done = false;
    this.feedback =
      "Scegli la pala per lo strato compatto e il pennello vicino ai fossili.";
    this.hintPhase = "";
    this.hintLevel = 0;
  }
  get recovered() {
    return this.mission.parts.filter((p) => this.depth[p.id] === 0);
  }
  get phase() {
    if (this.done) return "won";
    if (
      this.recovered.length !== this.mission.parts.length ||
      !this.used.shovel ||
      !this.used.brush
    )
      return "dig";
    if (
      this.mission.assemble &&
      this.placed.length !== this.mission.parts.length
    )
      return "assemble";
    if (this.mission.labels.some((l) => this.labels[l.specimen] !== l.answer))
      return "identify";
    return "ready";
  }
  selectSite(index) {
    if (!Number.isInteger(index) || !this.mission.sites[index] || this.done)
      return false;
    this.site = index;
    this.feedback =
      "Sito: " + this.mission.sites[index] + ". Osserva prima di scavare.";
    return true;
  }
  trace() {
    if (this.done || this.traces.includes(this.site)) return false;
    this.traces.push(this.site);
    this.feedback =
      "Traccia osservata! Le impronte raccontano un movimento, ma da sole non sempre indicano la specie.";
    return true;
  }
  dig(id, tool) {
    const p = this.mission.parts.find((p) => p.id === id);
    if (
      this.phase !== "dig" ||
      !p ||
      p.site !== this.site ||
      !["shovel", "brush"].includes(tool)
    )
      return false;
    if (this.mission.trace && !this.traces.includes(this.site)) {
      this.feedback = "Prima osserva la traccia di questo sito con la lente.";
      return false;
    }
    const depth = this.depth[id];
    if (depth > 1) {
      if (tool === "shovel") {
        this.depth[id]--;
        this.used.shovel = true;
        this.feedback =
          "Via lo strato compatto! Ora osserva quanto terreno resta.";
      } else {
        this.errors++;
        this.feedback =
          "Questo strato è ancora compatto: la piccola pala può aiutarti.";
      }
    } else if (depth === 1) {
      this.depth[id] = 0;
      if (tool === "brush") {
        this.used.brush = true;
        this.feedback = "Reperto recuperato con delicatezza!";
      } else {
        this.errors++;
        this.feedback =
          "Reperto recuperato. Vicino all’osso il pennello conserva meglio i dettagli: puoi rifinirlo adesso.";
      }
    } else if (tool === "brush") {
      this.used.brush = true;
      this.feedback =
        "Ottima rifinitura: i dettagli del reperto sono visibili.";
    } else return false;
    return true;
  }
  place(id, slot) {
    if (
      this.phase !== "assemble" ||
      this.depth[id] !== 0 ||
      this.placed.includes(id)
    )
      return false;
    const p = this.mission.parts.find((p) => p.id === id);
    if (!p) return false;
    if (id !== slot) {
      this.errors++;
      this.feedback =
        "Questo incastro non combacia. Confronta forma, posizione e gli altri pezzi: puoi riprovare.";
      return false;
    }
    this.placed.push(id);
    this.feedback = "Incastro riuscito! Il modello prende forma.";
    return true;
  }
  assign(specimen, answer) {
    if (this.phase !== "identify") return false;
    const label = this.mission.labels.find((l) => l.specimen === specimen);
    if (!label) return false;
    if (label.answer !== answer) {
      this.errors++;
      this.feedback =
        "Riguarda gli indizi del reperto. Denti, cranio e arti vanno confrontati insieme.";
      return false;
    }
    this.labels[specimen] = answer;
    this.feedback =
      "Indizi collegati! La scheda scientifica può entrare nel museo.";
    return true;
  }
  conclude() {
    if (this.phase !== "ready") return false;
    if (this.mission.trace && this.traces.length !== this.mission.sites.length)
      return false;
    this.done = true;
    this.feedback =
      this.stage === 5
        ? "Museo inaugurato! Lo Zio ha spolverato tutto… anche il suo cappellino!"
        : "Spedizione conclusa: una scoperta preziosa per il Diario!";
    return true;
  }
  get points() {
    return Math.max(25, this.stage * 300 - this.errors * 4);
  }
  hint(level) {
    if (this.hintPhase !== this.phase) this.hintLevel = 0;
    this.hintPhase = this.phase;
    this.hintLevel = Math.max(this.hintLevel, level);
  }
  get visualHint() {
    return this.hintPhase === this.phase ? this.hintLevel : 0;
  }
  export() {
    return {
      stage: this.stage,
      difficulty: this.difficulty,
      depth: { ...this.depth },
      placed: [...this.placed],
      labels: { ...this.labels },
      traces: [...this.traces],
      used: { ...this.used },
      site: this.site,
      errors: this.errors,
      done: this.done,
    };
  }
}
