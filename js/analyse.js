/* analyse.js — Onglet Analyse strategique: comparateur + swing bureaux + demo */
const Analyse = (() => {

  async function render() {
    // Show loading state
    const compEl = document.getElementById('analyse-comparateur');
    const swingEl = document.getElementById('analyse-swing');
    const demoEl = document.getElementById('analyse-demo');
    if (compEl) compEl.innerHTML = '<p class="muted">Chargement des donnees...</p>';

    try {
      await HistoriqueBV.load();
    } catch (e) {
      console.warn('Analyse: echec chargement BV', e);
    }

    // Verify containers still exist (page not navigated away)
    if (!document.getElementById('analyse-comparateur')) return;

    renderComparateur();
    renderSwingBureaux();
    renderDemographics();
  }

  // ── COMPARATEUR DE SCENARIOS ──
  function renderComparateur() {
    const container = document.getElementById('analyse-comparateur');
    const config = Store.getConfig();

    // T2 config
    const idxL = config.listes.findIndex(l => l.nom.toLowerCase().includes('lemoigne'));
    const idxG = config.listes.findIndex(l => l.nom.toLowerCase().includes('grelet'));
    const t2Noms = [config.listes[idxL].nom, config.listes[idxG].nom];
    const t2Colors = [config.listes[idxL].couleur, config.listes[idxG].couleur];

    // ── T2 Scenarios ──
    const t2Scenarios = [
      { key: 't2_neutre', label: 'Reports equilibres', icon: '🔄' },
      { key: 't2_lemoigne', label: 'Dynamique Lemoigne', icon: '📈' },
      { key: 't2_grelet', label: 'Dynamique Grelet', icon: '📉' }
    ];

    const t2Results = [];
    for (const sc of t2Scenarios) {
      const matrixData = Historique.getDefaultMatrix(sc.key);
      if (!matrixData) continue;
      const sigmas = Historique.getDefaultSigmas(sc.key);
      if (!sigmas) continue;
      const mcResult = MonteCarlo.simulate(matrixData, sigmas, t2Noms, { n: 1000 });
      t2Results.push({ ...sc, mc: mcResult });
    }

    let html = '';

    if (t2Results.length > 0) {
      html += '<h3 style="margin-bottom:10px;color:var(--warning)">Projections 2nd tour</h3>';
      html += '<div class="table-scroll"><table class="comparateur-table">';
      html += '<thead><tr><th>Scenario T2</th>';
      t2Noms.forEach((nom, i) => {
        html += `<th style="color:${t2Colors[i]}">${nom}</th>`;
      });
      html += '<th>Part.</th><th>Vainqueur</th></tr></thead><tbody>';

      for (const r of t2Results) {
        html += `<tr><td><strong>${r.icon} ${r.label}</strong></td>`;
        r.mc.results.forEach(res => {
          const ci = res.ci80;
          const isWinner = res.mean > 50;
          const style = isWinner ? 'font-weight:bold;color:var(--success)' : '';
          html += `<td style="${style}"><strong>${res.mean.toFixed(1)}%</strong><br>` +
                  `<span class="mc-interval">[${ci[0].toFixed(0)}-${ci[1].toFixed(0)}]</span></td>`;
        });
        html += `<td>${r.mc.participation.mean.toFixed(0)}%</td>`;
        const winnerIdx = r.mc.results[0].mean > r.mc.results[1].mean ? 0 : 1;
        const winnerProb = ((r.mc.winProbabilities[t2Noms[winnerIdx]] || 0) * 100).toFixed(0);
        html += `<td style="color:${t2Colors[winnerIdx]};font-weight:bold">${t2Noms[winnerIdx]}<br>` +
                `<span class="mc-interval">${winnerProb}%</span></td>`;
        html += '</tr>';
      }
      html += '</tbody></table></div>';

      // T2 Win probability bars
      html += '<h3 style="margin-top:16px">Probabilite de victoire T2</h3>';
      html += '<div class="comparateur-probs">';
      for (const r of t2Results) {
        html += `<div class="prob-scenario"><strong>${r.icon} ${r.label}</strong>`;
        t2Noms.forEach((nom, i) => {
          const prob = (r.mc.winProbabilities[nom] * 100).toFixed(0);
          const width = Math.max(15, r.mc.winProbabilities[nom] * 100);
          html += `<div class="prob-item">` +
                  `<div class="prob-bar" style="width:${width}%;background:${t2Colors[i]}">` +
                  `<span class="prob-label">${nom}</span>` +
                  `<span class="prob-value">${prob}%</span>` +
                  `</div></div>`;
        });
        html += '</div>';
      }
      html += '</div>';

      // T2 Synthesis
      const avgProbs = {};
      t2Noms.forEach(nom => {
        avgProbs[nom] = t2Results.reduce((s, r) => s + (r.mc.winProbabilities[nom] || 0), 0) / t2Results.length;
      });
      const winner = t2Noms.reduce((best, nom) => avgProbs[nom] > avgProbs[best] ? nom : best, t2Noms[0]);
      const wIdx = t2Noms.indexOf(winner);

      html += `<div class="synthese-box">` +
              `<strong>Synthese T2:</strong> ` +
              `<span style="color:${t2Colors[wIdx]}">${winner}</span> favori ` +
              `avec ${(avgProbs[winner] * 100).toFixed(0)}% de probabilite moyenne de victoire` +
              `<br><span class="muted">Variable cle : le report des ${Historique.municipalesT1_2026.resultats['Da Silva'].voix} electeurs Da Silva</span></div>`;
    }

    // ── T1 Retrospectif ──
    const listeNoms = config.listes.map(l => l.nom);
    const colors = config.listes.map(l => l.couleur);

    const t1Scenarios = [
      { key: 'europeennes', label: 'Europeennes 2024', icon: '🇪🇺' },
      { key: 'legislatives', label: 'Legislatives 2024', icon: '🏛️' },
      { key: 'presidentielle', label: 'Presidentielle 2022', icon: '🗳️' }
    ];

    const t1Results = [];
    for (const sc of t1Scenarios) {
      const matrixData = Historique.getDefaultMatrix(sc.key);
      if (!matrixData) continue;
      const sigmas = Historique.getDefaultSigmas(sc.key);
      if (!sigmas) continue;
      const mcResult = MonteCarlo.simulate(matrixData, sigmas, listeNoms, { n: 1000 });
      t1Results.push({ ...sc, mc: mcResult });
    }

    if (t1Results.length > 0) {
      html += '<h3 style="margin-top:20px;margin-bottom:10px;color:var(--text-muted)">Projections T1 (retrospectif)</h3>';
      html += '<div class="table-scroll"><table class="comparateur-table">';
      html += '<thead><tr><th>Scenario</th>';
      listeNoms.forEach((nom, i) => {
        html += `<th style="color:${colors[i]}">${nom}</th>`;
      });
      html += '<th>Part.</th></tr></thead><tbody>';

      const t1 = Historique.municipalesT1_2026;
      html += '<tr style="background:rgba(79,195,247,0.1)"><td><strong>Reel T1</strong></td>';
      listeNoms.forEach(nom => {
        const r = t1.resultats[nom];
        html += `<td><strong>${r ? r.pct.toFixed(1) : '-'}%</strong></td>`;
      });
      html += `<td>${t1.participation.toFixed(0)}%</td></tr>`;

      for (const r of t1Results) {
        html += `<tr><td><strong>${r.icon} ${r.label}</strong></td>`;
        r.mc.results.forEach(res => {
          html += `<td>${res.mean.toFixed(1)}%</td>`;
        });
        html += `<td>${r.mc.participation.mean.toFixed(0)}%</td>`;
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    }

    container.innerHTML = html;
  }

  // ── SWING BUREAUX ──
  function renderSwingBureaux() {
    const container = document.getElementById('analyse-swing');
    const bvData = HistoriqueBV.getData();
    if (!bvData || !bvData.volatility || !bvData.elections) {
      container.innerHTML = '<p class="muted">Donnees non disponibles</p>';
      return;
    }

    const vol = bvData.volatility.bureaux;
    const demo = bvData.demographics || {};
    const el24 = bvData.elections.europeennes2024;
    const muni = bvData.elections.municipales2020;

    const bureaux = [];
    for (const bv of Object.keys(vol).sort((a, b) => +a - +b)) {
      const v = vol[bv];
      const d = demo[bv] || {};
      const inscrits = d.inscrits || 500;

      // Volatilite cles (RN + Macron)
      const volKey = ((v.RN || 5) + (v.Macron || 5)) / 2;

      // Positionnement politique
      const b24 = (el24 && el24.bureaux && el24.bureaux[bv]) || {};
      let spread = 10;
      let rnPct = 0, gPct = 0, mPct = 0;
      if (b24.blocs && b24.exprimes > 0) {
        rnPct = (b24.blocs.RN || 0) / b24.exprimes * 100;
        gPct = (b24.blocs.Gauche || 0) / b24.exprimes * 100;
        mPct = (b24.blocs.Macron || 0) / b24.exprimes * 100;
        spread = Math.abs(rnPct - gPct);
      }
      const centrality = Math.max(0, 1 - spread / 25);

      // Competitivite municipales 2020
      const mb = (muni && muni.bureaux && muni.bureaux[bv]) || {};
      let comp2020 = 0.5;
      let grelet2020 = 0;
      if (mb.voix && mb.exprimes > 0) {
        grelet2020 = (mb.voix['GRELET-CERTENAIS'] || 0) / mb.exprimes * 100;
        comp2020 = 1 - Math.abs(grelet2020 - 50) / 50;
      }

      const score = volKey * Math.sqrt(inscrits / 500) * (1 + centrality) * (0.5 + comp2020);

      bureaux.push({
        bv, score, volKey, inscrits, rnPct, gPct, mPct, spread,
        grelet2020, comp2020, age: d.age || {}
      });
    }

    bureaux.sort((a, b) => b.score - a.score);
    const maxScore = bureaux[0].score;

    let html = '<div class="swing-grid">';
    for (const b of bureaux) {
      const pct = (b.score / maxScore) * 100;
      let tier, tierClass;
      if (pct > 75) { tier = 'PRIORITAIRE'; tierClass = 'tier-prio'; }
      else if (pct > 45) { tier = 'IMPORTANT'; tierClass = 'tier-imp'; }
      else { tier = 'SECONDAIRE'; tierClass = 'tier-sec'; }

      // Political position
      let position;
      if (b.spread < 5) position = 'Centre';
      else if (b.rnPct > b.gPct) position = 'Droite';
      else position = 'Gauche';

      html += `<div class="swing-bureau ${tierClass}">` +
              `<div class="swing-header">` +
              `<span class="swing-num">Bureau ${b.bv}</span>` +
              `<span class="swing-tier">${tier}</span>` +
              `</div>` +
              `<div class="swing-bar-bg"><div class="swing-bar-fill" style="width:${pct}%"></div></div>` +
              `<div class="swing-details">` +
              `<span>${b.inscrits} inscrits</span>` +
              `<span>${position}</span>` +
              `<span>Volatilite: ${b.volKey.toFixed(1)}</span>` +
              `</div>` +
              `<div class="swing-details">` +
              `<span>RN ${b.rnPct.toFixed(0)}%</span>` +
              `<span>Gau ${b.gPct.toFixed(0)}%</span>` +
              `<span>Mac ${b.mPct.toFixed(0)}%</span>` +
              `<span>Muni20: ${b.grelet2020.toFixed(0)}%</span>` +
              `</div></div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ── DEMOGRAPHICS ──
  function renderDemographics() {
    const container = document.getElementById('analyse-demo');
    const bvData = HistoriqueBV.getData();
    if (!bvData || !bvData.demographics) {
      container.innerHTML = '<p class="muted">Donnees non disponibles</p>';
      return;
    }

    const demo = bvData.demographics;
    const bvIds = Object.keys(demo).sort((a, b) => +a - +b);

    let html = '<div class="table-scroll"><table class="demo-table">';
    html += '<thead><tr><th>Bureau</th><th>Inscrits</th>' +
            '<th>18-35 ans</th><th>36-65 ans</th><th>66-80 ans</th><th>80+ ans</th>' +
            '<th>Profil</th></tr></thead><tbody>';

    for (const bv of bvIds) {
      const d = demo[bv];
      const a = d.age;
      let profile = 'Mixte';
      if (a['18_35'] > 26) profile = '🟡 Jeune';
      else if (a['80_plus'] > 17) profile = '🔵 Tres age';
      else if (a['66_80'] > 30) profile = '🟣 Senior';
      else if (a['36_65'] > 44) profile = '🟠 Actif';

      // Color intensity for each cell based on deviation from average
      const avg = { '18_35': 22.1, '36_65': 38.9, '66_80': 25.6, '80_plus': 12.7 };
      const cellStyle = (key) => {
        const diff = a[key] - avg[key];
        if (diff > 5) return 'style="color:#4CAF50;font-weight:bold"';
        if (diff < -5) return 'style="color:#FF5722;font-weight:bold"';
        return '';
      };

      html += `<tr>` +
              `<td><strong>Bureau ${bv}</strong></td>` +
              `<td>${d.inscrits}</td>` +
              `<td ${cellStyle('18_35')}>${a['18_35']}%</td>` +
              `<td ${cellStyle('36_65')}>${a['36_65']}%</td>` +
              `<td ${cellStyle('66_80')}>${a['66_80']}%</td>` +
              `<td ${cellStyle('80_plus')}>${a['80_plus']}%</td>` +
              `<td>${profile}</td></tr>`;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // Auto-render when page becomes visible (robust: works regardless of how navigation happens)
  document.addEventListener('DOMContentLoaded', () => {
    const pageEl = document.getElementById('page-analyse');
    if (pageEl) {
      const observer = new MutationObserver(() => {
        if (pageEl.classList.contains('active')) {
          render().catch(e => console.warn('Analyse auto-render:', e));
        }
      });
      observer.observe(pageEl, { attributes: true, attributeFilter: ['class'] });
    }
  });

  return { render };
})();
