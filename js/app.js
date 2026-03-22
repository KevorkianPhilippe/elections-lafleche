/* app.js — Routeur SPA + navigation + init */
const App = (() => {
  const PAGE_TITLES = {
    soiree: 'Soiree T2 — Live',
    dashboard: 'Elections La Fleche',
    saisie: 'Saisie des resultats',
    resultats: 'Resultats',
    sieges: 'Repartition des sieges',
    projections: 'Projections',
    analyse: 'Analyse strategique',
    config: 'Configuration'
  };

  let currentPage = 'dashboard';

  function navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Update nav
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Update title
    document.getElementById('page-title').textContent = PAGE_TITLES[page] || 'Elections';

    currentPage = page;

    // Render page content
    renderPage(page);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function renderPage(page) {
    switch (page) {
      case 'soiree':
        Soiree.render();
        break;
      case 'dashboard':
        Resultats.renderDashboard();
        break;
      case 'saisie':
        Saisie.render();
        break;
      case 'resultats':
        Resultats.render();
        break;
      case 'sieges':
        renderSieges();
        break;
      case 'projections':
        Projections.render();
        break;
      case 'analyse':
        if (typeof Analyse !== 'undefined') {
          // Defer render to next frame to let DOM settle after page transition
          requestAnimationFrame(() => {
            Analyse.render().catch(e => console.warn('Analyse render:', e));
          });
        }
        break;
      case 'config':
        renderConfig();
        break;
    }
  }

  // === SIEGES PAGE ===
  function renderSieges() {
    const config = Store.getConfig();
    const agg = Store.getAggregate();
    const resultDiv = document.getElementById('sieges-result');
    const hemiDiv = document.getElementById('sieges-hemicycle');
    const detailDiv = document.getElementById('sieges-detail');

    if (agg.filled === 0) {
      resultDiv.innerHTML = '<p class="muted">Aucun bureau saisi.</p>';
      hemiDiv.innerHTML = '';
      detailDiv.innerHTML = '';
      return;
    }

    const result = Sieges.calculer(agg.voix, config.totalSieges, config.primeMajoritaire);

    // Siege bars
    resultDiv.innerHTML = config.listes.map((liste, i) => `
      <div class="siege-row">
        <span class="siege-label">${liste.nom}</span>
        <span class="siege-count">${result.sieges[i]}</span>
        <div class="siege-bar" style="background:${liste.couleur};width:${(result.sieges[i] / config.totalSieges) * 100}%"></div>
      </div>
    `).join('');

    // Hemicycle bar
    const totalSiegesAttribues = result.sieges.reduce((s, v) => s + v, 0);
    hemiDiv.innerHTML = '<div class="hemicycle-bar">' +
      config.listes.map((liste, i) => {
        const widthPct = totalSiegesAttribues > 0
          ? (result.sieges[i] / totalSiegesAttribues) * 100 : 0;
        return widthPct > 0
          ? `<div class="hemicycle-segment" style="width:${widthPct}%;background:${liste.couleur}">${result.sieges[i]}</div>`
          : '';
      }).join('') + '</div>';

    // Second tour warning
    if (result.secondTour) {
      resultDiv.innerHTML += `<div style="background:rgba(255,167,38,0.15);padding:12px;border-radius:8px;margin-top:12px">
        <strong style="color:var(--warning)">2nd tour probable</strong>
        <p style="font-size:0.8rem;margin-top:4px">Aucune liste n'a obtenu la majorite absolue (>50%).
        La projection ci-dessus est indicative.</p>
      </div>`;
    }

    // Detail
    detailDiv.innerHTML = `<pre style="font-size:0.75rem;white-space:pre-wrap;color:var(--text-muted)">${result.detail}</pre>`;
  }

  // === CONFIG PAGE ===
  function renderConfig() {
    const config = Store.getConfig();
    const container = document.getElementById('config-listes');

    container.innerHTML = config.listes.map((liste, i) => `
      <div class="config-liste-row" data-idx="${i}">
        <input type="color" value="${liste.couleur}" data-field="couleur" data-idx="${i}">
        <input type="text" value="${liste.nom}" placeholder="Nom de la liste" data-field="nom" data-idx="${i}">
        <button class="config-remove-btn" data-idx="${i}">&times;</button>
      </div>
    `).join('');

    // Listeners
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const field = e.target.dataset.field;
        config.listes[idx][field] = e.target.value;
        // Auto-generate abbreviation
        if (field === 'nom') {
          config.listes[idx].abrev = e.target.value.substring(0, 3).toUpperCase();
        }
        Store.setConfig(config);
      });
    });

    container.querySelectorAll('.config-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (config.listes.length <= 2) {
          alert('Minimum 2 listes');
          return;
        }
        const idx = parseInt(e.target.dataset.idx);
        config.listes.splice(idx, 1);
        Store.setConfig(config);
        renderConfig();
      });
    });

    // Nb bureaux
    document.getElementById('config-nb-bureaux').value = config.nbBureaux;
  }

  function initConfig() {
    // Add list button
    document.getElementById('btn-add-liste').addEventListener('click', () => {
      const config = Store.getConfig();
      const colors = ['#FF9800', '#9C27B0', '#4CAF50', '#FF5722', '#00BCD4'];
      const color = colors[config.listes.length % colors.length];
      config.listes.push({ nom: 'Nouvelle liste', couleur: color, abrev: 'NL' });
      Store.setConfig(config);
      renderConfig();
    });

    // Nb bureaux change
    document.getElementById('config-nb-bureaux').addEventListener('change', (e) => {
      const config = Store.getConfig();
      config.nbBureaux = Math.max(1, Math.min(50, parseInt(e.target.value) || 17));
      Store.setConfig(config);
    });

    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
      const json = Store.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'elections-lafleche-2026.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (Store.importJSON(ev.target.result)) {
          alert('Donnees importees avec succes');
          renderConfig();
          navigate('dashboard');
        } else {
          alert('Fichier invalide');
        }
      };
      reader.readAsText(file);
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Tout reinitialiser ? Les donnees saisies seront perdues.')) {
        Store.reset();
        alert('Reinitialise');
        renderConfig();
        navigate('dashboard');
      }
    });

    // Config button in header
    document.getElementById('btn-config').addEventListener('click', () => {
      navigate('config');
    });
  }

  // === INIT ===
  function init() {
    Store.init();

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.page));
    });

    // Init modules
    Saisie.init();
    Projections.init();
    Soiree.init();
    initConfig();

    // Pre-load BV data in background (for Analyse + MC)
    if (typeof HistoriqueBV !== 'undefined') {
      HistoriqueBV.load().catch(e => console.warn('BV preload:', e));
    }

    // Render soiree T2 by default (election day!)
    navigate('soiree');

    // Register service worker with auto-update + force refresh
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('New version available, reloading...');
        window.location.reload();
      });
      // Force unregister old SW then re-register fresh
      navigator.serviceWorker.getRegistrations().then(regs => {
        const p = regs.map(r => r.unregister());
        return Promise.all(p);
      }).then(() => {
        return caches.keys();
      }).then(keys => {
        return Promise.all(keys.map(k => caches.delete(k)));
      }).then(() => {
        return navigator.serviceWorker.register('./sw.js?v=23');
      }).then(reg => {
        console.log('SW re-registered fresh v23');
        setInterval(() => reg.update(), 300000);
      }).catch(err => console.log('SW error:', err));
    }
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return { navigate };
})();
