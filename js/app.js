import { GAMES, gameById } from "./catalog.js";
import { createStore, totals } from "./progress.js";
import "./pwa.js";
import { HERO_ART } from "./artwork.js";
let storage;
try {
  storage = localStorage;
} catch {
  storage = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
}
const store = createStore(storage),
  main = document.querySelector("main"),
  radio = document.querySelector("#radio");
const hints = [
  "Esplora la mappa: ogni tappa custodirà un frammento della Bussola del Tempo. Le avventure sono ancora in preparazione.",
  "Cinque obiettivi per ogni avventura, cinque tesori da conquistare. Il frammento si ricompone quando li completi tutti!",
  "Il Diario raccoglierà ciò che scopri giocando. Non serve correre: osservare è il primo superpotere di un esploratore.",
];
let hint = 0;
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const link = (text, to, className = "button") => {
  const a = el("a", text, className);
  a.href = "#" + to;
  return a;
};
function heading(title, text) {
  main.append(el("p", "LA BUSSOLA DEL TEMPO", "eyebrow"), el("h1", title));
  if (text) main.append(el("p", text, "muted"));
}
function gems(n) {
  const row = el("span");
  row.setAttribute("aria-label", n + " ricompense su 5");
  for (let i = 0; i < 5; i++) {
    const gem = el("i", undefined, "medal" + (i < n ? " earned" : ""));
    gem.setAttribute("aria-hidden", "true");
    row.append(gem);
  }
  return row;
}
function cards(map = false) {
  const grid = el("div", undefined, "grid" + (map ? " map" : ""));
  for (const g of GAMES) {
    const card = link("", "game/" + g.id, "card");
    card.dataset.number = g.number;
    const img = gameArt(g);
    const body = el("div", undefined, "card-body");
    body.append(
      el("small", "AVVENTURA " + String(g.number).padStart(2, "0")),
      el("h3", g.name),
      el("p", g.description),
      el("span", "In preparazione · Fase " + g.phase, "tag"),
    );
    card.append(img, body);
    grid.append(card);
  }
  return grid;
}
function stats() {
  const t = totals(store.data),
    row = el("div", undefined, "stats");
  for (const [n, label] of [
    [t.fragments + "/12", "frammenti della Bussola"],
    [t.rewards + "/60", "tesori conquistati"],
  ]) {
    const item = el("div");
    item.append(el("strong", n), " ", el("span", label));
    row.append(item);
  }
  return row;
}
function gameArt(g) {
  const frame = el("div", undefined, "game-art");
  frame.style.setProperty("--col", (g.number - 1) % 4);
  frame.style.setProperty("--row", Math.floor((g.number - 1) / 4));
  frame.dataset.art = g.art;
  const image = el("img");
  image.src = "./assets/" + g.art + ".svg";
  image.alt = "";
  frame.append(image);
  return frame;
}
function showHome() {
  const hero = el("section", undefined, "hero splash"),
    copy = el("div", undefined, "hero-copy");
  copy.append(
    el("span", "UNA GRANDE AVVENTURA STA PER INIZIARE", "eyebrow"),
    el("h1", "EHY AMICO!"),
    el("p", "Il Mistero del Tempo Perduto", "hero-subtitle"),
    el(
      "p",
      "Ehy Amico! Sono lo Zio Inventore. Un piccolo pasticcio ha sparso dodici frammenti della Bussola del Tempo. Prepara lo zaino: ci aspettano mondi incredibili!",
    ),
    link("Inizia l’avventura", "map"),
  );
  const visual = el("div", undefined, "hero-visual");
  const img = el("img");
  img.src = HERO_ART.src;
  img.alt = HERO_ART.alt;
  img.className = "hero-portrait";
  img.width = HERO_ART.width;
  img.height = HERO_ART.height;
  visual.append(img);
  const caption = el("span", "VERSO L’IGNOTO, INSIEME", "hero-caption");
  visual.append(caption);
  hero.append(copy, visual);
  main.append(hero, stats());
  const head = el("div", undefined, "section-head");
  const words = el("div");
  words.append(
    el("p", "DODICI TAPPE. UN SOLO GRANDE MISTERO.", "eyebrow"),
    el("h2", "Scegli la prossima scoperta"),
    el("p", "La mappa è pronta. I giochi arriveranno nelle prossime fasi."),
  );
  head.append(words);
  const b = el("button", "Chiedi allo Zio");
  b.onclick = () => radio.showModal();
  head.append(b);
  main.append(head, cards());
}
function game(id) {
  const g = gameById(id);
  if (!g) {
    heading(
      "Questa tappa non è sulla mappa.",
      "Torniamo alla base per scegliere una nuova direzione.",
    );
    main.append(link("Torna alla base", "home"));
    return;
  }
  store.visit(id);
  const panel = el("section", undefined, "panel");
  const img = gameArt(g);
  panel.append(
    img,
    el("p", "AVVENTURA " + g.number + " / 12", "eyebrow"),
    el("h1", g.name),
    el("p", g.description),
    el(
      "p",
      "Lo Zio Inventore sta preparando questa avventura. Sarà disponibile nella Fase " +
        g.phase +
        ". Qui troverai cinque obiettivi e tre livelli di difficoltà.",
    ),
    gems(store.data.games[id].completed),
  );
  const actions = el("div", undefined, "actions");
  actions.append(link("Torna alla mappa", "map"));
  const b = el("button", "Chiedi allo Zio", "secondary");
  b.onclick = () => radio.showModal();
  actions.append(b);
  panel.append(actions);
  main.append(panel);
}
function diary() {
  heading(
    "Diario delle Scoperte",
    "Le idee più preziose si portano nello zaino.",
  );
  const p = el("section", undefined, "panel empty notebook");
  p.append(
    el("h2", "Una pagina bianca, mille possibilità."),
    el(
      "p",
      "Le prime scoperte compariranno qui quando completerai le missioni educative. Ogni pagina racconterà ciò che hai osservato e imparato.",
    ),
    link("Sfoglia la mappa", "map"),
  );
  main.append(p);
}
function rewards() {
  heading(
    "La collezione dei tesori",
    "Cinque ricompense per avventura. Un frammento per ogni percorso completato.",
  );
  main.append(stats(), compass());
  const list = el("div", undefined, "panel reward-list notebook");
  for (const g of GAMES) {
    const row = el("div", undefined, "reward-row");
    row.append(el("strong", g.name), gems(store.data.games[g.id].completed));
    list.append(row);
  }
  main.append(list);
}
function compass() {
  const section = el("section", undefined, "compass-collection");
  section.append(
    el("h2", "La Bussola del Tempo"),
    el("p", "Dodici frammenti. Una grande avventura.", "muted"),
  );
  const wheel = el("div", undefined, "compass-wheel");
  const center = el("img");
  center.src = "./icons/compass.svg";
  center.alt = "Bussola del Tempo";
  wheel.append(center);
  for (const g of GAMES) {
    const earned = store.data.games[g.id].completed === 5;
    const fragment = link(
      "",
      "game/" + g.id,
      "fragment" + (earned ? " earned" : ""),
    );
    fragment.style.setProperty("--angle", (g.number - 1) * 30 + "deg");
    fragment.setAttribute(
      "aria-label",
      g.name + ": frammento " + (earned ? "conquistato" : "da scoprire"),
    );
    fragment.append(el("span", String(g.number)));
    wheel.append(fragment);
  }
  section.append(wheel);
  return section;
}
function adventureMap() {
  heading(
    "La mappa delle avventure",
    "Segui il sentiero, scegli una tappa e preparati alla scoperta.",
  );
  main.append(stats());
  const toolbar = el("div", undefined, "map-toolbar");
  const pathButton = el("button", "Percorso illustrato"),
    gridButton = el("button", "Griglia accessibile", "secondary");
  toolbar.append(pathButton, gridButton);
  main.append(toolbar);
  const path = el("section", undefined, "adventure-path");
  path.id = "illustrated-path";
  path.setAttribute("aria-label", "Percorso delle dodici avventure");
  for (const g of GAMES) {
    const stop = link("", "game/" + g.id, "map-stop");
    stop.style.setProperty("--stop", g.number - 1);
    stop.append(gameArt(g));
    const label = el("div", undefined, "stop-label");
    label.append(
      el("small", "TAPPA " + String(g.number).padStart(2, "0")),
      el("h2", g.name),
      el("p", g.region),
      el("span", "In preparazione", "tag"),
    );
    stop.append(label);
    path.append(stop);
  }
  const grid = cards(true);
  grid.id = "accessible-grid";
  grid.hidden = true;
  function setView(illustrated) {
    path.hidden = !illustrated;
    grid.hidden = illustrated;
    pathButton.setAttribute("aria-pressed", String(illustrated));
    gridButton.setAttribute("aria-pressed", String(!illustrated));
  }
  pathButton.onclick = () => setView(true);
  gridButton.onclick = () => setView(false);
  pathButton.setAttribute("aria-controls", path.id);
  gridButton.setAttribute("aria-controls", grid.id);
  setView(true);
  main.append(path, grid);
}
function settings() {
  heading(
    "Prepara il tuo zaino",
    "Le preferenze vengono salvate solo in questo browser.",
  );
  const panel = el("section", undefined, "panel");
  const sound = el("button");
  const update = () => {
    sound.textContent =
      "Audio: " + (store.data.settings.sound ? "attivo" : "disattivato");
    sound.setAttribute("aria-pressed", String(store.data.settings.sound));
  };
  update();
  sound.onclick = () => {
    store.data.settings.sound = !store.data.settings.sound;
    store.save();
    update();
    warning();
  };
  panel.append(
    sound,
    el(
      "p",
      "La base è silenziosa. Questa preferenza sarà usata dai giochi con audio.",
    ),
  );
  const label = el("label", "Difficoltà delle avventure "),
    select = el("select");
  for (const [i, name] of [
    "Esploratore",
    "Avventuriero",
    "Esperto",
  ].entries()) {
    const o = el("option", name);
    o.value = i;
    select.append(o);
  }
  select.value = store.data.settings.difficulty;
  select.onchange = () => {
    store.data.settings.difficulty = Number(select.value);
    store.save();
    warning();
  };
  label.append(select);
  panel.append(
    label,
    el(
      "p",
      "Per giocare senza connessione, aspetta il messaggio “Zaino pronto: disponibile offline”. Su iPhone o iPad usa Condividi → Aggiungi alla schermata Home. Su Android usa il menu del browser → Installa app.",
    ),
    el(
      "p",
      "Il browser può eliminare i dati del sito. La navigazione privata o lo spazio esaurito possono impedire il salvataggio. Gli aggiornamenti normali mantengono i progressi.",
    ),
  );
  main.append(panel);
}
function warning() {
  let node = document.querySelector("#save-warning");
  if (store.warning) {
    if (!node) {
      node = el("p", undefined, "notice");
      node.id = "save-warning";
      node.setAttribute("role", "status");
      main.prepend(node);
    }
    node.textContent = store.warning;
  }
}
let initial = true;
function render() {
  main.replaceChildren();
  const route = location.hash.slice(1) || "home";
  document.querySelectorAll("nav a").forEach((a) => {
    if (a.hash === "#" + route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (route === "home") showHome();
  else if (route === "map") {
    adventureMap();
  } else if (route === "diary") diary();
  else if (route === "rewards") rewards();
  else if (route === "settings") settings();
  else if (route.startsWith("game/")) game(route.slice(5));
  else {
    heading("Sentiero sconosciuto", "La base ti aspetta.");
    main.append(link("Torna alla base", "home"));
  }
  warning();
  if (!initial) {
    main.focus();
    window.scrollTo(0, 0);
  }
  initial = false;
}
document.querySelector("#hint").textContent = hints[0];
document.querySelector("#more").onclick = () => {
  hint = Math.min(hint + 1, hints.length - 1);
  document.querySelector("#hint").textContent = hints[hint];
  document.querySelector("#more").disabled = hint === hints.length - 1;
};
window.addEventListener("hashchange", render);
render();
