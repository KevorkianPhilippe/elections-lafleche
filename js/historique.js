/* historique.js — Donnees historiques elections La Fleche (72154)
 * Sources: DataRealis (72154_resultats_elections.xlsx) — donnees exactes
 * Donnees par bureau de vote regroupees en blocs politiques
 */
const Historique = (() => {

  // ── Europeennes 2024 — Resultats exacts La Fleche (DataRealis) ──
  // Gauche = PS(16%) + LFI(5.01%) + EELV(4.45%) + PCF(2.10%) = 27.56%
  const europeennes2024 = {
    blocs: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres', 'Abstention'],
    global: {
      inscrits: 10267,
      votants: 5649,
      resultats: [
        { bloc: 'Gauche', pct: 27.6 },
        { bloc: 'Macron', pct: 15.9 },
        { bloc: 'LR', pct: 7.5 },
        { bloc: 'RN', pct: 34.3 },
        { bloc: 'Reconquete', pct: 6.3 },
        { bloc: 'Autres', pct: 8.4 }
      ]
    }
  };

  // ── Legislatives 2024 T1 — Resultats exacts La Fleche (DataRealis) ──
  const legislatives2024 = {
    blocs: ['Gauche (NFP)', 'Macron (Ensemble)', 'LR', 'RN', 'Reconquete', 'Abstention'],
    global: {
      inscrits: 10266,
      votants: 7119,
      resultats: [
        { bloc: 'Gauche (NFP)', pct: 22.9 },
        { bloc: 'Macron (Ensemble)', pct: 30.5 },
        { bloc: 'LR', pct: 4.8 },
        { bloc: 'RN', pct: 36.8 },
        { bloc: 'Reconquete', pct: 2.3 }
      ]
    }
  };

  // ── Presidentielle 2022 T1 — Resultats exacts La Fleche (DataRealis) ──
  // Gauche = LFI(18.07%) + EELV(4.82%) = 22.89%
  // LR = LR(4.82%) + Lassalle(2.55%) = 7.37%
  const presidentielle2022 = {
    blocs: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres', 'Abstention'],
    global: {
      inscrits: 11122,
      votants: 8050,
      resultats: [
        { bloc: 'Gauche', pct: 22.9 },
        { bloc: 'Macron', pct: 30.0 },
        { bloc: 'LR', pct: 7.4 },
        { bloc: 'RN', pct: 25.2 },
        { bloc: 'Reconquete', pct: 6.4 },
        { bloc: 'Autres', pct: 8.1 }
      ]
    }
  };

  // ── Municipales 2026 T1 — Resultats definitifs ──
  const municipalesT1_2026 = {
    inscrits: 10330,
    votants: 7114,
    blancs: 130,
    nuls: 84,
    exprimes: 6900,
    participation: 68.87,
    resultats: {
      'Lemoigne': { voix: 3014, pct: 43.68 },
      'Da Silva': { voix: 1161, pct: 16.83 },
      'Grelet-Certenais': { voix: 2724, pct: 39.48 }
    }
  };

  // ── Matrices de reports par defaut ──
  // Lignes = blocs source, Colonnes = [Lemoigne, Da Silva, Grelet-Certenais, Abstention]
  const defaultMatrices = {
    europeennes: {
      blocs: europeennes2024.blocs.filter(b => b !== 'Abstention'),
      sources: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres'],
      destinations: ['Lemoigne', 'Da Silva', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        [2, 5, 80, 13],    // Gauche -> municipales
        [5, 45, 35, 15],   // Macron -> municipales
        [10, 65, 10, 15],  // LR -> municipales
        [75, 10, 3, 12],   // RN -> municipales
        [50, 30, 2, 18],   // Reconquete -> municipales
        [15, 25, 25, 35]   // Autres -> municipales
      ],
      sourcePcts: europeennes2024.global.resultats.map(r => r.pct),
      abstentionPct: 45.0  // 100 - 55%
    },
    legislatives: {
      blocs: legislatives2024.blocs.filter(b => b !== 'Abstention'),
      sources: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete'],
      destinations: ['Lemoigne', 'Da Silva', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        [2, 3, 82, 13],    // Gauche NFP -> municipales
        [5, 50, 30, 15],   // Macron Ensemble -> municipales
        [8, 70, 8, 14],    // LR -> municipales
        [78, 8, 2, 12],    // RN -> municipales
        [55, 25, 2, 18]    // Reconquete -> municipales
      ],
      sourcePcts: legislatives2024.global.resultats.map(r => r.pct),
      abstentionPct: 30.7  // 100 - 69.3%
    },
    presidentielle: {
      blocs: presidentielle2022.blocs.filter(b => b !== 'Abstention'),
      sources: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres'],
      destinations: ['Lemoigne', 'Da Silva', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        [2, 5, 80, 13],    // Gauche (Melenchon+Jadot) -> municipales
        [5, 45, 35, 15],   // Macron -> municipales
        [10, 60, 12, 18],  // LR (Pecresse+Lassalle) -> municipales
        [75, 10, 3, 12],   // RN (Le Pen) -> municipales
        [50, 30, 2, 18],   // Reconquete (Zemmour) -> municipales
        [15, 25, 25, 35]   // Autres -> municipales
      ],
      sourcePcts: presidentielle2022.global.resultats.map(r => r.pct),
      abstentionPct: 27.6  // 100 - 72.4%
    },

  };

  /**
   * Calcule la matrice T2 a partir des donnees reelles des elections nationales.
   * Inference ecologique : decompose l'electorat Da Silva par bloc politique,
   * puis estime l'affinite Lemoigne/Grelet de chaque composante.
   *
   * @param {number} daSilvaAbstPct - taux d'abstention prevu des electeurs Da Silva (defaut 30)
   * @param {number} loyaute - taux de fidelite des electeurs Lemoigne/Grelet T1 (defaut 93)
   * @returns {object} matrice T2 au format standard
   */
  function computeT2Matrix(daSilvaAbstPct = 30, loyaute = 93) {
    const scenarios = ['europeennes', 'legislatives', 'presidentielle'];
    let totalAffiniteL = 0, totalAffiniteG = 0, totalPoids = 0;

    // Decomposition par scenario et par bloc
    const detailParScenario = [];

    for (const sc of scenarios) {
      const m = defaultMatrices[sc];
      if (!m) continue;
      let scAffiniteL = 0, scAffiniteG = 0, scPoids = 0;

      for (let i = 0; i < m.matrix.length; i++) {
        const poidsBloc = m.sourcePcts[i];
        const versLemoigne = m.matrix[i][0];
        const versDaSilva = m.matrix[i][1];
        const versGrelet = m.matrix[i][2];

        // Poids de ce bloc dans l'electorat Da Silva
        const wDaSilva = poidsBloc * versDaSilva;
        if (wDaSilva <= 0) continue;

        // Affinite naturelle : parmi les electeurs de ce bloc,
        // ratio L/(L+G) hors Da Silva et abstention
        const sommeL_G = versLemoigne + versGrelet;
        if (sommeL_G <= 0) continue;

        const ratioL = versLemoigne / sommeL_G;

        scAffiniteL += wDaSilva * ratioL;
        scAffiniteG += wDaSilva * (1 - ratioL);
        scPoids += wDaSilva;
      }

      if (scPoids > 0) {
        detailParScenario.push({
          scenario: sc,
          affiniteL: scAffiniteL / scPoids,
          affiniteG: scAffiniteG / scPoids
        });
        totalAffiniteL += scAffiniteL;
        totalAffiniteG += scAffiniteG;
        totalPoids += scPoids;
      }
    }

    // Affinite moyenne ponderee sur les 3 scrutins
    const affiniteL = totalPoids > 0 ? totalAffiniteL / totalPoids : 0.5;
    const affiniteG = totalPoids > 0 ? totalAffiniteG / totalPoids : 0.5;

    // Reports Da Silva parmi ceux qui votent (hors abstention)
    const daSilvaVotants = 100 - daSilvaAbstPct;
    const daSilvaVersL = Math.round(affiniteL * daSilvaVotants);
    const daSilvaVersG = daSilvaVotants - daSilvaVersL;

    // Fuite inter-candidats (2% de switch est standard)
    const fuite = Math.round((100 - loyaute) * 0.3); // ~2% de switch
    const abstLoyaute = 100 - loyaute - fuite;

    return {
      blocs: [
        `Elect. Lemoigne (${municipalesT1_2026.resultats['Lemoigne'].pct.toFixed(1)}%)`,
        `Elect. Da Silva (${municipalesT1_2026.resultats['Da Silva'].pct.toFixed(1)}%)`,
        `Elect. Grelet (${municipalesT1_2026.resultats['Grelet-Certenais'].pct.toFixed(1)}%)`
      ],
      sources: ['Lemoigne', 'Da Silva', 'Grelet'],
      destinations: ['Lemoigne', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        [loyaute, fuite, abstLoyaute],
        [daSilvaVersL, daSilvaVersG, daSilvaAbstPct],
        [fuite, loyaute, abstLoyaute]
      ],
      sourcePcts: [
        municipalesT1_2026.resultats['Lemoigne'].pct,
        municipalesT1_2026.resultats['Da Silva'].pct,
        municipalesT1_2026.resultats['Grelet-Certenais'].pct
      ],
      abstentionPct: 100 - municipalesT1_2026.participation,
      _computed: true,
      _details: {
        affiniteL, affiniteG, detailParScenario,
        daSilvaAbstPct, loyaute
      }
    };
  }

  function getElection(name) {
    if (name === 'europeennes') return europeennes2024;
    if (name === 'legislatives') return legislatives2024;
    if (name === 'presidentielle') return presidentielle2022;
    return null;
  }

  function getDefaultMatrix(scenario) {
    // T2 data-driven : calculee a la volee
    if (scenario === 't2_datadriven') return computeT2Matrix(30);
    // Sensibilite : abstention basse/haute pour Da Silva
    if (scenario === 't2_abst_basse') return computeT2Matrix(20);
    if (scenario === 't2_abst_haute') return computeT2Matrix(40);
    return defaultMatrices[scenario] || null;
  }

  /**
   * Projeter les resultats municipaux a partir d'une matrice de reports
   */
  function projeter(matrixData, listeNoms) {
    const { blocs, matrix, sourcePcts, abstentionPct } = matrixData;
    const nbListes = listeNoms.length;
    const projPcts = new Array(nbListes).fill(0);
    let projAbstention = 0;

    const participationSource = 100 - abstentionPct;

    blocs.forEach((bloc, i) => {
      const partElectorat = (sourcePcts[i] / 100) * participationSource;
      for (let j = 0; j < nbListes; j++) {
        projPcts[j] += partElectorat * (matrix[i][j] / 100);
      }
      if (matrix[i].length > nbListes) {
        projAbstention += partElectorat * (matrix[i][nbListes] / 100);
      }
    });

    // Abstentionnistes source: 90% restent, 10% se mobilisent
    const abstSourceMobilises = abstentionPct * 0.10;
    projAbstention += abstentionPct * 0.90;

    const totalProjAvant = projPcts.reduce((s, v) => s + v, 0);
    if (totalProjAvant > 0) {
      projPcts.forEach((p, i) => {
        projPcts[i] += abstSourceMobilises * (p / totalProjAvant);
      });
    }

    const totalExprimes = projPcts.reduce((s, v) => s + v, 0);
    const projections = listeNoms.map((nom, i) => ({
      nom,
      pct: totalExprimes > 0 ? (projPcts[i] / totalExprimes) * 100 : 0,
      rawPct: projPcts[i]
    }));

    const participation = totalExprimes > 0
      ? totalExprimes / (totalExprimes + projAbstention) * 100 : 0;

    return { projections, participation };
  }

  /** Sigmas par defaut (delegation vers HistoriqueBV data-driven) */
  function getDefaultSigmas(scenario) {
    const matrixData = getDefaultMatrix(scenario);
    if (!matrixData) return null;
    if (typeof HistoriqueBV !== 'undefined' && HistoriqueBV.getProfiles()) {
      return HistoriqueBV.getDefaultSigmas(matrixData);
    }
    return matrixData.matrix.map(row =>
      row.map(val => Math.min(15, Math.max(3, val * 0.15)))
    );
  }

  return {
    getElection, getDefaultMatrix, getDefaultSigmas, projeter, computeT2Matrix,
    europeennes2024, legislatives2024, presidentielle2022, municipalesT1_2026
  };
})();
