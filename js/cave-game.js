import { node, button, installDrag } from "./education-dom.js";
import { CaveEngine } from "./cave-engine.js";
import {
  CAVE_TITLES,
  SYMBOLS,
  COLORS,
  ZONES,
  DISCOVERY_NAMES,
  describeDiscovery,
} from "./cave-data.js";
export { CAVE_TITLES };
const NS = "http://www.w3.org/2000/svg";
const vector = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
  return n;
};
export function caveEntries(data) {
  return Object.entries(data.adventures?.cave || {})
    .filter(([, s]) => s.discovery)
    .map(([stage, s]) => ({
      stage: Number(stage),
      title: DISCOVERY_NAMES[stage - 1],
      text: describeDiscovery(Number(stage), s.discovery),
    }));
}
function glyph(name) {
  const svg = vector("svg", {
    viewBox: "0 0 48 48",
    "aria-hidden": true,
    class: "cave-glyph",
  });
  if (name === "sole") {
    svg.append(vector("circle", { cx: 24, cy: 24, r: 10 }));
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      svg.append(
        vector("path", {
          d: `M${24 + Math.cos(a) * 15} ${24 + Math.sin(a) * 15}L${24 + Math.cos(a) * 21} ${24 + Math.sin(a) * 21}`,
        }),
      );
    }
  } else
    svg.append(
      vector("path", {
        d:
          name === "onda"
            ? "M3 19Q10 9 17 19T31 19T45 19M3 31Q10 21 17 31T31 31T45 31"
            : name === "foglia"
              ? "M10 37Q0 7 39 7Q41 43 10 37ZM10 37L31 15M21 26L19 14M21 26L33 28"
              : "M32 5A20 20 0 1 0 41 35A21 21 0 0 1 32 5Z",
      }),
    );
  return svg;
}
export function cave(ctx) {
  const saved = ctx.readAdventure(),
    artifacts = Object.fromEntries(
      [1, 2, 3, 4]
        .map((n) => [n, ctx.readAdventure(n)?.discovery])
        .filter(([, d]) => d),
    );
  let engine = new CaveEngine(ctx.stage, saved, artifacts);
  if (ctx.restart) engine = engine.restart();
  const root = node("section", undefined, "cave-game");
  ctx.play.append(root);
  let selectedSymbol = "sole",
    selectedGear = 0,
    panelController = new AbortController(),
    scene,
    avatar,
    notice,
    audio = null,
    focusTile = 2;
  const listen = (target, event, fn) =>
    target.addEventListener(event, fn, { signal: panelController.signal });
  const persist = () => ctx.saveAdventure(engine.export());
  function tone(ok) {
    if (!ctx.soundEnabled || ctx.paused) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio ??= new Audio();
      audio.resume().catch(() => {});
      const osc = audio.createOscillator(),
        gain = audio.createGain(),
        t = audio.currentTime;
      osc.type = "sine";
      osc.frequency.value = ok ? 620 : 310;
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(t + 0.14);
    } catch {}
  }
  function action(fn) {
    return () => {
      if (ctx.paused) return;
      const result = fn();
      tone(result !== false);
      persist();
      if (engine.s.won) {
        ctx.best("", engine.s.records[engine.s.mode]);
        ctx.complete(ctx.stage);
        ctx.play.dataset.state = "won";
      }
      paint();
    };
  }
  function btn(parent, label, fn, cls) {
    const b = button(parent, label, action(fn), cls);
    b.dataset.focus = label;
    return b;
  }
  function image(path, cls, alt = "") {
    const img = node("img", undefined, cls);
    img.src = "./assets/" + path + ".svg";
    img.alt = alt;
    img.draggable = false;
    return img;
  }
  function paint() {
    const focus = root.contains(document.activeElement)
      ? document.activeElement.dataset.focus
      : null;
    panelController.abort();
    panelController = new AbortController();
    root.replaceChildren();
    const heading = node("div", undefined, "cave-heading");
    heading.append(
      node("p", "AVVENTURA 10 · IL MISTERO DELLA GROTTA", "eyebrow"),
      node("h2", CAVE_TITLES[ctx.stage - 1]),
      node("p", "La montagna custodisce un segreto. Tu hai gli indizi."),
    );
    root.append(heading);
    const modes = node("div", undefined, "cave-toolbar");
    for (const [id, label] of [
      ["explorer", "Esploratore"],
      ["investigator", "Investigatore"],
    ]) {
      const b = btn(modes, label, () => {
        engine = new CaveEngine(
          ctx.stage,
          {
            mode: id,
            seed: engine.s.seed,
            records: engine.s.records,
            discovery: engine.s.discovery,
          },
          artifacts,
        );
      });
      b.setAttribute("aria-pressed", String(engine.s.mode === id));
      b.disabled = engine.s.moves > 0 || engine.s.won;
    }
    root.append(modes);
    notice = node("p", engine.message, "cave-radio");
    notice.setAttribute("role", "status");
    root.append(notice);
    ctx.info(
      `${ZONES[ctx.stage - 1][engine.s.zone]} · ${engine.hard ? "Investigatore" : "Esploratore"} · Mosse ${engine.s.moves} · Record ${engine.s.records[engine.s.mode]}`,
    );
    if (engine.s.won) {
      finale();
      inventory();
      return;
    }
    const nav = node("nav", undefined, "cave-zones");
    nav.setAttribute("aria-label", "Zone della grotta");
    for (const [i, name] of ZONES[ctx.stage - 1].entries()) {
      const b = btn(nav, name, () => engine.moveZone(i));
      b.dataset.zone = i;
      b.setAttribute(
        "aria-current",
        engine.s.zone === i ? "location" : "false",
      );
    }
    root.append(nav);
    scene = node("div", undefined, "cave-scene");
    scene.dataset.zone = engine.s.zone;
    scene.dataset.stage = ctx.stage;
    scene.append(
      node("div", undefined, "cave-torch cave-torch-left"),
      node("div", undefined, "cave-torch cave-torch-right"),
    );
    avatar = image("cave-explorer", "cave-avatar", "Nipotino Esploratore");
    scene.append(avatar);
    root.append(scene);
    positionAvatar();
    const work = node("div", undefined, "cave-work");
    root.append(work);
    if (ctx.stage === 1) entrance(work);
    if (ctx.stage === 2) lightRoom(work);
    if (ctx.stage === 3) floorRoom(work);
    if (ctx.stage === 4) bridgeRoom(work);
    if (ctx.stage === 5) temple(work);
    inventory();
    const tools = node("div", undefined, "cave-toolbar");
    btn(
      tools,
      "Nuova configurazione",
      () => {
        engine = engine.restart();
        focusTile = 2;
      },
      "secondary",
    );
    root.append(tools);
    root.append(
      node(
        "p",
        "Puoi riprovare: tesori, scoperte già conquistate e record restano al sicuro. Nessun timer.",
        "cave-caption",
      ),
    );
    if (focus)
      [...root.querySelectorAll("[data-focus]")]
        .find((n) => n.dataset.focus === focus && !n.disabled)
        ?.focus({ preventScroll: true });
  }
  function positionAvatar() {
    if (!avatar) return;
    const position =
      ctx.stage === 4
        ? 10
        : ctx.stage === 3 && engine.s.floorStep < engine.floor.rows - 1
          ? 20
          : 20 + engine.s.zone * 29;
    avatar.style.left = `${engine.s.won ? 80 : position}%`;
    avatar.style.setProperty("--facing", engine.s.zone === 0 ? "-1" : "1");
  }
  function stoneDoor(parent, opened = false) {
    const door = node("div", undefined, "cave-stone-door");
    door.setAttribute("aria-hidden", "true");
    for (const symbol of ["sole", "luna"]) {
      const leaf = node("div", undefined, "cave-stone-leaf");
      leaf.append(glyph(symbol));
      door.append(leaf);
    }
    parent.append(door);
    if (opened) parent.classList.add("cave-open");
  }
  function entrance(work) {
    if (engine.s.zone === 2) stoneDoor(scene);
    const index = engine.s.zone;
    const prop = btn(
      scene,
      ["Osserva l’incisione", "Solleva le radici", "Studia il sigillo"][index],
      () => engine.collect(index),
      "cave-hotspot",
    );
    prop.dataset.clue = index;
    prop.style.left = ["16%", "60%", "43%"][index];
    prop.style.top = ["32%", "42%", "28%"][index];
    prop.prepend(
      glyph(engine.door.order[Math.min(index, engine.door.order.length - 1)]),
    );
    work.append(
      node("h3", "Tre tracce, una porta"),
      node(
        "p",
        engine.hard
          ? "Le incisioni descrivono relazioni: ricostruisci l’ordine completo."
          : "Esplora tutte e tre le zone. Gli indizi dicono quale simbolo viene prima, in mezzo e alla fine.",
      ),
    );
    if (engine.s.zone === 2) {
      codeBoard(work);
      btn(work, "Aziona il portone", () => engine.advance());
    } else
      work.append(
        node("p", "Gli indizi raccolti restano nel taccuino qui sotto."),
      );
  }
  function codeBoard(parent) {
    const board = node("section", undefined, "cave-code");
    board.append(
      node(
        "h3",
        ctx.stage === 1 ? "Ricomponi il sigillo" : "Codice degli antenati",
      ),
    );
    const tokens = node("div", undefined, "cave-tokens");
    board.append(tokens);
    for (const name of SYMBOLS) {
      const b = btn(tokens, name, () => (selectedSymbol = name));
      b.prepend(glyph(name));
      b.dataset.drag = name;
      b.setAttribute("aria-pressed", String(selectedSymbol === name));
    }
    const slots = node("div", undefined, "cave-code-slots");
    board.append(slots);
    for (let i = 0; i < engine.codeAnswer.length; i++) {
      const symbol = engine.s.code[i],
        b = btn(slots, `Runa ${i + 1}: ${symbol || "vuota"}`, () =>
          engine.setSymbol(i, selectedSymbol),
        );
      b.dataset.drop = String(i);
      b.dataset.slot = i;
      if (symbol) b.prepend(glyph(symbol));
    }
    board.append(
      node(
        "p",
        "Scegli un simbolo, poi tocca un alloggiamento. Puoi anche trascinarlo.",
      ),
    );
    parent.append(board);
    // The shared drag helper needs a scoped context so replacing the scene releases its listeners.
    installDrag(
      board,
      {
        listen,
        onCleanup: (fn) =>
          panelController.signal.addEventListener("abort", fn, { once: true }),
        play: ctx.play,
        get paused() {
          return ctx.paused;
        },
      },
      (name) => {
        selectedSymbol = name;
        paint();
      },
      (name, slot) => {
        if (ctx.paused) return;
        engine.setSymbol(Number(slot), name);
        persist();
        paint();
      },
    );
  }
  function lightRoom(work) {
    work.append(
      node("h3", "Porta la luce fino al sensore"),
      node(
        "p",
        engine.hard
          ? "Quattro riflessioni e tre cristalli: segui la luce una casella alla volta."
          : "Il fascio deve attraversare entrambi i cristalli e raggiungere il sensore. Gli ostacoli fermano la luce.",
      ),
    );
    beamBoard(scene);
    if (engine.s.zone === 0)
      work.append(
        node(
          "p",
          "Taccuino della luce: uno specchio / manda la luce che arriva da sinistra verso l’alto. Da sotto, la manda a destra. Lo specchio \\ fa la curva opposta.",
        ),
      );
    btn(work, engine.s.lightOn ? "Spegni la torcia" : "Accendi la torcia", () =>
      engine.toggleLight(),
    );
    if (engine.s.zone === 1) mirrorControls(work);
    else
      work.append(
        node("p", "Raggiungi la galleria degli specchi per ruotarli."),
      );
    if (engine.s.zone === 2)
      btn(work, "Attraversa la porta luminosa", () => engine.advance());
    work.append(
      node(
        "p",
        `Cristalli accesi: ${engine.beam.colors.length}/${engine.light.crystals.length} · Sensore ${engine.beam.sensor ? "attivo" : "spento"}`,
      ),
    );
  }
  function beamBoard(parent) {
    const p = engine.light,
      beam = engine.beam,
      board = node("div", undefined, "cave-light-board");
    board.style.setProperty("--columns", p.width);
    board.setAttribute("aria-label", "Griglia della luce");
    for (let y = 0; y < p.height; y++)
      for (let x = 0; x < p.width; x++) {
        const mirror = p.mirrors.findIndex((m) => m.x === x && m.y === y),
          crystal = p.crystals.find((c) => c.x === x && c.y === y),
          wall = p.walls.some((c) => c[0] === x && c[1] === y),
          source = p.source[0] === x && p.source[1] === y,
          sensor = p.sensor[0] === x && p.sensor[1] === y;
        const cell =
          mirror >= 0
            ? btn(
                board,
                `Specchio ${mirror + 1}: ${engine.s.mirrors[mirror]}`,
                () => engine.rotateMirror(mirror),
                "cave-light-cell mirror",
              )
            : node("div", undefined, "cave-light-cell");
        if (mirror < 0) board.append(cell);
        if (mirror >= 0) {
          cell.dataset.mirror = mirror;
          cell.textContent = engine.s.mirrors[mirror];
          cell.setAttribute(
            "aria-label",
            `Specchio ${mirror + 1}: ${engine.s.mirrors[mirror]}`,
          );
          cell.disabled =
            engine.s.zone !== 1 || (ctx.stage === 5 && !engine.codeCorrect);
        }
        if (wall) {
          cell.classList.add("wall");
          cell.textContent = "▧";
          cell.setAttribute("aria-label", "Roccia: ostacolo");
        }
        if (crystal) {
          cell.classList.add("crystal");
          cell.style.color = COLORS[crystal.color];
          cell.textContent = "◆";
          cell.setAttribute("aria-label", "Cristallo " + crystal.color);
          cell.dataset.active = beam.colors.includes(crystal.color);
        }
        if (source) {
          cell.classList.add("source");
          cell.textContent = "➜";
          cell.setAttribute("aria-label", "Sorgente luminosa");
        }
        if (sensor) {
          cell.classList.add("sensor");
          cell.textContent = beam.sensor ? "●" : "○";
          cell.setAttribute(
            "aria-label",
            "Sensore " + (beam.sensor ? "attivo" : "spento"),
          );
        }
      }
    const ray = vector("svg", {
      viewBox: `0 0 ${p.width * 100} ${p.height * 100}`,
      class: "cave-ray",
      "aria-hidden": true,
    });
    ray.append(
      vector("polyline", {
        points: beam.points
          .map(([x, y]) => `${x * 100 + 50},${y * 100 + 50}`)
          .join(" "),
        fill: "none",
        stroke: "#fff0a5",
        "stroke-width": 8,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    );
    board.append(ray);
    parent.append(board);
  }
  function mirrorControls(parent) {
    const controls = node("div", undefined, "cave-toolbar");
    for (let i = 0; i < engine.light.mirrors.length; i++)
      btn(controls, "Ruota specchio " + (i + 1), () => engine.rotateMirror(i));
    parent.append(controls);
  }
  function floorRoom(work) {
    if (engine.s.zone === 0) {
      const stone = btn(
        scene,
        "Leggi la stele del ritmo",
        () => {
          engine.message =
            "La stele dice: " +
            engine.floor.motif.join(" → ") +
            ", poi ricomincia.";
          return true;
        },
        "cave-hotspot",
      );
      stone.style.left = "34%";
      stone.style.top = "26%";
      stone.prepend(glyph(engine.floor.motif[0]));
    }
    work.append(
      node("h3", "Ascolta il ritmo delle pietre"),
      node(
        "p",
        "Il motivo inciso si ripete: " +
          engine.floor.motif.join(" → ") +
          ". Ogni passo sale di una riga, sulla stessa colonna o su una vicina.",
      ),
    );
    if (engine.s.zone === 1) {
      const board = node("div", undefined, "cave-floor");
      board.style.setProperty("--columns", engine.floor.cols);
      board.setAttribute(
        "aria-label",
        "Pavimento: dalla riga in basso verso l’uscita",
      );
      for (let step = engine.floor.rows - 1; step >= 0; step--)
        for (let col = 0; col < engine.floor.cols; col++) {
          const isPlayer =
              step === engine.s.floorStep && col === engine.floorColumn,
            symbol = step === 0 ? null : engine.floor.tiles[step - 1][col],
            b = btn(
              board,
              `Riga ${step}, colonna ${col + 1}${symbol ? ", " + symbol : ""}${isPlayer ? ", esploratore" : ""}`,
              () => engine.stepFloor(col),
              "cave-tile",
            );
          b.dataset.step = step;
          b.dataset.col = col;
          b.disabled =
            step !== engine.s.floorStep + 1 ||
            Math.abs(col - engine.floorColumn) > 1;
          b.dataset.player = isPlayer;
          b.dataset.checkpoint = step === 3;
          if (symbol) b.append(glyph(symbol));
          if (isPlayer) b.append(image("cave-explorer", "cave-tile-explorer"));
        }
      scene.append(board);
      const arrows = node("div", undefined, "cave-toolbar");
      btn(arrows, "Seleziona piastrella a sinistra", () => {
        focusTile = Math.max(0, focusTile - 1);
        engine.message = "Colonna selezionata: " + (focusTile + 1);
      });
      btn(arrows, "Fai un passo", () => engine.stepFloor(focusTile));
      btn(arrows, "Seleziona piastrella a destra", () => {
        focusTile = Math.min(4, focusTile + 1);
        engine.message = "Colonna selezionata: " + (focusTile + 1);
      });
      work.append(
        arrows,
        node(
          "p",
          `Passi sicuri ${engine.s.floorStep}/${engine.floor.rows - 1} · Checkpoint ${engine.s.floorCheckpoint}. Tastiera: ← → selezionano la colonna; ↑ cammina.`,
        ),
      );
    }
    if (engine.s.zone === 2)
      btn(work, "Esci dalla sala delle piastrelle", () => engine.advance());
  }
  function gearPicture(teeth, cls) {
    const svg = vector("svg", {
      viewBox: "0 0 100 100",
      class: cls || "cave-gear",
      "aria-hidden": true,
    });
    for (let i = 0; i < teeth; i++) {
      const a = (i * 360) / teeth;
      svg.append(
        vector("rect", {
          x: 43,
          y: 5,
          width: 14,
          height: 20,
          rx: 2,
          transform: `rotate(${a} 50 50)`,
        }),
      );
    }
    svg.append(
      vector("circle", { cx: 50, cy: 50, r: 32 }),
      vector("circle", { cx: 50, cy: 50, r: 12, class: "cave-gear-hole" }),
    );
    return svg;
  }
  function bridgeRoom(work) {
    work.append(
      node("h3", "Dal movimento al ponte"),
      node(
        "p",
        "Le ruote vicine si toccano solo con le dimensioni giuste. La leva avvia il moto; i contrappesi sollevano le sezioni. Una pietra in più può sbilanciarle.",
      ),
    );
    bridgePicture(scene);
    if (engine.s.zone === 0) {
      const gears = node("div", undefined, "cave-tokens");
      for (const [id, teeth] of engine.bridge.inventory.entries()) {
        const b = btn(
          gears,
          `Ruota ${id + 1} · ${teeth} denti`,
          () => (selectedGear = id),
        );
        b.prepend(gearPicture(teeth));
        b.setAttribute("aria-pressed", String(selectedGear === id));
        b.dataset.gear = id;
      }
      work.append(gears);
      const rack = node("div", undefined, "cave-gear-rack");
      rack.append(
        node(
          "p",
          "Asse motore: 8 denti. Distanza tra assi = metà della somma dei denti delle due ruote.",
        ),
      );
      for (let i = 0; i < engine.s.gearSlots.length; i++) {
        const id = engine.s.gearSlots[i],
          b = btn(
            rack,
            `Alloggiamento ${i + 1}: ${id === null ? "vuoto" : engine.bridge.inventory[id] + " denti"}`,
            () => engine.placeGear(i, selectedGear),
          );
        b.dataset.gearSlot = i;
        if (id !== null) b.prepend(gearPicture(engine.bridge.inventory[id]));
        rack.append(
          node(
            "p",
            `Distanza assi ${i + 1}: ${engine.bridge.axes[i + 1] - engine.bridge.axes[i]}${engine.hard ? "" : " · sagoma da " + engine.bridge.teeth[i + 1] + " denti"}`,
          ),
        );
      }
      work.append(
        rack,
        node(
          "p",
          "Una ruota si può spostare da un alloggiamento all’altro: non può occupare due assi insieme.",
        ),
      );
    }
    if (engine.s.zone === 1) {
      work.append(
        node("p", `Pietre ancora disponibili: ${engine.spareWeights}.`),
      );
      const weights = node("div", undefined, "cave-weights");
      for (const [i, target] of engine.bridge.targets.entries()) {
        const card = node("section");
        card.append(
          node("h4", "Argano " + (i + 1)),
          node(
            "p",
            `Tacca di equilibrio: ${target} · Pietre: ${engine.s.weights[i]}`,
          ),
        );
        btn(card, "Aggiungi pietra " + (i + 1), () => engine.weight(i, 1));
        btn(card, "Togli pietra " + (i + 1), () => engine.weight(i, -1));
        weights.append(card);
      }
      work.append(weights);
    }
    btn(work, engine.s.lever ? "Abbassa la leva" : "Solleva la leva", () =>
      engine.toggleLever(),
    );
    work.append(
      node(
        "p",
        `Trasmissione: ${engine.transmission ? "collegata, rapporto " + engine.transmission.toFixed(2) : "ferma"} · Ponte ${engine.bridgeReady ? "allineato" : "incompleto"}`,
      ),
    );
    if (engine.s.zone === 2)
      btn(work, "Attraversa il ponte", () => engine.advance());
  }
  function bridgePicture(parent) {
    const svg = vector("svg", {
      viewBox: "0 0 800 300",
      class: "cave-bridge",
      "aria-label": "Ponte: sezioni sollevate da ingranaggi e contrappesi",
      role: "img",
    });
    svg.append(
      vector("path", {
        d: "M0 215Q100 165 200 215T400 215T600 215T800 215V300H0Z",
        fill: "#37acbd",
      }),
    );
    svg.append(
      vector("path", {
        d: "M0 165H120V300H0ZM680 165H800V300H680Z",
        fill: "#4d6972",
      }),
    );
    svg.append(
      vector("path", {
        d: "M120 70H680",
        stroke: engine.transmission ? "#f4d08a" : "#70888c",
        "stroke-width": 5,
      }),
    );
    const n = engine.bridge.targets.length,
      w = 560 / n;
    for (let i = 0; i < n; i++) {
      const lift = engine.lift(i),
        y = 235 - lift * 70;
      svg.append(
        vector("path", {
          d: `M${120 + i * w} ${y}H${120 + (i + 1) * w}`,
          stroke: "#e4c189",
          "stroke-width": 16,
          "stroke-dasharray": "21 3",
        }),
      );
      svg.append(
        vector("path", {
          d: `M${120 + (i + 0.5) * w} ${y}V70H${170 + (i + 0.5) * w}V${90 + engine.s.weights[i] * 10}`,
          fill: "none",
          stroke: "#adc3b2",
          "stroke-width": 3,
        }),
      );
      const weightX = 170 + (i + 0.5) * w;
      const weightY = 90 + engine.s.weights[i] * 10;
      svg.append(
        vector("rect", {
          x: weightX - 16,
          y: weightY,
          width: 32,
          height: 25,
          rx: 4,
          fill: "#d8b379",
          stroke: "#f8e7b9",
          "stroke-width": 2,
        }),
      );
      svg.append(
        vector("path", {
          d: `M${weightX - 22} ${90 + engine.bridge.targets[i] * 10}H${weightX + 22}`,
          stroke: "#9affdf",
          "stroke-width": 2,
          "stroke-dasharray": "3 3",
        }),
      );
      const massLabel = vector("text", {
        x: weightX,
        y: weightY + 18,
        "text-anchor": "middle",
        fill: "#173a4f",
        "font-size": 18,
      });
      massLabel.textContent = engine.s.weights[i];
      svg.append(massLabel);
      const label = vector("text", {
        x: 120 + (i + 0.5) * w,
        y: y + 35,
        "text-anchor": "middle",
        fill: "#e5fff4",
        "font-size": 18,
      });
      label.textContent = Math.round(lift * 100) + "%";
      svg.append(label);
    }
    for (let i = 0; i < engine.bridge.teeth.length; i++) {
      const id = i === 0 ? null : engine.s.gearSlots[i - 1],
        teeth = i === 0 ? 8 : id === null ? null : engine.bridge.inventory[id];
      if (!teeth) continue;
      const gear = gearPicture(teeth, "cave-mechanical-gear");
      const size = teeth * 10;
      gear.setAttribute(
        "x",
        String(180 + engine.bridge.axes[i] * 9 - size / 2),
      );
      gear.setAttribute("y", String(38 - size / 2));
      gear.setAttribute("width", String(size));
      gear.setAttribute("height", String(size));
      const rotor = vector("g", { class: "cave-rotor" });
      rotor.append(...Array.from(gear.childNodes));
      gear.append(rotor);
      rotor.dataset.spin =
        engine.s.lever && (i === 0 || engine.gearsWorking) ? "true" : "false";
      rotor.style.animationDirection = i % 2 ? "reverse" : "normal";
      rotor.style.animationDuration = (3 * teeth) / 8 + "s";
      svg.append(gear);
    }
    parent.append(svg);
  }
  function temple(work) {
    scene.classList.add("cave-temple");
    if (engine.s.zone === 2) {
      stoneDoor(scene, engine.s.opened);
      if (engine.s.opened) {
        const treasure = btn(
          scene,
          "Raccogli il cuore",
          () => engine.advance(),
          "cave-hotspot cave-heart",
        );
        treasure.prepend(glyph("sole"));
      }
    }
    work.append(node("h3", "Quattro scoperte, un solo segreto"));
    if (!engine.hasArtifacts) {
      work.append(
        node(
          "p",
          "Il taccuino non contiene ancora tutte e quattro le scoperte. Riprendi le missioni precedenti: nessun codice viene inventato al loro posto.",
        ),
      );
      return;
    }
    if (engine.s.zone === 0) {
      work.append(
        node(
          "p",
          engine.hard
            ? "Prendi la prima runa della porta, la seconda del motivo del pavimento, l’ultima della porta e l’ultima del motivo."
            : "Prendi la prima runa della porta, la seconda del motivo del pavimento e l’ultima della porta.",
        ),
      );
      codeBoard(work);
      work.append(
        node(
          "p",
          engine.codeCorrect
            ? "Le rune riconoscono il codice: il prisma si sblocca."
            : "Consulta i calchi nel taccuino: le parole prima, seconda e ultima indicano le posizioni.",
        ),
      );
    }
    if (engine.s.zone === 1) {
      if (engine.codeCorrect) {
        beamBoard(scene);
        btn(
          work,
          engine.s.lightOn ? "Spegni la torcia" : "Accendi la torcia",
          () => engine.toggleLight(),
        );
        mirrorControls(work);
        work.append(
          node(
            "p",
            "Il prisma combina la luce con le rune. Attraversa tutti i cristalli e raggiungi il sensore.",
          ),
        );
      } else
        work.append(
          node(
            "p",
            "Il prisma resta chiuso finché le rune non sono nell’ordine giusto.",
          ),
        );
    }
    if (engine.s.zone === 2) {
      work.append(
        node(
          "p",
          "Ripeti l’ordine dei colori annotato nella sala dei cristalli. Ripetilo tante volte quanti ingranaggi hai montato sul ponte.",
        ),
      );
      const pads = node("div", undefined, "cave-pulses");
      for (const color of Object.keys(COLORS)) {
        const b = btn(pads, "Suona " + color, () => engine.pulse(color));
        b.style.setProperty("--crystal", COLORS[color]);
        b.disabled =
          !engine.codeCorrect ||
          !engine.beam.sensor ||
          engine.s.pulse === engine.pulseAnswer.length;
      }
      work.append(
        pads,
        node(
          "p",
          `Note attivate ${engine.s.pulse}/${engine.pulseAnswer.length} · Luce ${engine.beam.sensor ? "pronta" : "spenta"}`,
        ),
      );
      btn(
        work,
        engine.s.opened ? "Recupera il quinto tesoro" : "Apri il santuario",
        () => engine.advance(),
      );
      if (engine.s.opened) scene.classList.add("cave-open");
    }
  }
  function inventory() {
    const details = node("details", undefined, "cave-inventory");
    details.open = ctx.stage === 5 || engine.s.clues.length > 0;
    details.append(node("summary", "Taccuino degli indizi"));
    if (ctx.stage === 1)
      for (const index of engine.s.clues)
        details.append(
          node(
            "p",
            "Incisione " + (index + 1) + " · " + engine.door.clues[index],
          ),
        );
    for (const [stage, d] of Object.entries(artifacts))
      details.append(
        node("h4", DISCOVERY_NAMES[stage - 1]),
        node("p", describeDiscovery(Number(stage), d)),
      );
    if (engine.s.discovery)
      details.append(
        node("h4", DISCOVERY_NAMES[ctx.stage - 1]),
        node("p", describeDiscovery(ctx.stage, engine.s.discovery)),
      );
    if (
      !engine.s.clues.length &&
      !Object.keys(artifacts).length &&
      !engine.s.discovery
    )
      details.append(
        node(
          "p",
          "Osserva un oggetto luminoso: gli indizi trovati resteranno qui.",
        ),
      );
    root.append(details);
  }
  function finale() {
    const room = node("div", undefined, "cave-victory");
    room.append(
      image(ctx.stage === 5 ? "cave-temple" : "cave-world", "cave-victory-art"),
      image("cave-explorer", "cave-victory-avatar"),
    );
    room.append(
      node(
        "h3",
        ctx.stage === 5
          ? "IL CUORE DELLA MONTAGNA È TUO!"
          : "Passaggio aperto!",
      ),
      node("p", engine.message),
      node(
        "p",
        ctx.stage === 5
          ? "Quinto tesoro e frammento della Bussola del Tempo ritrovati."
          : "Scoperta salvata nel diario. Scegli la prossima missione in alto.",
      ),
    );
    root.append(room);
  }
  ctx.getHints = () => {
    const area = engine.s.zone;
    const first = [
      "Cerca i dettagli luminosi nelle tre zone. La porta ama gli esploratori che osservano.",
      "Guarda dove si ferma il raggio: non può attraversare la roccia.",
      "Il pavimento tiene il ritmo. Io invece inciampo anche sulle note!",
      "Una leva da sola non basta: il movimento deve arrivare fino agli argani.",
      "Il tempio ricorda il viaggio: apri il taccuino, non la scatola delle risposte.",
    ][ctx.stage - 1];
    const second = [
      "Ogni incisione descrive una posizione o una relazione tra simboli. Raccoglile tutte prima di usare il portone.",
      "Immagina di camminare insieme al raggio. Sullo specchio / chi arriva da sinistra va in alto; chi sale va a destra.",
      "Leggi il motivo inciso e ricomincia dal primo simbolo quando finisce. Dopo il checkpoint non devi tornare all’inizio.",
      "Controlla prima le ruote, poi la leva e infine le tacche dei contrappesi. Troppo peso può sbilanciare il ponte.",
      "Le rune usano porta e pavimento; il raggio usa gli specchi; il ritmo usa colori e numero di ruote del ponte.",
    ][ctx.stage - 1];
    const third =
      ctx.stage === 1
        ? engine.hard
          ? "Metti in fila le tre relazioni «precede»: il simbolo che non ha nessuno prima apre la sequenza."
          : "Un indizio dice chi apre, uno chi è in mezzo e uno chi chiude: inseriscili nei tre alloggiamenti."
        : ctx.stage === 2
          ? "Ruota uno specchio alla volta. Cerca una curva che porti al cristallo successivo; se la luce esce dalla griglia, cambia l’ultimo specchio incontrato."
          : ctx.stage === 3
            ? "La prossima piastrella è nella riga subito sopra, al massimo una colonna più in là. Confronta il suo simbolo con il prossimo nel motivo."
            : ctx.stage === 4
              ? "Le ruote devono toccarsi: somma i loro denti e dividi per due per confrontare la distanza degli assi. Ogni argano si bilancia alla sua tacca."
              : area === 0
                ? "Prima, seconda e ultima sono posizioni nei calchi del taccuino, non nomi di simboli."
                : area === 1
                  ? "Il sensore si attiva solo dopo tutti i cristalli. Segui il raggio dall’ingresso fino all’ultima curva."
                  : "Leggi i colori nell’ordine in cui li incontrava il raggio. Il numero di ingranaggi montati indica quante volte ripetere il giro.";
    return ["Ehy Amico! " + first, second, third];
  };
  ctx.listen(window, "keydown", (ev) => {
    if (
      ctx.paused ||
      engine.s.won ||
      ctx.stage !== 3 ||
      engine.s.zone !== 1 ||
      !["ArrowLeft", "ArrowRight", "ArrowUp"].includes(ev.key) ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(ev.target.tagName)
    )
      return;
    ev.preventDefault();
    action(() => {
      if (ev.key === "ArrowLeft") focusTile = Math.max(0, focusTile - 1);
      else if (ev.key === "ArrowRight") focusTile = Math.min(4, focusTile + 1);
      else return engine.stepFloor(focusTile);
      engine.message = "Colonna selezionata: " + (focusTile + 1);
    })();
  });
  ctx.listen(ctx.play, "game:pausechange", () => {
    root.classList.toggle("cave-paused", ctx.paused);
    persist();
    if (audio) {
      if (ctx.paused) audio.suspend().catch(() => {});
      else audio.resume().catch(() => {});
    }
  });
  ctx.onCleanup(() => {
    panelController.abort();
    persist();
    audio?.close().catch(() => {});
  });
  persist();
  paint();
}
