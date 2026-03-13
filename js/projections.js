/* projections.js — Matrices de reports + projections */
const Projections = (() => {
  let chartProjection = null;
  let currentMatrix = null;

  function render() {
    const scenario = document.getElementById('proj-scenario').value;
    loadScenario(scenario);
  }

  function loadScenario(scenario) {
    const config = Store.getConfig();
    const listeNoms = config.listes.map(l => l.nom);

    if (scenario === 'custom') {
      // Custom: use current matrix or create empty
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

    renderMatrix();
    updateProjection();
  }

  function renderMatrix() {
    if (!currentMatrix) return;
    const config = Store.getConfig();
    const table = document.getElementById('proj-matrix');
    const destNames = currentMatrix.destinations;

    let html = '<thead><tr><th>De / Vers</th>';
    destNames.forEach(d => { html += `<th>${d.substring(0, 10)}</th>`; });
    html += '<th>Total</th></tr></thead><tbody>';

    currentMatrix.blocs.forEach((bloc, i) => {
      html += `<tr><td style="font-size:0.75rem">${bloc}</td>`;
      currentMatrix.matrix[i].forEach((val, j) => {
        html += `<td><input type="number" class="proj-input" min="0" max="100"
          data-row="${i}" data-col="${j}" value="${val}" inputmode="numeric"></td>`;
      });
      const total = currentMatrix.matrix[i].reduce((s, v) => s + v, 0);
      const totalClass = Math.abs(total - 100) < 1 ? 'color:var(--success)' : 'color:var(--danger)';
      html += `<td style="${totalClass};font-weight:600">${total}%</td>`;
      html += '</tr>';
    });

    // Source percentages row
    html += '<tr style="border-top:2px solid var(--accent)"><td style="font-size:0.75rem"><em>Poids (%)</em></td>';
    currentMatrix.sourcePcts.forEach(p => {
      html += `<td colspan="1" style="font-size:0.75rem;text-align:center">${p}%</td>`;
    });
    html += '</tr>';

    html += '</tbody>';
    table.innerHTML = html;

    // Listeners
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
    if (!currentMatrix) return;
    const config = Store.getConfig();
    const listeNoms = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);

    const result = Historique.projeter(currentMatrix, listeNoms);

    // Chart
    renderProjectionChart(result, listeNoms, colors);

    // Details
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

    // Projection sieges
    const voixProj = result.projections.map(p => p.pct * 100); // Use pct as proxy
    const siegesResult = Sieges.calculer(voixProj, config.totalSieges, config.primeMajoritaire);
    html += '<div style="margin-top:12px"><h3 style="font-size:0.9rem;color:var(--accent)">Sieges projetes</h3>';
    siegesResult.sieges.forEach((s, i) => {
      if (s > 0) {
        html += `<div style="display:flex;justify-content:space-between;padding:4px 0">
          <span>${listeNoms[i]}</span><strong>${s} sieges</strong>
        </div>`;
      }
    });
    if (siegesResult.secondTour) {
      html += '<p style="color:var(--warning);margin-top:8px;font-size:0.8rem">2nd tour probable (projection indicative)</p>';
    }
    html += '</div></div>';
    details.innerHTML = html;
  }

  function renderProjectionChart(result, listeNoms, colors) {
    const ctx = document.getElementById('chart-projection');
    if (chartProjection) chartProjection.destroy();

    // Also show actual results if available
    const agg = Store.getAggregate();
    const datasets = [{
      label: 'Projection',
      data: result.projections.map(p => p.pct.toFixed(1)),
      backgroundColor: colors.map(c => c + 'AA'),
      borderColor: colors,
      borderWidth: 2,
      borderRadius: 6
    }];

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

    chartProjection = new Chart(ctx, {
      type: 'bar',
      data: { labels: listeNoms, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E0E7EF', font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 70,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8899AA', callback: v => v + '%' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#E0E7EF', font: { size: 11 } }
          }
        }
      }
    });
  }

  function init() {
    document.getElementById('proj-scenario').addEventListener('change', (e) => {
      loadScenario(e.target.value);
    });
  }

  return { render, init };
})();
