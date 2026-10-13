# IT Knowledge Base — Documentation informatique

Site public : https://petrus-canisius.github.io/tutos-informatique/

La base de connaissances est publiée avec Zensical, GitHub Pages et GitHub Actions.

## Fonctionnement

Les procédures sont dans `docs/`. La navigation et l'identité générale sont dans `zensical.toml`. La page d'accueil se trouve dans `docs/index.md`.

Le design est dans `docs/stylesheets/extra.css`. La recherche d'accueil utilise `docs/javascripts/site.js`. Le favicon est dans `docs/images/favicon.svg`.

## Ajouter une procédure

1. Créer un fichier Markdown dans la catégorie concernée.
2. Suivre `docs/modeles/modele-procedure.md`.
3. Ajouter son chemin à la liste `nav` du fichier `zensical.toml`.
4. Enregistrer les modifications sur `main`.
5. Contrôler le résultat dans GitHub Actions.

Voir également le guide de contribution sur le site.

## Sécurité

Le dépôt est public. Ne jamais y publier des secrets, clés privées, identifiants, informations personnelles ou captures confidentielles. Les tutoriels d'exemple nécessitent une validation en situation réelle.

## Mémoire de fin d'études

Le mémoire est consultable à l'adresse `/memoire/` au moyen de 47 images WebP filigranées dans `docs/memoire/pages/`. La liseuse se trouve dans `docs/memoire/index.md`, avec les scripts et styles `docs/javascripts/memoire.js` et `docs/stylesheets/memoire.css`.

**Le PDF original n'est pas stocké dans ce dépôt.** Les images publiques peuvent toutefois être enregistrées ou capturées : un site statique ne peut garantir l'absence de copies.
