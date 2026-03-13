/* resultats.js — Ecran resultats agreges + graphiques Chart.js */
const Resultats = (() => {
  let chartBarres = null;
  let chartPie = null;

  function render() {
    const config = Store.getConfig();
    const agg = Store.getAggregate();
    const resultats = Store.getResultats();

    // Bureaux depouilles
    document.getElementById('res-bureaux-count').textContent =
      `${agg.filled} / ${agg.total} bureaux depouilles`;

    // Participation stats
    document.getElementById('res-inscrits').textContent = agg.inscrits.toLocaleString('fr-FR');
    document.getElementById('res-votants').textContent = agg.votants.toLocaleString('fr-FR');
    document.getElementById('res-blancs').textContent = agg.blancs.toLocaleString('fr-FR');
    document.getElementById('res-nuls').textContent = agg.nuls.toLocaleString('fr-FR');
    document.getElementById('res-participation').textContent =
      agg.participation ? `${agg.participation}%` : '-';

    // Chart barres
    renderBarChart(config, agg);

    // Chart pie
    renderPieChart(config, agg);

    // Table detail
    renderTable(config, agg, resultats);
  }

  function renderBarChart(config, agg) {
    const ctx = document.getElementById('chart-barres');
    const labels = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);
    const pcts = agg.exprimes > 0
      ? agg.voix.map(v => ((v / agg.exprimes) * 100).toFixed(1))
      : agg.voix.map(() => 0);

    if (chartBarres) chartBarres.destroy();

    chartBarres = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: pcts,
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const idx = ctx.dataIndex;
                return `${ctx.parsed.x}% (${agg.voix[idx].toLocaleString('fr-FR')} voix)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8899AA', callback: v => v + '%' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#E0E7EF', font: { size: 12 } }
          }
        }
      }
    });
  }

  function renderPieChart(config, agg) {
    const ctx = document.getElementById('chart-pie');
    const labels = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);

    if (chartPie) chartPie.destroy();

    chartPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: agg.voix,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#1B2A4A'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E0E7EF', padding: 12, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = agg.exprimes > 0
                  ? ((ctx.parsed / agg.exprimes) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${pct}% (${ctx.parsed.toLocaleString('fr-FR')} voix)`;
              }
            }
          }
        }
      }
    });
  }

  function renderTable(config, agg, resultats) {
    const tbody = document.getElementById('res-table-body');
    const thead = document.querySelector('#res-table thead tr');

    // Build header with liste names
    thead.innerHTML = '<th>BV</th><th>Insc.</th><th>Vot.</th><th>Expr.</th>' +
      config.listes.map(l =>
        `<th style="color:${l.couleur}">${l.abrev || l.nom.substring(0, 3)}</th>`
      ).join('');

    const bureaux = Store.getBureaux(config.nbBureaux);
    tbody.innerHTML = bureaux.map(bv => {
      const r = resultats[bv];
      if (!r) {
        return `<tr style="opacity:0.4"><td>${parseInt(bv)}</td><td colspan="${3 + config.listes.length}">-</td></tr>`;
      }
      const expr = r.votants - r.blancs - r.nuls;
      const voixCells = (r.voix || []).map((v, i) => {
        const pct = expr > 0 ? ((v / expr) * 100).toFixed(1) : 0;
        return `<td>${v} <small style="color:var(--text-muted)">(${pct}%)</small></td>`;
      }).join('');
      return `<tr>
        <td><strong>${parseInt(bv)}</strong></td>
        <td>${r.inscrits}</td><td>${r.votants}</td><td>${expr}</td>
        ${voixCells}
      </tr>`;
    }).join('');

    // Total row
    if (agg.filled > 0) {
      const voixTotal = agg.voix.map((v, i) => {
        const pct = agg.exprimes > 0 ? ((v / agg.exprimes) * 100).toFixed(1) : 0;
        return `<td><strong>${v}</strong> <small style="color:var(--accent)">(${pct}%)</small></td>`;
      }).join('');
      tbody.innerHTML += `<tr style="border-top:2px solid var(--accent)">
        <td><strong>Total</strong></td>
        <td><strong>${agg.inscrits}</strong></td>
        <td><strong>${agg.votants}</strong></td>
        <td><strong>${agg.exprimes}</strong></td>
        ${voixTotal}
      </tr>`;
    }
  }

  // Update dashboard partial results
  function renderDashboard() {
    const config = Store.getConfig();
    const agg = Store.getAggregate();

    // Progress
    const pct = (agg.filled / agg.total) * 100;
    document.getElementById('dash-progress-fill').style.width = pct + '%';
    document.getElementById('dash-progress-text').textContent =
      `${agg.filled} / ${agg.total} bureaux saisis`;

    // Participation
    document.getElementById('dash-votants').textContent = agg.votants.toLocaleString('fr-FR');
    document.getElementById('dash-inscrits').textContent = agg.inscrits.toLocaleString('fr-FR');
    document.getElementById('dash-participation').textContent =
      agg.participation ? `${agg.participation}%` : '-';

    // Result bars
    const barsDiv = document.getElementById('dash-results-bars');
    const noData = document.getElementById('dash-no-data');

    if (agg.filled === 0) {
      barsDiv.innerHTML = '';
      noData.style.display = 'block';
      return;
    }
    noData.style.display = 'none';

    barsDiv.innerHTML = config.listes.map((liste, i) => {
      const voix = agg.voix[i] || 0;
      const pctVoix = agg.exprimes > 0 ? ((voix / agg.exprimes) * 100).toFixed(1) : 0;
      return `<div class="result-bar-row">
        <div class="result-bar-label">
          <span>${liste.nom}</span>
          <span>${pctVoix}%</span>
        </div>
        <div class="result-bar-track">
          <div class="result-bar-fill" style="width:${pctVoix}%;background:${liste.couleur}">
            ${voix.toLocaleString('fr-FR')} voix
          </div>
        </div>
      </div>`;
    }).join('');
  }

  return { render, renderDashboard };
})();
