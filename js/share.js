/* share.js — Capture d'ecran + partage WhatsApp */
const Share = (() => {

  async function capture(elementId, section) {
    const el = document.getElementById(elementId);
    if (!el) {
      alert('Element introuvable : ' + elementId);
      return;
    }

    // Find the share button inside to show loading state
    const btn = el.querySelector('.btn-share');
    const origText = btn ? btn.textContent : '';

    try {
      if (btn) {
        btn.textContent = 'Capture...';
        btn.disabled = true;
      }

      // html2canvas options — adapt scale to element size to avoid too-large canvases
      const rect = el.getBoundingClientRect();
      const maxDim = Math.max(rect.width, rect.height);
      const scale = maxDim > 800 ? 1.5 : 2; // reduce scale for large sections

      const canvas = await html2canvas(el, {
        backgroundColor: '#1B2A4A',
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Scroll to element to ensure it's rendered
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        alert('Erreur : la capture est vide. Essayez une capture d\'ecran manuelle.');
        return;
      }

      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob || blob.size < 1000) {
        alert('Erreur : image capturee trop petite ou vide. Essayez une capture d\'ecran manuelle.');
        return;
      }

      const filename = `elections-lafleche-${section || 'resultats'}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      const shareText = getShareText(section);

      // Try Web Share API with files
      let shared = false;
      if (navigator.share && navigator.canShare) {
        const shareDataWithFile = {
          title: 'Elections La Fleche 2026',
          text: shareText,
          files: [file]
        };

        try {
          if (navigator.canShare(shareDataWithFile)) {
            await navigator.share(shareDataWithFile);
            shared = true;
          }
        } catch (e) {
          if (e.name === 'AbortError') return; // User cancelled
          console.warn('Share with file failed:', e.message);
          // Fall through to download
        }
      }

      if (!shared) {
        // Fallback: download the image
        downloadBlob(blob, filename);

        // Also try to share just the text via Web Share (without file)
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Elections La Fleche 2026',
              text: shareText
            });
          } catch (e) {
            // Ignore
          }
        }
      }

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur lors de la capture : ' + err.message);
    } finally {
      // Always restore button state
      if (btn) {
        btn.textContent = origText;
        btn.disabled = false;
      }
    }
  }

  function getShareText(section) {
    const agg = typeof Store !== 'undefined' ? Store.getAggregate() : { filled: 0, total: 17 };
    const progress = agg.filled > 0 ? ` (${agg.filled}/${agg.total} bureaux)` : '';

    const texts = {
      'dashboard': `Resultats partiels${progress} — Municipales La Fleche 2026`,
      'resultats-barres': `Resultats${progress} — Municipales La Fleche 2026`,
      'resultats-camembert': `Repartition des voix${progress} — Municipales La Fleche 2026`,
      'resultats-detail': `Detail par bureau${progress} — Municipales La Fleche 2026`,
      'sieges': `Repartition des sieges${progress} — Municipales La Fleche 2026`,
      'projections': `Projection des resultats — Municipales La Fleche 2026`,
      'probabilites': `Probabilites de victoire — Municipales La Fleche 2026`,
      'analyse-scenarios': `Comparaison des scenarios — Municipales La Fleche 2026`,
      'analyse-swing': `Bureaux strategiques — Municipales La Fleche 2026`,
      'analyse-demographics': `Profils demographiques — Municipales La Fleche 2026`
    };
    return texts[section] || 'Municipales La Fleche 2026';
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
