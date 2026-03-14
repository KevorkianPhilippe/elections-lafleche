const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Elections La Fleche 2026";
pres.title = "Elections La Fleche 2026 - Synthese Militants";

// === COLOR PALETTE — BRIGHT BUT PROFESSIONAL ===
const BG_LIGHT = "E3F2FD";
const BG_WHITE = "FFFFFF";
const BG_ACCENT = "1565C0";
const BG_MID = "1976D2";
const TEXT_DARK = "1A237E";
const TEXT_BODY = "37474F";
const TEXT_MUTED = "78909C";
const ACCENT_ORANGE = "FF6F00";
const ACCENT_GREEN = "2E7D32";
const ACCENT_RED = "C62828";
const ACCENT_BLUE = "1565C0";
const ACCENT_PURPLE = "6A1B9A";
const ACCENT_YELLOW = "F9A825";
const LEMOIGNE = "5C6BC0";
const DASILVA = "2196F3";
const GRELET = "E91E63";
const WARNING = "FFA726";

const makeShadow = () => ({ type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.12 });

// ============================================================
// SLIDE 1: TITLE
// ============================================================
let s1 = pres.addSlide();
s1.background = { color: BG_ACCENT };

s1.addText("Municipales La Fleche 2026", {
  x: 0.5, y: 1.0, w: 9, h: 1.0,
  fontSize: 40, fontFace: "Calibri", bold: true, color: BG_WHITE,
  align: "center", margin: 0
});

s1.addText("Analyse et plan d'action militant", {
  x: 0.5, y: 2.0, w: 9, h: 0.7,
  fontSize: 26, fontFace: "Calibri Light", color: ACCENT_YELLOW,
  align: "center", margin: 0
});

s1.addText("Projections basees sur 3 scenarios electoraux — 10 267 inscrits — 17 bureaux", {
  x: 0.5, y: 3.0, w: 9, h: 0.5,
  fontSize: 14, fontFace: "Calibri", color: "90CAF9", italic: true,
  align: "center", margin: 0
});

// Candidate badges
[
  { name: "Lemoigne", color: LEMOIGNE },
  { name: "Da Silva", color: DASILVA },
  { name: "Grelet-Certenais", color: GRELET }
].forEach((c, i) => {
  const xPos = 1.5 + i * 2.8;
  s1.addShape(pres.shapes.RECTANGLE, { x: xPos, y: 4.2, w: 2.2, h: 0.5, fill: { color: c.color }, shadow: makeShadow() });
  s1.addText(c.name, { x: xPos, y: 4.2, w: 2.2, h: 0.5, fontSize: 14, bold: true, color: BG_WHITE, align: "center", valign: "middle" });
});


// ============================================================
// SLIDE 2: SITUATION OVERVIEW
// ============================================================
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };

s2.addText("L'essentiel a retenir", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

// Headline
s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 0.9, w: 8.4, h: 0.8, fill: { color: ACCENT_RED }, shadow: makeShadow() });
s2.addText("L'election est tres serree : tout se joue sur la mobilisation", {
  x: 0.8, y: 0.9, w: 8.4, h: 0.8,
  fontSize: 22, fontFace: "Calibri", bold: true, color: BG_WHITE,
  align: "center", valign: "middle"
});

// 3 key facts as numbered cards
const keyFacts = [
  { num: "1", title: "Resultat incertain selon le scenario", desc: "Lemoigne favori si la dynamique RN de 2024 se maintient (59 a 94% de chances). Grelet favorite si retour a la configuration 2022 (99%).", color: WARNING },
  { num: "2", title: "2nd tour certain dans tous les scenarios", desc: "Aucune liste n'atteint la majorite absolue au 1er tour. La strategie d'entre-deux-tours sera decisive.", color: ACCENT_RED },
  { num: "3", title: "7 bureaux strategiques a cibler", desc: "Les bureaux 4, 17, 12, 5, 11, 16 et 7 representent 41% des inscrits et concentrent les electeurs les plus indecis.", color: ACCENT_GREEN }
];

