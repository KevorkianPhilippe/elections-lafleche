/* sieges.js — Calcul repartition des sieges municipales */
const Sieges = (() => {

  /**
   * Calcul de la repartition des sieges
   * Scrutin de liste proportionnel avec prime majoritaire
   *
   * @param {number[]} voix - Voix par liste
   * @param {number} totalSieges - Nombre total de sieges (33)
   * @param {number} primeMaj - Sieges de la prime majoritaire (17)
   * @returns {object} { sieges: number[], detail: string, secondTour: boolean, qualifiees: number[] }
   */
  function calculer(voix, totalSieges, primeMaj) {
    totalSieges = totalSieges || 33;
    primeMaj = primeMaj || 17;
    const nbListes = voix.length;
    const sieges = new Array(nbListes).fill(0);
    const totalExprimes = voix.reduce((s, v) => s + v, 0);

    if (totalExprimes === 0) {
      return { sieges, detail: 'Aucun vote exprime.', secondTour: false, qualifiees: [] };
    }

    // Pourcentages
    const pcts = voix.map(v => (v / totalExprimes) * 100);

    // Trouver la liste en tete
    const maxVoix = Math.max(...voix);
    const gagnant = voix.indexOf(maxVoix);

    // Listes >= 5% (participent a la repartition proportionnelle)
    const listesQualifiees5 = [];
    pcts.forEach((p, i) => { if (p >= 5) listesQualifiees5.push(i); });

    // Verifier si une liste a la majorite absolue (>50%)
    const majoritaireAbsolue = pcts[gagnant] > 50;
    let detail = '';

    if (!majoritaireAbsolue) {
      // Pas de majorite absolue au 1er tour
      // Listes qualifiees pour le 2nd tour : >= 10% des inscrits
      // Ici on simplifie : on calcule quand meme comme si c'etait le resultat final
      // pour donner une projection
      const qualifiees10 = [];
      pcts.forEach((p, i) => { if (p >= 10) qualifiees10.push(i); });

      detail = 'Aucune liste n\'a la majorite absolue (>50%).\n';
      detail += 'En situation reelle, un 2nd tour serait necessaire.\n\n';
      detail += 'Projection (si ces resultats etaient definitifs) :\n';

      // On applique quand meme la prime au gagnant relatif pour la projection
      sieges[gagnant] = primeMaj;
      detail += `Prime majoritaire : ${primeMaj} sieges a ${getListeNom(gagnant)}\n`;

      // Proportionnelle sur les sieges restants
      const siegesRestants = totalSieges - primeMaj;
      detail += repartirProportionnel(voix, listesQualifiees5, siegesRestants, sieges, detail);

      return {
        sieges, detail,
        secondTour: true,
        qualifiees: qualifiees10
      };
    }

    // Majorite absolue : prime au gagnant
    sieges[gagnant] = primeMaj;
    detail += `Majorite absolue : ${pcts[gagnant].toFixed(1)}%\n`;
    detail += `Prime majoritaire : ${primeMaj} sieges a ${getListeNom(gagnant)}\n\n`;

    // Repartition proportionnelle des sieges restants
    const siegesRestants = totalSieges - primeMaj;
    detail += repartirProportionnel(voix, listesQualifiees5, siegesRestants, sieges, '');

    return { sieges, detail, secondTour: false, qualifiees: [] };
  }

  function repartirProportionnel(voix, qualifiees, nbSieges, sieges, prefix) {
    let detail = prefix;
    if (qualifiees.length === 0) return detail + 'Aucune liste qualifiee (>=5%).\n';

    const voixQualifiees = qualifiees.map(i => voix[i]);
    const totalVoixQ = voixQualifiees.reduce((s, v) => s + v, 0);

    if (totalVoixQ === 0) return detail + 'Aucune voix qualifiee.\n';

    // Quotient electoral
    const quotient = totalVoixQ / nbSieges;
    detail += `\nRepartition proportionnelle (${nbSieges} sieges) :\n`;
    detail += `Quotient electoral : ${quotient.toFixed(1)}\n\n`;

    // Attribution au quotient
    const siegesQuotient = {};
    let siegesAttribues = 0;
    qualifiees.forEach(i => {
      const s = Math.floor(voix[i] / quotient);
      siegesQuotient[i] = s;
      sieges[i] += s;
      siegesAttribues += s;
      detail += `${getListeNom(i)} : ${voix[i]} voix / ${quotient.toFixed(1)} = ${s} sieges\n`;
    });

    // Sieges restants a la plus forte moyenne
    let restants = nbSieges - siegesAttribues;
    if (restants > 0) {
      detail += `\nSieges restants (plus forte moyenne) : ${restants}\n`;
      while (restants > 0) {
        let bestIdx = -1, bestMoy = -1;
        qualifiees.forEach(i => {
          // Nombre de sieges proportionnels uniquement (hors prime)
          const siegesProp = siegesQuotient[i] || 0;
          const extraFromPFM = sieges[i] - (siegesQuotient[i] || 0) -
            (i === getGagnantIndex(voix) ? (Store.getConfig().primeMajoritaire || 17) : 0);
          const totalPropSieges = siegesProp + Math.max(0, extraFromPFM);
          const moy = voix[i] / (totalPropSieges + 1);
          if (moy > bestMoy) { bestMoy = moy; bestIdx = i; }
        });
        if (bestIdx >= 0) {
          sieges[bestIdx]++;
          siegesQuotient[bestIdx] = (siegesQuotient[bestIdx] || 0) + 1;
          detail += `  -> ${getListeNom(bestIdx)} (moyenne: ${bestMoy.toFixed(1)})\n`;
        }
        restants--;
      }
    }

    detail += '\nTotal :\n';
    sieges.forEach((s, i) => {
      if (s > 0) detail += `  ${getListeNom(i)} : ${s} sieges\n`;
    });

    return detail;
  }

  function getListeNom(idx) {
    const config = Store.getConfig();
    return config.listes[idx] ? config.listes[idx].nom : `Liste ${idx + 1}`;
  }

  function getGagnantIndex(voix) {
    const maxV = Math.max(...voix);
    return voix.indexOf(maxV);
  }

  return { calculer };
})();
