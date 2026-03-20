/* soiree.js — Page "Soiree T2" : saisie rapide + projection live + comparaison T1/T2
   TRIANGULAIRE : Lemoigne / Da Silva / Grelet-Certenais */
const Soiree = (() => {
  const STORE_KEY = 'elections-lafleche-t2';

  // Couleurs candidats
  const COLORS = {
    lemoigne: '#5C6BC0',
    dasilva: '#2196F3',
    grelet: '#E91E63'
  };

  // T1 data (from definitive results)
  const T1 = {
    "01": { inscrits: 495, votants: 332, blancs: 3, nuls: 4, lemoigne: 145, dasilva: 53, grelet: 127 },
    "02": { inscrits: 744, votants: 538, blancs: 11, nuls: 7, lemoigne: 258, dasilva: 91, grelet: 170 },
    "03": { inscrits: 667, votants: 453, blancs: 5, nuls: 10, lemoigne: 186, dasilva: 66, grelet: 186 },
    "04": { inscrits: 573, votants: 402, blancs: 3, nuls: 4, lemoigne: 148, dasilva: 91, grelet: 156 },
    "05": { inscrits: 664, votants: 464, blancs: 11, nuls: 8, lemoigne: 210, dasilva: 70, grelet: 165 },
    "06": { inscrits: 616, votants: 410, blancs: 10, nuls: 1, lemoigne: 195, dasilva: 60, grelet: 144 },
    "07": { inscrits: 664, votants: 469, blancs: 10, nuls: 5, lemoigne: 191, dasilva: 80, grelet: 183 },
    "08": { inscrits: 486, votants: 331, blancs: 9, nuls: 6, lemoigne: 164, dasilva: 46, grelet: 106 },
    "09": { inscrits: 547, votants: 358, blancs: 5, nuls: 6, lemoigne: 167, dasilva: 56, grelet: 124 },
    "10": { inscrits: 507, votants: 368, blancs: 5, nuls: 1, lemoigne: 114, dasilva: 65, grelet: 183 },
    "11": { inscrits: 538, votants: 360, blancs: 5, nuls: 3, lemoigne: 127, dasilva: 74, grelet: 151 },
    "12": { inscrits: 519, votants: 356, blancs: 8, nuls: 1, lemoigne: 130, dasilva: 68, grelet: 149 },
    "13": { inscrits: 518, votants: 293, blancs: 2, nuls: 4, lemoigne: 124, dasilva: 43, grelet: 120 },
    "14": { inscrits: 653, votants: 460, blancs: 10, nuls: 3, lemoigne: 211, dasilva: 50, grelet: 186 },
    "15": { inscrits: 839, votants: 574, blancs: 17, nuls: 10, lemoigne: 272, dasilva: 79, grelet: 196 },
    "16": { inscrits: 754, votants: 537, blancs: 11, nuls: 8, lemoigne: 207, dasilva: 94, grelet: 217 },
    "17": { inscrits: 546, votants: 409, blancs: 5, nuls: 3, lemoigne: 165, dasilva: 75, grelet: 161 }
  };

  const TOTAL_T1 = {
    inscrits: 10330, votants: 7114,
    lemoigne: 3014, grelet: 2724, dasilva: 1161,
    exprimes: 6899, participation: 68.9
  };

  // BV sentinelles (les plus predictifs / swings)
  const SENTINELLES = ['03', '07', '11', '12', '17'];

  let chartTrend = null;
  let finalOverlayShown = false;

  // === STORE ===
  function loadT2() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : { participation: {}, resultats: {} };
    } catch (e) { return { participation: {}, resultats: {} }; }
  }

  function saveT2(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function resetT2() {
    localStorage.removeItem(STORE_KEY);
  }

  // === CALCULS ===
  function getFilledBureaux() {
    const data = loadT2();
    return Object.keys(data.resultats).sort();
  }

  function getAggregate() {
    const data = loadT2();
    const filled = Object.keys(data.resultats);
    let totalInscrits = 0, totalVotants = 0, totalBlancs = 0, totalNuls = 0;
    let totalLemoigne = 0, totalDasilva = 0, totalGrelet = 0;

    filled.forEach(bv => {
      const r = data.resultats[bv];
      totalInscrits += T1[bv].inscrits;
      totalVotants += r.votants;
      totalBlancs += r.blancs || 0;
      totalNuls += r.nuls || 0;
      totalLemoigne += r.lemoigne;
      totalDasilva += r.dasilva || 0;
      totalGrelet += r.grelet;
    });

    const exprimes = totalVotants - totalBlancs - totalNuls;
    return {
      filled: filled.length,
      inscrits: totalInscrits, votants: totalVotants,
      blancs: totalBlancs, nuls: totalNuls, exprimes,
      lemoigne: totalLemoigne, dasilva: totalDasilva, grelet: totalGrelet,
      pctLemoigne: exprimes > 0 ? (totalLemoigne / exprimes * 100) : 0,
      pctDasilva: exprimes > 0 ? (totalDasilva / exprimes * 100) : 0,
      pctGrelet: exprimes > 0 ? (totalGrelet / exprimes * 100) : 0,
      participation: totalInscrits > 0 ? (totalVotants / totalInscrits * 100) : 0
    };
  }

  // === REPORT PARAMS — observed transfer patterns from filled BVs ===
  function getReportParams() {
    const data = loadT2();
    const filled = Object.keys(data.resultats);
    if (filled.length === 0) return null;

    let sumDasT1 = 0, sumDasT2 = 0;
    let sumExprT1 = 0, sumExprT2 = 0;
    let sumReportLem = 0, sumReportGre = 0;
    const perBV = [];

    filled.forEach(bv => {
      const t1 = T1[bv];
      const r = data.resultats[bv];
      const exprT1 = t1.lemoigne + t1.dasilva + t1.grelet;
      const exprT2 = r.votants - (r.blancs || 0) - (r.nuls || 0);

      sumDasT1 += t1.dasilva;
      sumDasT2 += (r.dasilva || 0);
      sumExprT1 += exprT1;
      sumExprT2 += exprT2;

      // Participation-adjusted gains = report signal
      const scale = exprT1 > 0 ? exprT2 / exprT1 : 1;
      const reportLem = r.lemoigne - t1.lemoigne * scale;
      const reportGre = r.grelet - t1.grelet * scale;
      sumReportLem += reportLem;
      sumReportGre += reportGre;

      const retention = t1.dasilva > 0 ? (r.dasilva || 0) / t1.dasilva : 1;
      const totalReport = reportLem + reportGre;
      const ratioLem = totalReport > 0 ? reportLem / totalReport : 0.5;

      perBV.push({ bv, retention, ratioLem, participationRatio: scale });
    });

    const avgRetention = sumDasT1 > 0 ? sumDasT2 / sumDasT1 : 1;
    const avgParticipation = sumExprT1 > 0 ? sumExprT2 / sumExprT1 : 1;

    const totalReportPositive = Math.max(0.1, sumReportLem + sumReportGre);
    const fuiteLem = (sumReportLem > 0 || sumReportGre > 0)
      ? Math.max(0, Math.min(1, sumReportLem / totalReportPositive)) : 0.5;
    const fuiteGre = 1 - fuiteLem;

    // Abstention among Da Silva fuitards
    const totalDasFuite = sumDasT1 - sumDasT2;
    const totalRedistributed = Math.max(0, sumReportLem + sumReportGre);
    const abstentionDas = totalDasFuite > 0
      ? Math.max(0, Math.min(0.5, 1 - totalRedistributed / totalDasFuite)) : 0;

    const retentions = perBV.map(p => p.retention);
    const ratios = perBV.map(p => p.ratioLem);

    return {
      retention: avgRetention,
      participationRatio: avgParticipation,
      fuiteLem, fuiteGre, abstentionDas,
      filled: filled.length,
      retentionMin: Math.min(...retentions),
      retentionMax: Math.max(...retentions),
      ratioLemMin: Math.min(...ratios),
      ratioLemMax: Math.max(...ratios),
      perBV
    };
  }

  // Fourchette from per-BV variance
  function getProjectionFourchette() {
    const params = getReportParams();
    if (!params || params.filled < 2) return null;

    const data = loadT2();
    const filled = Object.keys(data.resultats);
    const remaining = Object.keys(T1).filter(bv => !filled.includes(bv));
    if (remaining.length === 0) return null;

    let realLem = 0, realDas = 0, realGre = 0, realExpr = 0;
    filled.forEach(bv => {
      const r = data.resultats[bv];
      const expr = r.votants - (r.blancs || 0) - (r.nuls || 0);
      realLem += r.lemoigne;
      realDas += r.dasilva || 0;
      realGre += r.grelet;
      realExpr += expr;
    });

    function projectWith(retention, ratioLem) {
      let estLem = 0, estDas = 0, estGre = 0, estExpr = 0;
      remaining.forEach(bv => {
        const t1 = T1[bv];
        const exprT1 = t1.lemoigne + t1.dasilva + t1.grelet;
        const eExpr = Math.round(exprT1 * params.participationRatio);
        const eDas = Math.round(t1.dasilva * retention);
        const fuite = t1.dasilva - eDas;
        const redist = fuite * (1 - params.abstentionDas);

        estLem += Math.round(t1.lemoigne * params.participationRatio + redist * ratioLem);
        estDas += eDas;
        estGre += Math.round(t1.grelet * params.participationRatio + redist * (1 - ratioLem));
        estExpr += eExpr;
      });
      const tExpr = realExpr + estExpr;
      return {
        lemoigne: tExpr > 0 ? ((realLem + estLem) / tExpr * 100) : 0,
        dasilva: tExpr > 0 ? ((realDas + estDas) / tExpr * 100) : 0,
        grelet: tExpr > 0 ? ((realGre + estGre) / tExpr * 100) : 0
      };
    }

    const scenarios = [];
    [params.retentionMin, params.retention, params.retentionMax].forEach(ret => {
      [params.ratioLemMin, params.fuiteLem, params.ratioLemMax].forEach(ratio => {
        scenarios.push(projectWith(ret, ratio));
      });
    });

    return {
      lemoigne: { min: Math.min(...scenarios.map(s => s.lemoigne)), max: Math.max(...scenarios.map(s => s.lemoigne)) },
      dasilva: { min: Math.min(...scenarios.map(s => s.dasilva)), max: Math.max(...scenarios.map(s => s.dasilva)) },
      grelet: { min: Math.min(...scenarios.map(s => s.grelet)), max: Math.max(...scenarios.map(s => s.grelet)) }
    };
  }

  // Projection : bureaux saisis = reel, non-saisis = modele de report proportionnel
  function getProjection() {
    const data = loadT2();
    const filled = Object.keys(data.resultats);
    const remaining = Object.keys(T1).filter(bv => !filled.includes(bv));

    if (filled.length === 0) {
      return {
        lemoigne: 43.7, dasilva: 16.8, grelet: 39.5,
        confidence: 0, method: 'theorique',
        filled: 0, total: 17
      };
    }

    // Real part (filled bureaux)
    let realLem = 0, realDas = 0, realGre = 0, realExpr = 0;
    filled.forEach(bv => {
      const r = data.resultats[bv];
      const expr = r.votants - (r.blancs || 0) - (r.nuls || 0);
      realLem += r.lemoigne;
      realDas += r.dasilva || 0;
      realGre += r.grelet;
      realExpr += expr;
    });

    if (remaining.length === 0) {
      return {
        lemoigne: realExpr > 0 ? (realLem / realExpr * 100) : 0,
        dasilva: realExpr > 0 ? (realDas / realExpr * 100) : 0,
        grelet: realExpr > 0 ? (realGre / realExpr * 100) : 0,
        voixLemoigne: realLem, voixDasilva: realDas, voixGrelet: realGre,
        exprimes: realExpr, confidence: 100,
        method: 'definitif', filled: 17, total: 17
      };
    }

    // Report-based estimation for remaining BVs
    const params = getReportParams();
    let estLem = 0, estDas = 0, estGre = 0, estExpr = 0;

    remaining.forEach(bv => {
      const t1 = T1[bv];
      const exprT1 = t1.lemoigne + t1.dasilva + t1.grelet;
      const eExpr = Math.round(exprT1 * params.participationRatio);

      // Da Silva: retention model
      const eDas = Math.round(t1.dasilva * params.retention);
      const fuite = t1.dasilva - eDas;
      const redist = fuite * (1 - params.abstentionDas);

      // L and G: participation-adjusted base + reports from Da Silva
      const eLem = Math.round(t1.lemoigne * params.participationRatio + redist * params.fuiteLem);
      const eGre = Math.round(t1.grelet * params.participationRatio + redist * params.fuiteGre);

      estLem += eLem;
      estDas += eDas;
      estGre += eGre;
      estExpr += eExpr;
    });

    const totalLem = realLem + estLem;
    const totalDas = realDas + estDas;
    const totalGre = realGre + estGre;
    const totalExpr = realExpr + estExpr;

    const sentinellesFilled = SENTINELLES.filter(bv => filled.includes(bv)).length;
    const basePct = (filled.length / 17) * 100;
    const sentBonus = (sentinellesFilled / SENTINELLES.length) * 15;
    const confidence = Math.min(100, basePct + sentBonus);

    return {
      lemoigne: totalExpr > 0 ? (totalLem / totalExpr * 100) : 0,
      dasilva: totalExpr > 0 ? (totalDas / totalExpr * 100) : 0,
      grelet: totalExpr > 0 ? (totalGre / totalExpr * 100) : 0,
      voixLemoigne: totalLem, voixDasilva: totalDas, voixGrelet: totalGre,
      exprimes: totalExpr, confidence,
      method: 'projection', filled: filled.length, total: 17
    };
  }

  // === ALERT LEVEL (en triangulaire, c'est relatif au 1er) ===
  function getAlertLevel(proj) {
    const lead = proj.lemoigne - Math.max(proj.grelet, proj.dasilva);
    if (lead >= 6) return { icon: '\u{1F7E2}', label: 'Large avance' };
    if (lead >= 3) return { icon: '\u{1F7E2}', label: 'Avance confortable' };
    if (lead >= 1) return { icon: '\u{1F7E0}', label: 'Avance courte' };
    if (lead >= -1) return { icon: '\u{1F7E0}', label: 'Au coude a coude' };
    return { icon: '\u{1F534}', label: 'En retard' };
  }

  function getAlertColor(pct, isLeader) {
    if (isLeader) return '#4CAF50';
    if (pct >= 40) return '#FFA726';
    return '#EF5350';
  }

  function getCandidateColor(pctLem, pctDas, pctGre) {
    if (pctLem > pctGre && pctLem > pctDas) return COLORS.lemoigne;
    if (pctGre > pctLem && pctGre > pctDas) return COLORS.grelet;
    return COLORS.dasilva;
  }

  // === RENDER ===
  function render() {
    const data = loadT2();
    const agg = getAggregate();
    const proj = getProjection();

    renderAlertBanner(proj);
    renderParticipation(data);
    renderProjectionCard(proj, agg);
    renderComparison();
    renderTrendChart(data);
    renderBureauGrid(data);
    renderBureauTable(data, agg);
    renderPublishButton(proj, agg);

    // Auto-show final overlay when all 17 BVs are filled (once)
    if (proj.method === 'definitif' && !finalOverlayShown) {
      finalOverlayShown = true;
      setTimeout(() => showFinalOverlay(proj, agg), 600);
    }
  }

  function renderAlertBanner(proj) {
    const el = document.getElementById('soiree-alert');
    const filled = proj.filled;
    const alert = getAlertLevel(proj);

    if (filled === 0) {
      el.innerHTML = `
        <div style="background:rgba(79,195,247,0.15);padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.8rem">\u{1F5F3}\u{FE0F}</div>
          <div style="font-size:1.1rem;font-weight:700;margin:8px 0">TRIANGULAIRE \u2014 En attente</div>
          <div style="font-size:0.85rem;color:var(--text-muted)">T1: Lemoigne 43.7% \u00b7 Grelet 39.5% \u00b7 Da Silva 16.8%</div>
        </div>`;
      return;
    }

    const isDefinitif = proj.method === 'definitif';
    const leader = proj.lemoigne >= proj.grelet && proj.lemoigne >= proj.dasilva ? 'lemoigne' :
                   proj.grelet >= proj.dasilva ? 'grelet' : 'dasilva';
    const leaderColor = COLORS[leader];

    el.innerHTML = `
      <div style="background:${leaderColor}22;border:2px solid ${leaderColor};padding:16px;border-radius:12px;text-align:center">
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">
          ${isDefinitif ? '\u2705 RESULTAT DEFINITIF' : `\u{1F4CA} PROJECTION (${filled}/17 BV)`}
        </div>
        <div style="display:flex;justify-content:center;align-items:baseline;gap:12px;flex-wrap:wrap">
          <div>
            <span style="font-size:1.8rem;font-weight:800;color:${COLORS.lemoigne}">${proj.lemoigne.toFixed(1)}%</span>
            <span style="font-size:0.75rem;display:block;color:var(--text-muted)">Lemoigne</span>
          </div>
          <span style="font-size:1rem;color:var(--text-muted)">\u00b7</span>
          <div>
            <span style="font-size:1.8rem;font-weight:800;color:${COLORS.grelet}">${proj.grelet.toFixed(1)}%</span>
            <span style="font-size:0.75rem;display:block;color:var(--text-muted)">Grelet</span>
          </div>
          <span style="font-size:1rem;color:var(--text-muted)">\u00b7</span>
          <div>
            <span style="font-size:1.8rem;font-weight:800;color:${COLORS.dasilva}">${proj.dasilva.toFixed(1)}%</span>
            <span style="font-size:0.75rem;display:block;color:var(--text-muted)">Da Silva</span>
          </div>
        </div>
        <div style="margin-top:8px;font-size:0.85rem">
          ${alert.icon} ${alert.label}
          ${!isDefinitif ? `<span style="color:var(--text-muted)"> \u2014 Confiance: ${proj.confidence.toFixed(0)}%</span>` : ''}
        </div>
        ${proj.voixLemoigne ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">
          Voix: Lem ${proj.voixLemoigne} \u00b7 Gre ${proj.voixGrelet} \u00b7 DaS ${proj.voixDasilva}
        </div>` : ''}
      </div>`;
  }

  function renderParticipation(data) {
    const el = document.getElementById('soiree-participation');
    const p12 = data.participation?.['12h'];
    const p17 = data.participation?.['17h'];

    const t1_12h = 25.3;
    const t1_17h = 48.7;
    const t1_final = 68.9;

    el.innerHTML = `
      <div class="stat-row" style="margin-bottom:12px">
        <div class="stat-box" style="flex:1">
          <span class="stat-label">12h</span>
          <input type="number" step="0.1" min="0" max="100"
            class="soiree-part-input" id="part-12h"
            value="${p12 || ''}" placeholder="-"
            style="width:70px;text-align:center;font-size:1.2rem;font-weight:700;background:var(--bg-input);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:var(--text);padding:6px">
          <span class="stat-label" style="margin-top:4px">T1: ~${t1_12h}%</span>
        </div>
        <div class="stat-box" style="flex:1">
          <span class="stat-label">17h</span>
          <input type="number" step="0.1" min="0" max="100"
            class="soiree-part-input" id="part-17h"
            value="${p17 || ''}" placeholder="-"
            style="width:70px;text-align:center;font-size:1.2rem;font-weight:700;background:var(--bg-input);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:var(--text);padding:6px">
          <span class="stat-label" style="margin-top:4px">T1: ~${t1_17h}%</span>
        </div>
        <div class="stat-box" style="flex:1">
          <span class="stat-label">Final</span>
          <span class="stat-value" id="part-final" style="font-size:1.2rem">-</span>
          <span class="stat-label" style="margin-top:4px">T1: ${t1_final}%</span>
        </div>
      </div>
      <div id="part-signal" style="font-size:0.8rem;text-align:center;color:var(--text-muted)"></div>`;

    const agg = getAggregate();
    if (agg.filled > 0) {
      document.getElementById('part-final').textContent = agg.participation.toFixed(1) + '%';
    }

    updateParticipationSignal(data);

    ['12h', '17h'].forEach(h => {
      document.getElementById(`part-${h}`).addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        const d = loadT2();
        if (!d.participation) d.participation = {};
        d.participation[h] = val;
        saveT2(d);
        updateParticipationSignal(d);
      });
    });
  }

  function updateParticipationSignal(data) {
    const signalEl = document.getElementById('part-signal');
    if (!signalEl) return;

    const p17 = data.participation?.['17h'];
    if (p17) {
      const diff = p17 - 48.7;
      if (diff > 2) {
        signalEl.innerHTML = `\u{1F7E2} Hausse (+${diff.toFixed(1)} pts vs T1) \u2014 <strong>mobilisation forte</strong>`;
        signalEl.style.color = '#4CAF50';
      } else if (diff > -2) {
        signalEl.innerHTML = `\u{1F7E0} Stable (${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts vs T1)`;
        signalEl.style.color = '#FFA726';
      } else {
        signalEl.innerHTML = `\u{1F534} Baisse (${diff.toFixed(1)} pts vs T1) \u2014 <strong>demobilisation</strong>`;
        signalEl.style.color = '#EF5350';
      }
    } else {
      const p12 = data.participation?.['12h'];
      if (p12) {
        const diff = p12 - 25.3;
        if (diff > 1) {
          signalEl.innerHTML = `\u{1F7E2} 12h: hausse (+${diff.toFixed(1)} pts)`;
          signalEl.style.color = '#4CAF50';
        } else if (diff > -1) {
          signalEl.innerHTML = `\u{1F7E0} 12h: stable`;
          signalEl.style.color = '#FFA726';
        } else {
          signalEl.innerHTML = `\u{1F534} 12h: baisse (${diff.toFixed(1)} pts)`;
          signalEl.style.color = '#EF5350';
        }
      } else {
        signalEl.innerHTML = 'Saisissez la participation pour voir le signal';
        signalEl.style.color = 'var(--text-muted)';
      }
    }
  }

  // === PROJECTION CARD (enhanced with report params + fourchette) ===
  function renderProjectionCard(proj, agg) {
    const el = document.getElementById('soiree-projection-details');
    if (agg.filled === 0) {
      el.innerHTML = '<p class="muted" style="text-align:center">Aucun bureau saisi</p>';
      return;
    }

    const params = getReportParams();
    const fourchette = getProjectionFourchette();

    const maxPct = Math.max(proj.lemoigne, proj.dasilva, proj.grelet);
    const barScale = 85 / maxPct;

    function bar(name, color, pct, fourch) {
      const w = pct * barScale;
      let fourchHTML = '';
      if (fourch && Math.abs(fourch.max - fourch.min) > 0.3) {
        fourchHTML = `<div style="font-size:0.6rem;color:var(--text-muted);text-align:right">${fourch.min.toFixed(1)}\u2013${fourch.max.toFixed(1)}</div>`;
      }
      return `<div style="margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:65px;font-size:0.75rem;color:${color};font-weight:600">${name}</span>
          <div style="flex:1;height:22px;background:var(--bg-input);border-radius:6px;overflow:hidden">
            <div style="width:${w}%;height:100%;background:${color};border-radius:6px;transition:width 0.5s"></div>
          </div>
          <span style="width:48px;text-align:right;font-weight:700;font-size:0.9rem;color:${color}">${pct.toFixed(1)}%</span>
        </div>
        ${fourchHTML}
      </div>`;
    }

    // Report params display
    let paramsHTML = '';
    if (params && agg.filled >= 2) {
      paramsHTML = `
        <div style="display:flex;justify-content:space-around;margin-bottom:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:0.7rem">
          <div style="text-align:center">
            <div style="font-weight:700;font-size:0.95rem">${(params.retention * 100).toFixed(0)}%</div>
            <div style="color:var(--text-muted)">Retention DaS</div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:700;font-size:0.95rem;color:${COLORS.lemoigne}">${Math.round(params.fuiteLem * 100)}%</div>
            <div style="color:var(--text-muted)">Fuite\u2192L</div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:700;font-size:0.95rem;color:${COLORS.grelet}">${Math.round(params.fuiteGre * 100)}%</div>
            <div style="color:var(--text-muted)">Fuite\u2192G</div>
          </div>
        </div>`;
    }

    el.innerHTML = `
      ${paramsHTML}
      <div style="margin-bottom:10px">
        ${bar('Lemoigne', COLORS.lemoigne, proj.lemoigne, fourchette?.lemoigne)}
        ${bar('Grelet', COLORS.grelet, proj.grelet, fourchette?.grelet)}
        ${bar('Da Silva', COLORS.dasilva, proj.dasilva, fourchette?.dasilva)}
      </div>
      ${proj.voixLemoigne ? `<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">
        Voix: L\u00a0${proj.voixLemoigne.toLocaleString('fr-FR')} \u00b7 G\u00a0${proj.voixGrelet.toLocaleString('fr-FR')} \u00b7 D\u00a0${proj.voixDasilva.toLocaleString('fr-FR')}
        \u00b7 Ecart: ${proj.voixLemoigne > proj.voixGrelet ? '+' : ''}${(proj.voixLemoigne - proj.voixGrelet).toLocaleString('fr-FR')} voix
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted)">
        <span>${agg.filled}/17 BV ${proj.method === 'definitif' ? '(definitif)' : ''}</span>
        <span>Ecart L-G: ${(proj.lemoigne - proj.grelet) > 0 ? '+' : ''}${(proj.lemoigne - proj.grelet).toFixed(1)} pts</span>
      </div>
      <div class="confidence-meter" style="margin-top:8px">
        <div class="confidence-fill" style="width:${proj.confidence}%"></div>
      </div>
      <div style="text-align:center;font-size:0.7rem;color:var(--text-muted)">
        Fiabilite: ${proj.confidence.toFixed(0)}%
      </div>`;
  }

  // === COMPARISON T1 vs T2 on same bureaux ===
  function renderComparison() {
    const el = document.getElementById('soiree-comparison');
    const content = document.getElementById('soiree-comparison-content');
    if (!el || !content) return;

    const data = loadT2();
    const filled = Object.keys(data.resultats);

    if (filled.length === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    const params = getReportParams();

    // Aggregate T1 and T2 on same bureaux
    let t1Lem = 0, t1Das = 0, t1Gre = 0, t1Expr = 0, t1Vot = 0, t1Insc = 0;
    let t2Lem = 0, t2Das = 0, t2Gre = 0, t2Expr = 0, t2Vot = 0;

    filled.forEach(bv => {
      const t1 = T1[bv];
      const r = data.resultats[bv];
      t1Lem += t1.lemoigne; t1Das += t1.dasilva; t1Gre += t1.grelet;
      t1Expr += t1.lemoigne + t1.dasilva + t1.grelet;
      t1Vot += t1.votants; t1Insc += t1.inscrits;
      t2Lem += r.lemoigne; t2Das += r.dasilva || 0; t2Gre += r.grelet;
      const e = r.votants - (r.blancs || 0) - (r.nuls || 0);
      t2Expr += e; t2Vot += r.votants;
    });

    const pctT1L = (t1Lem / t1Expr * 100);
    const pctT1D = (t1Das / t1Expr * 100);
    const pctT1G = (t1Gre / t1Expr * 100);
    const pctT2L = (t2Lem / t2Expr * 100);
    const pctT2D = (t2Das / t2Expr * 100);
    const pctT2G = (t2Gre / t2Expr * 100);

    const deltaL = pctT2L - pctT1L;
    const deltaD = pctT2D - pctT1D;
    const deltaG = pctT2G - pctT1G;

    const partT1 = (t1Vot / t1Insc * 100);
    const partT2 = (t2Vot / t1Insc * 100);
    const deltaPart = partT2 - partT1;

    function deltaStr(d) {
      const color = d >= 0 ? '#4CAF50' : '#EF5350';
      const arrow = d >= 0 ? '\u25B2' : '\u25BC';
      return `<span style="color:${color};font-weight:600">${arrow}${d >= 0 ? '+' : ''}${d.toFixed(1)}</span>`;
    }

    // Report indicator bar
    let reportHTML = '';
    if (deltaD < -1 && (deltaL > 0 || deltaG > 0)) {
      const gainL = Math.max(0, deltaL);
      const gainG = Math.max(0, deltaG);
      const totalGain = Math.max(0.1, gainL + gainG);
      const ratioL = Math.round(gainL / totalGain * 100);
      const ratioG = Math.round(gainG / totalGain * 100);
      const abst = Math.max(0, 100 - ratioL - ratioG);

      reportHTML = `
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;margin-top:10px">
          <div style="font-size:0.8rem;font-weight:600;margin-bottom:6px">Indicateur de report</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">
            Da Silva perd ${Math.abs(deltaD).toFixed(1)} pts sur ${filled.length} BV
          </div>
          <div style="display:flex;gap:2px;margin:6px 0;height:18px;border-radius:4px;overflow:hidden">
            ${ratioL > 0 ? `<div style="width:${ratioL}%;background:${COLORS.lemoigne};border-radius:4px 0 0 4px"></div>` : ''}
            ${ratioG > 0 ? `<div style="width:${ratioG}%;background:${COLORS.grelet}"></div>` : ''}
            ${abst > 5 ? `<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:0 4px 4px 0"></div>` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem">
            <span style="color:${COLORS.lemoigne}">\u2192 Lemoigne ${ratioL}%</span>
            <span style="color:${COLORS.grelet}">\u2192 Grelet ${ratioG}%</span>
            ${abst > 5 ? `<span style="color:var(--text-muted)">\u2192 Abst. ${abst}%</span>` : ''}
          </div>
        </div>`;
    }

    content.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;font-size:0.8rem;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.15)">
              <th style="text-align:left;padding:6px 4px">Candidat</th>
              <th style="text-align:right;padding:6px 4px">%T1</th>
              <th style="text-align:right;padding:6px 4px">%T2</th>
              <th style="text-align:right;padding:6px 4px">\u0394 pts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="color:${COLORS.lemoigne};font-weight:600;padding:6px 4px">Lemoigne</td>
              <td style="text-align:right;padding:6px 4px">${pctT1L.toFixed(1)}%</td>
              <td style="text-align:right;font-weight:700;padding:6px 4px">${pctT2L.toFixed(1)}%</td>
              <td style="text-align:right;padding:6px 4px">${deltaStr(deltaL)}</td>
            </tr>
            <tr>
              <td style="color:${COLORS.dasilva};font-weight:600;padding:6px 4px">Da Silva</td>
              <td style="text-align:right;padding:6px 4px">${pctT1D.toFixed(1)}%</td>
              <td style="text-align:right;font-weight:700;padding:6px 4px">${pctT2D.toFixed(1)}%</td>
              <td style="text-align:right;padding:6px 4px">${deltaStr(deltaD)}</td>
            </tr>
            <tr>
              <td style="color:${COLORS.grelet};font-weight:600;padding:6px 4px">Grelet</td>
              <td style="text-align:right;padding:6px 4px">${pctT1G.toFixed(1)}%</td>
              <td style="text-align:right;font-weight:700;padding:6px 4px">${pctT2G.toFixed(1)}%</td>
              <td style="text-align:right;padding:6px 4px">${deltaStr(deltaG)}</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.1)">
              <td style="padding:6px 4px;color:var(--text-muted)">Participation</td>
              <td style="text-align:right;padding:6px 4px">${partT1.toFixed(1)}%</td>
              <td style="text-align:right;font-weight:700;padding:6px 4px">${partT2.toFixed(1)}%</td>
              <td style="text-align:right;padding:6px 4px">${deltaStr(deltaPart)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${params ? `
      <div style="display:flex;justify-content:space-around;margin-top:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:0.75rem">
        <div style="text-align:center">
          <div style="font-weight:700;font-size:1rem">${(params.retention * 100).toFixed(0)}%</div>
          <div style="color:var(--text-muted)">Retention DaS</div>
        </div>
        <div style="text-align:center">
          <div style="font-weight:700;font-size:1rem">${Math.round(params.fuiteLem * 100)}/${Math.round(params.fuiteGre * 100)}</div>
          <div style="color:var(--text-muted)">Split L/G</div>
        </div>
        <div style="text-align:center">
          <div style="font-weight:700;font-size:1rem">${deltaPart >= 0 ? '+' : ''}${deltaPart.toFixed(1)}</div>
          <div style="color:var(--text-muted)">\u0394 Particip.</div>
        </div>
      </div>` : ''}
      ${reportHTML}`;
  }

  function renderTrendChart(data) {
    const canvas = document.getElementById('chart-soiree-trend');
    const filled = getFilledBureaux();

    if (filled.length < 2) {
      if (chartTrend) { chartTrend.destroy(); chartTrend = null; }
      return;
    }

    const labels = [];
    const lemData = [], dasData = [], greData = [];
    let cumLem = 0, cumDas = 0, cumGre = 0, cumExpr = 0;

    filled.forEach(bv => {
      const r = data.resultats[bv];
      const expr = r.votants - (r.blancs || 0) - (r.nuls || 0);
      cumLem += r.lemoigne;
      cumDas += r.dasilva || 0;
      cumGre += r.grelet;
      cumExpr += expr;
      labels.push(`BV${parseInt(bv)}`);
      lemData.push(parseFloat((cumLem / cumExpr * 100).toFixed(1)));
      dasData.push(parseFloat((cumDas / cumExpr * 100).toFixed(1)));
      greData.push(parseFloat((cumGre / cumExpr * 100).toFixed(1)));
    });

    if (chartTrend) chartTrend.destroy();

    chartTrend = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Lemoigne', data: lemData,
            borderColor: COLORS.lemoigne, fill: false,
            tension: 0.3, pointRadius: 3, borderWidth: 2,
            pointBackgroundColor: COLORS.lemoigne
          },
          {
            label: 'Grelet', data: greData,
            borderColor: COLORS.grelet, fill: false,
            tension: 0.3, pointRadius: 3, borderWidth: 2,
            pointBackgroundColor: COLORS.grelet
          },
          {
            label: 'Da Silva', data: dasData,
            borderColor: COLORS.dasilva, fill: false,
            tension: 0.3, pointRadius: 3, borderWidth: 2,
            borderDash: [4, 4],
            pointBackgroundColor: COLORS.dasilva
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#E0E7EF', font: { size: 10 }, boxWidth: 12 }
          },
          datalabels: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8899AA', font: { size: 9 } }
          },
          y: {
            min: Math.max(0, Math.min(...dasData) - 5),
            max: Math.min(70, Math.max(...lemData, ...greData) + 5),
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { color: '#8899AA', callback: v => v + '%' }
          }
        }
      }
    });
  }

  function renderBureauGrid(data) {
    const grid = document.getElementById('soiree-bureau-grid');
    const bureaux = Object.keys(T1).sort();
    const filled = Object.keys(data.resultats);

    grid.innerHTML = bureaux.map(bv => {
      const isFilled = filled.includes(bv);
      const isSentinelle = SENTINELLES.includes(bv);
      let statusClass = isFilled ? 'soiree-bv-filled' : 'soiree-bv-empty';
      let extraStyle = '';
      let indicator = '';

      if (isFilled) {
        const r = data.resultats[bv];
        const expr = r.votants - (r.blancs || 0) - (r.nuls || 0);
        const pctLem = expr > 0 ? (r.lemoigne / expr * 100) : 0;
        const pctGre = expr > 0 ? (r.grelet / expr * 100) : 0;
        const color = pctLem > pctGre ? COLORS.lemoigne : COLORS.grelet;
        extraStyle = `border-color:${color}`;
        indicator = `<span style="font-size:0.6rem;color:${color}">${pctLem.toFixed(0)}%</span>`;
      }

      return `<button class="bureau-btn ${statusClass} ${isSentinelle ? 'soiree-sentinelle' : ''}"
        data-bv="${bv}" style="${extraStyle}" onclick="Soiree.selectBV('${bv}')">
        ${parseInt(bv)}
        ${indicator}
        ${isSentinelle && !isFilled ? '<span style="font-size:0.5rem;display:block;color:var(--warning)">\u2605</span>' : ''}
      </button>`;
    }).join('');
  }

  // === BUREAU TABLE (enhanced with deltas + report indicator) ===
  function renderBureauTable(data, agg) {
    const el = document.getElementById('soiree-table-body');
    const bureaux = Object.keys(T1).sort();

    el.innerHTML = bureaux.map(bv => {
      const t1 = T1[bv];
      const r = data.resultats[bv];
      const t1Expr = t1.lemoigne + t1.grelet + t1.dasilva;

      if (!r) {
        return `<tr style="opacity:0.35">
          <td>${parseInt(bv)}${SENTINELLES.includes(bv) ? ' \u2605' : ''}</td>
          <td>-</td><td>-</td><td>-</td>
          <td style="color:var(--text-muted)">${(t1.lemoigne / t1Expr * 100).toFixed(1)}%</td>
          <td style="color:var(--text-muted)">${(t1.dasilva / t1Expr * 100).toFixed(1)}%</td>
          <td style="color:var(--text-muted)">${(t1.grelet / t1Expr * 100).toFixed(1)}%</td>
          <td>-</td>
        </tr>`;
      }

      const expr = r.votants - (r.blancs || 0) - (r.nuls || 0);
      const pctLem = expr > 0 ? (r.lemoigne / expr * 100) : 0;
      const pctDas = expr > 0 ? ((r.dasilva || 0) / expr * 100) : 0;
      const pctGre = expr > 0 ? (r.grelet / expr * 100) : 0;

      const t1PctLem = (t1.lemoigne / t1Expr * 100);
      const t1PctDas = (t1.dasilva / t1Expr * 100);
      const t1PctGre = (t1.grelet / t1Expr * 100);

      const dL = pctLem - t1PctLem;
      const dD = pctDas - t1PctDas;
      const dG = pctGre - t1PctGre;

      function miniDelta(d) {
        if (Math.abs(d) < 0.3) return '';
        const c = d > 0 ? '#4CAF50' : '#EF5350';
        return `<span style="font-size:0.55rem;color:${c}">${d > 0 ? '+' : ''}${d.toFixed(1)}</span>`;
      }

      // Report indicator for this BV
      let rep = '-';
      if (dD < -2 && (dL > 0 || dG > 0)) {
        const gL = Math.max(0, dL), gG = Math.max(0, dG);
        const tot = gL + gG;
        if (tot > 0) {
          const rL = Math.round(gL / tot * 100);
          rep = `<span style="font-size:0.65rem;color:${COLORS.lemoigne}">${rL}</span>/<span style="font-size:0.65rem;color:${COLORS.grelet}">${100 - rL}</span>`;
        }
      }

      return `<tr>
        <td><strong>${parseInt(bv)}</strong>${SENTINELLES.includes(bv) ? ' <span style="color:var(--warning)">\u2605</span>' : ''}</td>
        <td style="color:${COLORS.lemoigne};font-weight:600">${r.lemoigne}</td>
        <td style="color:${COLORS.dasilva};font-weight:600">${r.dasilva || 0}</td>
        <td style="color:${COLORS.grelet};font-weight:600">${r.grelet}</td>
        <td><span style="font-weight:700">${pctLem.toFixed(1)}%</span> ${miniDelta(dL)}</td>
        <td>${pctDas.toFixed(1)}% ${miniDelta(dD)}</td>
        <td>${pctGre.toFixed(1)}% ${miniDelta(dG)}</td>
        <td>${rep}</td>
      </tr>`;
    }).join('');

    // Total row with deltas
    if (agg.filled > 0) {
      const filled = Object.keys(data.resultats);
      let t1L = 0, t1D = 0, t1G = 0, t1E = 0;
      filled.forEach(bv => {
        t1L += T1[bv].lemoigne; t1D += T1[bv].dasilva; t1G += T1[bv].grelet;
        t1E += T1[bv].lemoigne + T1[bv].dasilva + T1[bv].grelet;
      });
      const dTotL = agg.pctLemoigne - (t1L / t1E * 100);
      const dTotD = agg.pctDasilva - (t1D / t1E * 100);
      const dTotG = agg.pctGrelet - (t1G / t1E * 100);

      function miniDelta(d) {
        if (Math.abs(d) < 0.3) return '';
        const c = d > 0 ? '#4CAF50' : '#EF5350';
        return `<span style="font-size:0.55rem;color:${c}">${d > 0 ? '+' : ''}${d.toFixed(1)}</span>`;
      }

      el.innerHTML += `<tr style="border-top:2px solid var(--accent)">
        <td><strong>Tot.</strong></td>
        <td style="color:${COLORS.lemoigne};font-weight:700">${agg.lemoigne}</td>
        <td style="color:${COLORS.dasilva};font-weight:700">${agg.dasilva}</td>
        <td style="color:${COLORS.grelet};font-weight:700">${agg.grelet}</td>
        <td><span style="font-weight:800">${agg.pctLemoigne.toFixed(1)}%</span> ${miniDelta(dTotL)}</td>
        <td>${agg.pctDasilva.toFixed(1)}% ${miniDelta(dTotD)}</td>
        <td>${agg.pctGrelet.toFixed(1)}% ${miniDelta(dTotG)}</td>
        <td>-</td>
      </tr>`;
    }
  }

  // === SAISIE RAPIDE ===
  function selectBV(bv) {
    const form = document.getElementById('soiree-form');
    const t1 = T1[bv];
    const data = loadT2();
    const existing = data.resultats[bv];

    // Hide feedback from previous save
    const feedback = document.getElementById('soiree-bv-feedback');
    if (feedback) feedback.style.display = 'none';

    document.getElementById('soiree-bv-title').textContent = `Bureau n\u00B0${parseInt(bv)}`;
    document.getElementById('soiree-bv-num').value = bv;
    document.getElementById('s-inscrits').textContent = t1.inscrits;

    const t1Expr = t1.lemoigne + t1.grelet + t1.dasilva;
    document.getElementById('s-t1-info').innerHTML =
      `T1: <span style="color:${COLORS.lemoigne}">Lem ${t1.lemoigne} (${(t1.lemoigne/t1Expr*100).toFixed(1)}%)</span> \u00b7 ` +
      `<span style="color:${COLORS.dasilva}">DaS ${t1.dasilva} (${(t1.dasilva/t1Expr*100).toFixed(1)}%)</span> \u00b7 ` +
      `<span style="color:${COLORS.grelet}">Gre ${t1.grelet} (${(t1.grelet/t1Expr*100).toFixed(1)}%)</span>` +
      ` (${t1.votants} vot.)`;

    document.getElementById('s-votants').value = existing ? existing.votants : '';
    document.getElementById('s-blancs').value = existing ? (existing.blancs || 0) : '';
    document.getElementById('s-nuls').value = existing ? (existing.nuls || 0) : '';
    document.getElementById('s-lemoigne').value = existing ? existing.lemoigne : '';
    document.getElementById('s-dasilva').value = existing ? (existing.dasilva || 0) : '';
    document.getElementById('s-grelet').value = existing ? existing.grelet : '';

    form.style.display = 'block';
    updateSaisieCheck();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('s-votants').focus(), 300);
  }

  function updateSaisieCheck() {
    const votants = parseInt(document.getElementById('s-votants').value) || 0;
    const blancs = parseInt(document.getElementById('s-blancs').value) || 0;
    const nuls = parseInt(document.getElementById('s-nuls').value) || 0;
    const lemoigne = parseInt(document.getElementById('s-lemoigne').value) || 0;
    const dasilva = parseInt(document.getElementById('s-dasilva').value) || 0;
    const grelet = parseInt(document.getElementById('s-grelet').value) || 0;

    const exprimes = votants - blancs - nuls;
    const totalVoix = lemoigne + dasilva + grelet;
    const check = document.getElementById('s-check');

    if (votants === 0) { check.textContent = ''; return; }

    if (totalVoix === exprimes) {
      check.innerHTML = `<span style="color:var(--success)">\u2713 OK \u2014 ${exprimes} exprimes</span>`;
    } else {
      check.innerHTML = `<span style="color:var(--danger)">\u26A0 Total voix (${totalVoix}) \u2260 exprimes (${exprimes})</span>`;
    }
  }

  function saveBV() {
    const bv = document.getElementById('soiree-bv-num').value;
    const votants = parseInt(document.getElementById('s-votants').value);
    const blancs = parseInt(document.getElementById('s-blancs').value) || 0;
    const nuls = parseInt(document.getElementById('s-nuls').value) || 0;
    const lemoigne = parseInt(document.getElementById('s-lemoigne').value);
    const dasilva = parseInt(document.getElementById('s-dasilva').value) || 0;
    const grelet = parseInt(document.getElementById('s-grelet').value);

    if (!votants || isNaN(lemoigne) || isNaN(grelet)) {
      alert('Remplissez au minimum : votants, Lemoigne, Grelet');
      return;
    }

    const exprimes = votants - blancs - nuls;
    const totalVoix = lemoigne + dasilva + grelet;
    if (totalVoix !== exprimes) {
      if (!confirm(`Total voix (${totalVoix}) \u2260 exprimes (${exprimes}).\nEnregistrer quand meme ?`)) {
        return;
      }
    }

    const data = loadT2();
    data.resultats[bv] = { votants, blancs, nuls, lemoigne, dasilva, grelet };
    saveT2(data);

    // Show feedback for this BV then render
    showBureauFeedback(bv);
    render();
  }

  // === BUREAU FEEDBACK — shown after saving a BV ===
  function showBureauFeedback(bv) {
    const feedbackEl = document.getElementById('soiree-bv-feedback');
    if (!feedbackEl) return;

    const data = loadT2();
    const r = data.resultats[bv];
    const t1 = T1[bv];
    if (!r) { feedbackEl.style.display = 'none'; return; }

    const exprT1 = t1.lemoigne + t1.dasilva + t1.grelet;
    const exprT2 = r.votants - (r.blancs || 0) - (r.nuls || 0);

    const pT1L = (t1.lemoigne / exprT1 * 100);
    const pT1D = (t1.dasilva / exprT1 * 100);
    const pT1G = (t1.grelet / exprT1 * 100);
    const pT2L = exprT2 > 0 ? (r.lemoigne / exprT2 * 100) : 0;
    const pT2D = exprT2 > 0 ? ((r.dasilva || 0) / exprT2 * 100) : 0;
    const pT2G = exprT2 > 0 ? (r.grelet / exprT2 * 100) : 0;

    const dL = pT2L - pT1L;
    const dD = pT2D - pT1D;
    const dG = pT2G - pT1G;

    const partT1 = (t1.votants / t1.inscrits * 100);
    const partT2 = (r.votants / t1.inscrits * 100);
    const dPart = partT2 - partT1;

    // Signal text
    let signal = '';
    if (dD < -3 && dL > 2 && dG > 2) {
      signal = 'Reports Da Silva \u2192 les deux candidats';
    } else if (dD < -3 && dL > dG + 2) {
      signal = 'Reports Da Silva \u2192 Lemoigne';
    } else if (dD < -3 && dG > dL + 2) {
      signal = 'Reports Da Silva \u2192 Grelet';
    } else if (dD < -3) {
      signal = 'Da Silva en recul, reports partages';
    } else if (Math.abs(dD) <= 3) {
      signal = 'Peu de variation vs T1';
    } else {
      signal = 'Da Silva en hausse sur ce BV';
    }

    function delta(d) {
      const c = d >= 0 ? '#4CAF50' : '#EF5350';
      return `<span style="color:${c};font-weight:600">${d >= 0 ? '+' : ''}${d.toFixed(1)}</span>`;
    }

    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = `
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;margin-top:12px;font-size:0.8rem">
        <div style="font-weight:600;margin-bottom:8px">BV ${parseInt(bv)} \u2014 Comparaison T1 \u2192 T2</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="color:var(--text-muted);font-size:0.7rem">Participation</span>
          <span>${partT1.toFixed(1)}% \u2192 <strong>${partT2.toFixed(1)}%</strong> ${delta(dPart)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="color:${COLORS.lemoigne}">Lemoigne</span>
          <span>${pT1L.toFixed(1)}% \u2192 <strong>${pT2L.toFixed(1)}%</strong> ${delta(dL)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="color:${COLORS.dasilva}">Da Silva</span>
          <span>${pT1D.toFixed(1)}% \u2192 <strong>${pT2D.toFixed(1)}%</strong> ${delta(dD)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="color:${COLORS.grelet}">Grelet</span>
          <span>${pT1G.toFixed(1)}% \u2192 <strong>${pT2G.toFixed(1)}%</strong> ${delta(dG)}</span>
        </div>
        <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:0.75rem;font-style:italic;color:var(--text-muted)">${signal}</div>
      </div>`;
  }

  function deleteBV() {
    const bv = document.getElementById('soiree-bv-num').value;
    if (!confirm(`Effacer le bureau ${parseInt(bv)} ?`)) return;
    const data = loadT2();
    delete data.resultats[bv];
    saveT2(data);
    document.getElementById('soiree-form').style.display = 'none';
    const feedback = document.getElementById('soiree-bv-feedback');
    if (feedback) feedback.style.display = 'none';
    render();
  }

  // === PUBLISH BUTTON ===
  function renderPublishButton(proj, agg) {
    let btn = document.getElementById('soiree-publish-btn');
    if (proj.method !== 'definitif') {
      if (btn) btn.style.display = 'none';
      return;
    }
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'soiree-publish-btn';
      btn.innerHTML = `
        <button class="btn-publish-final" onclick="Soiree.showFinal()">
          <span style="font-size:1.5rem">\u{1F3C6}</span>
          <span>PUBLIER LE RESULTAT FINAL</span>
          <span style="font-size:0.75rem;opacity:0.8">17/17 bureaux \u2014 Appuyez pour partager</span>
        </button>`;
      const alert = document.getElementById('soiree-alert');
      alert.parentNode.insertBefore(btn, alert.nextSibling);
    }
    btn.style.display = 'block';
  }

  // === FINAL OVERLAY ===
  function showFinalOverlay(projArg, aggArg) {
    const data = loadT2();
    const proj = projArg || getProjection();
    const agg = aggArg || getAggregate();

    if (proj.method !== 'definitif') return;

    const candidates = [
      { name: 'Lemoigne', pct: agg.pctLemoigne, voix: agg.lemoigne, color: COLORS.lemoigne },
      { name: 'Da Silva', pct: agg.pctDasilva, voix: agg.dasilva, color: COLORS.dasilva },
      { name: 'Grelet-Certenais', pct: agg.pctGrelet, voix: agg.grelet, color: COLORS.grelet }
    ].sort((a, b) => b.pct - a.pct);

    const winner = candidates[0];
    const isLemoigneWinner = winner.name === 'Lemoigne';

    const existing = document.getElementById('final-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'final-overlay';
    overlay.innerHTML = `
      <div class="final-backdrop" onclick="Soiree.closeFinal()"></div>
      <div class="final-content">
        ${isLemoigneWinner ? '<div class="confetti-container" id="confetti-box"></div>' : ''}
        <div class="final-header">
          <button class="final-close" onclick="Soiree.closeFinal()">&times;</button>
        </div>
        <div class="final-body">
          <div class="final-icon">${isLemoigneWinner ? '\u{1F3C6}' : '\u{1F4CA}'}</div>
          <div class="final-title">${isLemoigneWinner ? 'VICTOIRE !' : 'RESULTAT DEFINITIF'}</div>
          <div class="final-subtitle">Municipales La Fleche 2026 \u2014 2nd tour</div>

          <div class="final-results">
            ${candidates.map((c, i) => `
              <div class="final-candidate ${i === 0 ? 'final-winner' : ''}">
                <div class="final-rank">${i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : '\u{1F949}'}</div>
                <div class="final-name" style="color:${c.color}">${c.name}</div>
                <div class="final-pct" style="color:${c.color}">${c.pct.toFixed(2)}%</div>
                <div class="final-voix">${c.voix.toLocaleString('fr-FR')} voix</div>
                <div class="final-bar-track">
                  <div class="final-bar-fill" style="width:${c.pct}%;background:${c.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="final-stats">
            <span>Participation : ${agg.participation.toFixed(1)}%</span>
            <span>Exprimes : ${agg.exprimes.toLocaleString('fr-FR')}</span>
          </div>

          <div class="final-actions">
            <button class="btn-final-share" onclick="Soiree.shareFinal()">
              \u{1F4E4} PARTAGER LE RESULTAT
            </button>
            <button class="btn-final-close" onclick="Soiree.closeFinal()">
              Fermer
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
      if (isLemoigneWinner) launchConfetti();
    });

    if (navigator.vibrate) {
      navigator.vibrate(isLemoigneWinner ? [100, 50, 100, 50, 200] : [200]);
    }
  }

  function closeFinalOverlay() {
    const overlay = document.getElementById('final-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 400);
    }
  }

  function shareFinal() {
    closeFinalOverlay();
    setTimeout(() => Share.capture('soiree-alert', 'resultat-final'), 300);
  }

  function launchConfetti() {
    const box = document.getElementById('confetti-box');
    if (!box) return;
    const colors = ['#FFD700', '#5C6BC0', '#4FC3F7', '#66BB6A', '#FF9800', '#E91E63', '#fff'];
    for (let i = 0; i < 80; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti-dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.background = colors[Math.floor(Math.random() * colors.length)];
      dot.style.animationDelay = (Math.random() * 2) + 's';
      dot.style.animationDuration = (2 + Math.random() * 3) + 's';
      if (Math.random() > 0.5) {
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.borderRadius = '50%';
      } else {
        dot.style.width = '6px';
        dot.style.height = '12px';
        dot.style.borderRadius = '2px';
      }
      box.appendChild(dot);
    }
  }

  // === INIT ===
  function init() {
    ['s-votants', 's-blancs', 's-nuls', 's-lemoigne', 's-dasilva', 's-grelet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateSaisieCheck);
    });

    document.getElementById('soiree-save-btn').addEventListener('click', saveBV);
    document.getElementById('soiree-delete-btn').addEventListener('click', deleteBV);

    document.getElementById('soiree-reset-btn').addEventListener('click', () => {
      if (confirm('Reinitialiser TOUTES les donnees T2 ?')) {
        resetT2();
        document.getElementById('soiree-form').style.display = 'none';
        const feedback = document.getElementById('soiree-bv-feedback');
        if (feedback) feedback.style.display = 'none';
        render();
      }
    });
  }

  return {
    render, init, selectBV, saveBV, deleteBV,
    showFinal: () => showFinalOverlay(),
    closeFinal: closeFinalOverlay,
    shareFinal
  };
})();
