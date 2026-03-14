const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Elections La Fleche 2026";
pres.title = "Municipales La Fleche 2026 - Analyse Prospective";

// === COLOR PALETTE ===
const BG_DARK = "1B2A4A";
const BG_MID = "243656";
const BG_LIGHT = "2D4268";
const TEXT_WHITE = "FFFFFF";
const TEXT_LIGHT = "B0BEC5";
const TEXT_MUTED = "78909C";
const ACCENT = "4FC3F7";
const LEMOIGNE = "5C6BC0";   // Indigo
const DASILVA = "2196F3";    // Blue
const GRELET = "E91E63";     // Pink
const SUCCESS = "66BB6A";
const WARNING = "FFA726";
const DANGER = "EF5350";

// Helper: fresh shadow object (PptxGenJS mutates options)
const makeShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.25 });
const makeCardBg = (x, y, w, h, color) => ({
  x, y, w, h, fill: { color: color || BG_LIGHT }, shadow: makeShadow()
});

// ============================================================
// SLIDE 1: TITLE
// ============================================================
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };

// Decorative top bar
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

// Title
s1.addText("Municipales La Fleche 2026", {
  x: 0.8, y: 1.2, w: 8.4, h: 1.0,
  fontSize: 38, fontFace: "Calibri", bold: true, color: TEXT_WHITE,
  align: "left", margin: 0
});

s1.addText("Analyse Prospective", {
  x: 0.8, y: 2.1, w: 8.4, h: 0.7,
  fontSize: 28, fontFace: "Calibri Light", color: ACCENT,
  align: "left", margin: 0
});

// Subtitle
s1.addText("Projections Monte Carlo basees sur 3 scenarios electoraux", {
  x: 0.8, y: 3.1, w: 8.4, h: 0.5,
  fontSize: 16, fontFace: "Calibri Light", color: TEXT_LIGHT, italic: true,
  align: "left", margin: 0
});

// Divider line
s1.addShape(pres.shapes.LINE, { x: 0.8, y: 3.9, w: 3, h: 0, line: { color: ACCENT, width: 2 } });

// Footer stats
s1.addText([
  { text: "10 267 inscrits", options: { bold: true, color: ACCENT } },
  { text: "  |  17 bureaux de vote  |  2 000 iterations Monte Carlo", options: { color: TEXT_MUTED } }
], { x: 0.8, y: 4.6, w: 8.4, h: 0.4, fontSize: 13, fontFace: "Calibri" });

