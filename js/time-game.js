import { TimeEngine, taskValue, solutionHint } from "./time-engine.js";
import {
  node,
  button,
  installDrag,
  focusKey,
  preserveFocus,
} from "./education-dom.js";
const formatClock = (minutes) =>
  String(Math.floor(minutes / 60)).padStart(2, "0") +
  ":" +
  String(minutes % 60).padStart(2, "0");
export function timeMachine(ctx) {
  const e = new TimeEngine(
      ctx.stage,
      ctx.difficulty,
      ctx.restart ? null : ctx.readAdventure(),
    ),
    root = node("section", undefined, "education-game time-game");
  ctx.play.append(root);
  let selected = null;
  const persist = () => ctx.saveAdventure(e.export());
  const change = (fn) => {
    if (ctx.paused) return;
    fn();
    persist();
    render();
  };
  function connect(id, drop) {
    if (id === "crystal" && drop.startsWith("group:"))
      change(() => e.group("add", Number(drop.slice(6))));
    else if (id.startsWith("pour:") && drop === "tank")
      change(() => e.pour(Number(id.slice(5))));
    else if (id.startsWith("item:") && drop.startsWith("slot:"))
      change(() => e.connect(Number(id.slice(5)), Number(drop.slice(5))));
    selected = null;
  }
  installDrag(
    root,
    ctx,
    (id) => {
      if (id.startsWith("pour:")) change(() => e.pour(Number(id.slice(5))));
      else {
        selected = id;
        render();
      }
    },
    connect,
  );
  ctx.getHints = () =>
    e.done
      ? [
          "Ehy Amico! " + e.feedback,
          "La destinazione è nel Diario delle Scoperte. Il portale si ricorda di te!",
          "Puoi riprovare i viaggi senza duplicare i tesori.",
        ]
      : [
          "Ehy Amico! " +
            (e.task
              ? e.task.title
              : "Tutti gli strumenti sono riparati: puoi partire!"),
          e.task?.type === "groups"
            ? "Guarda i puntini nelle ruote: devono essere uguali e usare tutta la riserva."
            : e.task?.type === "tank"
              ? "Le tacche sono in millilitri: 1 litro corrisponde a 1000 millilitri."
              : e.task?.type === "clock"
                ? "Confronta le lancette e conta a salti di cinque minuti."
                : e.task?.type === "circuit"
                  ? "Il segno + aggiunge energia; il segno − la toglie. Guarda il totale mentre sposti le pile."
                  : "Osserva i numeri in ordine o conta i passi sul cruscotto.",
          solutionHint(e.task),
        ];
  ctx.onHint = (index) => {
    e.hint(index + 1);
    persist();
    render();
  };
  ctx.onCleanup(persist);
  ctx.listen(window, "keydown", (event) => {
    if (
      e.task?.type !== "coords" ||
      ctx.paused ||
      document.querySelector("dialog[open]") ||
      ["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(event.target.tagName)
    )
      return;
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    }[event.key];
    if (direction) {
      event.preventDefault();
      change(() => e.move(...direction));
    }
  });
  function render() {
    preserveFocus(root, () => {
      root.replaceChildren();
      const task = e.task;
      root.append(
        node(
          "p",
          "MECCANISMO " +
            Math.min(e.index + 1, e.tasks.length) +
            " / " +
            e.tasks.length,
          "eyebrow",
        ),
      );
      const progress = node("progress");
      progress.max = e.tasks.length;
      progress.value = e.history.length;
      progress.setAttribute("aria-label", "Meccanismi riparati");
      root.append(progress);
      const feedback = node("p", e.feedback, "edu-feedback");
      feedback.setAttribute("role", "status");
      root.append(feedback);
      if (e.done) {
        const arrival = node(
          "section",
          undefined,
          "arrival-scene arrival-" + ctx.stage,
        );
        arrival.append(
          node("div", undefined, "portal-ring"),
          node("h2", e.destination[0]),
          node("p", e.destination[1]),
          node("p", e.feedback, "radio-celebration"),
        );
        root.append(arrival);
        ctx.info("Destinazione raggiunta · Punti " + e.points);
        return;
      }
      if (!task) {
        root.append(
          node("h2", "Il portale è pronto"),
          node("div", undefined, "portal-ring"),
        );
        button(root, "Avvia il portale", () => {
          if (ctx.paused || !e.travel()) return;
          persist();
          ctx.play.dataset.state = "won";
          ctx.best("", e.points);
          ctx.complete(ctx.stage);
          render();
        });
        ctx.info(
          "Meccanismi " +
            e.history.length +
            "/" +
            e.tasks.length +
            " · Pronto al viaggio",
        );
        return;
      }
      root.append(node("h2", task.title));
      if (e.feedback.startsWith("Meccanismo riparato"))
        root.append(node("span", "Ruota riparata!", "success-wheel"));
      if (task.type === "circuit" || task.type === "order") renderSlots(task);
      else if (task.type === "groups") renderGroups(task);
      else if (task.type === "tank") renderTank(task);
      else if (task.type === "clock") renderClock(task);
      else renderCoords(task);
      if (e.visualHint >= 2)
        root.append(
          node(
            "p",
            task.type === "circuit"
              ? "Segui i segni dei connettori e osserva il totale."
              : task.type === "groups"
                ? "Confronta le file di cristalli: la divisione funziona quando ogni ruota riceve la stessa quantità."
                : task.type === "tank"
                  ? "Una dose da 500 mL vale due dosi da 250 mL."
                  : task.type === "clock"
                    ? "La lancetta corta segue le ore, quella lunga i minuti."
                    : "Leggi il cruscotto un passo alla volta.",
            "visual-hint",
          ),
        );
      const verify = button(root, "Prova il meccanismo", () =>
        change(() => {
          e.verify();
          selected = null;
        }),
      );
      focusKey(verify, "verify");
      ctx.info(
        "Meccanismi riparati " +
          e.history.length +
          "/" +
          e.tasks.length +
          " · Punti " +
          e.points,
      );
    });
  }
  function renderSlots(task) {
    const circuit = task.type === "circuit",
      values = task.values,
      inventory = node("div", undefined, "battery-tray");
    root.append(
      node(
        "p",
        circuit
          ? "Energia richiesta: " +
              task.target +
              " unità. Usa ogni pila una sola volta."
          : "Trascina i segnali negli alloggiamenti in ordine crescente. Puoi anche selezionare un numero e poi il suo posto.",
        "edu-target",
      ),
    );
    for (let id = values.length - 1; id >= 0; id--) {
      const b = button(
        inventory,
        String(values[id]),
        (event) => {
          if (event.detail === 0) {
            selected = "item:" + id;
            render();
          }
        },
        (circuit ? "energy-battery" : "sequence-card") +
          (selected === "item:" + id ? " selected" : ""),
      );
      b.dataset.drag = "item:" + id;
      b.setAttribute(
        "aria-label",
        (circuit ? "Pila " : "Segnale ") + values[id],
      );
      b.disabled = e.current.slots.includes(id);
      focusKey(b, "item-" + id);
    }
    root.append(
      inventory,
      node(
        "p",
        "Trascina, oppure seleziona un elemento e poi tocca un connettore. Senza selezione, un tocco sul connettore lo libera.",
        "edu-instruction",
      ),
    );
    const slots = node(
      "div",
      undefined,
      circuit ? "energy-circuit" : "sequence-rack",
    );
    for (let i = 0; i < e.current.slots.length; i++) {
      const id = e.current.slots[i],
        b = button(
          slots,
          (circuit ? (task.signs[i] === 1 ? "+" : "−") : "Posto " + (i + 1)) +
            ": " +
            (id === null ? "vuoto" : values[id]),
          () => {
            if (ctx.paused) return;
            if (selected?.startsWith("item:")) {
              e.connect(Number(selected.slice(5)), i);
              selected = null;
            } else e.remove(i);
            persist();
            render();
          },
          "energy-slot",
        );
      b.dataset.drop = "slot:" + i;
      focusKey(b, "slot-" + i);
    }
    root.append(slots);
    if (circuit) {
      const meter = node(
        "output",
        "Energia: " + taskValue(task, e.current) + " / " + task.target,
        "energy-meter",
      );
      root.append(meter);
    } else
      root.append(
        node(
          "p",
          "Segnali: " +
            e.current.slots
              .map((id) => (id === null ? "…" : values[id]))
              .join(" → "),
          "sequence-readout",
        ),
      );
  }
  function renderGroups(task) {
    const toolbar = node("div", undefined, "edu-toolbar");
    root.append(
      node(
        "p",
        "Riserva: " +
          (task.total - taskValue(task, e.current)) +
          " cristalli su " +
          task.total +
          (task.count ? " · Ruote richieste: " + task.count : ""),
        "edu-target",
      ),
    );
    focusKey(
      button(toolbar, "Aggiungi una ruota", () => change(() => e.group("new"))),
      "group-new",
    );
    focusKey(
      button(toolbar, "Togli l’ultima ruota", () =>
        change(() => e.group("remove")),
      ),
      "group-remove",
    );
    const crystal = button(
      toolbar,
      "Un cristallo",
      (event) => {
        if (event.detail === 0) {
          selected = "crystal";
          render();
        }
      },
      "crystal-source",
    );
    crystal.dataset.drag = "crystal";
    crystal.disabled = taskValue(task, e.current) === task.total;
    root.append(
      toolbar,
      node(
        "p",
        "Crea le ruote e distribuisci i cristalli. Trascina un cristallo su una ruota, oppure usa i pulsanti + e −.",
      ),
    );
    const groups = node("div", undefined, "gear-groups");
    e.current.groups.forEach((count, index) => {
      const group = node("section", undefined, "gear-group"),
        wheel = node("div", undefined, "gear-wheel");
      wheel.append(node("strong", String(count)));
      for (let n = 0; n < count; n++)
        wheel.append(node("i", undefined, "crystal-dot"));
      group.append(node("h3", "Ruota " + (index + 1)), wheel);
      const plus = button(group, "+ un cristallo", () =>
        change(() => e.group("add", index)),
      );
      plus.dataset.drop = "group:" + index;
      focusKey(plus, "group-add-" + index);
      focusKey(
        button(group, "− un cristallo", () =>
          change(() => e.group("take", index)),
        ),
        "group-take-" + index,
      );
      groups.append(group);
    });
    root.append(groups);
    if (e.current.groups.length) {
      const g = e.current.groups,
        equal = g.every((n) => n === g[0]);
      root.append(
        node(
          "p",
          equal
            ? g.length +
                " ruote × " +
                g[0] +
                " cristalli = " +
                taskValue(task, e.current)
            : g.length +
                " gruppi: " +
                g.join(" + ") +
                " = " +
                taskValue(task, e.current),
          "energy-meter",
        ),
      );
      if (equal && task.count)
        root.append(
          node(
            "p",
            taskValue(task, e.current) +
              " ÷ " +
              g.length +
              " = " +
              g[0] +
              " per ruota.",
          ),
        );
    }
  }
  function renderTank(task) {
    root.append(
      node(
        "p",
        "Richiesta: " + task.target + " mL · 1 L = 1000 mL",
        "edu-target",
      ),
    );
    const toolbar = node("div", undefined, "edu-toolbar");
    for (const value of [250, 500]) {
      const b = button(
        toolbar,
        "Versa " + value + " mL",
        (event) => {
          if (event.detail === 0) change(() => e.pour(value));
        },
        "measure-bottle",
      );
      b.dataset.drag = "pour:" + value;
      focusKey(b, "pour-" + value);
    }
    focusKey(
      button(toolbar, "Scarica 250 mL", () => change(() => e.pour(-250))),
      "drain",
    );
    root.append(
      toolbar,
      node(
        "p",
        "Trascina un dosatore nel serbatoio o toccalo per versare. Se superi la tacca, puoi scaricare e riprovare.",
      ),
    );
    const tank = node("div", undefined, "fuel-tank");
    tank.dataset.drop = "tank";
    tank.setAttribute("role", "meter");
    tank.setAttribute("aria-label", "Carburante in millilitri");
    tank.setAttribute("aria-valuemin", "0");
    tank.setAttribute("aria-valuemax", String(task.capacity));
    tank.setAttribute("aria-valuenow", String(e.current.level));
    const liquid = node("div", undefined, "tank-liquid");
    liquid.style.height = (e.current.level / task.capacity) * 100 + "%";
    tank.append(liquid);
    for (let value = 0; value <= task.capacity; value += 250) {
      const tick = node(
        "span",
        value % 500 === 0 ? value + " mL" : "",
        "tank-tick",
      );
      tick.style.bottom = (value / task.capacity) * 100 + "%";
      tank.append(tick);
    }
    root.append(
      tank,
      node("output", "Livello: " + e.current.level + " mL", "energy-meter"),
    );
  }
  function renderClock(task) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      "Orologio: " + formatClock(e.current.minutes),
    );
    svg.classList.add("time-clock");
    const make = (tag, attrs) => {
      const n = document.createElementNS(svg.namespaceURI, tag);
      for (const [key, value] of Object.entries(attrs))
        n.setAttribute(key, String(value));
      svg.append(n);
      return n;
    };
    make("circle", {
      cx: 50,
      cy: 50,
      r: 47,
      fill: "#fff4d0",
      stroke: "#8f6834",
      "stroke-width": 3,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      make("line", {
        x1: 50 + Math.sin(a) * 37,
        y1: 50 - Math.cos(a) * 37,
        x2: 50 + Math.sin(a) * 42,
        y2: 50 - Math.cos(a) * 42,
        stroke: "#234c40",
        "stroke-width": 2,
      });
    }
    make("line", {
      x1: 50,
      y1: 50,
      x2: 50,
      y2: 25,
      stroke: "#214e40",
      "stroke-width": 5,
      "stroke-linecap": "round",
      transform: "rotate(" + (e.current.minutes / 720) * 360 + " 50 50)",
    });
    make("line", {
      x1: 50,
      y1: 50,
      x2: 50,
      y2: 12,
      stroke: "#ba6834",
      "stroke-width": 3,
      "stroke-linecap": "round",
      transform: "rotate(" + (e.current.minutes % 60) * 6 + " 50 50)",
    });
    make("circle", { cx: 50, cy: 50, r: 4, fill: "#234c40" });
    root.append(
      svg,
      node("output", formatClock(e.current.minutes), "clock-readout"),
    );
    const controls = node("div", undefined, "edu-toolbar");
    for (const [label, value] of [
      ["− un’ora", -60],
      ["+ un’ora", 60],
      ["− 5 minuti", -5],
      ["+ 5 minuti", 5],
    ])
      focusKey(
        button(controls, label, () => change(() => e.turn(value))),
        "clock-" + value,
      );
    root.append(controls);
  }
  function renderCoords(task) {
    root.append(
      node(
        "p",
        "Est è verso destra, nord verso l’alto. Conta i passi dal punto di partenza.",
      ),
    );
    const grid = node("div", undefined, "coordinate-grid");
    grid.style.setProperty("--size", task.size);
    grid.setAttribute("role", "img");
    grid.setAttribute(
      "aria-label",
      "Coordinate: x " + e.current.x + ", y " + e.current.y,
    );
    for (let y = task.size - 1; y >= 0; y--)
      for (let x = 0; x < task.size; x++) {
        const cell = node(
          "span",
          x + ", " + y,
          "coordinate-cell" +
            (x === e.current.x && y === e.current.y ? " current" : ""),
        );
        grid.append(cell);
      }
    root.append(
      grid,
      node(
        "output",
        "Coordinate (" + e.current.x + ", " + e.current.y + ")",
        "energy-meter",
      ),
    );
    const controls = node("div", undefined, "edu-toolbar");
    for (const [label, dx, dy] of [
      ["Ovest", -1, 0],
      ["Nord", 0, 1],
      ["Sud", 0, -1],
      ["Est", 1, 0],
    ])
      focusKey(
        button(controls, label, () => change(() => e.move(dx, dy))),
        "coord-" + label,
      );
    root.append(controls);
  }
  render();
}
