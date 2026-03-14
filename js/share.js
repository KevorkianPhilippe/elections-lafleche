/* share.js — Capture d'ecran + partage WhatsApp
 *
 * Strategie: telecharger l'image + ouvrir WhatsApp avec texte pre-rempli.
 * L'utilisateur joint l'image depuis sa galerie.
 * (Web Share API avec fichiers ne fonctionne pas sur tous les Android/WhatsApp)
 */
const Share = (() => {

  let overlay = null;
  let currentSection = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'share-overlay';
    overlay.innerHTML = `
      <div class="share-overlay-backdrop"></div>
      <div class="share-overlay-content">
        <div class="share-overlay-header">
          <span>Apercu de la capture</span>
          <button class="share-overlay-close" id="share-close">&times;</button>
        </div>
        <div class="share-overlay-img-wrap">
          <img id="share-preview-img" alt="Capture">
        </div>
        <div class="share-overlay-actions">
          <button class="share-overlay-btn share-btn-whatsapp" id="share-btn-wa">
            Envoyer sur WhatsApp
          </button>
          <button class="share-overlay-btn share-btn-secondary" id="share-btn-download">
            Telecharger l'image
          </button>
        </div>
        <p class="share-overlay-hint" id="share-hint"></p>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #share-overlay { display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:10000; }
      #share-overlay.active { display:flex; align-items:center; justify-content:center; }
      .share-overlay-backdrop { position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); }
      .share-overlay-content { position:relative; background:#1B2A4A; border-radius:12px; width:92vw; max-width:500px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
      .share-overlay-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #2D4268; color:#fff; font-size:15px; font-weight:600; }
      .share-overlay-close { background:none; border:none; color:#B0BEC5; font-size:28px; cursor:pointer; padding:0 4px; line-height:1; }
      .share-overlay-img-wrap { overflow:auto; padding:8px; display:flex; justify-content:center; background:#0D1B2A; max-height:50vh; }
      .share-overlay-img-wrap img { max-width:100%; height:auto; border-radius:6px; object-fit:contain; }
      .share-overlay-actions { display:flex; flex-direction:column; gap:10px; padding:12px 16px; }
      .share-overlay-btn { padding:14px; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; text-align:center; }
      .share-btn-whatsapp { background:#25D366; color:#fff; }
      .share-btn-secondary { background:#2D4268; color:#B0BEC5; }
      .share-overlay-hint { text-align:center; color:#78909C; font-size:12px; padding:4px 16px 12px; margin:0; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    overlay.querySelector('.share-overlay-backdrop').addEventListener('click', closeOverlay);
    document.getElementById('share-close').addEventListener('click', closeOverlay);

    return overlay;
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove('active');
  }

  function getShareText(section) {
    const agg = typeof Store !== 'undefined' ? Store.getAggregate() : { filled: 0, total: 17 };
    const progress = agg.filled > 0 ? ` (${agg.filled}/${agg.total} bureaux)` : '';
    const texts = {
      'dashboard': `Resultats partiels${progress} - Municipales La Fleche 2026`,
      'resultats-barres': `Resultats${progress} - Municipales La Fleche 2026`,
      'resultats-camembert': `Repartition des voix${progress} - Municipales La Fleche 2026`,
      'resultats-detail': `Detail par bureau${progress} - Municipales La Fleche 2026`,
      'sieges': `Repartition des sieges${progress} - Municipales La Fleche 2026`,
      'projections': `Projection des resultats - Municipales La Fleche 2026`,
      'probabilites': `Probabilites de victoire - Municipales La Fleche 2026`,
      'analyse-scenarios': `Comparaison des scenarios - Municipales La Fleche 2026`,
      'analyse-swing': `Bureaux strategiques - Municipales La Fleche 2026`,
      'analyse-demographics': `Profils demographiques - Municipales La Fleche 2026`
    };
    return texts[section] || 'Municipales La Fleche 2026';
  }

  function showOverlay(dataUrl, blob, filename, section) {
    createOverlay();
    currentSection = section;

    const img = document.getElementById('share-preview-img');
    img.src = dataUrl;

    const waBtn = document.getElementById('share-btn-wa');
    const downloadBtn = document.getElementById('share-btn-download');
    const hint = document.getElementById('share-hint');

    // Clone buttons to remove old event listeners
    const newWaBtn = waBtn.cloneNode(true);
    waBtn.parentNode.replaceChild(newWaBtn, waBtn);
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);

    // Reset hint
    hint.textContent = '';
    hint.style.color = '#78909C';

    // ── DOWNLOAD BUTTON ──
    newDownloadBtn.addEventListener('click', () => {
      downloadBlob(blob, filename);
      hint.textContent = 'Image sauvegardee dans vos telechargements !';
      hint.style.color = '#66BB6A';
    });

    // ── WHATSAPP BUTTON ──
    // Step 1: download image, Step 2: open WhatsApp with text
    newWaBtn.addEventListener('click', () => {
      // Download image first
      downloadBlob(blob, filename);

      // Open WhatsApp with pre-filled text
      const text = getShareText(section) + '\n(voir image jointe)';
      const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);

      // Small delay so download starts first
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 500);

      hint.innerHTML = 'Image telechargee !<br>Joignez-la dans WhatsApp avec le bouton 📎';
      hint.style.color = '#25D366';
    });

    overlay.classList.add('active');
  }

  async function capture(elementId, section) {
    const el = document.getElementById(elementId);
    if (!el) {
      alert('Element introuvable : ' + elementId);
      return;
    }

    const btn = el.querySelector('.btn-share');

    try {
      // Hide button during capture
      if (btn) btn.style.display = 'none';

      const rect = el.getBoundingClientRect();
      const maxDim = Math.max(rect.width, rect.height);
      const scale = maxDim > 800 ? 1.5 : 2;

      const canvas = await html2canvas(el, {
        backgroundColor: '#1B2A4A',
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        alert('Erreur : la capture est vide.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await new Promise(r => canvas.toBlob(b => r(b), 'image/png'));

      if (!blob || blob.size < 500) {
        alert('Erreur : image trop petite');
        return;
      }

      const filename = `elections-lafleche-${section || 'resultats'}.png`;
      showOverlay(dataUrl, blob, filename, section);

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur capture : ' + err.message);
    } finally {
      if (btn) btn.style.display = '';
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  return { capture };
})();