// Candidate color indicators
const candY = 4.0;
[
  { name: "Lemoigne", color: LEMOIGNE, x: 0.8 },
  { name: "Da Silva", color: DASILVA, x: 3.5 },
  { name: "Grelet-Certenais", color: GRELET, x: 6.2 }
].forEach(c => {
  s1.addShape(pres.shapes.RECTANGLE, { x: c.x, y: candY, w: 0.3, h: 0.3, fill: { color: c.color } });
  s1.addText(c.name, { x: c.x + 0.4, y: candY - 0.02, w: 2.2, h: 0.35, fontSize: 12, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 2: EXECUTIVE SUMMARY
// ============================================================
let s2 = pres.addSlide();
s2.background = { color: BG_DARK };
s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s2.addText("Synthese", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

// Three key insight cards
const insights = [
  {
    icon: "1", title: "Resultat incertain",
    text: "Le vainqueur depend du scenario de mobilisation: Lemoigne favori si dynamique RN (59-94%), Grelet favorite si dynamique gauche-centre (99%)",
    color: WARNING
  },
  {
    icon: "2", title: "2nd tour certain",
    text: "Aucun scenario ne donne de majorite absolue au 1er tour. Probabilite de 2nd tour : 100% dans les 3 scenarios.",
    color: DANGER
  },
  {
    icon: "3", title: "7 bureaux decisifs",
    text: "Les bureaux 4, 17, 12, 5, 11, 16, 7 representent 41% de l'electorat et determineront l'issue du scrutin.",
    color: SUCCESS
  }
];

insights.forEach((ins, i) => {
  const yPos = 1.2 + i * 1.35;
  // Card background
  s2.addShape(pres.shapes.RECTANGLE, makeCardBg(0.8, yPos, 8.4, 1.15, BG_MID));
  // Left accent
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: yPos, w: 0.08, h: 1.15, fill: { color: ins.color } });
  // Number circle
  s2.addShape(pres.shapes.OVAL, { x: 1.1, y: yPos + 0.25, w: 0.6, h: 0.6, fill: { color: ins.color } });
  s2.addText(ins.icon, { x: 1.1, y: yPos + 0.25, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: TEXT_WHITE, align: "center", valign: "middle" });
  // Title
  s2.addText(ins.title, { x: 1.9, y: yPos + 0.08, w: 7, h: 0.35, fontSize: 16, bold: true, color: TEXT_WHITE, fontFace: "Calibri", margin: 0 });
  // Text
  s2.addText(ins.text, { x: 1.9, y: yPos + 0.45, w: 7, h: 0.6, fontSize: 12, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 3: SCENARIO COMPARISON TABLE
// ============================================================
let s3 = pres.addSlide();
s3.background = { color: BG_DARK };
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s3.addText("Comparaison des 3 scenarios", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

s3.addText("Resultats projetes (%) avec intervalles de confiance a 80%", {
  x: 0.8, y: 0.85, w: 8.4, h: 0.3,
  fontSize: 12, fontFace: "Calibri", color: TEXT_MUTED, margin: 0
});

// Table header styling
const headerOpts = { fill: { color: BG_MID }, color: TEXT_WHITE, bold: true, fontSize: 12, fontFace: "Calibri", align: "center", valign: "middle" };
const cellOpts = { fill: { color: BG_LIGHT }, color: TEXT_WHITE, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const cellLabelOpts = { fill: { color: BG_LIGHT }, color: TEXT_WHITE, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", bold: true };

const tableRows = [
  [
    { text: "Scenario", options: { ...headerOpts, align: "left" } },
    { text: "Lemoigne", options: { ...headerOpts, color: LEMOIGNE } },
    { text: "Da Silva", options: { ...headerOpts, color: DASILVA } },
    { text: "Grelet-Certenais", options: { ...headerOpts, color: GRELET } },
    { text: "2nd tour", options: headerOpts }
  ],
  [
    { text: "Europeennes 2024", options: cellLabelOpts },
    { text: "38.0%\n[36-40]", options: { ...cellOpts, color: LEMOIGNE } },
    { text: "24.6%\n[23-27]", options: { ...cellOpts, color: DASILVA } },
    { text: "37.4%\n[35-40]", options: { ...cellOpts, color: GRELET } },
    { text: "100%", options: { ...cellOpts, color: WARNING } }
  ],
  [
    { text: "Legislatives 2024 T1", options: cellLabelOpts },
    { text: "38.4%\n[37-41]", options: { ...cellOpts, color: LEMOIGNE } },
    { text: "27.1%\n[24-31]", options: { ...cellOpts, color: DASILVA } },
    { text: "34.5%\n[31-38]", options: { ...cellOpts, color: GRELET } },
    { text: "100%", options: { ...cellOpts, color: WARNING } }
  ],
  [
    { text: "Presidentielle 2022 T1", options: cellLabelOpts },
    { text: "30.9%\n[29-33]", options: { ...cellOpts, color: LEMOIGNE } },
    { text: "30.4%\n[27-34]", options: { ...cellOpts, color: DASILVA } },
    { text: "38.8%\n[35-42]", options: { ...cellOpts, color: GRELET } },
    { text: "100%", options: { ...cellOpts, color: WARNING } }
  ]
];

s3.addTable(tableRows, {
  x: 0.5, y: 1.4, w: 9, colW: [2.5, 1.8, 1.6, 1.8, 1.3],
  border: { pt: 0.5, color: "3D5A80" },
  rowH: [0.45, 0.6, 0.6, 0.6]
});

// Bar chart below
s3.addChart(pres.charts.BAR, [
  { name: "Lemoigne", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [38.0, 38.4, 30.9] },
  { name: "Da Silva", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [24.6, 27.1, 30.4] },
  { name: "Grelet", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [37.4, 34.5, 38.8] }
], {
  x: 0.5, y: 3.5, w: 9, h: 2.0, barDir: "col",
  chartColors: [LEMOIGNE, DASILVA, GRELET],
  chartArea: { fill: { color: BG_MID }, roundedCorners: true },
  catAxisLabelColor: TEXT_LIGHT,
  valAxisLabelColor: TEXT_MUTED,
  catAxisLabelFontSize: 10,
  valAxisLabelFontSize: 9,
  valGridLine: { color: "3D5A80", size: 0.5 },
  catGridLine: { style: "none" },
  showValue: true,
  dataLabelColor: TEXT_WHITE,
  dataLabelFontSize: 9,
  dataLabelPosition: "outEnd",
  showLegend: true,
  legendPos: "b",
  legendColor: TEXT_LIGHT,
  legendFontSize: 10
});


// ============================================================
// SLIDE 4: WIN PROBABILITIES
// ============================================================
let s4 = pres.addSlide();
s4.background = { color: BG_DARK };
s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s4.addText("Probabilites de victoire par scenario", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

// Probability table
const probHeaderOpts = { fill: { color: BG_MID }, color: TEXT_WHITE, bold: true, fontSize: 13, fontFace: "Calibri", align: "center", valign: "middle" };
const probCellOpts = { fill: { color: BG_LIGHT }, color: TEXT_WHITE, fontSize: 14, fontFace: "Calibri", align: "center", valign: "middle", bold: true };

const probRows = [
  [
    { text: "Scenario", options: { ...probHeaderOpts, align: "left" } },
    { text: "Lemoigne", options: { ...probHeaderOpts, color: LEMOIGNE } },
    { text: "Da Silva", options: { ...probHeaderOpts, color: DASILVA } },
    { text: "Grelet", options: { ...probHeaderOpts, color: GRELET } }
  ],
  [
    { text: "Europeennes 2024", options: { ...probCellOpts, align: "left", bold: false, fontSize: 12 } },
    { text: "59%", options: { ...probCellOpts, color: LEMOIGNE } },
    { text: "0%", options: { ...probCellOpts, color: TEXT_MUTED } },
    { text: "41%", options: { ...probCellOpts, color: GRELET } }
  ],
  [
    { text: "Legislatives 2024", options: { ...probCellOpts, align: "left", bold: false, fontSize: 12 } },
    { text: "94%", options: { ...probCellOpts, color: LEMOIGNE } },
    { text: "0%", options: { ...probCellOpts, color: TEXT_MUTED } },
    { text: "6%", options: { ...probCellOpts, color: GRELET } }
  ],
  [
    { text: "Presidentielle 2022", options: { ...probCellOpts, align: "left", bold: false, fontSize: 12 } },
    { text: "0%", options: { ...probCellOpts, color: TEXT_MUTED } },
    { text: "1%", options: { ...probCellOpts, color: TEXT_MUTED } },
    { text: "99%", options: { ...probCellOpts, color: GRELET } }
  ]
];

s4.addTable(probRows, {
  x: 0.8, y: 1.2, w: 8.4, colW: [2.8, 2.0, 1.8, 1.8],
  border: { pt: 0.5, color: "3D5A80" },
  rowH: [0.5, 0.55, 0.55, 0.55]
});

// Visual bars for each scenario
const probData = [
  { label: "Europeennes 2024", probs: [59, 0, 41] },
  { label: "Legislatives 2024", probs: [94, 0, 6] },
  { label: "Presidentielle 2022", probs: [0, 1, 99] }
];

probData.forEach((sc, i) => {
  const yBase = 3.4 + i * 0.55;
  s4.addText(sc.label, { x: 0.8, y: yBase, w: 2.5, h: 0.4, fontSize: 10, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0 });

  let xOff = 3.5;
  const barW = 5.7;
  [LEMOIGNE, DASILVA, GRELET].forEach((col, j) => {
    const w = (sc.probs[j] / 100) * barW;
    if (w > 0.01) {
      s4.addShape(pres.shapes.RECTANGLE, { x: xOff, y: yBase + 0.05, w: w, h: 0.3, fill: { color: col } });
      if (sc.probs[j] >= 5) {
        s4.addText(sc.probs[j] + "%", { x: xOff, y: yBase + 0.05, w: w, h: 0.3, fontSize: 10, bold: true, color: TEXT_WHITE, align: "center", valign: "middle" });
      }
      xOff += w;
    }
  });
});

// Note
s4.addShape(pres.shapes.RECTANGLE, makeCardBg(0.8, 5.0, 8.4, 0.45, BG_MID));
s4.addText("Moyenne ponderee : avantage Lemoigne si mobilisation RN maintenue au niveau 2024", {
  x: 0.8, y: 5.0, w: 8.4, h: 0.45,
  fontSize: 11, fontFace: "Calibri", color: WARNING, italic: true, align: "center", valign: "middle"
});


// ============================================================
// SLIDE 5: RN MOBILIZATION
// ============================================================
let s5 = pres.addSlide();
s5.background = { color: BG_DARK };
s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s5.addText("Variable cle : la mobilisation RN", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

// Two-column layout
// Left: RN scores
s5.addShape(pres.shapes.RECTANGLE, makeCardBg(0.5, 1.2, 4.3, 2.0, BG_MID));
s5.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.2, w: 0.08, h: 2.0, fill: { color: DANGER } });
s5.addText("Scores RN a La Fleche", { x: 0.8, y: 1.3, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: TEXT_WHITE, fontFace: "Calibri", margin: 0 });

s5.addText("34.3%", { x: 0.8, y: 1.75, w: 1.5, h: 0.5, fontSize: 28, bold: true, color: DANGER, fontFace: "Calibri", margin: 0 });
s5.addText("Europeennes 2024", { x: 2.3, y: 1.75, w: 2.3, h: 0.5, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, valign: "middle" });

s5.addText("36.8%", { x: 0.8, y: 2.3, w: 1.5, h: 0.5, fontSize: 28, bold: true, color: DANGER, fontFace: "Calibri", margin: 0 });
s5.addText("Legislatives 2024", { x: 2.3, y: 2.3, w: 2.3, h: 0.5, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, valign: "middle" });

// Right: Transfer rate
s5.addShape(pres.shapes.RECTANGLE, makeCardBg(5.2, 1.2, 4.3, 2.0, BG_MID));
s5.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.2, w: 0.08, h: 2.0, fill: { color: LEMOIGNE } });
s5.addText("Report RN vers Lemoigne", { x: 5.5, y: 1.3, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: TEXT_WHITE, fontFace: "Calibri", margin: 0 });

s5.addText("75-78%", { x: 5.5, y: 1.8, w: 3.5, h: 0.7, fontSize: 36, bold: true, color: LEMOIGNE, fontFace: "Calibri", margin: 0, align: "center" });
s5.addText("des electeurs RN votent Lemoigne", { x: 5.5, y: 2.5, w: 3.5, h: 0.35, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, align: "center" });

// Key conclusions
const rnBullets = [
  { text: "Si le RN maintient sa dynamique 2024, Lemoigne est nettement favori", options: { bullet: true, breakLine: true, fontSize: 13, color: TEXT_WHITE, fontFace: "Calibri" } },
  { text: "Si retour a la configuration 2022 (RN 25%), Grelet reprend l'avantage", options: { bullet: true, breakLine: true, fontSize: 13, color: TEXT_WHITE, fontFace: "Calibri" } },
  { text: "La mobilisation RN est LA variable determinante du scrutin", options: { bullet: true, fontSize: 13, color: WARNING, fontFace: "Calibri", bold: true } }
];

s5.addShape(pres.shapes.RECTANGLE, makeCardBg(0.5, 3.5, 9.0, 1.7, BG_MID));
s5.addText(rnBullets, { x: 0.8, y: 3.6, w: 8.4, h: 1.5 });


// ============================================================
// SLIDE 6: SWING BUREAUX
// ============================================================
let s6 = pres.addSlide();
s6.background = { color: BG_DARK };
s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s6.addText("7 bureaux strategiques prioritaires", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});
s6.addText("41% de l'electorat — Classes par potentiel de basculement", {
  x: 0.8, y: 0.85, w: 8.4, h: 0.3,
  fontSize: 12, fontFace: "Calibri", color: TEXT_MUTED, margin: 0
});

const swingHeaderOpts2 = { fill: { color: BG_MID }, color: ACCENT, bold: true, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const swingCellOpts2 = { fill: { color: BG_LIGHT }, color: TEXT_WHITE, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const swingLabelOpts2 = { fill: { color: BG_LIGHT }, color: TEXT_WHITE, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", bold: true };

const swingData = [
  ["Bureau 4", "568", "Gauche", "7.4", "58%"],
  ["Bureau 17", "541", "Centre", "7.3", "66%"],
  ["Bureau 12", "534", "Droite", "7.3", "62%"],
  ["Bureau 5", "676", "Droite", "8.3", "70%"],
  ["Bureau 11", "549", "Gauche", "6.8", "64%"],
  ["Bureau 16", "739", "Droite", "6.9", "73%"],
  ["Bureau 7", "650", "Centre", "6.7", "75%"]
];

const swingRows = [
  [
    { text: "Bureau", options: { ...swingHeaderOpts2, align: "left" } },
    { text: "Inscrits", options: swingHeaderOpts2 },
    { text: "Position", options: swingHeaderOpts2 },
    { text: "Volatilite", options: swingHeaderOpts2 },
    { text: "Grelet 2020", options: swingHeaderOpts2 }
  ],
  ...swingData.map((row, i) => {
    const posColor = row[2] === "Gauche" ? GRELET : row[2] === "Droite" ? LEMOIGNE : DASILVA;
    return [
      { text: row[0], options: { ...swingLabelOpts2, fill: { color: i === 0 ? "3D2020" : BG_LIGHT } } },
      { text: row[1], options: { ...swingCellOpts2, fill: { color: i === 0 ? "3D2020" : BG_LIGHT } } },
      { text: row[2], options: { ...swingCellOpts2, color: posColor, fill: { color: i === 0 ? "3D2020" : BG_LIGHT } } },
      { text: row[3], options: { ...swingCellOpts2, fill: { color: i === 0 ? "3D2020" : BG_LIGHT } } },
      { text: row[4], options: { ...swingCellOpts2, fill: { color: i === 0 ? "3D2020" : BG_LIGHT } } }
    ];
  })
];

s6.addTable(swingRows, {
  x: 0.5, y: 1.3, w: 9.0, colW: [2.0, 1.5, 1.8, 1.8, 1.9],
  border: { pt: 0.5, color: "3D5A80" },
  rowH: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
});

// Note about Bureau 4
s6.addShape(pres.shapes.RECTANGLE, makeCardBg(0.5, 4.8, 9.0, 0.55, "3D2020"));
s6.addText("Bureau 4 = cible prioritaire : plus haute volatilite (7.4) et score Grelet 2020 le plus bas (58%)", {
  x: 0.5, y: 4.8, w: 9.0, h: 0.55,
  fontSize: 12, fontFace: "Calibri", color: DANGER, bold: true, align: "center", valign: "middle"
});


// ============================================================
// SLIDE 7: DEMOGRAPHICS
// ============================================================
let s7 = pres.addSlide();
s7.background = { color: BG_DARK };
s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s7.addText("Profils demographiques et enjeux", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

// 4 demographic cards in 2x2 grid
const demoCards = [
  { title: "Bureaux jeunes", bureaux: "1, 5, 13, 14, 15", desc: "Electorat plus volatile, sensible aux themes emploi et logement", color: "FFC107", icon: "18-35 ans" },
  { title: "Bureaux seniors", bureaux: "6, 7, 8, 9, 17", desc: "Fort vote conservateur, sensibles aux themes sante et securite", color: "9C27B0", icon: "66-80 ans" },
  { title: "Bureaux actifs", bureaux: "2, 14", desc: "CSP intermediaires, enjeux pouvoir d'achat et services publics", color: "FF9800", icon: "36-65 ans" },
  { title: "Bureaux tres ages", bureaux: "4, 12", desc: "Historiquement gauche, potentiel de basculement important", color: "2196F3", icon: "80+ ans" }
];

demoCards.forEach((card, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const xPos = 0.5 + col * 4.7;
  const yPos = 1.2 + row * 2.0;

  s7.addShape(pres.shapes.RECTANGLE, makeCardBg(xPos, yPos, 4.3, 1.7, BG_MID));
  s7.addShape(pres.shapes.RECTANGLE, { x: xPos, y: yPos, w: 0.08, h: 1.7, fill: { color: card.color } });

  // Age badge
  s7.addShape(pres.shapes.RECTANGLE, { x: xPos + 3.0, y: yPos + 0.15, w: 1.0, h: 0.3, fill: { color: card.color }, shadow: makeShadow() });
  s7.addText(card.icon, { x: xPos + 3.0, y: yPos + 0.15, w: 1.0, h: 0.3, fontSize: 9, bold: true, color: TEXT_WHITE, align: "center", valign: "middle" });

  s7.addText(card.title, { x: xPos + 0.3, y: yPos + 0.1, w: 2.8, h: 0.35, fontSize: 14, bold: true, color: TEXT_WHITE, fontFace: "Calibri", margin: 0 });
  s7.addText("Bureaux : " + card.bureaux, { x: xPos + 0.3, y: yPos + 0.5, w: 3.7, h: 0.3, fontSize: 11, color: ACCENT, fontFace: "Calibri", margin: 0 });
  s7.addText(card.desc, { x: xPos + 0.3, y: yPos + 0.9, w: 3.7, h: 0.6, fontSize: 11, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 8: STRATEGIC RECOMMENDATIONS
// ============================================================
let s8 = pres.addSlide();
s8.background = { color: BG_DARK };
s8.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s8.addText("Recommandations strategiques", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

const recos = [
  { prio: "P1", title: "Identifier la dynamique RN locale", desc: "Sondage qualitatif pour mesurer la mobilisation RN attendue. C'est la variable qui determine tout.", color: DANGER },
  { prio: "P2", title: "Concentrer le terrain sur les 7 bureaux swing", desc: "41% de l'electorat dans les bureaux 4, 17, 12, 5, 11, 16, 7. Maximiser la presence terrain.", color: WARNING },
  { prio: "P3", title: "Bureau 4 = micro-cible", desc: "Plus fort potentiel de basculement: haute volatilite (7.4), score Grelet 2020 le plus bas (58%).", color: LEMOIGNE },
  { prio: "!", title: "Strategie d'entre-deux-tours decisive", desc: "Tous les scenarios donnent un 2nd tour. Preparer les alliances et les reports des maintenant.", color: ACCENT }
];

recos.forEach((r, i) => {
  const yPos = 1.1 + i * 1.05;
  s8.addShape(pres.shapes.RECTANGLE, makeCardBg(0.5, yPos, 9.0, 0.85, BG_MID));
  s8.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 0.08, h: 0.85, fill: { color: r.color } });

  // Priority badge
  s8.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: yPos + 0.2, w: 0.6, h: 0.45, fill: { color: r.color } });
  s8.addText(r.prio, { x: 0.8, y: yPos + 0.2, w: 0.6, h: 0.45, fontSize: 14, bold: true, color: TEXT_WHITE, align: "center", valign: "middle" });

  s8.addText(r.title, { x: 1.6, y: yPos + 0.08, w: 7.5, h: 0.35, fontSize: 14, bold: true, color: TEXT_WHITE, fontFace: "Calibri", margin: 0 });
  s8.addText(r.desc, { x: 1.6, y: yPos + 0.42, w: 7.5, h: 0.35, fontSize: 11, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 9: METHODOLOGY
// ============================================================
let s9 = pres.addSlide();
s9.background = { color: BG_DARK };
s9.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: ACCENT } });

s9.addText("Methodologie", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: ACCENT, margin: 0
});

// Method cards
const methods = [
  { title: "Source", desc: "DataRealis — donnees electorales exactes 2019-2024, INSEE 72154", color: ACCENT },
  { title: "Modele", desc: "Monte Carlo 2 000 iterations, echantillonnage Dirichlet, Bayesian updating", color: SUCCESS },
  { title: "Reports", desc: "Matrices de reports basees sur correlations ecologiques bureau par bureau", color: LEMOIGNE },
  { title: "Volatilite", desc: "Calculee sur 5 elections T1 (ecart-type reel par bloc et par bureau)", color: WARNING },
  { title: "Limites", desc: "Les reports sont des hypotheses, pas des mesures. Le contexte local 2026 peut changer la donne.", color: DANGER }
];

methods.forEach((m, i) => {
  const yPos = 1.1 + i * 0.82;
  s9.addShape(pres.shapes.RECTANGLE, makeCardBg(0.5, yPos, 9.0, 0.65, BG_MID));
  s9.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 0.08, h: 0.65, fill: { color: m.color } });
  s9.addText(m.title, { x: 0.8, y: yPos + 0.05, w: 1.5, h: 0.55, fontSize: 13, bold: true, color: m.color, fontFace: "Calibri", margin: 0, valign: "middle" });
  s9.addText(m.desc, { x: 2.3, y: yPos + 0.05, w: 6.8, h: 0.55, fontSize: 12, color: TEXT_LIGHT, fontFace: "Calibri", margin: 0, valign: "middle" });
});

// Footer
s9.addText("Elections La Fleche 2026 — Analyse generee par simulation Monte Carlo", {
  x: 0.5, y: 5.2, w: 9.0, h: 0.3,
  fontSize: 10, fontFace: "Calibri", color: TEXT_MUTED, align: "center"
});


// ============================================================
// SAVE
// ============================================================
pres.writeFile({ fileName: "C:/Users/Philippe/Documents/CLAUDECODE/ELECTIONS-LAFLECHE/docs/synthese-decideurs.pptx" })
  .then(() => console.log("synthese-decideurs.pptx created successfully!"))
  .catch(err => console.error("Error:", err));