keyFacts.forEach((kf, i) => {
  const yPos = 1.9 + i * 1.15;
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: yPos, w: 8.4, h: 1.0, fill: { color: BG_WHITE }, shadow: makeShadow() });
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: yPos, w: 0.08, h: 1.0, fill: { color: kf.color } });
  s2.addShape(pres.shapes.OVAL, { x: 1.1, y: yPos + 0.2, w: 0.55, h: 0.55, fill: { color: kf.color } });
  s2.addText(kf.num, { x: 1.1, y: yPos + 0.2, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: BG_WHITE, align: "center", valign: "middle" });
  s2.addText(kf.title, { x: 1.85, y: yPos + 0.05, w: 7.0, h: 0.35, fontSize: 14, bold: true, color: TEXT_DARK, fontFace: "Calibri", margin: 0 });
  s2.addText(kf.desc, { x: 1.85, y: yPos + 0.42, w: 7.0, h: 0.5, fontSize: 12, color: TEXT_BODY, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 3: SCENARIO COMPARISON WITH DATA
// ============================================================
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };

s3.addText("Les 3 scenarios et leurs resultats", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

s3.addText("Chaque scenario simule ce qui se passerait si les electeurs se mobilisaient comme lors d'un scrutin passe", {
  x: 0.5, y: 0.75, w: 9, h: 0.3,
  fontSize: 11, fontFace: "Calibri", color: TEXT_MUTED, align: "center"
});

// Table with results + probabilities
const hdrOpts = { fill: { color: BG_ACCENT }, color: BG_WHITE, bold: true, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const cellOpts = { fill: { color: BG_WHITE }, color: TEXT_BODY, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const lblOpts = { fill: { color: BG_WHITE }, color: TEXT_DARK, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", bold: true };

const tableRows = [
  [
    { text: "Scenario", options: { ...hdrOpts, align: "left" } },
    { text: "Lemoigne", options: { ...hdrOpts, color: LEMOIGNE } },
    { text: "Da Silva", options: { ...hdrOpts, color: DASILVA } },
    { text: "Grelet", options: { ...hdrOpts, color: GRELET } },
    { text: "Proba Lemoigne", options: hdrOpts },
    { text: "Proba Grelet", options: hdrOpts }
  ],
  [
    { text: "Europeennes 2024", options: lblOpts },
    { text: "38.0%", options: { ...cellOpts, color: LEMOIGNE, bold: true } },
    { text: "24.6%", options: { ...cellOpts, color: DASILVA } },
    { text: "37.4%", options: { ...cellOpts, color: GRELET, bold: true } },
    { text: "59%", options: { ...cellOpts, color: LEMOIGNE, bold: true, fontSize: 13 } },
    { text: "41%", options: { ...cellOpts, color: GRELET, bold: true, fontSize: 13 } }
  ],
  [
    { text: "Legislatives 2024", options: lblOpts },
    { text: "38.4%", options: { ...cellOpts, color: LEMOIGNE, bold: true } },
    { text: "27.1%", options: { ...cellOpts, color: DASILVA } },
    { text: "34.5%", options: { ...cellOpts, color: GRELET } },
    { text: "94%", options: { ...cellOpts, color: LEMOIGNE, bold: true, fontSize: 13 } },
    { text: "6%", options: { ...cellOpts, color: GRELET, fontSize: 13 } }
  ],
  [
    { text: "Presidentielle 2022", options: lblOpts },
    { text: "30.9%", options: { ...cellOpts, color: LEMOIGNE } },
    { text: "30.4%", options: { ...cellOpts, color: DASILVA } },
    { text: "38.8%", options: { ...cellOpts, color: GRELET, bold: true } },
    { text: "0%", options: { ...cellOpts, color: TEXT_MUTED } },
    { text: "99%", options: { ...cellOpts, color: GRELET, bold: true, fontSize: 13 } }
  ]
];

s3.addTable(tableRows, {
  x: 0.3, y: 1.2, w: 9.4, colW: [2.0, 1.3, 1.2, 1.2, 1.8, 1.8],
  border: { pt: 0.5, color: "90CAF9" },
  rowH: [0.45, 0.5, 0.5, 0.5]
});

// Bar chart
s3.addChart(pres.charts.BAR, [
  { name: "Lemoigne", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [38.0, 38.4, 30.9] },
  { name: "Da Silva", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [24.6, 27.1, 30.4] },
  { name: "Grelet", labels: ["Europeennes", "Legislatives", "Presidentielle"], values: [37.4, 34.5, 38.8] }
], {
  x: 0.5, y: 3.5, w: 9, h: 2.0, barDir: "col",
  chartColors: [LEMOIGNE, DASILVA, GRELET],
  chartArea: { fill: { color: BG_WHITE }, roundedCorners: true },
  catAxisLabelColor: TEXT_BODY,
  valAxisLabelColor: TEXT_MUTED,
  catAxisLabelFontSize: 10,
  valAxisLabelFontSize: 9,
  valGridLine: { color: "E0E0E0", size: 0.5 },
  catGridLine: { style: "none" },
  showValue: true,
  dataLabelColor: TEXT_DARK,
  dataLabelFontSize: 9,
  dataLabelPosition: "outEnd",
  showLegend: true,
  legendPos: "b",
  legendColor: TEXT_BODY,
  legendFontSize: 10
});


// ============================================================
// SLIDE 4: THE RN VARIABLE
// ============================================================
let s4 = pres.addSlide();
s4.background = { color: BG_LIGHT };

s4.addText("La variable determinante : la mobilisation RN", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

// Left card: RN scores
s4.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.9, w: 4.3, h: 2.0, fill: { color: BG_WHITE }, shadow: makeShadow() });
s4.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.9, w: 0.08, h: 2.0, fill: { color: ACCENT_RED } });
s4.addText("Scores RN a La Fleche", { x: 0.8, y: 1.0, w: 3.8, h: 0.3, fontSize: 14, bold: true, color: ACCENT_RED, fontFace: "Calibri", margin: 0 });

s4.addText("34.3%", { x: 0.8, y: 1.45, w: 1.5, h: 0.45, fontSize: 26, bold: true, color: ACCENT_RED, fontFace: "Calibri", margin: 0 });
s4.addText("Europeennes juin 2024", { x: 2.3, y: 1.45, w: 2.3, h: 0.45, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, valign: "middle" });

s4.addText("36.8%", { x: 0.8, y: 1.95, w: 1.5, h: 0.45, fontSize: 26, bold: true, color: ACCENT_RED, fontFace: "Calibri", margin: 0 });
s4.addText("Legislatives juillet 2024", { x: 2.3, y: 1.95, w: 2.3, h: 0.45, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, valign: "middle" });

// Right card: Transfer
s4.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 0.9, w: 4.3, h: 2.0, fill: { color: BG_WHITE }, shadow: makeShadow() });
s4.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 0.9, w: 0.08, h: 2.0, fill: { color: LEMOIGNE } });
s4.addText("Report estime RN vers Lemoigne", { x: 5.5, y: 1.0, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: LEMOIGNE, fontFace: "Calibri", margin: 0 });

