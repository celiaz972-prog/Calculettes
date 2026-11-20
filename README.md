# Gestion Chantiers — App Web (PWA)

App de métré chantier, installable sur iPhone sans App Store, sans compte Apple Developer, sans dépendance à un PC allumé.

## Déploiement via GitHub Pages

1. Crée un repo GitHub (ex: `chantier-web`), pousse tout ce dossier dedans :
   ```
   git init
   git add .
   git commit -m "Initial"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/chantier-web.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings → Pages → Source → Deploy from branch → main / (root)** → Save.
3. Après ~1 min, l'app est en ligne sur `https://<ton-compte>.github.io/chantier-web/`.

## Installer sur iPhone

1. Ouvre le lien GitHub Pages dans **Safari** (obligatoire — pas Chrome).
2. Bouton **Partager** (carré + flèche) → **Sur l'écran d'accueil**.
3. Icône apparaît comme une vraie app. Fonctionne hors ligne après premier chargement (service worker en cache tout).

## Données

Stockées en local sur l'appareil (`localStorage`). Pas de serveur, pas de synchronisation entre appareils. Si tu veux changer de téléphone, il faudra exporter/réimporter (pas encore prévu — dis-le si besoin).

## Mettre à jour l'app

Modifie les fichiers, repousse sur GitHub (`git add . && git commit -m "maj" && git push`). GitHub Pages republie automatiquement en ~1 min. Sur iPhone, rouvre l'app (le service worker recharge la nouvelle version en arrière-plan, parfois il faut fermer/rouvrir une fois pour voir le changement).

## Structure

- `index.html` — structure + styles
- `app.js` — logique UI, routage (chantiers → détail → formulaire métré → résultat)
- `metreCalc.js` — moteur de calcul (mêmes formules que le classeur Excel)
- `store.js` — persistance locale (localStorage)
- `manifest.json` + `sw.js` — rendent l'app installable et utilisable hors ligne
- `icons/` — icônes app (placeholder, à remplacer si besoin)
