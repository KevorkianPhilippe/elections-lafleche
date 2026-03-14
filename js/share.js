/* share.js — Capture d'ecran + partage WhatsApp */
const Share = (() => {

  async function capture(elementId, section) {
    const el = document.getElementById(elementId) ||
               document.querySelector(`#${elementId}`) ||
               document.querySelector(`.${elementId}`);
    if (!el) {
      alert('Element introuvable');
      return;
    }

    try {
      // Show a loading state
      const btn = el.querySelector('.btn-share');
      const origText = btn ? btn.textContent : '';
      if (btn) btn.textContent = '...';

      const canvas = await html2canvas(el, {
        backgroundColor: '#1B2A4A',
        scale: 2,
        useCORS: true,
        logging: false
      });

      if (btn) btn.textContent = origText;

      // Dynamic filename based on section
      const filename = `elections-lafleche-${section || 'resultats'}.png`;

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Try Web Share API (works on Android)
        if (navigator.canShare) {
          const file = new File([blob], filename, { type: 'image/png' });
          const shareData = {
            title: 'Elections La Fleche 2026',
            text: getShareText(section),
            files: [file]
          };

          try {
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return;
            }
          } catch (e) {
            // User cancelled or not supported, fall through to download
            if (e.name === 'AbortError') return;
          }
        }

        // Fallback: download the image
        downloadBlob(blob, filename);
      }, 'image/png');

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur lors de la capture. Essayez une capture d\'ecran manuelle.');
    }
  }

  function getShareText(section) {
    const agg = Store.getAggregate();
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { capture };
})();
