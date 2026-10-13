# IT Knowledge Base — Documentation informatique

Site public : https://petrus-canisius.github.io/tutos-informatique/

La base de connaissances est publiée avec Zensical, GitHub Pages et GitHub Actions.

## Fonctionnement

Les procédures sont dans `docs/`. La navigation et l'identité générale sont dans `zensical.toml`. La page d'accueil se trouve dans `docs/index.md`.

Le design est dans `docs/stylesheets/extra.css`. La recherche d'accueil utilise `docs/javascripts/site.js`. Le favicon est dans `docs/images/favicon.svg`. Les alertes, le suivi de progression et les filtres sont dans `docs/javascripts/features.js`, les diagnostics et schémas dans `docs/javascripts/tools.js`.

## Ajouter une procédure

1. Créer un fichier Markdown dans la catégorie concernée.
2. Suivre `docs/modeles/modele-procedure.md`.
3. Ajouter son chemin à la liste `nav` du fichier `zensical.toml`.
4. Enregistrer les modifications sur `main`.
5. Contrôler le résultat dans GitHub Actions.

Le workflow exécute `python tools/build_catalog.py` avant Zensical. Le catalogue statique est généré depuis les pages Markdown et les dates de Git : il alimente les annonces automatiques sur 14 jours, les cartes de publication et la recherche avancée. Les marques de progression restent sur l'appareil du visiteur (localStorage). La date de vérification réelle ne doit pas être confondue avec la date du dernier commit. L'export PDF repose sur la fonction d'impression du navigateur.

Voir également le guide de contribution sur le site.

## Sécurité

Le dépôt est public. Ne jamais y publier des secrets, clés privées, identifiants, informations personnelles ou captures confidentielles. Les tutoriels d'exemple nécessitent une validation en situation réelle.

## Mémoire de fin d'études

Le mémoire est consultable à l'adresse `/memoire/` au moyen de 47 images WebP filigranées dans `docs/memoire/pages/`. La liseuse se trouve dans `docs/memoire/index.md`, avec les scripts et styles `docs/javascripts/memoire.js` et `docs/stylesheets/memoire.css`.

**Le PDF original n'est pas stocké dans ce dépôt.** Les images publiques peuvent toutefois être enregistrées ou capturées : un site statique ne peut garantir l'absence de copies.

## Déploiement et gestion de parc

La documentation FOG Project se trouve dans `docs/deploiement/fog-installation.md`, avec une page de rubrique et deux schémas SVG originaux. Les sept captures réalisées pour le tutoriel d'origine sont intégrées localement avec l'autorisation déclarée du titulaire des droits. Les fichiers PXE doivent être adaptés à la version FOG réellement utilisée.
