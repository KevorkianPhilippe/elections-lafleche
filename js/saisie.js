/* saisie.js — Ecran de saisie des resultats par bureau de vote */
const Saisie = (() => {
  let selectedBV = null;

  function render() {
    renderBureauGrid();
    if (selectedBV) selectBureau(selectedBV);
  }

  function renderBureauGrid() {
    const config = Store.getConfig();
    const bureaux = Store.getBureaux(config.nbBureaux);
    const resultats = Store.getResultats();
    const grid = document.getElementById('bureau-grid');

    grid.innerHTML = bureaux.map(bv => {
      const filled = resultats[bv] ? 'filled' : '';
      const selected = bv === selectedBV ? 'selected' : '';
      return `<button class="bureau-btn ${filled} ${selected}" data-bv="${bv}">${parseInt(bv)}</button>`;
    }).join('');

    grid.querySelectorAll('.bureau-btn').forEach(btn => {
      btn.addEventListener('click', () => selectBureau(btn.dataset.bv));
    });
  }

  function selectBureau(bv) {
    selectedBV = bv;
    document.querySelectorAll('.bureau-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.querySelector(`.bureau-btn[data-bv="${bv}"]`);
    if (btn) btn.classList.add('selected');

    const container = document.getElementById('saisie-form-container');
    container.style.display = 'block';
    document.getElementById('saisie-bv-num').textContent = parseInt(bv);

    // Rendre les champs de listes
    renderListeFields();

    // Pre-remplir si donnees existantes
    const resultats = Store.getResultats();
    const r = resultats[bv];
    document.getElementById('f-inscrits').value = r ? r.inscrits : '';
    document.getElementById('f-votants').value = r ? r.votants : '';
    document.getElementById('f-blancs').value = r ? r.blancs : '';
    document.getElementById('f-nuls').value = r ? r.nuls : '';

    const config = Store.getConfig();
    config.listes.forEach((liste, i) => {
      const input = document.getElementById(`f-voix-${i}`);
      if (input) input.value = r && r.voix ? r.voix[i] : '';
    });

    updateCalcInfo();
    container.scrollIntoView({ behavior: 'smooth' });
  }

  function renderListeFields() {
    const config = Store.getConfig();
    const container = document.getElementById('saisie-listes-fields');
    container.innerHTML = config.listes.map((liste, i) => `
      <div class="form-group">
        <label for="f-voix-${i}">
          <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${liste.couleur};margin-right:6px;vertical-align:middle"></span>
          ${liste.nom}
        </label>
        <input type="number" id="f-voix-${i}" min="0" inputmode="numeric" required>
      </div>
    `).join('');

    // Ajouter listeners pour calcul en temps reel
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', updateCalcInfo);
    });
  }

  function updateCalcInfo() {
    const votants = parseInt(document.getElementById('f-votants').value) || 0;
    const blancs = parseInt(document.getElementById('f-blancs').value) || 0;
    const nuls = parseInt(document.getElementById('f-nuls').value) || 0;
    const exprimes = votants - blancs - nuls;

    document.getElementById('f-exprimes-info').textContent = `Exprimes : ${exprimes >= 0 ? exprimes : '-'}`;

    const config = Store.getConfig();
    let totalVoix = 0;
    config.listes.forEach((_, i) => {
      totalVoix += parseInt(document.getElementById(`f-voix-${i}`)?.value) || 0;
    });

    const infoEl = document.getElementById('f-total-voix-info');
    infoEl.textContent = `Total voix : ${totalVoix}`;

    const msgEl = document.getElementById('saisie-validation-msg');
    if (votants > 0 && totalVoix > 0) {
      if (totalVoix === exprimes) {
        msgEl.textContent = 'Coherent';
        msgEl.className = 'validation-msg ok';
      } else if (totalVoix > exprimes) {
        msgEl.textContent = `Attention : ${totalVoix - exprimes} voix en trop`;
        msgEl.className = 'validation-msg error';
      } else {
        msgEl.textContent = `Il manque ${exprimes - totalVoix} voix`;
        msgEl.className = 'validation-msg error';
      }
    } else {
      msgEl.textContent = '';
      msgEl.className = 'validation-msg';
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedBV) return;

    const config = Store.getConfig();
    const inscrits = parseInt(document.getElementById('f-inscrits').value) || 0;
    const votants = parseInt(document.getElementById('f-votants').value) || 0;
    const blancs = parseInt(document.getElementById('f-blancs').value) || 0;
    const nuls = parseInt(document.getElementById('f-nuls').value) || 0;

    const voix = config.listes.map((_, i) =>
      parseInt(document.getElementById(`f-voix-${i}`).value) || 0
    );

    Store.setResultat(selectedBV, { inscrits, votants, blancs, nuls, voix });

    // Feedback visuel
    const btn = document.querySelector(`.bureau-btn[data-bv="${selectedBV}"]`);
    if (btn) btn.classList.add('filled');

    // Notification
    showToast(`Bureau ${parseInt(selectedBV)} enregistre`);

    // Passer au bureau suivant non rempli
    const bureaux = Store.getBureaux(config.nbBureaux);
    const resultats = Store.getResultats();
    const nextEmpty = bureaux.find(bv => !resultats[bv] && bv !== selectedBV);
    if (nextEmpty) {
      selectBureau(nextEmpty);
    } else {
      // Tous remplis
      document.getElementById('saisie-form-container').style.display = 'none';
      selectedBV = null;
      renderBureauGrid();
      showToast('Tous les bureaux sont saisis !');
    }
  }

  function handleEffacer() {
    if (!selectedBV) return;
    if (!confirm(`Effacer les donnees du bureau ${parseInt(selectedBV)} ?`)) return;
    Store.deleteResultat(selectedBV);
    selectBureau(selectedBV);
    renderBureauGrid();
    selectBureau(selectedBV);
    showToast(`Bureau ${parseInt(selectedBV)} efface`);
  }

  function showToast(msg) {
    // Simple toast notification
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
        'background:#66BB6A;color:#000;padding:10px 20px;border-radius:8px;font-weight:600;' +
        'font-size:0.9rem;z-index:200;transition:opacity 0.3s;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  function init() {
    document.getElementById('saisie-form').addEventListener('submit', handleSubmit);
    document.getElementById('btn-effacer-bv').addEventListener('click', handleEffacer);

    // Input listeners for live calculation
    ['f-inscrits', 'f-votants', 'f-blancs', 'f-nuls'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateCalcInfo);
    });
  }

  return { render, init };
})();
