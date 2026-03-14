/* share.js — Capture d'ecran + partage WhatsApp
 *
 * Bug Android/WhatsApp connu: si on envoie text + files ensemble,
 * WhatsApp affiche le texte et ignore l'image.
 * Solution: partager UNIQUEMENT le fichier (sans text ni title).
 */
const Share = (() => {

  async function capture(elementId, section) {
    const el = document.getElementById(elementId);
    if (!el) {
      alert('Element introuvable : ' + elementId);
      return;
    }

    const btn = el.querySelector('.btn-share');
    const origText = btn ? btn.textContent : '';

    try {
      if (btn) {
        btn.textContent = 'Capture...';
        btn.disabled = true;
      }

      // Adapt scale to element size to avoid too-large canvases on mobile
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

      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob || blob.size < 1000) {
        alert('Erreur : image capturee trop petite.');
        return;
      }

      const filename = `elections-lafleche-${section || 'resultats'}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // ── PARTAGE ──
      // On Android + WhatsApp, envoyer SEULEMENT le fichier (pas de text/title)
      // sinon WhatsApp affiche le texte et ignore l'image
      let shared = false;

      if (navigator.share && navigator.canShare) {
        // Tenter le partage avec UNIQUEMENT le fichier
        const shareData = { files: [file] };

        try {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            shared = true;
          }
        } catch (e) {
          if (e.name === 'AbortError') return;
          console.warn('Share failed:', e.message);
        }
      }

      // Fallback: telecharger l'image
      if (!shared) {
        downloadBlob(blob, filename);
      }

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur lors de la capture : ' + err.message);
    } finally {
      if (btn) {
        btn.textContent = origText;
        btn.disabled = false;
      }
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
