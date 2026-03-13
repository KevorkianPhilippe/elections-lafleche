/* montecarlo.js — Moteur Monte Carlo + Bayesian updating */
const MonteCarlo = (() => {

  // === GENERATEURS ALEATOIRES ===

  /** Box-Muller: echantillon d'une normale standard */
  function randn() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /** Marsaglia-Tsang: echantillon d'une loi Gamma(shape, scale) */
  function sampleGamma(shape, scale) {
    if (shape < 1) {
      return sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = randn();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v * scale;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
    }
  }

  /** Echantillon d'une loi Dirichlet(alphas) */
  function sampleDirichlet(alphas) {
    const gammas = alphas.map(a => sampleGamma(Math.max(0.01, a), 1.0));
    const sum = gammas.reduce((s, g) => s + g, 0);
    if (sum <= 0) return alphas.map(() => 1 / alphas.length);
    return gammas.map(g => g / sum);
  }

  // === ECHANTILLONNAGE MATRICE ===

  /** Convertit moyennes + sigmas en parametres Dirichlet alpha */
  function computeAlphas(means, sigmas) {
    // alpha_j = kappa * mean_j
    // Var(X_j) = mean_j(1-mean_j)/(kappa+1)  =>  kappa = mean_j(1-mean_j)/var - 1
    const kappas = means.map((m, j) => {
      if (m <= 0.005 || m >= 0.995 || sigmas[j] <= 0.005) return 200;
      const variance = sigmas[j] * sigmas[j];
      return Math.max(2, m * (1 - m) / variance - 1);
    });
    // Kappa median pour coherence de la ligne
    const sorted = [...kappas].sort((a, b) => a - b);
    const kappa = sorted[Math.floor(sorted.length / 2)];

    return means.map(m => Math.max(0.05, kappa * m));
  }

  /** Echantillonne une matrice de reports complete */
  function sampleMatrix(meanMatrix, sigmaMatrix) {
    return meanMatrix.map((row, i) => {
      const rowSum = row.reduce((s, v) => s + v, 0);
      if (rowSum <= 0) return row.slice();
      const means = row.map(v => v / rowSum);
      const sigmas = sigmaMatrix[i].map(v => v / 100);
      const alphas = computeAlphas(means, sigmas);
      const sampled = sampleDirichlet(alphas);
      return sampled.map(v => v * rowSum);
    });
  }

  // === SIMULATION MONTE CARLO ===

  /**
   * Simule N scenarios a partir d'une matrice de reports + incertitudes
   * @param {object} matrixData - { blocs, matrix, sourcePcts, abstentionPct, destinations }
   * @param {number[][]} sigmaMatrix - ecarts-types pour chaque cellule
   * @param {string[]} listeNoms - noms des listes municipales
   * @param {object} options - { n: 2000 }
   * @returns {MCResult}
   */
  function simulate(matrixData, sigmaMatrix, listeNoms, options) {
    const N = (options && options.n) || 2000;
    const nbListes = listeNoms.length;
    const rawSamples = new Float64Array(N * nbListes);
    const participations = new Float64Array(N);

    for (let sim = 0; sim < N; sim++) {
      // 1. Echantillonner la matrice
      const sampledMatrix = sampleMatrix(matrixData.matrix, sigmaMatrix);

      // 2. Perturber legèrement la participation (+/- 2pp)
      const perturbedAbstention = matrixData.abstentionPct + randn() * 2;

      // 3. Construire les donnees pour projeter()
      const sampledData = {
        blocs: matrixData.blocs,
        matrix: sampledMatrix,
        sourcePcts: matrixData.sourcePcts,
        abstentionPct: Math.max(5, Math.min(95, perturbedAbstention)),
        destinations: matrixData.destinations
      };

      // 4. Projeter (reutilise Historique.projeter)
      const result = Historique.projeter(sampledData, listeNoms);

      // 5. Stocker les resultats bruts
      for (let j = 0; j < nbListes; j++) {
        rawSamples[sim * nbListes + j] = result.projections[j].pct;
      }
      participations[sim] = result.participation;
    }

    return buildMCResult(rawSamples, participations, N, nbListes, listeNoms);
  }

  // === CONSTRUCTION DES RESULTATS ===

  function buildMCResult(rawSamples, participations, N, nbListes, listeNoms) {
    const results = [];
    for (let j = 0; j < nbListes; j++) {
      const values = new Float64Array(N);
      for (let s = 0; s < N; s++) {
        values[s] = rawSamples[s * nbListes + j];
      }
      const sorted = Array.from(values).sort((a, b) => a - b);
      const mean = sorted.reduce((s, v) => s + v, 0) / N;

      results.push({
        nom: listeNoms[j],
        mean: mean,
        median: sorted[Math.floor(N * 0.5)],
        stddev: computeStddev(sorted, mean),
        ci95: [sorted[Math.floor(N * 0.025)], sorted[Math.ceil(N * 0.975)]],
        ci80: [sorted[Math.floor(N * 0.10)], sorted[Math.ceil(N * 0.90)]]
      });
    }

    // Probabilites de victoire
    const winCounts = new Array(nbListes).fill(0);
    let secondTourCount = 0;
    for (let s = 0; s < N; s++) {
      let maxPct = -1, maxIdx = 0;
      let anyOver50 = false;
      for (let j = 0; j < nbListes; j++) {
        const pct = rawSamples[s * nbListes + j];
        if (pct > maxPct) { maxPct = pct; maxIdx = j; }
        if (pct > 50) anyOver50 = true;
      }
      winCounts[maxIdx]++;
      if (!anyOver50) secondTourCount++;
    }

    const winProbabilities = {};
    listeNoms.forEach((nom, j) => {
      winProbabilities[nom] = winCounts[j] / N;
    });

    // Participation
    const partSorted = Array.from(participations).sort((a, b) => a - b);
    const partMean = partSorted.reduce((s, v) => s + v, 0) / N;

    return {
      simulations: N,
      results,
      winProbabilities,
      secondTourProbability: secondTourCount / N,
      participation: {
        mean: partMean,
        ci95: [partSorted[Math.floor(N * 0.025)], partSorted[Math.ceil(N * 0.975)]]
      },
      rawSamples,
      participations,
      nbListes,
      listeNoms
    };
  }

  function computeStddev(sortedArr, mean) {
    const n = sortedArr.length;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const d = sortedArr[i] - mean;
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / n);
  }

  // === BAYESIAN UPDATING ===

  /**
   * Met a jour la distribution posterieure avec un resultat de bureau observe
   * @param {MCResult} priorResult - resultat MC anterieur
   * @param {string} bureauId - id du bureau observe
   * @param {object} observedPcts - { listeName: pct, ... } + _exprimes
   * @param {object} bureauDeviations - ecarts attendus du bureau { listeName: deviation }
   * @returns {MCResult}
   */
  function updateWithBureau(priorResult, bureauId, observedPcts, bureauDeviations) {
    const N = priorResult.simulations;
    const nbListes = priorResult.nbListes;
    const raw = priorResult.rawSamples;
    const listeNoms = priorResult.listeNoms;
    const nExprimes = observedPcts._exprimes || 300;

    // Calcul des log-vraisemblances pour chaque simulation
    const logWeights = new Float64Array(N);

    for (let s = 0; s < N; s++) {
      let logLik = 0;
      for (let j = 0; j < nbListes; j++) {
        const communePct = raw[s * nbListes + j];
        const deviation = bureauDeviations ? (bureauDeviations[listeNoms[j]] || 0) : 0;
        const expectedPct = communePct + deviation;
        const obsPct = observedPcts[listeNoms[j]] || 0;

        // Ecart-type: erreur binomiale + incertitude du modele
        const p = Math.max(0.01, Math.min(0.99, expectedPct / 100));
        const sigmaBinom = Math.sqrt(p * (1 - p) / nExprimes) * 100;
        const sigmaTotal = Math.sqrt(sigmaBinom * sigmaBinom + 16); // +4pp modele

        const diff = obsPct - expectedPct;
        logLik += -0.5 * (diff * diff) / (sigmaTotal * sigmaTotal);
      }
      logWeights[s] = logLik;
    }

    // Log-sum-exp pour stabilite numerique
    let maxLogW = -Infinity;
    for (let s = 0; s < N; s++) {
      if (logWeights[s] > maxLogW) maxLogW = logWeights[s];
    }

    const weights = new Float64Array(N);
    let sumW = 0;
    for (let s = 0; s < N; s++) {
      weights[s] = Math.exp(logWeights[s] - maxLogW);
      sumW += weights[s];
    }
    for (let s = 0; s < N; s++) {
      weights[s] /= sumW;
    }

    // ESS (Effective Sample Size)
    let sumWsq = 0;
    for (let s = 0; s < N; s++) sumWsq += weights[s] * weights[s];
    const ess = 1 / sumWsq;

    // Resampling SIR si ESS trop bas
    if (ess < N / 4) {
      const resampled = resampleSIR(raw, weights, N, nbListes);
      return buildMCResult(resampled, priorResult.participations, N, nbListes, listeNoms);
    }

    // Sinon: statistiques ponderees
    return buildWeightedMCResult(raw, weights, N, nbListes, listeNoms, priorResult.participations);
  }

  /** Systematic resampling (SIR) */
  function resampleSIR(samples, weights, N, nbListes) {
    const resampled = new Float64Array(N * nbListes);
    const cumW = new Float64Array(N);
    cumW[0] = weights[0];
    for (let i = 1; i < N; i++) cumW[i] = cumW[i - 1] + weights[i];

    const u0 = Math.random() / N;
    let j = 0;
    for (let i = 0; i < N; i++) {
      const u = u0 + i / N;
      while (j < N - 1 && cumW[j] < u) j++;
      for (let k = 0; k < nbListes; k++) {
        resampled[i * nbListes + k] = samples[j * nbListes + k];
      }
    }
    return resampled;
  }

  /** Resultats MC ponderes */
  function buildWeightedMCResult(rawSamples, weights, N, nbListes, listeNoms, participations) {
    const results = [];
    for (let j = 0; j < nbListes; j++) {
      // Moyenne ponderee
      let wMean = 0;
      for (let s = 0; s < N; s++) {
        wMean += weights[s] * rawSamples[s * nbListes + j];
      }

      // Ecart-type pondere
      let wVar = 0;
      for (let s = 0; s < N; s++) {
        const d = rawSamples[s * nbListes + j] - wMean;
        wVar += weights[s] * d * d;
      }

      // Percentiles ponderes (tri + accumulation des poids)
      const indexed = [];
      for (let s = 0; s < N; s++) {
        indexed.push({ val: rawSamples[s * nbListes + j], w: weights[s] });
      }
      indexed.sort((a, b) => a.val - b.val);

      const ci95 = [weightedPercentile(indexed, 0.025), weightedPercentile(indexed, 0.975)];
      const ci80 = [weightedPercentile(indexed, 0.10), weightedPercentile(indexed, 0.90)];

      results.push({
        nom: listeNoms[j],
        mean: wMean,
        median: weightedPercentile(indexed, 0.5),
        stddev: Math.sqrt(wVar),
        ci95, ci80
      });
    }

    // Probabilites de victoire ponderees
    const winProbs = {};
    listeNoms.forEach(() => { /* init below */ });
    const winSums = new Array(nbListes).fill(0);
    let secondTourSum = 0;

    for (let s = 0; s < N; s++) {
      let maxPct = -1, maxIdx = 0, anyOver50 = false;
      for (let j = 0; j < nbListes; j++) {
        const pct = rawSamples[s * nbListes + j];
        if (pct > maxPct) { maxPct = pct; maxIdx = j; }
        if (pct > 50) anyOver50 = true;
      }
      winSums[maxIdx] += weights[s];
      if (!anyOver50) secondTourSum += weights[s];
    }

    listeNoms.forEach((nom, j) => { winProbs[nom] = winSums[j]; });

    // Participation
    const partMean = participations
      ? Array.from(participations).reduce((s, v, i) => s + weights[i] * v, 0)
      : 50;

    return {
      simulations: N,
      results,
      winProbabilities: winProbs,
      secondTourProbability: secondTourSum,
      participation: { mean: partMean, ci95: [partMean - 5, partMean + 5] },
      rawSamples, participations, nbListes, listeNoms
    };
  }

  function weightedPercentile(sortedIndexed, p) {
    let cumW = 0;
    for (const item of sortedIndexed) {
      cumW += item.w;
      if (cumW >= p) return item.val;
    }
    return sortedIndexed[sortedIndexed.length - 1].val;
  }

  return { simulate, updateWithBureau };
})();
