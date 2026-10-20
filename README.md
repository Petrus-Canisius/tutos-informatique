# IT Knowledge Base — Documentation informatique

**Site public :** https://petrus-canisius.github.io/tutos-informatique/

Documentation personnelle sur l'administration, le déploiement, l'automatisation et la sécurité des systèmes d'information. Le projet utilise **Zensical**, Markdown, Python et GitHub Pages.

## Guides publiés

- [Installer et exploiter FOG Project](https://petrus-canisius.github.io/tutos-informatique/deploiement/fog-installation/) : capture et déploiement réseau de postes.
- [Installer et utiliser yt-dlp sur Windows 11](https://petrus-canisius.github.io/tutos-informatique/windows/yt-dlp/) : PowerShell, FFmpeg, Deno, formats et dépannage.

Le [mémoire sur la sécurisation d'Active Directory](https://petrus-canisius.github.io/tutos-informatique/memoire/) reste consultable dans sa liseuse de 47 pages.

**Transparence :** les deux procédures existantes sont documentées, mais leur exécution complète en laboratoire n'a pas été confirmée pour cette publication. Les statuts affichés dans les pages distinguent vérification documentaire et essai pratique.

## Architecture

- **docs/** : contenus Markdown, images et ressources.
- **docs/index.md** : accueil ; les blocs AUTO sont remplis à la compilation.
- **zensical.toml** : configuration Zensical, navigation automatiquement actualisée.
- **tools/build_catalog.py** : source unique du catalogue, des compteurs, du bandeau et des index.
- **docs/data/catalog.json** : données générées à la compilation.
- **docs/stylesheets/** et **docs/javascripts/** : présentation et interactions.
- **tests/** : tests du catalogue et des métadonnées.
- **.github/workflows/docs.yml** : contrôle et déploiement GitHub Pages.

## Installation locale — Windows PowerShell

Prérequis : Git, Python 3.12 et accès à Internet lors de l'installation.

~~~powershell
git clone https://github.com/Petrus-Canisius/tutos-informatique.git
cd tutos-informatique
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python tools/build_catalog.py
zensical serve
~~~

La commande « serve » affiche l'URL locale dans PowerShell.

## Ajouter une procédure

1. Créer un Markdown dans le dossier de catégorie approprié.
2. Utiliser le modèle [docs/modeles/modele-procedure.md](docs/modeles/modele-procedure.md).
3. Ajouter les métadonnées obligatoires : titre, description, catégorie, niveau, date de publication et statut de validation.
4. Exécuter le générateur et les tests.
5. Créer une branche et ouvrir une pull request.

~~~powershell
python tools/build_catalog.py
python -m unittest discover -s tests -v
zensical build --clean
python tools/check_site.py site
~~~

Le générateur actualise les cartes, le nombre de procédures, les index des rubriques et la navigation. Aucune mise à jour manuelle de ces éléments n'est nécessaire lors de l'ajout d'un guide.

### Validation

Les valeurs autorisées sont :

- **documentation_only** : analyse documentaire, exécution non confirmée.
- **partially_tested** : essais partiels déclarés.
- **lab_tested** : procédure entièrement testée dans un laboratoire.
- **review_required** : vérification à reprendre.

Ne jamais attribuer automatiquement un statut « lab_tested ». La date de dernière vérification doit correspondre à un contrôle réellement effectué.

### Génération

Les marqueurs AUTO des Markdown sont remplacés par le script avant chaque compilation. La configuration de la navigation est également reconstruite à partir des pages connues.

Les fichiers de rubrique « index », le mémoire et les modèles sont exclus du catalogue des procédures.

## Publication

Les pull requests exécutent les tests et la compilation sans déployer sur GitHub Pages. Une fois les modifications intégrées dans la branche main, le workflow publie le site uniquement si les validations sont réussies.

## Sécurité, licences et attribution

Ce dépôt public ne doit contenir ni mots de passe, ni clés privées, ni jetons ou captures confidentielles.

Le guide FOG contient des captures provenant d'un tutoriel tiers, publiées avec l'autorisation déclarée du titulaire des droits et les références correspondantes.

Le mémoire est diffusé sous forme d'images WebP filigranées ; le PDF source n'est pas publié. Les images restent techniquement récupérables. Elles ne fournissent pas une lecture textuelle accessible.

**Les droits des textes, du code, des captures tierces et du mémoire doivent être distingués avant d'adopter une licence globale.**
