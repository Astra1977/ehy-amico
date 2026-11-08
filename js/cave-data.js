export const CAVE_TITLES = [
  "L’ingresso proibito",
  "La sala dei cristalli",
  "Il pavimento misterioso",
  "Il ponte dimenticato",
  "Il cuore della montagna",
];
export const SYMBOLS = ["sole", "onda", "foglia", "luna"];
export const COLORS = {
  ambra: "#ffc65a",
  azzurro: "#6fe9f4",
  verde: "#a5f5a0",
};
export const ZONES = [
  ["Parete incisa", "Nicchia delle radici", "Portone di pietra"],
  ["La sorgente", "Galleria degli specchi", "Porta del sensore"],
  ["La stele del ritmo", "Pavimento sospeso", "Uscita della sala"],
  ["Officina degli ingranaggi", "Argani del ponte", "Accesso al ponte"],
  ["Le rune degli antenati", "Il prisma del tempio", "Santuario"],
];
export function doorPuzzle(seed, hard) {
  const count = hard ? 4 : 3,
    order = Array.from(
      { length: count },
      (_, i) => SYMBOLS[(i + seed) % count],
    );
  return {
    order,
    clues: hard
      ? [
          `${order[0]} precede ${order[1]}.`,
          `${order[1]} precede ${order[2]}.`,
          `${order[2]} precede ${order[3]}.`,
        ]
      : [
          `${order[0]} apre il cammino.`,
          `${order[1]} è tra gli altri due simboli.`,
          `${order[2]} chiude la fila.`,
        ],
  };
}
export function lightPuzzle(hard) {
  return hard
    ? {
        width: 9,
        height: 7,
        source: [0, 4],
        dir: 0,
        mirrors: [
          { x: 2, y: 4, goal: "/" },
          { x: 2, y: 1, goal: "/" },
          { x: 7, y: 1, goal: "\\" },
          { x: 7, y: 5, goal: "/" },
        ],
        walls: [
          [4, 4],
          [6, 3],
          [1, 1],
          [3, 2],
        ],
        crystals: [
          { x: 2, y: 2, color: "ambra" },
          { x: 5, y: 1, color: "azzurro" },
          { x: 5, y: 5, color: "verde" },
        ],
        sensor: [3, 5],
      }
    : {
        width: 7,
        height: 6,
        source: [0, 3],
        dir: 0,
        mirrors: [
          { x: 2, y: 3, goal: "/" },
          { x: 2, y: 1, goal: "/" },
          { x: 5, y: 1, goal: "\\" },
        ],
        walls: [
          [3, 3],
          [4, 4],
          [1, 1],
        ],
        crystals: [
          { x: 2, y: 2, color: "ambra" },
          { x: 4, y: 1, color: "azzurro" },
        ],
        sensor: [5, 4],
      };
}
export function floorPuzzle(seed, hard) {
  const rows = hard ? 8 : 6,
    cols = 5,
    motif = hard
      ? ["sole", "sole", "onda", "foglia"]
      : ["sole", "onda", "foglia"];
  const rotated = motif.map((_, i) => motif[(i + seed) % motif.length]);
  let col = 2;
  const path = [col],
    tiles = [];
  for (let step = 1; step < rows; step++) {
    col = Math.max(0, Math.min(cols - 1, col + [-1, 0, 1][(seed + step) % 3]));
    path.push(col);
    const target = rotated[(step - 1) % rotated.length];
    tiles.push(
      Array.from({ length: cols }, (_, x) =>
        x === col
          ? target
          : SYMBOLS.filter((s) => s !== target)[(seed + step + x) % 3],
      ),
    );
  }
  return { rows, cols, motif: rotated, path, tiles };
}
export function bridgePuzzle(hard) {
  return {
    teeth: hard ? [8, 6, 4, 6] : [8, 6, 4],
    axes: hard ? [0, 7, 12, 17] : [0, 7, 12],
    targets: hard ? [2, 3, 4] : [2, 3],
    inventory: hard ? [6, 4, 8, 6] : [6, 4, 8],
  };
}
export const DISCOVERY_NAMES = [
  "Calco della porta",
  "Spettro dei cristalli",
  "Ritmo del pavimento",
  "Taccuino del ponte",
  "Cuore della montagna",
];
export function describeDiscovery(stage, d) {
  if (!d) return "";
  return stage === 1
    ? `Ordine delle rune: ${d.order.join(" → ")}.`
    : stage === 2
      ? `Ordine dei cristalli lungo il raggio: ${d.colors.join(" → ")}.`
      : stage === 3
        ? `Motivo del pavimento: ${d.motif.join(" → ")}; poi si ripete.`
        : stage === 4
          ? `Il ponte trasmette il movimento con ${d.gears} ingranaggi montati. Ripeti il ritmo questo numero di volte.`
          : "Santuario aperto con simboli, luce, ritmo e ingranaggi.";
}
