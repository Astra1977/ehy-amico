const entries = [
  ["roach", "Acchiappa la Cucaracha", "Riflessi nella giungla", "giungla", 2],
  ["runner", "Salta la Cacca", "Un sentiero pieno di sorprese", "sentiero", 2],
  ["tetris", "Tetris", "Metti ordine nel tempo", "cristalli", 2],
  ["maze", "Labirinto", "Segui le tracce segrete", "labirinto", 2],
  ["memory", "Memory", "Ricordi da esploratore", "carte", 2],
  ["car", "Out Run", "In viaggio verso l’ignoto", "strada", 2],
  [
    "jurassic",
    "Jurassic — La Spedizione Perduta",
    "La terra racconta la sua storia",
    "fossili",
    3,
  ],
  [
    "time",
    "La Macchina del Tempo",
    "La matematica accende il motore",
    "portale",
    3,
  ],
  ["atlas", "L’Atlante Segreto", "Un mondo da scoprire", "atlante", 3],
  [
    "cave",
    "Il Mistero della Grotta",
    "Osserva. Collega. Risolvi.",
    "grotta",
    3,
  ],
  [
    "lab",
    "Il Laboratorio degli Esploratori",
    "Ogni domanda è un esperimento",
    "laboratorio",
    3,
  ],
  [
    "polo",
    "Campione di Pallanuoto",
    "La squadra fa la differenza",
    "piscina",
    3,
  ],
];
export const REGIONS = [
  "Giungla dei Riflessi",
  "Sentiero delle Sorprese",
  "Tempio dei Cristalli",
  "Giardino dei Sentieri",
  "Archivio dei Ricordi",
  "Costa del Tramonto",
  "Valle dei Giganti",
  "Portale del Tempo",
  "Osservatorio del Mondo",
  "Grotta degli Indizi",
  "Isola della Scienza",
  "Laguna dei Campioni",
];
export const GAMES = Object.freeze(
  entries.map(([id, name, description, art, phase], i) =>
    Object.freeze({
      id,
      name,
      description,
      art,
      phase,
      number: i + 1,
      region: REGIONS[i],
      status: [
        "roach",
        "runner",
        "tetris",
        "maze",
        "memory",
        "car",
        "jurassic",
        "time",
      ].includes(id)
        ? "playable"
        : "planned",
      missions: 5,
      difficulties: ["Esploratore", "Avventuriero", "Esperto"],
    }),
  ),
);
export const gameById = (id) => GAMES.find((game) => game.id === id);
