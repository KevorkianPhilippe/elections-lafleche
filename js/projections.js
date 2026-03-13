/* projections.js — Matrices de reports + projections + Monte Carlo */
const Projections = (() => {
  let chartProjection = null;
  let currentMatrix = null;
  let currentSigmas = null;
  let mcResult = null;
  let bvDataLoaded = false;

  // Plugin Chart.js pour barres d'erreur
  const errorBarPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart) {
      const dataset = chart.data.datasets[0];
      if (!dataset || !dataset.errorBars) return;
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);

      meta.data.forEach((bar, i) => {
        const eb = dataset.errorBars[i];
        if (!eb) return;
        const x = bar.x;
        const yLow = chart.scales.y.getPixelForValue(eb.low);
        const yHigh = chart.scales.y.getPixelForValue(eb.high);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        // Ligne verticale
        ctx.beginPath();
        ctx.moveTo(x, yLow);
        ctx.lineTo(x, yHigh);
        ctx.stroke();
        // Caps
        ctx.beginPath();
        ctx.moveTo(x - 6, yLow); ctx.lineTo(x + 6, yLow);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 6, yHigh); ctx.lineTo(x + 6, yHigh);
        ctx.stroke();
        ctx.restore();
      });
    }
  };

  function render() {
    const scenario = document.getElementById('proj-scenario').value;
    loadScenario(scenario);
  }

  function loadScenario(scenario) {
    const config = Store.getConfig();
    const listeNoms = config.listes.map(l => l.nom);

    if (scenario === 'custom') {
      if (!currentMatrix || currentMatrix._scenario !== 'custom') {
        const euroMatrix = Historique.getDefaultMatrix('europeennes');
        currentMatrix = JSON.parse(JSON.stringify(euroMatrix));
        currentMatrix._scenario = 'custom';
        currentMatrix.destinations = [...listeNoms, 'Abstention'];
      }
    } else {
      const defaultMatrix = Historique.getDefaultMatrix(scenario);
      if (defaultMatrix) {
        currentMatrix = JSON.parse(JSON.stringify(defaultMatrix));
        currentMatrix._scenario = scenario;
        currentMatrix.destinations = [...listeNoms, 'Abstention'];
      }
    }

    // Charger les sigmas
    const baseScenario = scenario === 'custom' ? 'europeennes' : scenario;
    currentSigmas = Historique.getDefaultSigmas(baseScenario);

    renderMatrix();
    updateProjection();
  }

  function renderMatrix() {
    if (!currentMatrix) return;
    const table = document.getElementById('proj-matrix');
    const destNames = currentMatrix.destinations;

    let html = '<thead><tr><th>De / Vers</th><th>Poids</th>';
    destNames.forEach(d => { html += `<th>${d.substring(0, 10)}</th>`; });
    html += '<th>Total</th></tr></thead><tbody>';

    currentMatrix.blocs.forEach((bloc, i) => {
      const poids = currentMatrix.sourcePcts[i] || 0;
      html += `<tr><td style="font-size:0.75rem">${bloc}</td>`;
      html += `<td style="font-size:0.75rem;text-align:center;color:var(--accent);font-weight:600">${poids}%</td>`;
      currentMatrix.matrix[i].forEach((val, j) => {
        html += `<td><input type="number" class="proj-input" min="0" max="100"
          data-row="${i}" data-col="${j}" value="${val}" inputmode="numeric"></td>`;
      });
      const total = currentMatrix.matrix[i].reduce((s, v) => s + v, 0);
      const totalClass = Math.abs(total - 100) < 1 ? 'color:var(--success)' : 'color:var(--danger)';
      html += `<td style="${totalClass};font-weight:600">${total}%</td>`;
      html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;

    table.querySelectorAll('.proj-input').forEach(input => {
      input.addEventListener('change', onMatrixChange);
    });
  }

  function onMatrixChange(e) {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
    e.target.value = val;
    currentMatrix.matrix[row][col] = val;
    currentMatrix._scenario = 'custom';
    document.getElementById('proj-scenario').value = 'custom';
    renderMatrix();
    updateProjection();
  }

  function updateProjection() {
    const mcEnabled = Store.getMCSettings().enabled;
    if (mcEnabled) {
      updateProjectionMC();
    } else {
      updateProjectionDeterministic();
    }
  }

  // === MODE DETERMINISTE (existant) ===

  function updateProjectionDeterministic() {
    if (!currentMatrix) return;
    const config = Store.getConfig();
    const listeNoms = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);

    const result = Historique.projeter(currentMatrix, listeNoms);
    renderProjectionChart(result, listeNoms, colors, null);
    renderDeterministicDetails(result, listeNoms, colors, config);

    // Masquer les panels MC
    document.getElementById('proj-probabilities').style.display = 'none';
    document.getElementById('proj-confidence').style.display = 'none';
  }

  function renderDeterministicDetails(result, listeNoms, colors, config) {
    const details = document.getElementById('proj-details');
    let html = '<div style="margin-top:12px">';
    html += `<p style="font-size:0.85rem">Participation projetee : <strong>${result.participation.toFixed(1)}%</strong></p>`;
    html += '<div style="margin-top:8px">';
    result.projections.forEach((p, i) => {
      html += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${colors[i]};margin-right:6px"></span>${p.nom}</span>
        <strong>${p.pct.toFixed(1)}%</strong>
      </div>`;
    });

    // Sieges
    const voixProj = result.projections.map(p => p.pct * 100);
    const siegesResult = Sieges.calculer(voixProj, config.totalSieges, config.primeMajoritaire);
    html += '<div style="margin-top:12px"><h3 style="font-size:0.9rem;color:var(--accent)">Sieges projetes</h3>';
    siegesResult.sieges.forEach((s, i) => {
      if (s > 0) {
        html += `<div style="display:flex;justify-content:space-between;padding:4px 0">
          <span>${listeNoms[i]}</span><strong>${s} sieges</strong></div>`;
      }
    });
    if (siegesResult.secondTour) {
      html += '<p style="color:var(--warning);margin-top:8px;font-size:0.8rem">2nd tour probable</p>';
    }
    html += '</div></div>';
    details.innerHTML = html;
  }

  // === MODE MONTE CARLO ===

  async function updateProjectionMC() {
    if (!currentMatrix || !currentSigmas) return;
    const config = Store.getConfig();
    const listeNoms = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);

    // Charger les donnees BV si pas fait
    if (!bvDataLoaded) {
      await HistoriqueBV.load();
      bvDataLoaded = true;
      // Recalculer les sigmas avec les donnees ecologiques
      const baseScenario = currentMatrix._scenario === 'custom' ? 'europeennes' : currentMatrix._scenario;
      currentSigmas = Historique.getDefaultSigmas(baseScenario);
    }

    // Lancer la simulation
    mcResult = MonteCarlo.simulate(currentMatrix, currentSigmas, listeNoms, { n: 2000 });

    // Bayesian updating avec les bureaux saisis
    const resultats = Store.getResultats();
    const filledBvs = Object.keys(resultats).filter(bv => resultats[bv] && resultats[bv].votants > 0);

    if (filledBvs.length > 0) {
      for (const bvId of filledBvs) {
        const bvResult = resultats[bvId];
        const exprimes = bvResult.votants - bvResult.blancs - bvResult.nuls;
        if (exprimes <= 0) continue;

        const obsPcts = { _exprimes: exprimes };
        listeNoms.forEach((nom, i) => {
          obsPcts[nom] = (bvResult.voix[i] / exprimes) * 100;
        });

        const bvNum = bvId.replace(/^0+/, '') || '1';
        const deviation = HistoriqueBV.getBureauDeviation(bvNum, listeNoms);
        mcResult = MonteCarlo.updateWithBureau(mcResult, bvNum, obsPcts, deviation);
      }
    }

    // Rendu
    renderProjectionChart(null, listeNoms, colors, mcResult);
    renderMCDetails(mcResult, listeNoms, colors, config);
    renderProbabilities(mcResult, listeNoms, colors);
    renderConfidenceIndicator(filledBvs.length, config.nbBureaux);
  }

  // === RENDU CHART ===

  function renderProjectionChart(detResult, listeNoms, colors, mcRes) {
    const ctx = document.getElementById('chart-projection');
    if (chartProjection) chartProjection.destroy();

    const agg = Store.getAggregate();
    const datasets = [];
    const plugins = [ChartDataLabels];

    if (mcRes) {
      // Mode MC: barres avec erreurs
      const mainData = mcRes.results.map(r => r.mean.toFixed(1));
      const errorBars = mcRes.results.map(r => ({
        low: r.ci95[0],
        high: r.ci95[1]
      }));

      datasets.push({
        label: 'Projection MC',
        data: mainData,
        backgroundColor: colors.map(c => c + 'AA'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        errorBars: errorBars
      });
      plugins.push(errorBarPlugin);
    } else if (detResult) {
      // Mode deterministe
      datasets.push({
        label: 'Projection',
        data: detResult.projections.map(p => p.pct.toFixed(1)),
        backgroundColor: colors.map(c => c + 'AA'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6
      });
    }

    // Resultats reels si disponibles
    if (agg.filled > 0 && agg.exprimes > 0) {
      datasets.push({
        label: `Reel (${agg.filled}/${agg.total} BV)`,
        data: agg.voix.map(v => ((v / agg.exprimes) * 100).toFixed(1)),
        backgroundColor: colors.map(c => c + '44'),
        borderColor: colors.map(c => c + '88'),
        borderWidth: 2,
        borderDash: [4, 4],
        borderRadius: 6
      });
    }

    const maxVal = Math.max(
      ...datasets.flatMap(ds => {
        const dataMax = Math.max(...ds.data.map(v => parseFloat(v)));
        if (ds.errorBars) {
          const ebMax = Math.max(...ds.errorBars.map(eb => eb.high));
          return [dataMax, ebMax];
        }
        return [dataMax];
      })
    );

    chartProjection = new Chart(ctx, {
      type: 'bar',
      data: { labels: listeNoms, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: { padding: { top: 25 } },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E0E7EF', font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (tip) => {
                let text = `${tip.dataset.label}: ${tip.parsed.y}%`;
                if (tip.dataset.errorBars) {
                  const eb = tip.dataset.errorBars[tip.dataIndex];
                  text += ` [${eb.low.toFixed(1)}% - ${eb.high.toFixed(1)}%]`;
                }
                return text;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#E0E7EF',
            font: { size: 12, weight: 'bold' },
            formatter: (val) => val + '%'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: Math.min(100, maxVal + 15),
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8899AA', callback: v => v + '%' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#E0E7EF', font: { size: 11 } }
          }
        }
      },
      plugins: plugins
    });
  }

  // === DETAILS MC ===

  function renderMCDetails(mcRes, listeNoms, colors, config) {
    const details = document.getElementById('proj-details');
    let html = '<div style="margin-top:12px">';
    html += `<p style="font-size:0.85rem">Participation projetee : <strong>${mcRes.participation.mean.toFixed(1)}%</strong>`;
    html += `<span class="mc-interval">[${mcRes.participation.ci95[0].toFixed(1)}% - ${mcRes.participation.ci95[1].toFixed(1)}%]</span></p>`;

    html += '<div style="margin-top:8px">';
    mcRes.results.forEach((r, i) => {
      html += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${colors[i]};margin-right:6px"></span>${r.nom}</span>
        <span><strong>${r.mean.toFixed(1)}%</strong>
        <span class="mc-interval">[${r.ci95[0].toFixed(1)} - ${r.ci95[1].toFixed(1)}]</span></span>
      </div>`;
    });

    // Sieges projetes (basés sur la moyenne)
    const voixProj = mcRes.results.map(r => r.mean * 100);
    const siegesResult = Sieges.calculer(voixProj, config.totalSieges, config.primeMajoritaire);
    html += '<div style="margin-top:12px"><h3 style="font-size:0.9rem;color:var(--accent)">Sieges projetes (estimation)</h3>';
    siegesResult.sieges.forEach((s, i) => {
      if (s > 0) {
        html += `<div style="display:flex;justify-content:space-between;padding:4px 0">
          <span>${listeNoms[i]}</span><strong>${s} sieges</strong></div>`;
      }
    });
    if (siegesResult.secondTour) {
      html += `<p style="color:var(--warning);margin-top:8px;font-size:0.8rem">2nd tour probable dans ${(mcRes.secondTourProbability * 100).toFixed(0)}% des simulations</p>`;
    }
    html += '</div></div>';
    details.innerHTML = html;
  }

  // === PROBABILITES ===

  function renderProbabilities(mcRes, listeNoms, colors) {
    const container = document.getElementById('proj-probabilities');
    container.style.display = 'block';

    const barsDiv = document.getElementById('prob-bars');
    let html = '';
    mcRes.results.forEach((r, i) => {
      const prob = mcRes.winProbabilities[r.nom] || 0;
      const pct = (prob * 100).toFixed(0);
      const width = Math.max(15, prob * 100);
      html += `<div class="prob-item">
        <div class="prob-bar" style="width:${width}%;background:${colors[i]}">
          <span class="prob-label">${r.nom}</span>
          <span class="prob-value">${pct}%</span>
        </div>
      </div>`;
    });
    barsDiv.innerHTML = html;

    const st = document.getElementById('prob-second-tour');
    const stPct = (mcRes.secondTourProbability * 100).toFixed(0);
    st.textContent = mcRes.secondTourProbability > 0.1
      ? `Second tour probable dans ${stPct}% des simulations`
      : `Victoire au 1er tour dans ${100 - parseInt(stPct)}% des simulations`;
  }

  // === CONFIANCE ===

  function renderConfidenceIndicator(filledBv, totalBv) {
    const container = document.getElementById('proj-confidence');
    container.style.display = 'block';

    const pct = totalBv > 0 ? (filledBv / totalBv) * 100 : 0;
    document.getElementById('confidence-fill').style.width = pct + '%';

    let text = 'Projection theorique';
    if (filledBv === 0) text = 'Projection theorique (aucun bureau saisi)';
    else if (filledBv <= 4) text = `Estimation precoce (${filledBv}/${totalBv} BV)`;
    else if (filledBv <= 10) text = `Tendance fiable (${filledBv}/${totalBv} BV)`;
    else if (filledBv < totalBv) text = `Quasi-definitif (${filledBv}/${totalBv} BV)`;
    else text = `Definitif (${filledBv}/${totalBv} BV)`;

    document.getElementById('confidence-text').textContent = text;
  }

  // === INIT ===

  function init() {
    document.getElementById('proj-scenario').addEventListener('change', (e) => {
      loadScenario(e.target.value);
    });

    // Toggle Monte Carlo
    const toggle = document.getElementById('proj-mc-toggle');
    const mcSettings = Store.getMCSettings();
    toggle.checked = mcSettings.enabled;

    toggle.addEventListener('change', () => {
      const settings = Store.getMCSettings();
      settings.enabled = toggle.checked;
      Store.setMCSettings(settings);
      updateProjection();
    });
  }

  return { render, init };
})();
