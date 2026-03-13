/* historique_bv.js — Donnees bureau de vote + inference ecologique */
const HistoriqueBV = (() => {
  let data = null;
  let profiles = null;
  let correlations = null;

  async function load() {
    if (data) return data;
    try {
      const resp = await fetch('./data/historique_bv.json');
      data = await resp.json();
      profiles = computeProfiles();
      correlations = computeCorrelations();
      return data;
    } catch (e) {
      console.warn('HistoriqueBV: impossible de charger historique_bv.json', e);
      return null;
    }
  }

  /** Calcule les ecarts de chaque bureau par rapport a la moyenne communale */
  function computeProfiles() {
    if (!data) return null;
    const result = {};
    const elections = ['europeennes2024', 'legislatives2024', 'municipales2020'];

    for (const elec of elections) {
      const elecData = data[elec];
      if (!elecData || !elecData.bureaux) continue;

      // Totaux communaux
      const communeTotals = {};
      let communeExprimes = 0;
      for (const bv of Object.values(elecData.bureaux)) {
        communeExprimes += bv.exprimes;
        for (const [bloc, voix] of Object.entries(bv.voix)) {
          communeTotals[bloc] = (communeTotals[bloc] || 0) + voix;
        }
      }

      // Pourcentages communaux
      const communePcts = {};
      for (const [bloc, voix] of Object.entries(communeTotals)) {
        communePcts[bloc] = communeExprimes > 0 ? (voix / communeExprimes) * 100 : 0;
      }

      // Deviations par bureau
      for (const [bvId, bv] of Object.entries(elecData.bureaux)) {
        if (!result[bvId]) result[bvId] = {};
        result[bvId][elec] = {};
        for (const [bloc, voix] of Object.entries(bv.voix)) {
          const bureauPct = bv.exprimes > 0 ? (voix / bv.exprimes) * 100 : 0;
          result[bvId][elec][bloc] = bureauPct - (communePcts[bloc] || 0);
        }
      }
    }
    return result;
  }

  /** Correlation de Pearson entre deux vecteurs */
  function pearson(x, y) {
    const n = x.length;
    if (n < 3) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i]; sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den > 0 ? num / den : 0;
  }

  /** Correlations entre blocs nationaux et listes municipales 2020 */
  function computeCorrelations() {
    if (!data) return null;
    const result = {};
    const muniData = data.municipales2020;
    if (!muniData) return null;

    const bvIds = Object.keys(muniData.bureaux).sort((a, b) => parseInt(a) - parseInt(b));
    const muniListes = Object.keys(muniData.bureaux[bvIds[0]].voix);

    // % municipales par BV
    const muniPcts = {};
    for (const liste of muniListes) {
      muniPcts[liste] = bvIds.map(bv => {
        const d = muniData.bureaux[bv];
        return d.exprimes > 0 ? (d.voix[liste] / d.exprimes) * 100 : 0;
      });
    }

    for (const sourceElec of ['europeennes2024', 'legislatives2024']) {
      const elecData = data[sourceElec];
      if (!elecData) continue;
      result[sourceElec] = {};
      const blocs = Object.keys(elecData.bureaux[bvIds[0]].voix);

      for (const bloc of blocs) {
        const blocPcts = bvIds.map(bv => {
          const d = elecData.bureaux[bv];
          return d.exprimes > 0 ? (d.voix[bloc] / d.exprimes) * 100 : 0;
        });
        for (const liste of muniListes) {
          const key = `${bloc}_vs_${liste}`;
          result[sourceElec][key] = pearson(blocPcts, muniPcts[liste]);
        }
      }
    }
    return result;
  }

  /** Derive les sigmas (ecart-types) pour la matrice de reports */
  function getDefaultSigmas(matrixConfig) {
    if (!data || !profiles) {
      // Heuristique: 15% du mean, min 3, max 15
      return matrixConfig.matrix.map(row =>
        row.map(val => Math.min(15, Math.max(3, val * 0.15)))
      );
    }

    // Utilise la variance inter-bureaux des taux de report implicites
    const sigmas = matrixConfig.matrix.map((row, i) => {
      return row.map((val, j) => {
        // Heuristique calibree: plus le coefficient est eleve, plus l'incertitude absolue est grande
        // mais proportionnellement moins incertaine
        const base = Math.max(3, val * 0.12);
        // Bonus d'incertitude pour les coefficients moyens (30-70%) car plus de variance
        const midBonus = val > 20 && val < 80 ? 2 : 0;
        return Math.min(15, base + midBonus);
      });
    });
    return sigmas;
  }

  /** Deviation moyenne d'un bureau par rapport a la commune (tous blocs, toutes elections) */
  function getBureauDeviation(bvId, listeNoms) {
    if (!profiles || !profiles[bvId]) return null;

    // On utilise les europeennes et legislatives pour estimer les deviations
    // Mapping des blocs nationaux vers les listes municipales
    const deviations = {};
    for (const nom of listeNoms) {
      deviations[nom] = 0;
    }

    // Moyenne des deviations sur les elections disponibles
    let count = 0;
    for (const elec of ['europeennes2024', 'legislatives2024']) {
      if (!profiles[bvId][elec]) continue;
      const devs = profiles[bvId][elec];

      // Heuristique de mapping:
      // RN -> Lemoigne (si present dans listes)
      // Gauche -> Grelet-Certenais (si presente)
      // Macron/LR -> Da Silva (si present)
      for (const nom of listeNoms) {
        const nomLower = nom.toLowerCase();
        if (nomLower.includes('lemoigne')) {
          deviations[nom] += (devs['RN'] || 0) * 0.7 + (devs['Reconquete'] || 0) * 0.3;
        } else if (nomLower.includes('grelet')) {
          deviations[nom] += (devs['Gauche'] || 0) * 0.8 + (devs['Macron'] || 0) * 0.1;
        } else if (nomLower.includes('silva')) {
          deviations[nom] += (devs['Macron'] || 0) * 0.5 + (devs['LR'] || 0) * 0.4;
        }
      }
      count++;
    }

    if (count > 0) {
      for (const nom of listeNoms) {
        deviations[nom] /= count;
      }
    }
    return deviations;
  }

  function getData() { return data; }
  function getProfiles() { return profiles; }
  function getCorrelations() { return correlations; }

  return { load, getData, getProfiles, getCorrelations, getDefaultSigmas, getBureauDeviation };
})();
