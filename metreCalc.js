// Moteur de calcul métré cloison placoplâtre — mêmes formules que le classeur Excel.

function defaultMetreInput() {
  return {
    nom: "",
    type_cloison: "72/48",
    longueur_m: 0,
    hauteur_m: 0,
    entraxe_m: 0.6,
    nb_faces: 2,
    nb_couches: 1,
    ouvertures: [],
    taux_chute: 0.01,
    vis_par_m2: 8,
    bandes_par_m2: 2,
    enduit_par_m2: 2,
    plaque_largeur_m: 1.2,
    plaque_hauteur_m: 2.55,
    barre_rail_m: 3.0,
    barre_montant_m: 3.0,
  };
}

function roundUp(n) {
  return Math.ceil(n - 1e-9);
}

function calculerMetre(input) {
  const {
    longueur_m, hauteur_m, entraxe_m, nb_faces, nb_couches, ouvertures,
    taux_chute, vis_par_m2, bandes_par_m2, enduit_par_m2,
    plaque_largeur_m, plaque_hauteur_m, barre_rail_m, barre_montant_m,
  } = input;

  const surfaceBrute = longueur_m * hauteur_m;
  const surfaceOuvertures = ouvertures.reduce((s, o) => s + o.largeur_m * o.hauteur_m, 0);
  const surfaceNette = surfaceBrute - surfaceOuvertures;

  const surfacePlaquesTotal = surfaceNette * nb_faces * nb_couches * (1 + taux_chute);
  const surfaceFinition = surfaceNette * nb_faces * (1 + taux_chute);

  const nbMontantsEspacement = entraxe_m > 0 ? roundUp(longueur_m / entraxe_m) + 1 : 0;
  const nbOuverturesJambage = ouvertures.filter((o) => o.type === "porte" || o.type === "fenêtre").length;
  const nbMontantsJambage = nbOuverturesJambage * 2;
  const nbMontantsTotal = nbMontantsEspacement + nbMontantsJambage;

  const railMlNecessaire = 2 * longueur_m;
  const nbBarresRail = barre_rail_m > 0 ? roundUp(railMlNecessaire / barre_rail_m) : 0;

  const nbMontantsParBarre = barre_montant_m > 0 ? Math.max(1, Math.floor(barre_montant_m / hauteur_m)) : 1;
  const nbBarresMontant = roundUp(nbMontantsTotal / nbMontantsParBarre);
  const alerteBarreMontant = barre_montant_m < hauteur_m;

  const linteauMl = ouvertures.reduce((s, o) => s + o.largeur_m, 0);
  const allegeMl = ouvertures.filter((o) => o.type === "fenêtre").reduce((s, o) => s + o.largeur_m, 0);
  const corniereMl =
    ouvertures.filter((o) => o.type === "porte").reduce((s, o) => s + (2 * o.hauteur_m + o.largeur_m), 0) +
    ouvertures.filter((o) => o.type === "fenêtre").reduce((s, o) => s + (2 * o.hauteur_m + 2 * o.largeur_m), 0);

  const plaques = roundUp(surfacePlaquesTotal / (plaque_largeur_m * plaque_hauteur_m));
  const isolationM2 = roundUp(surfaceNette * (1 + taux_chute));
  const vis = roundUp(vis_par_m2 * surfacePlaquesTotal);
  const bandes = roundUp(bandes_par_m2 * surfaceFinition);
  const enduit = roundUp(enduit_par_m2 * surfaceFinition);

  return {
    surfaceBrute, surfaceOuvertures, surfaceNette, surfacePlaquesTotal, surfaceFinition,
    resultats: [
      { materiau: "Plaques BA13 (toutes couches)", unite: "unité", qte: plaques },
      { materiau: "Rail (haut + bas)", unite: "ml", qte: roundUp(railMlNecessaire) },
      { materiau: "Rail — barres à commander", unite: "barre", qte: nbBarresRail },
      { materiau: "Montant vertical", unite: "ml", qte: roundUp(nbMontantsTotal * hauteur_m) },
      { materiau: "Montant — barres à commander", unite: "barre", qte: nbBarresMontant },
      { materiau: "Isolation", unite: "m²", qte: isolationM2 },
      { materiau: "Vis", unite: "pièce", qte: vis },
      { materiau: "Bande à joint", unite: "ml", qte: bandes },
      { materiau: "Enduit de jointoiement", unite: "kg", qte: enduit },
      { materiau: "Linteau haut", unite: "ml", qte: roundUp(linteauMl) },
      { materiau: "Traverse basse / allège (fenêtres)", unite: "ml", qte: roundUp(allegeMl) },
      { materiau: "Cornière de renfort", unite: "ml", qte: roundUp(corniereMl) },
    ],
    alertes: alerteBarreMontant
      ? ["Barre montant plus courte que la hauteur de cloison : jonction/rallonge nécessaire"]
      : [],
  };
}
