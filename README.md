# IT Knowledge Base — Documentation informatique

Site public : https://petrus-canisius.github.io/tutos-informatique/

La base de connaissances est publiée avec Zensical, GitHub Pages et GitHub Actions.

Les procédures sont organisées par catégories, dont [FOG Project](https://petrus-canisius.github.io/tutos-informatique/deploiement/fog-installation/) et [Réparer Brave après un renommage d’Ubuntu](https://petrus-canisius.github.io/tutos-informatique/linux/brave-profil-verrouille/). Le mémoire et le modèle de rédaction sont conservés.

## Fonctionnement

Les procédures sont dans `docs/`. La navigation et l'identité générale sont dans `zensical.toml`. La page d'accueil se trouve dans `docs/index.md`.

Le design est dans `docs/stylesheets/extra.css`. La recherche d'accueil utilise `docs/javascripts/site.js`. Le favicon est dans `docs/images/favicon.svg`.

Le bandeau « Dernière procédure publiée » figure en haut de l'accueil. À chaque déploiement, `tools/latest_procedure.py` parcourt les procédures Markdown présentes dans la navigation `zensical.toml`, identifie la plus récemment ajoutée grâce à l'historique Git, puis génère `docs/data/latest-procedure.json`. `docs/javascripts/latest-procedure.js` actualise automatiquement le titre, la description, la date et le lien. Les pages d'index, le mémoire, le modèle et les pages de gestion du site sont exclus. Le tutoriel FOG sert de repli statique si le catalogue est temporairement indisponible.

## Ajouter une procédure

1. Créer un fichier Markdown dans la catégorie concernée.
2. Suivre `docs/modeles/modele-procedure.md`.
3. Ajouter le tutoriel à la liste `nav` de `zensical.toml` sous sa catégorie et à la liste « Procédures disponibles » de `docs/<categorie>/index.md`.
4. Enregistrer les modifications sur `main`.
5. Contrôler le résultat dans GitHub Actions.

Les catégories sans procédure sont des pages d’attente. Le bandeau de l’accueil identifie automatiquement les tutoriels référencés dans la navigation, et exclut les pages d’index.

Le guide de contribution interne est conservé dans `docs/contribuer/index.md`, mais n'est pas affiché sur l'accueil ou dans le menu.

## Sécurité

Le dépôt est public. Ne jamais y publier des secrets, clés privées, identifiants, informations personnelles ou captures confidentielles. Les tutoriels d'exemple nécessitent une validation en situation réelle.

## Mémoire de fin d'études

Le mémoire est consultable à l'adresse `/memoire/` au moyen de 47 images WebP filigranées dans `docs/memoire/pages/`. La liseuse se trouve dans `docs/memoire/index.md`, avec les scripts et styles `docs/javascripts/memoire.js` et `docs/stylesheets/memoire.css`.

**Le PDF original n'est pas stocké dans ce dépôt.** Les images publiques peuvent toutefois être enregistrées ou capturées : un site statique ne peut garantir l'absence de copies.

## Déploiement et gestion de parc

La documentation FOG Project se trouve dans `docs/deploiement/fog-installation.md`, avec une page de rubrique et deux schémas SVG originaux. Les sept captures réalisées pour le tutoriel d'origine sont intégrées localement avec l'autorisation déclarée du titulaire des droits. Les fichiers PXE doivent être adaptés à la version FOG réellement utilisée.
