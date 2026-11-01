// Schede divulgative locali: ricostruzioni schematiche, non in scala.
export const SPECIES = {
  stego: {
    name: "Stegosauro",
    period: "Giurassico superiore",
    fact: "Lo Stegosauro era un dinosauro erbivoro. Le grandi placche lungo il dorso e le spine sulla coda sono caratteristiche riconoscibili.",
    clue: "Cranio piccolo e denti adatti a lavorare vegetali. Le placche non erano ali.",
  },
  tyranno: {
    name: "Tirannosauro",
    period: "Cretaceo superiore",
    fact: "Il Tyrannosaurus rex era un dinosauro carnivoro. Aveva denti robusti e seghettati. Camminava su due zampe; le braccia erano piccole.",
    clue: "Osserva i denti robusti e seghettati e il cranio grande. Non tutti i dinosauri mangiavano la stessa cosa.",
  },
  trice: {
    name: "Triceratopo",
    period: "Cretaceo superiore",
    fact: "Il Triceratopo era un dinosauro erbivoro. Aveva un becco, denti per lavorare vegetali, un collare osseo e tre corna sul cranio.",
    clue: "Il becco tagliava vegetali. I denti nella bocca aiutavano a lavorarli; le corna non servivano a masticare.",
  },
  diplo: {
    name: "Diplodoco",
    period: "Giurassico superiore",
    fact: "Il Diplodoco era un dinosauro erbivoro con collo e coda lunghi. La posizione del collo durante le diverse attività è studiata attraverso modelli e fossili.",
    clue: "Collo lungo, testa piccola e quattro grandi zampe: confronta tutto lo scheletro, non un solo osso.",
  },
  ptera: {
    name: "Pteranodonte",
    period: "Cretaceo superiore",
    fact: "Il Pteranodonte era uno pterosauro, un rettile volante, non un dinosauro. Le ali erano sostenute soprattutto da un dito molto allungato.",
    clue: "Le lunghe ossa dell’ala sostenevano una membrana. Un animale preistorico volante non è per forza un dinosauro.",
  },
};
const part = (id, label, kind, species, site, x, y) => ({
  id,
  label,
  kind,
  species,
  site,
  x,
  y,
});
export const JURASSIC_MISSIONS = [
  {
    title: "Il primo fossile",
    sites: ["Scavo guidato"],
    parts: [
      part("s-cranio", "Cranio piccolo", "skull", "stego", 0, 78, 35),
      part("s-placca", "Placca dorsale", "plate", "stego", 0, 50, 35),
      part("s-coda", "Spine della coda", "tail", "stego", 0, 20, 45),
    ],
    assemble: false,
    labels: [],
    trace: false,
    lesson:
      "Un fossile può essere un resto o una traccia di un organismo antico, non soltanto un osso.",
  },
  {
    title: "Le ossa misteriose",
    sites: ["Parete delle Placche"],
    parts: [
      part("s-cranio", "Cranio piccolo", "skull", "stego", 0, 80, 34),
      part("s-colonna", "Colonna vertebrale", "spine", "stego", 0, 52, 43),
      part("s-placca", "Placche dorsali", "plate", "stego", 0, 48, 24),
      part("s-arti", "Arti robusti", "leg", "stego", 0, 55, 72),
      part("s-coda", "Coda con spine", "tail", "stego", 0, 19, 44),
    ],
    assemble: true,
    labels: [],
    trace: false,
    lesson:
      "Le ossa si confrontano per forma e posizione. La ricostruzione qui è uno schema, non un modello anatomico esatto.",
  },
  {
    title: "Il predatore e l’erbivoro",
    sites: ["Sito A: denti seghettati", "Sito B: becco e collare"],
    parts: [
      part("t-cranio", "Grande cranio", "skull", "tyranno", 0, 72, 35),
      part("t-denti", "Denti seghettati", "teeth", "tyranno", 0, 72, 58),
      part("t-arti", "Arti posteriori", "leg", "tyranno", 0, 30, 66),
      part("c-cranio", "Cranio con tre corna", "horned", "trice", 1, 72, 35),
      part("c-denti", "Denti per vegetali", "grinding", "trice", 1, 72, 58),
      part("c-arti", "Arti robusti", "leg", "trice", 1, 30, 66),
    ],
    assemble: true,
    labels: [
      {
        specimen: "tyranno",
        answer: "Carnivoro",
        choices: ["Carnivoro", "Erbivoro"],
      },
      {
        specimen: "trice",
        answer: "Erbivoro",
        choices: ["Carnivoro", "Erbivoro"],
      },
    ],
    trace: false,
    lesson:
      "Si ricostruisce l’alimentazione confrontando denti, cranio e altri indizi insieme.",
  },
  {
    title: "La valle dimenticata",
    sites: ["Riva del Fiume", "Radura dei Passi", "Parete del Collo"],
    parts: [
      part("d-testa", "Testa piccola", "skull", "diplo", 2, 85, 27),
      part("d-collo", "Collo lungo", "neck", "diplo", 2, 70, 36),
      part("d-colonna", "Colonna vertebrale", "spine", "diplo", 0, 47, 45),
      part("d-costole", "Costole", "ribs", "diplo", 0, 50, 60),
      part("d-bacino", "Bacino", "pelvis", "diplo", 1, 32, 54),
      part("d-zampe", "Quattro arti", "leg", "diplo", 1, 46, 80),
      part("d-coda", "Coda lunga", "tail", "diplo", 0, 15, 41),
    ],
    assemble: true,
    labels: [
      {
        specimen: "diplo",
        answer: "Diplodoco",
        choices: ["Diplodoco", "Pteranodonte"],
      },
    ],
    trace: true,
    lesson:
      "Le impronte sono tracce fossili. Danno indizi sul movimento, ma non sempre permettono di riconoscere la specie con certezza.",
  },
  {
    title: "Il Museo del Tempo",
    sites: ["Argilla del Becco", "Sabbia delle Ali", "Sentiero delle Tracce"],
    parts: [
      part("c-cranio", "Cranio con tre corna", "horned", "trice", 0, 76, 32),
      part("c-costole", "Costole", "ribs", "trice", 0, 49, 49),
      part("c-arti", "Arti robusti", "leg", "trice", 2, 50, 77),
      part("c-coda", "Coda", "tail", "trice", 2, 20, 42),
      part("p-cranio", "Cranio con becco", "beak", "ptera", 1, 73, 29),
      part("p-ala", "Dito alare allungato", "wing", "ptera", 1, 33, 35),
      part("p-costole", "Torace", "ribs", "ptera", 2, 53, 56),
      part("p-arti", "Arti posteriori", "leg", "ptera", 2, 50, 78),
    ],
    assemble: true,
    labels: [
      {
        specimen: "trice",
        answer: "Dinosauro",
        choices: ["Dinosauro", "Pterosauro"],
      },
      {
        specimen: "ptera",
        answer: "Pterosauro",
        choices: ["Dinosauro", "Pterosauro"],
      },
    ],
    trace: true,
    lesson:
      "Pterosauri e dinosauri sono gruppi diversi. Gli uccelli, invece, sono dinosauri viventi.",
  },
];
const circuit = (title, values, target, signs) => ({
  type: "circuit",
  title,
  values,
  target,
  signs,
});
const groups = (title, total, count = null) => ({
  type: "groups",
  title,
  total,
  count,
});
const tank = (title, target, start = 0) => ({
  type: "tank",
  title,
  target,
  start,
  capacity: 2500,
});
const clock = (title, start, target) => ({
  type: "clock",
  title,
  start,
  target,
});
const order = (title, values) => ({ type: "order", title, values });
const coords = (title, x, y) => ({
  type: "coords",
  title,
  start: [1, 1],
  target: [x, y],
  size: 6,
});
export const TIME_DESTINATIONS = [
  [
    "Bosco delle Felci",
    "Il motore ha trovato il suo ritmo. La luce filtra tra felci gigantesche.",
  ],
  [
    "Officina delle Ruote",
    "Le ruote girano insieme: ogni gruppo ha la sua parte di energia.",
  ],
  [
    "Giardino delle Gocce",
    "I serbatoi sono in equilibrio. Qui anche una piccola goccia conta.",
  ],
  [
    "Osservatorio delle Stelle",
    "Gli strumenti sono sincronizzati: la rotta è pronta sotto le stelle.",
  ],
  [
    "Isola dell’Alba",
    "Il grande salto è riuscito! La Bussola del Tempo brilla di una nuova luce.",
  ],
];
export const TIME_TITLES = [
  "Accendi il motore",
  "Gli ingranaggi impazziti",
  "Il carburante temporale",
  "Le coordinate perdute",
  "Il grande salto temporale",
];
export function timeTasks(stage, difficulty = 0) {
  const d = difficulty;
  if (stage === 1) {
    const a = [
        [3, 7, 4, 6],
        [6, 9, 5, 10],
        [16, 19, 12, 23],
      ][d],
      sub = [
        [12, 4, 7, 2],
        [30, 12, 8, 5],
        [70, 28, 20, 12],
      ][d],
      v = [
        [7, 8, 9, 4],
        [12, 14, 13, 5],
        [21, 24, 27, 10],
      ][d];
    return [
      circuit(
        "Collega due pile per accendere la lampada.",
        a,
        a[0] + a[1],
        [1, 1],
      ),
      circuit(
        "Stabilizza il motore: il secondo connettore sottrae energia.",
        sub,
        sub[0] - sub[1],
        [1, -1],
      ),
      circuit(
        "Tre pile devono lavorare insieme.",
        v,
        v[0] + v[1] + v[2],
        [1, 1, 1],
      ),
    ];
  }
  if (stage === 2)
    return [
      groups(
        "Costruisci gruppi uguali: ogni ruota deve avere lo stesso numero di cristalli.",
        [12, 18, 24][d],
      ),
      groups(
        "Un secondo ingranaggio chiede gruppi uguali con una quantità maggiore.",
        [20, 24, 30][d],
      ),
      groups(
        "Distribuisci tutti i cristalli in " + [4, 4, 5][d] + " gruppi uguali.",
        [12, 20, 30][d],
        [4, 4, 5][d],
      ),
    ];
  if (stage === 3)
    return [
      tank(
        "Riempi la riserva piccola: usa i dosatori da 250 e 500 mL.",
        [750, 1250, 1500][d],
      ),
      tank(
        d === 2
          ? "Servono due litri e 250 millilitri."
          : "Servono un litro e " + [250, 750][d] + " millilitri.",
        [1250, 1750, 2250][d],
      ),
      tank(
        "La riserva è troppo piena: scarica solo il carburante in eccesso.",
        [1000, 1500, 2000][d],
        [1500, 2000, 2500][d],
      ),
    ];
  if (stage === 4)
    return [
      clock(
        "Parti alle 9:00. Il viaggio dura " +
          [30, 45, 55][d] +
          " minuti: imposta l’arrivo.",
        540,
        540 + [30, 45, 55][d],
      ),
      order(
        "Metti in ordine crescente i segnali della rotta.",
        [
          [6, 12, 18, 24],
          [7, 14, 21, 28, 35],
          [9, 18, 27, 36, 45],
        ][d],
      ),
      coords(
        "Parti da (1,1). Vai " +
          [3, 2, 3][d] +
          " passi a est e " +
          [1, 3, 3][d] +
          " a nord.",
        [4, 3, 4][d],
        [2, 4, 4][d],
      ),
    ];
  return [
    circuit(
      "Ripara il circuito finale: aggiungi energia e poi sottrai la seconda pila.",
      [42, 17, 25, 8],
      25,
      [1, -1],
    ),
    groups("Distribuisci 24 cristalli in quattro ruote uguali.", 24, 4),
    tank(
      "Carica " + [1250, 1750, 2250][d] + " mL per il grande salto.",
      [1250, 1750, 2250][d],
    ),
    clock(
      "Sono le 10:40. Il salto dura " +
        [35, 45, 55][d] +
        " minuti. Imposta l’arrivo.",
      640,
      640 + [35, 45, 55][d],
    ),
    coords("Parti da (1,1). Vai tre passi a est e tre a nord.", 4, 4),
  ];
}
export const EDUCATION_OBJECTIVES = {
  jurassic: JURASSIC_MISSIONS.map((m) => m.title),
  time: TIME_TITLES,
};
