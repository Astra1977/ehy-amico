import { JurassicEngine } from "./jurassic-engine.js";
import { JURASSIC_MISSIONS, SPECIES } from "./education-data.js";
import {
  node,
  button,
  fossilImage,
  installDrag,
  focusKey,
  preserveFocus,
} from "./education-dom.js";
export function jurassic(ctx) {
  const saved = ctx.restart ? null : ctx.readAdventure();
  const e = new JurassicEngine(ctx.stage, ctx.difficulty, saved),
    root = node("section", undefined, "education-game jurassic-game");
  ctx.play.append(root);
  let tool =
      saved && !saved.done && saved.tool === "brush" ? "brush" : "shovel",
    selected = null,
    labelChoice = null,
    stroke = null;
  const persist = () => ctx.saveAdventure({ ...e.export(), tool });
  function changed() {
    persist();
    render();
  }
  function dig(id) {
    if (e.dig(id, tool)) changed();
    else render();
  }
  function place(id, slot) {
    e.place(id, slot);
    selected = null;
    changed();
  }
  installDrag(
    root,
    ctx,
    (id) => {
      if (id.startsWith("label:")) labelChoice = id.slice(6);
      else selected = id;
      render();
    },
    (id, slot) => {
      if (id.startsWith("label:")) {
        e.assign(slot, id.slice(6));
        labelChoice = null;
        changed();
      } else place(id, slot);
    },
  );
  ctx.listen(root, "pointerdown", (event) => {
    const target = event.target.closest("[data-fossil]");
    if (!target || ctx.paused) return;
    event.preventDefault();
    root.setPointerCapture(event.pointerId);
    stroke = { id: event.pointerId, seen: new Set([target.dataset.fossil]) };
    dig(target.dataset.fossil);
  });
  ctx.listen(root, "pointermove", (event) => {
    if (!stroke || stroke.id !== event.pointerId || ctx.paused) return;
    const patch = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-fossil]");
    if (patch && !stroke.seen.has(patch.dataset.fossil)) {
      stroke.seen.add(patch.dataset.fossil);
      dig(patch.dataset.fossil);
    }
  });
  for (const event of ["pointerup", "pointercancel"])
    ctx.listen(root, event, () => (stroke = null));
  ctx.listen(ctx.play, "game:pausechange", () => (stroke = null));
  ctx.getHints = () => {
    if (e.phase === "ready")
      return [
        "Ehy Amico! Tutti i reperti sono pronti: premi Concludi la spedizione.",
        "Hai scavato, osservato e collegato gli indizi.",
        "La vetrina conserverà le tue scoperte anche quando torni alla mappa.",
      ];
    if (e.done)
      return [
        "Ehy Amico! " + e.feedback,
        "Le tue scoperte sono nel Museo del Tempo e nel Diario.",
        "Puoi rigiocare le spedizioni: i tesori non si duplicano.",
      ];
    const pending =
      e.mission.parts.find((p) => e.depth[p.id] > 0) ||
      e.mission.parts.find((p) => !e.placed.includes(p.id));
    return [
      "Ehy Amico! " +
        (e.phase === "dig"
          ? "Usa la pala sul terreno compatto e il pennello vicino alle ossa."
          : e.phase === "assemble"
            ? "Confronta le forme e ricostruisci il modello, un reperto alla volta."
            : "Osserva cranio, denti e arti prima di scegliere le etichette."),
      e.phase === "dig"
        ? "Guarda le zone illuminate: quando il terreno diventa sottile passa al pennello."
        : e.phase === "assemble"
          ? "Ho illuminato il prossimo incastro. Puoi selezionare un pezzo e poi il suo posto."
          : "Confronta le schede degli indizi accanto ai reperti.",
      e.phase === "dig"
        ? e.mission.trace && !e.traces.includes(e.site)
          ? "Prima premi Osserva la traccia."
          : pending
            ? "Lavora sul reperto «" +
              pending.label +
              "». Usa " +
              (e.depth[pending.id] > 1 ? "la pala" : "il pennello") +
              "."
            : "Rifinisci un reperto recuperato con il pennello."
        : e.phase === "assemble" && pending
          ? "Il prossimo pezzo è «" +
            pending.label +
            "»: il suo incastro è evidenziato."
          : e.mission.labels
              .map((l) => SPECIES[l.specimen].name + ": " + l.answer)
              .join(". "),
    ];
  };
  ctx.onHint = (index) => {
    e.hint(index + 1);
    changed();
  };
  ctx.onCleanup(persist);
  function render() {
    preserveFocus(root, () => {
      root.replaceChildren();
      const phase = e.phase;
      root.append(
        node(
          "p",
          "SPEDIZIONE " + ctx.stage + " · " + e.mission.title,
          "eyebrow",
        ),
      );
      const progress = node("progress");
      progress.max =
        e.mission.parts.length * (e.mission.assemble ? 2 : 1) +
        e.mission.labels.length;
      progress.value =
        e.recovered.length + e.placed.length + Object.keys(e.labels).length;
      progress.setAttribute("aria-label", "Reperti e ricostruzione");
      root.append(progress);
      const message = node("p", e.feedback, "edu-feedback");
      message.setAttribute("role", "status");
      root.append(message);
      if (phase === "dig") renderDig();
      else if (phase === "assemble") renderAssembly();
      else if (phase === "identify") renderIdentify();
      else if (phase === "ready") {
        root.append(
          node("h2", "Una vetrina pronta per il museo"),
          node("p", e.mission.lesson),
        );
        button(root, "Concludi la spedizione", () => {
          if (ctx.paused || !e.conclude()) return;
          persist();
          ctx.play.dataset.state = "won";
          ctx.best("", e.points);
          ctx.complete(ctx.stage);
          render();
        });
      } else {
        root.append(
          node("h2", "Spedizione completata!"),
          node("p", e.feedback, "radio-celebration"),
          node("p", e.mission.lesson),
        );
        const a = node("a", "Visita il Museo del Tempo", "button");
        a.href = "#museum";
        root.append(a);
      }
      ctx.info(
        "Reperti " +
          e.recovered.length +
          "/" +
          e.mission.parts.length +
          " · Incastro " +
          e.placed.length +
          "/" +
          (e.mission.assemble ? e.mission.parts.length : 0) +
          " · Punti " +
          e.points,
      );
    });
  }
  function renderDig() {
    root.append(node("h2", "Scava, osserva, proteggi"));
    const sites = node("div", undefined, "edu-toolbar");
    for (const [i, name] of e.mission.sites.entries()) {
      const b = button(sites, name, () => {
        e.selectSite(i);
        changed();
      });
      b.setAttribute("aria-pressed", String(e.site === i));
      focusKey(b, "site-" + i);
    }
    root.append(sites);
    if (e.mission.trace) {
      const b = button(
        root,
        e.traces.includes(e.site) ? "Traccia osservata" : "Osserva la traccia",
        () => {
          e.trace();
          changed();
        },
        "trace-button",
      );
      b.prepend(fossilImage("trace"));
      b.disabled = e.traces.includes(e.site);
      focusKey(b, "trace");
      root.append(
        node(
          "p",
          "Una pista attraversa il sito. L’impronta è schematica: da sola non identifica la specie dei fossili.",
        ),
      );
    }
    const tools = node("div", undefined, "edu-toolbar");
    for (const [id, text] of [
      ["shovel", "Piccola pala"],
      ["brush", "Pennello"],
    ]) {
      const b = button(tools, text, () => {
        tool = id;
        render();
      });
      b.setAttribute("aria-pressed", String(tool === id));
      focusKey(b, "tool-" + id);
    }
    root.append(
      tools,
      node(
        "p",
        "Trascina sul terreno o tocca una zona. Con la tastiera scegli uno strumento, poi attiva le zone con Invio.",
        "edu-instruction",
      ),
    );
    const strata = node("div", undefined, "strata-key");
    strata.append(
      node("span", "Terreno compatto"),
      node("span", "Sedimento fine"),
      node("span", "Roccia e reperti"),
    );
    root.append(strata);
    const field = node("div", undefined, "dig-field");
    field.setAttribute("aria-label", "Terreno stratificato");
    const next = e.mission.parts.find(
      (p) => p.site === e.site && e.depth[p.id] > 0,
    );
    for (const p of e.mission.parts.filter((p) => p.site === e.site)) {
      const depth = e.depth[p.id],
        b = button(
          field,
          "",
          (event) => {
            if (event.detail === 0 && !ctx.paused) dig(p.id);
          },
          "dig-patch depth-" +
            Math.min(depth, 2) +
            (e.visualHint >= 2 && p.id === next?.id ? " suggested" : ""),
        );
      b.dataset.fossil = p.id;
      focusKey(b, "dig-" + p.id);
      b.setAttribute(
        "aria-label",
        p.label +
          ": " +
          (depth > 1
            ? "terreno compatto"
            : depth === 1
              ? "sedimento fine"
              : "recuperato, rifinisci con il pennello"),
      );
      b.append(
        fossilImage(p.kind),
        node(
          "span",
          depth > 1
            ? "Strato compatto"
            : depth === 1
              ? "Pennello, piano…"
              : p.label,
          "soil-label",
        ),
        node("i", undefined, "soil-cover"),
      );
    }
    root.append(field);
  }
  function renderAssembly() {
    root.append(
      node("h2", "Ricostruisci il modello"),
      node(
        "p",
        "Trascina un reperto sull’incastro. Oppure seleziona il reperto e poi tocca la sua destinazione.",
      ),
    );
    const tray = node("div", undefined, "fossil-tray");
    for (const p of e.mission.parts.filter((p) => !e.placed.includes(p.id))) {
      const b = button(
        tray,
        "",
        (event) => {
          if (event.detail === 0) {
            selected = p.id;
            render();
          }
        },
        "fossil-piece" + (selected === p.id ? " selected" : ""),
      );
      b.dataset.drag = p.id;
      b.setAttribute("aria-label", "Seleziona " + p.label);
      focusKey(b, "piece-" + p.id);
      b.append(fossilImage(p.kind), node("span", p.label));
    }
    root.append(tray);
    const next = e.mission.parts.find((p) => !e.placed.includes(p.id));
    for (const species of [...new Set(e.mission.parts.map((p) => p.species))]) {
      root.append(
        node(
          "h3",
          "Modello dei reperti " +
            ([...new Set(e.mission.parts.map((p) => p.species))].indexOf(
              species,
            ) +
              1),
        ),
      );
      const board = node("div", undefined, "skeleton-board");
      for (const p of e.mission.parts.filter((p) => p.species === species)) {
        const placed = e.placed.includes(p.id),
          b = button(
            board,
            "",
            () => {
              if (selected && !ctx.paused) place(selected, p.id);
            },
            "bone-slot" +
              (placed ? " placed" : "") +
              (e.visualHint >= 2 && p.id === next?.id ? " suggested" : ""),
          );
        b.style.left = p.x + "%";
        b.style.top = p.y + "%";
        b.dataset.drop = p.id;
        b.setAttribute("aria-label", "Incastro " + p.label);
        focusKey(b, "slot-" + p.id);
        b.append(fossilImage(p.kind), node("span", p.label));
        b.disabled = placed;
      }
      root.append(board);
    }
    root.append(
      node(
        "p",
        "Modello schematico, non in scala. Le ricostruzioni scientifiche richiedono il confronto di molti reperti.",
        "muted",
      ),
    );
  }
  function renderIdentify() {
    root.append(
      node("h2", "Dagli indizi alla scoperta"),
      node(
        "p",
        "Leggi gli indizi. Trascina un’etichetta sulla scheda o seleziona prima l’etichetta e poi il reperto.",
      ),
    );
    const choices = [...new Set(e.mission.labels.flatMap((l) => l.choices))],
      tray = node("div", undefined, "edu-toolbar");
    for (const choice of choices) {
      const b = button(
        tray,
        choice,
        (event) => {
          if (event.detail === 0) {
            labelChoice = choice;
            render();
          }
        },
        labelChoice === choice ? "selected" : "",
      );
      b.dataset.drag = "label:" + choice;
      focusKey(b, "label-" + choice);
    }
    root.append(tray);
    for (const l of e.mission.labels) {
      const card = node("section", undefined, "evidence-card");
      card.append(
        node("h3", "Indizi del reperto " + (e.mission.labels.indexOf(l) + 1)),
        fossilImage(e.mission.parts.find((p) => p.species === l.specimen).kind),
        node("p", SPECIES[l.specimen].clue),
      );
      const b = button(
        card,
        e.labels[l.specimen]
          ? "Etichetta: " + e.labels[l.specimen]
          : "Applica l’etichetta selezionata",
        () => {
          if (labelChoice && !ctx.paused) {
            e.assign(l.specimen, labelChoice);
            labelChoice = null;
            changed();
          }
        },
      );
      b.dataset.drop = l.specimen;
      focusKey(b, "identify-" + l.specimen);
      b.disabled = Boolean(e.labels[l.specimen]);
      root.append(card);
    }
  }
  render();
}
export function museumEntries(data) {
  const completed = data.games.jurassic.completed,
    entries = [];
  for (const [i, mission] of JURASSIC_MISSIONS.entries()) {
    const saved = data.adventures?.jurassic?.[i + 1];
    for (const part of mission.parts.filter(
      (p) => i < completed || saved?.depth?.[p.id] === 0,
    )) {
      let entry = entries.find((e) => e.id === part.species);
      if (!entry) {
        entry = {
          id: part.species,
          ...SPECIES[part.species],
          complete: i < completed,
          artifacts: [],
        };
        entries.push(entry);
      }
      entry.complete ||= i < completed;
      if (!entry.artifacts.includes(part.label))
        entry.artifacts.push(part.label);
    }
  }
  return entries;
}
export function renderMuseum(main, data) {
  main.append(
    node("p", "COLLEZIONE DELL’ESPLORATORE", "eyebrow"),
    node("h1", "Museo del Tempo"),
    node(
      "p",
      data.games.jurassic.completed === 5
        ? "Il museo è aperto! Tutte le spedizioni sono nella collezione."
        : "Le vetrine si popolano con i reperti che recuperi. L’inaugurazione arriva con la quinta spedizione.",
    ),
  );
  const grid = node("div", undefined, "museum-grid"),
    entries = museumEntries(data);
  if (!entries.length)
    grid.append(node("p", "Il primo reperto ti aspetta nella valle."));
  for (const entry of entries) {
    const card = node("article", undefined, "notebook museum-card");
    card.append(
      fossilImage(
        entry.id === "ptera"
          ? "wing"
          : entry.id === "trice"
            ? "horned"
            : "skull",
      ),
      node("h2", (entry.complete ? "" : "Ipotesi: ") + entry.name),
      node("p", entry.period, "eyebrow"),
      node("p", entry.fact),
      node("p", "Reperti: " + entry.artifacts.join(", ") + "."),
      node(
        "small",
        entry.complete ? "Scheda della spedizione" : "Reperti in studio",
      ),
    );
    grid.append(card);
  }
  main.append(
    grid,
    node(
      "p",
      "La valle fantastica riunisce epoche diverse: Tirannosauro e Triceratopo vissero nel Cretaceo, non nel Giurassico. Le illustrazioni sono schematiche.",
    ),
  );
  const back = node("a", "Torna alla spedizione", "button");
  back.href = "#game/jurassic";
  main.append(back);
}
