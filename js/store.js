/* store.js — localStorage CRUD for election data */
const Store = (() => {
  const STORAGE_KEY = 'elections-lafleche-2026';

  const DEFAULT_CONFIG = {
    listes: [
      { nom: 'Lemoigne', couleur: '#5C6BC0', abrev: 'RL' },
      { nom: 'Da Silva', couleur: '#2196F3', abrev: 'MDS' },
      { nom: 'Grelet-Certenais', couleur: '#E91E63', abrev: 'NGC' }
    ],
    nbBureaux: 17,
    totalSieges: 33,
    primeMajoritaire: 17
  };

  function getBureaux(nbBureaux) {
    return Array.from({ length: nbBureaux }, (_, i) =>
      String(i + 1).padStart(2, '0')
    );
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted data */ }
    return null;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function init() {
    let data = load();
    if (!data) {
      data = {
        config: { ...DEFAULT_CONFIG },
        resultats: {}
      };
      save(data);
    }
    // Ensure config has all fields
    if (!data.config.totalSieges) data.config.totalSieges = 33;
    if (!data.config.primeMajoritaire) data.config.primeMajoritaire = 17;
    return data;
  }

  function getConfig() {
    return init().config;
  }

  function setConfig(config) {
    const data = init();
    data.config = config;
    save(data);
  }

  function getResultats() {
    return init().resultats;
  }

  function setResultat(bv, result) {
    const data = init();
    data.resultats[bv] = result;
    save(data);
  }

  function deleteResultat(bv) {
    const data = init();
    delete data.resultats[bv];
    save(data);
  }

  function getAggregate() {
    const config = getConfig();
    const resultats = getResultats();
    const bureaux = getBureaux(config.nbBureaux);
    const filled = bureaux.filter(bv => resultats[bv]);
    const nbListes = config.listes.length;

    let totalInscrits = 0, totalVotants = 0, totalBlancs = 0, totalNuls = 0;
    const totalVoix = new Array(nbListes).fill(0);

    filled.forEach(bv => {
      const r = resultats[bv];
      totalInscrits += r.inscrits || 0;
      totalVotants += r.votants || 0;
      totalBlancs += r.blancs || 0;
      totalNuls += r.nuls || 0;
      (r.voix || []).forEach((v, i) => { totalVoix[i] += v; });
    });

    const totalExprimes = totalVotants - totalBlancs - totalNuls;
    const participation = totalInscrits > 0
      ? ((totalVotants / totalInscrits) * 100).toFixed(1)
      : null;

    return {
      bureaux, filled: filled.length, total: bureaux.length,
      inscrits: totalInscrits, votants: totalVotants,
      blancs: totalBlancs, nuls: totalNuls,
      exprimes: totalExprimes, voix: totalVoix,
      participation
    };
  }

  function exportJSON() {
    return JSON.stringify(init(), null, 2);
  }

  function importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (data.config && data.resultats !== undefined) {
        save(data);
        return true;
      }
    } catch (e) { /* invalid */ }
    return false;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    init();
  }

  return {
    init, getConfig, setConfig, getBureaux,
    getResultats, setResultat, deleteResultat,
    getAggregate, exportJSON, importJSON, reset
  };
})();