s4.addText("75-78%", { x: 5.5, y: 1.45, w: 3.5, h: 0.7, fontSize: 36, bold: true, color: LEMOIGNE, fontFace: "Calibri", margin: 0, align: "center" });
s4.addText("des electeurs RN votent Lemoigne aux municipales", { x: 5.5, y: 2.2, w: 3.5, h: 0.4, fontSize: 11, color: TEXT_MUTED, fontFace: "Calibri", margin: 0, align: "center" });

// Analysis bullets
const rnBullets = [
  { text: "Si le RN maintient son niveau de 2024 (34-37%) aux municipales, les reports massifs vers Lemoigne lui donnent un avantage net (59 a 94% de chances de victoire)", options: { bullet: true, breakLine: true, fontSize: 13, color: TEXT_BODY, fontFace: "Calibri", paraSpaceAfter: 8 } },
  { text: "Si le RN retombe a son niveau de 2022 (25%), ces reports ne suffisent plus et Grelet redevient favorite (99%)", options: { bullet: true, breakLine: true, fontSize: 13, color: TEXT_BODY, fontFace: "Calibri", paraSpaceAfter: 8 } },
  { text: "En clair : la mobilisation RN locale est la variable qui fait basculer l'election dans un sens ou dans l'autre", options: { bullet: true, fontSize: 13, color: ACCENT_RED, fontFace: "Calibri", bold: true } }
];

s4.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.15, w: 9, h: 2.2, fill: { color: BG_WHITE }, shadow: makeShadow() });
s4.addText(rnBullets, { x: 0.8, y: 3.3, w: 8.4, h: 1.9 });


// ============================================================
// SLIDE 5: SWING BUREAUX WITH TABLE
// ============================================================
let s5 = pres.addSlide();
s5.background = { color: BG_LIGHT };

