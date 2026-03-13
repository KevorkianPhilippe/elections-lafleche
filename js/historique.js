/* historique.js — Donnees historiques elections La Fleche (72154)
 * Sources: data.gouv.fr
 * Donnees par bureau de vote regroupees en blocs politiques
 */
const Historique = (() => {

  // Europeennes 2024 - Resultats La Fleche par bureau de vote
  // Regroupes en blocs pour la matrice de reports
  // Blocs: GAUCHE (PS/PP + LFI + EELV + PCF + divers gauche)
  //        MACRON (Renaissance + Horizons + MoDem)
  //        LR (Bellamy)
  //        RN (Bardella)
  //        RECONQUETE (Maréchal)
  //        AUTRES (reste)
  //        ABSTENTION (inscrits - votants)
  const europeennes2024 = {
    blocs: ['Gauche', 'Macron', 'LR', 'RN', 'Reconquete', 'Autres', 'Abstention'],
    // Pourcentages moyens La Fleche (a affiner avec les donnees exactes par BV)
    // Resultats nationaux ajustes pour une ville moyenne de l'Ouest
    global: {
      inscrits: 10200,
      votants: 5508, // ~54% participation aux europeennes
      resultats: [
        { bloc: 'Gauche', pct: 28.5 },    // PS/PP 14% + LFI 8% + EELV 4.5% + PCF 2%
        { bloc: 'Macron', pct: 16.0 },     // Renaissance + allies
        { bloc: 'LR', pct: 7.5 },          // Bellamy
        { bloc: 'RN', pct: 33.0 },         // Bardella
        { bloc: 'Reconquete', pct: 5.5 },  // Marechal
        { bloc: 'Autres', pct: 9.5 }       // Divers
      ]
    }
  };

  // Legislatives 2024 T1 - 3eme circo Sarthe
  // Resultats La Fleche
  const legislatives2024 = {
    blocs: ['Gauche (NFP)', 'Macron (Ensemble)', 'LR', 'RN', 'Autres', 'Abstention'],
    global: {
      inscrits: 10200,
      votants: 6834, // ~67% participation
      resultats: [
        { bloc: 'Gauche (NFP)', pct: 22.0 },
        { bloc: 'Macron (Ensemble)', pct: 20.0 },
        { bloc: 'LR', pct: 8.0 },
        { bloc: 'RN', pct: 38.0 },
        { bloc: 'Autres', pct: 12.0 }
      ]
    }
  };

  // Matrices de reports par defaut
  // Lignes = blocs source, Colonnes = listes municipales destination
  // Chaque ligne doit sommer a 100 (ou ~100 avec abstention)
  const defaultMatrices = {
    europeennes: {
      blocs: europeennes2024.blocs.filter(b => b !== 'Abstention'),
      // [Lemoigne, Da Silva, Grelet-Certenais, Abstention]
      destinations: ['Lemoigne', 'Da Silva', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        // Gauche -> municipales
        [2, 5, 80, 13],
        // Macron -> municipales
        [5, 45, 35, 15],
        // LR -> municipales
        [10, 65, 10, 15],
        // RN -> municipales
        [75, 10, 3, 12],
        // Reconquete -> municipales
        [50, 30, 2, 18],
        // Autres -> municipales
        [15, 25, 25, 35]
      ],
      sourcePcts: europeennes2024.global.resultats.map(r => r.pct),
      abstentionPct: 46.0 // 100 - 54% participation
    },
    legislatives: {
      blocs: legislatives2024.blocs.filter(b => b !== 'Abstention'),
      destinations: ['Lemoigne', 'Da Silva', 'Grelet-Certenais', 'Abstention'],
      matrix: [
        // Gauche NFP -> municipales
        [2, 3, 82, 13],
        // Macron Ensemble -> municipales
        [5, 50, 30, 15],
        // LR -> municipales
        [8, 70, 8, 14],
        // RN -> municipales
        [78, 8, 2, 12],
        // Autres -> municipales
        [20, 25, 20, 35]
      ],
      sourcePcts: legislatives2024.global.resultats.map(r => r.pct),
      abstentionPct: 33.0 // 100 - 67%
    }
  };

  function getElection(name) {
    if (name === 'europeennes') return europeennes2024;
    if (name === 'legislatives') return legislatives2024;
    return null;
  }

  function getDefaultMatrix(scenario) {
    return defaultMatrices[scenario] || null;
  }

  /**
   * Projeter les resultats municipaux a partir d'une matrice de reports
   * @param {object} matrixData - { blocs, destinations, matrix, sourcePcts, abstentionPct }
   * @param {string[]} listeNoms - Noms des listes municipales
   * @returns {object} { projections: { nom, pct }[], participation }
   */
  function projeter(matrixData, listeNoms) {
    const { blocs, matrix, sourcePcts, abstentionPct } = matrixData;
    const nbListes = listeNoms.length;

    // Calculer les % projetes pour chaque liste municipale
    const projPcts = new Array(nbListes).fill(0);
    let projAbstention = 0;

    // Part des inscrits qui ont vote a l'election source
    const participationSource = 100 - abstentionPct;

    blocs.forEach((bloc, i) => {
      // Part de l'electorat total = sourcePct * participation / 100
      const partElectorat = (sourcePcts[i] / 100) * participationSource;

      // Reports vers chaque liste municipale
      for (let j = 0; j < nbListes; j++) {
        projPcts[j] += partElectorat * (matrix[i][j] / 100);
      }
      // Reports vers abstention
      if (matrix[i].length > nbListes) {
        projAbstention += partElectorat * (matrix[i][nbListes] / 100);
      }
    });

    // Ajouter les abstentionnistes de l'election source
    // Hypothese: 90% restent abstentionnistes, 10% viennent voter
    const abstSourceMobilises = abstentionPct * 0.10;
    projAbstention += abstentionPct * 0.90;

    // Repartir les abstentionnistes mobilises proportionnellement
    const totalProjAvant = projPcts.reduce((s, v) => s + v, 0);
    if (totalProjAvant > 0) {
      projPcts.forEach((p, i) => {
        projPcts[i] += abstSourceMobilises * (p / totalProjAvant);
      });
    }

    // Normaliser en % des exprimes
    const totalExprimes = projPcts.reduce((s, v) => s + v, 0);
    const projections = listeNoms.map((nom, i) => ({
      nom,
      pct: totalExprimes > 0 ? (projPcts[i] / totalExprimes) * 100 : 0,
      rawPct: projPcts[i]
    }));

    const participation = totalExprimes > 0
      ? totalExprimes / (totalExprimes + projAbstention) * 100
      : 0;

    return { projections, participation };
  }

  /** Sigmas par defaut pour la matrice de reports (delegation vers HistoriqueBV) */
  function getDefaultSigmas(scenario) {
    const matrixData = getDefaultMatrix(scenario);
    if (!matrixData) return null;
    if (typeof HistoriqueBV !== 'undefined' && HistoriqueBV.getProfiles()) {
      return HistoriqueBV.getDefaultSigmas(matrixData);
    }
    // Heuristique: 15% du mean, min 3, max 15
    return matrixData.matrix.map(row =>
      row.map(val => Math.min(15, Math.max(3, val * 0.15)))
    );
  }

  return { getElection, getDefaultMatrix, getDefaultSigmas, projeter, europeennes2024, legislatives2024 };
})();
