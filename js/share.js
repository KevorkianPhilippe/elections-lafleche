/* share.js — Capture d'ecran + partage
 *
 * Strategie: afficher l'image dans un overlay.
 * L'utilisateur fait un APPUI LONG sur l'image → menu Android natif
 * → "Partager l'image" → WhatsApp. Fonctionne sur tous les telephones.
 */
const Share = (() => {

  let overlay = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'share-overlay';
    overlay.innerHTML = `
      <div class="share-overlay-backdrop"></div>
      <div class="share-overlay-content">
        <div class="share-overlay-header">
          <span>Capture prete !</span>
          <button class="share-overlay-close" id="share-close">&times;</button>
        </div>
        <div class="share-overlay-instruction" id="share-instruction">
          Appuyez longuement sur l'image ci-dessous<br>
          puis selectionnez <strong>Partager l'image</strong>
        </div>
        <div class="share-overlay-img-wrap">
          <img id="share-preview-img" alt="Capture elections">
        </div>
        <div class="share-overlay-actions">
          <button class="share-overlay-btn share-btn-primary" id="share-btn-save">
            Sauvegarder l'image
          </button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #share-overlay { display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:10000; }
      #share-overlay.active { display:flex; align-items:center; justify-content:center; }
      .share-overlay-backdrop { position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); }
      .share-overlay-content { position:relative; background:#1B2A4A; border-radius:12px; width:94vw; max-width:500px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
      .share-overlay-header { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; border-bottom:1px solid #2D4268; color:#fff; font-size:16px; font-weight:600; }
      .share-overlay-close { background:none; border:none; color:#B0BEC5; font-size:28px; cursor:pointer; padding:0 4px; line-height:1; }
      .share-overlay-instruction { padding:10px 16px; text-align:center; color:#4FC3F7; font-size:14px; line-height:1.4; background:#0D1B2A; }
      .share-overlay-instruction strong { color:#25D366; }
      .share-overlay-img-wrap { flex:1; overflow:auto; padding:8px; display:flex; justify-content:center; align-items:flex-start; background:#0D1B2A; min-height:100px; }
      .share-overlay-img-wrap img { max-width:100%; height:auto; border-radius:4px; -webkit-touch-callout:default !important; }
      .share-overlay-actions { display:flex; gap:10px; padding:10px 16px; }
      .share-overlay-btn { flex:1; padding:12px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; text-align:center; }
      .share-btn-primary { background:#4FC3F7; color:#1B2A4A; }
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

  function showOverlay(dataUrl, blob, filename) {
    createOverlay();

    // Set image — use data URL (pas de blob URL qui inclut l'adresse du site)
    const img = document.getElementById('share-preview-img');
    img.src = dataUrl;

    // Setup save button
    const saveBtn = document.getElementById('share-btn-save');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', () => {
      // Open image in new tab — user can save from there
      const w = window.open();
      if (w) {
        w.document.write(`
          <html><head><title>Elections La Fleche</title>
          <meta name="viewport" content="width=device-width">
          <style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;}
          img{max-width:100%;height:auto;}</style></head>
          <body><img src="${dataUrl}"></body></html>
        `);
        w.document.close();
      } else {
        // Popup blocked — try download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
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
      showOverlay(dataUrl, blob, filename);

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur capture : ' + err.message);
    } finally {
      if (btn) btn.style.display = '';
    }
  }

  return { capture };
})();