s5.addText("Les 7 bureaux ou tout se joue", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

s5.addText("Ces bureaux concentrent 41% de l'electorat et les electeurs les plus volatils", {
  x: 0.5, y: 0.75, w: 9, h: 0.3,
  fontSize: 11, fontFace: "Calibri", color: TEXT_MUTED, align: "center"
});

// Swing table
const swHdr = { fill: { color: BG_ACCENT }, color: BG_WHITE, bold: true, fontSize: 10, fontFace: "Calibri", align: "center", valign: "middle" };
const swCell = { fill: { color: BG_WHITE }, color: TEXT_BODY, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
const swLbl = { fill: { color: BG_WHITE }, color: TEXT_DARK, fontSize: 11, fontFace: "Calibri", align: "left", valign: "middle", bold: true };

const swingData = [
  ["Bureau 4", "568", "Gauche", "7.4", "58%", "PRIORITAIRE"],
  ["Bureau 17", "541", "Centre", "7.3", "66%", "PRIORITAIRE"],
  ["Bureau 12", "534", "Droite", "7.3", "62%", "PRIORITAIRE"],
  ["Bureau 5", "676", "Droite", "8.3", "70%", "IMPORTANT"],
  ["Bureau 11", "549", "Gauche", "6.8", "64%", "IMPORTANT"],
  ["Bureau 16", "739", "Droite", "6.9", "73%", "IMPORTANT"],
  ["Bureau 7", "650", "Centre", "6.7", "75%", "IMPORTANT"]
];

const prioColor = (tier) => tier === "PRIORITAIRE" ? ACCENT_RED : ACCENT_ORANGE;

const swingRows = [
  [
    { text: "Bureau", options: { ...swHdr, align: "left" } },
    { text: "Inscrits", options: swHdr },
    { text: "Tendance", options: swHdr },
    { text: "Volatilite", options: swHdr },
    { text: "Grelet 2020", options: swHdr },
    { text: "Priorite", options: swHdr }
  ],
  ...swingData.map((row) => {
    const posColor = row[2] === "Gauche" ? GRELET : row[2] === "Droite" ? LEMOIGNE : DASILVA;
    const bgRow = row[5] === "PRIORITAIRE" ? "FFF3E0" : BG_WHITE;
    return [
      { text: row[0], options: { ...swLbl, fill: { color: bgRow } } },
      { text: row[1], options: { ...swCell, fill: { color: bgRow } } },
      { text: row[2], options: { ...swCell, color: posColor, bold: true, fill: { color: bgRow } } },
      { text: row[3], options: { ...swCell, fill: { color: bgRow } } },
      { text: row[4], options: { ...swCell, fill: { color: bgRow } } },
      { text: row[5], options: { ...swCell, color: prioColor(row[5]), bold: true, fontSize: 9, fill: { color: bgRow } } }
    ];
  })
];

s5.addTable(swingRows, {
  x: 0.3, y: 1.15, w: 9.4, colW: [1.6, 1.2, 1.4, 1.4, 1.5, 2.0],
  border: { pt: 0.5, color: "90CAF9" },
  rowH: [0.4, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38]
});

// Key insight
s5.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 9, h: 0.9, fill: { color: "FFF3E0" }, shadow: makeShadow() });
s5.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.4, w: 0.08, h: 0.9, fill: { color: ACCENT_RED } });
s5.addText("Bureau 4 = cible numero 1", { x: 0.8, y: 4.45, w: 8.4, h: 0.35, fontSize: 14, bold: true, color: ACCENT_RED, fontFace: "Calibri", margin: 0 });
s5.addText("Plus forte volatilite electorale (7.4) + score Grelet 2020 le plus bas (58%) = le bureau qui peut le plus basculer", {
  x: 0.8, y: 4.82, w: 8.4, h: 0.35, fontSize: 12, color: TEXT_BODY, fontFace: "Calibri", margin: 0
});


// ============================================================
// SLIDE 6: DEMOGRAPHICS — ADAPTED FOR TERRAIN
// ============================================================
let s6 = pres.addSlide();
s6.background = { color: BG_LIGHT };

