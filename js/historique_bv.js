/* historique_bv.js — Donnees bureau de vote enrichies (DataRealis + data.gouv.fr)
   9 elections, demographics, volatilite data-driven */
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

  // ── Elections T1 avec blocs (pour correlations et profils) ──
  const BLOC_ELECTIONS = [
    'europeennes2019', 'presidentielle2022t1', 'legislatives2022t1',
    'europeennes2024', 'legislatives2024t1'
  ];

  // ── Profils: ecarts de chaque bureau par rapport a la moyenne communale ──
  function computeProfiles() {
    if (!data || !data.elections) return null;
    const result = {};

    for (const elecKey of BLOC_ELECTIONS) {
      const elec = data.elections[elecKey];
      if (!elec || !elec.bureaux) continue;

      // Compute commune-level percentages from bureau sum
      const communeTotals = {};
      let communeExprimes = 0;
      for (const bv of Object.values(elec.bureaux)) {
        if (!bv.blocs) continue;
        communeExprimes += bv.exprimes;
        for (const [bloc, voix] of Object.entries(bv.blocs)) {
          communeTotals[bloc] = (communeTotals[bloc] || 0) + voix;
        }
      }
      const communePcts = {};
      for (const [bloc, voix] of Object.entries(communeTotals)) {
        communePcts[bloc] = communeExprimes > 0 ? (voix / communeExprimes) * 100 : 0;
      }

      // Per-bureau deviations
      for (const [bvId, bv] of Object.entries(elec.bureaux)) {
        if (!bv.blocs) continue;
        if (!result[bvId]) result[bvId] = {};
        result[bvId][elecKey] = {};
        for (const [bloc, voix] of Object.entries(bv.blocs)) {
          const pct = bv.exprimes > 0 ? (voix / bv.exprimes) * 100 : 0;
          result[bvId][elecKey][bloc] = pct - (communePcts[bloc] || 0);
        }
      }
    }
    return result;
  }

  // ── Pearson correlation ──
  function pearson(x, y) {
    const n = x.length;
    if (n < 3) return 0;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
    for (let i = 0; i < n; i++) {
      sx += x[i]; sy += y[i];
      sxy += x[i] * y[i];
      sx2 += x[i] * x[i];
      sy2 += y[i] * y[i];
    }
    const num = n * sxy - sx * sy;
    const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
    return den > 0 ? num / den : 0;
  }

  // ── Correlations blocs nationaux <-> listes municipales 2020 ──
  function computeCorrelations() {
    if (!data || !data.elections) return null;
    const muni = data.elections.municipales2020;
    if (!muni || !muni.bureaux) return null;

    const bvIds = Object.keys(muni.bureaux).sort((a, b) => +a - +b);
    const listes = muni.candidats || Object.keys(muni.bureaux[bvIds[0]].voix);

    // Municipal % per list per BV
    const muniPcts = {};
    for (const liste of listes) {
      muniPcts[liste] = bvIds.map(bv => {
        const d = muni.bureaux[bv];
        return d.exprimes > 0 ? ((d.voix[liste] || 0) / d.exprimes) * 100 : 0;
      });
    }

    const result = {};
    for (const elecKey of BLOC_ELECTIONS) {
      const elec = data.elections[elecKey];
      if (!elec) continue;
      result[elecKey] = {};
      const blocs = Object.keys(elec.bureaux[bvIds[0]].blocs || {});

      for (const bloc of blocs) {
        const blocPcts = bvIds.map(bv => {
          const d = elec.bureaux[bv];
          return d.blocs && d.exprimes > 0 ? ((d.blocs[bloc] || 0) / d.exprimes) * 100 : 0;
        });
        for (const liste of listes) {
          result[elecKey][`${bloc}_vs_${liste}`] = pearson(blocPcts, muniPcts[liste]);
        }
      }
    }
    return result;
  }

  // ── Sigmas data-driven: utilise la volatilite reelle calculee par le parser ──
  function getDefaultSigmas(matrixConfig) {
    if (!data || !data.volatility || !data.volatility.commune) {
      // Fallback heuristique
      return matrixConfig.matrix.map(row =>
        row.map(val => Math.min(15, Math.max(3, val * 0.15)))
      );
    }

    const vol = data.volatility.commune;
    const sourceBlocs = matrixConfig.sources || [];

    return matrixConfig.matrix.map((row, i) => {
      // Volatilite du bloc source (si connu)
      const srcBloc = sourceBlocs[i];
      const blocVol = (srcBloc && vol[srcBloc]) || 5;

      return row.map(val => {
        // Sigma = proportion du coefficient * volatilite du bloc source
        // Plus le bloc est volatile historiquement, plus l'incertitude est grande
        const propFactor = Math.max(0.05, val / 100);
        const sigma = blocVol * propFactor * 2;
        // Floor 2, cap 18 (slightly wider than before since data-backed)
        return Math.min(18, Math.max(2, sigma));
      });
    });
  }

  // ── Deviation moyenne d'un bureau (toutes elections T1, ponderees) ──
  function getBureauDeviation(bvId, listeNoms) {
    if (!profiles || !profiles[bvId]) return null;

    const deviations = {};
    for (const nom of listeNoms) deviations[nom] = 0;

    // Weight more recent elections higher
    const weights = {
      'europeennes2019': 0.5,
      'presidentielle2022t1': 1.0,
      'legislatives2022t1': 0.8,
      'europeennes2024': 1.5,
      'legislatives2024t1': 1.5
    };

    let totalWeight = 0;
    for (const [elecKey, w] of Object.entries(weights)) {
      if (!profiles[bvId][elecKey]) continue;
      const devs = profiles[bvId][elecKey];
      totalWeight += w;

      for (const nom of listeNoms) {
        const nomLower = nom.toLowerCase();
        if (nomLower.includes('lemoigne')) {
          deviations[nom] += w * ((devs['RN'] || 0) * 0.7 + (devs['Reconquete'] || 0) * 0.3);
        } else if (nomLower.includes('grelet')) {
          deviations[nom] += w * ((devs['Gauche'] || 0) * 0.8 + (devs['Macron'] || 0) * 0.1);
        } else if (nomLower.includes('silva')) {
          deviations[nom] += w * ((devs['Macron'] || 0) * 0.5 + (devs['LR'] || 0) * 0.4);
        }
      }
    }

    if (totalWeight > 0) {
      for (const nom of listeNoms) deviations[nom] /= totalWeight;
    }
    return deviations;
  }

  // ── Bureau-level volatility (for per-bureau sigma modulation) ──
  function getBureauVolatility(bvId) {
    if (!data || !data.volatility || !data.volatility.bureaux) return null;
    return data.volatility.bureaux[bvId] || null;
  }

  // ── Demographics access ──
  function getDemographics(bvId) {
    if (!data || !data.demographics) return null;
    return bvId ? data.demographics[bvId] : data.demographics;
  }

  // ── Age-based voting tendency adjustment ──
  // Bureaux with more elderly voters lean more conservative/RN
  // Bureaux with more young voters lean more left
  function getAgeFactor(bvId, listeNoms) {
    const demo = getDemographics(bvId);
    if (!demo || !demo.age) return null;

    // Compute average age profile across all bureaux
    const allDemo = getDemographics();
    if (!allDemo) return null;

    const avgAge = { '18_35': 0, '36_65': 0, '66_80': 0, '80_plus': 0 };
    let n = 0;
    for (const d of Object.values(allDemo)) {
      if (!d.age) continue;
      for (const k of Object.keys(avgAge)) avgAge[k] += d.age[k];
      n++;
    }
    if (n === 0) return null;
    for (const k of Object.keys(avgAge)) avgAge[k] /= n;

    // Deviation from mean for this bureau
    const ageDev = {};
    for (const k of Object.keys(avgAge)) {
      ageDev[k] = demo.age[k] - avgAge[k];
    }

    // Map age deviation to list tendency
    // Young surplus → Gauche bonus; Elderly surplus → conservative bonus
    const factors = {};
    for (const nom of listeNoms) {
      const nomLower = nom.toLowerCase();
      if (nomLower.includes('lemoigne')) {
        // RN: correlates with 36-65 and 66-80
        factors[nom] = ageDev['36_65'] * 0.15 + ageDev['66_80'] * 0.1;
      } else if (nomLower.includes('grelet')) {
        // Gauche: correlates with young (18-35) and very old (80+, historic left)
        factors[nom] = ageDev['18_35'] * 0.2 + ageDev['80_plus'] * 0.1;
      } else if (nomLower.includes('silva')) {
        // Centre-droit: correlates with 66-80 (retraites CSP+)
        factors[nom] = ageDev['66_80'] * 0.15 + ageDev['80_plus'] * 0.1;
      } else {
        factors[nom] = 0;
      }
    }
    return factors;
  }

  // ── Accessors ──
  function getData() { return data; }
  function getProfiles() { return profiles; }
  function getCorrelations() { return correlations; }

  return {
    load, getData, getProfiles, getCorrelations,
    getDefaultSigmas, getBureauDeviation, getBureauVolatility,
    getDemographics, getAgeFactor
  };
})();
