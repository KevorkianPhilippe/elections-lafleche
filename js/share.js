/* share.js — Capture d'ecran + partage WhatsApp */
const Share = (() => {

  async function capture(elementId) {
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

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Try Web Share API (works on Android)
        if (navigator.canShare) {
          const file = new File([blob], 'resultats-elections.png', { type: 'image/png' });
          const shareData = {
            title: 'Elections La Fleche 2026',
            text: 'Resultats municipales La Fleche 2026',
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
        downloadBlob(blob, 'resultats-elections.png');
      }, 'image/png');

    } catch (err) {
      console.error('Capture error:', err);
      alert('Erreur lors de la capture. Essayez une capture d\'ecran manuelle.');
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { capture };
})();