s6.addText("Adapter le message selon le bureau", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

const demoCards = [
  {
    title: "Bureaux jeunes (18-35 ans)", bureaux: "1, 5, 13, 14, 15",
    desc: "Electorat plus volatile, sensible aux questions emploi, logement et pouvoir d'achat. Participation souvent plus faible : la mobilisation y est cruciale.",
    msg: "Parler emploi, logement, formation",
    color: ACCENT_YELLOW, bgColor: "FFFDE7"
  },
  {
    title: "Bureaux seniors (66-80 ans)", bureaux: "6, 7, 8, 9, 17",
    desc: "Vote plus conservateur et plus stable. Sensibles aux questions de sante, securite et cadre de vie. Forte participation habituelle.",
    msg: "Parler sante, securite, cadre de vie",
    color: ACCENT_PURPLE, bgColor: "F3E5F5"
  },
  {
    title: "Bureaux actifs (36-65 ans)", bureaux: "2, 14",
    desc: "CSP intermediaires, familles. Sensibles aux impots locaux, services scolaires, transports et commerces de proximite.",
    msg: "Parler fiscalite, ecoles, services",
    color: ACCENT_ORANGE, bgColor: "FFF3E0"
  },
  {
    title: "Bureaux tres ages (80+ ans)", bureaux: "4, 12",
    desc: "Historiquement orientes a gauche. Potentiel de basculement important. Difficulte de mobilisation (deplacement, isolement).",
    msg: "Proposer accompagnement au vote",
    color: ACCENT_BLUE, bgColor: "E3F2FD"
  }
];

demoCards.forEach((card, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const xPos = 0.3 + col * 4.85;
  const yPos = 0.9 + row * 2.3;

  s6.addShape(pres.shapes.RECTANGLE, { x: xPos, y: yPos, w: 4.55, h: 2.1, fill: { color: card.bgColor }, shadow: makeShadow() });
  s6.addShape(pres.shapes.RECTANGLE, { x: xPos, y: yPos, w: 0.08, h: 2.1, fill: { color: card.color } });

  s6.addText(card.title, { x: xPos + 0.25, y: yPos + 0.08, w: 4.0, h: 0.3, fontSize: 13, bold: true, color: card.color, fontFace: "Calibri", margin: 0 });

  // Bureau badge
  s6.addShape(pres.shapes.RECTANGLE, { x: xPos + 0.25, y: yPos + 0.42, w: 2.5, h: 0.28, fill: { color: card.color } });
  s6.addText("Bureaux " + card.bureaux, { x: xPos + 0.25, y: yPos + 0.42, w: 2.5, h: 0.28, fontSize: 10, bold: true, color: BG_WHITE, align: "center", valign: "middle" });

  s6.addText(card.desc, { x: xPos + 0.25, y: yPos + 0.8, w: 4.0, h: 0.7, fontSize: 10, color: TEXT_BODY, fontFace: "Calibri", margin: 0 });

  // Action message
  s6.addShape(pres.shapes.RECTANGLE, { x: xPos + 0.25, y: yPos + 1.6, w: 4.0, h: 0.35, fill: { color: card.color }, shadow: makeShadow() });
  s6.addText(card.msg, { x: xPos + 0.25, y: yPos + 1.6, w: 4.0, h: 0.35, fontSize: 11, bold: true, color: BG_WHITE, align: "center", valign: "middle" });
});


// ============================================================
// SLIDE 7: ACTION PLAN
// ============================================================
let s7 = pres.addSlide();
s7.background = { color: BG_LIGHT };

s7.addText("Plan d'action : que faire concretement ?", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 26, fontFace: "Calibri", bold: true, color: TEXT_DARK, align: "center"
});

const actions = [
  {
    prio: "1", title: "Terrain : 7 bureaux prioritaires",
    desc: "Concentrer le porte-a-porte sur les bureaux 4, 17, 12, 5, 11, 16 et 7. Ce sont les bureaux ou les electeurs sont les plus indecis et ou chaque voix pese le plus.",
    color: ACCENT_GREEN
  },
  {
    prio: "2", title: "Bureau 4 : cible prioritaire",
    desc: "568 inscrits, plus forte volatilite, score Grelet 2020 le plus bas (58%). C'est le bureau ou le resultat peut le plus bouger. Mobilisation intensive necessaire.",
    color: ACCENT_RED
  },
  {
    prio: "3", title: "Adapter le discours par bureau",
    desc: "Jeunes (1,5,13-15) : emploi, logement. Seniors (6-9,17) : sante, securite. Actifs (2,14) : pouvoir d'achat. Tres ages (4,12) : accompagnement au vote.",
    color: ACCENT_BLUE
  },
  {
    prio: "4", title: "Preparer le 2nd tour des maintenant",
    desc: "Tous les scenarios donnent un 2nd tour. La strategie d'alliance et de report sera decisive. Identifier des maintenant les electeurs de la 3e liste susceptibles de se reporter.",
    color: ACCENT_PURPLE
  }
];

actions.forEach((a, i) => {
  const yPos = 0.9 + i * 1.1;
  s7.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 9, h: 0.95, fill: { color: BG_WHITE }, shadow: makeShadow() });
  s7.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 0.08, h: 0.95, fill: { color: a.color } });

  // Priority badge
  s7.addShape(pres.shapes.OVAL, { x: 0.8, y: yPos + 0.2, w: 0.5, h: 0.5, fill: { color: a.color } });
  s7.addText(a.prio, { x: 0.8, y: yPos + 0.2, w: 0.5, h: 0.5, fontSize: 18, bold: true, color: BG_WHITE, align: "center", valign: "middle" });

  s7.addText(a.title, { x: 1.5, y: yPos + 0.05, w: 7.6, h: 0.35, fontSize: 14, bold: true, color: a.color, fontFace: "Calibri", margin: 0 });
  s7.addText(a.desc, { x: 1.5, y: yPos + 0.42, w: 7.6, h: 0.45, fontSize: 11, color: TEXT_BODY, fontFace: "Calibri", margin: 0 });
});


// ============================================================
// SLIDE 8: CLOSING — MOBILIZATION CALL
// ============================================================
let s8 = pres.addSlide();
s8.background = { color: BG_ACCENT };

s8.addText("L'election se jouera sur la mobilisation", {
  x: 0.5, y: 0.3, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Calibri", bold: true, color: BG_WHITE, align: "center"
});

// Key message
s8.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 8.4, h: 0.9, fill: { color: ACCENT_YELLOW } });
s8.addText("L'ecart projete est de quelques centaines de voix : chaque electeur convaincu compte", {
  x: 0.8, y: 1.1, w: 8.4, h: 0.9,
  fontSize: 18, fontFace: "Calibri", bold: true, color: TEXT_DARK,
  align: "center", valign: "middle"
});

// Two scenario summary
s8.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.3, w: 4.0, h: 1.2, fill: { color: LEMOIGNE }, shadow: makeShadow() });
s8.addText("Si forte mobilisation RN/droite", { x: 0.8, y: 2.35, w: 4.0, h: 0.4, fontSize: 13, bold: true, color: BG_WHITE, align: "center" });
s8.addText("Lemoigne favori\n(59 a 94% de chances)", { x: 0.8, y: 2.8, w: 4.0, h: 0.6, fontSize: 14, color: BG_WHITE, align: "center", fontFace: "Calibri" });

s8.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 2.3, w: 4.0, h: 1.2, fill: { color: GRELET }, shadow: makeShadow() });
s8.addText("Si forte mobilisation gauche/centre", { x: 5.2, y: 2.35, w: 4.0, h: 0.4, fontSize: 13, bold: true, color: BG_WHITE, align: "center" });
s8.addText("Grelet favorite\n(jusqu'a 99% de chances)", { x: 5.2, y: 2.8, w: 4.0, h: 0.6, fontSize: 14, color: BG_WHITE, align: "center", fontFace: "Calibri" });

// Final bullets
const finalBullets = [
  { text: "41% de l'electorat se trouve dans nos 7 bureaux cibles : concentrons nos efforts", options: { bullet: true, breakLine: true, fontSize: 14, color: BG_WHITE, fontFace: "Calibri", paraSpaceAfter: 8 } },
  { text: "Le 2nd tour est certain : preparons des maintenant la strategie d'alliance", options: { bullet: true, breakLine: true, fontSize: 14, color: BG_WHITE, fontFace: "Calibri", paraSpaceAfter: 8 } },
  { text: "Chaque porte frappee, chaque electeur convaincu peut faire basculer le resultat", options: { bullet: true, fontSize: 14, color: ACCENT_YELLOW, fontFace: "Calibri", bold: true } }
];

s8.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.75, w: 8.4, h: 1.65, fill: { color: "0D47A1" }, shadow: makeShadow() });
s8.addText(finalBullets, { x: 1.1, y: 3.85, w: 7.8, h: 1.5 });

// Footer
s8.addText("Elections La Fleche 2026 — Projections Monte Carlo sur donnees electorales 2019-2024", {
  x: 0.5, y: 5.2, w: 9, h: 0.3,
  fontSize: 10, color: "90CAF9", align: "center", fontFace: "Calibri"
});


// ============================================================
// SAVE
// ============================================================
pres.writeFile({ fileName: "C:/Users/Philippe/Documents/CLAUDECODE/ELECTIONS-LAFLECHE/docs/synthese-militants.pptx" })
  .then(() => console.log("synthese-militants.pptx created successfully!"))
  .catch(err => console.error("Error:", err));
