# Documentation informatique

Site public de procédures et tutoriels informatiques, publié avec [Zensical](https://zensical.org/) et GitHub Pages.

- **Site :** https://petrus-canisius.github.io/tutos-informatique/
- **Sources des procédures :** `docs/`
- **Menu et configuration :** `zensical.toml`
- **Publication automatique :** `.github/workflows/docs.yml`

## Ajouter une procédure depuis GitHub

1. Ouvrir le dossier `docs/` puis la catégorie concernée.
2. Cliquer sur **Add file → Create new file**.
3. Nommer le fichier, par exemple `diagnostic-vpn.md`.
4. Rédiger en Markdown en s'inspirant de `docs/modeles/modele-procedure.md`.
5. Dans `zensical.toml`, ajouter la nouvelle page à la section `nav` correspondante.
6. Valider les changements (**Commit changes**) sur `main`. GitHub Actions republiera le site.

## Prévisualiser sur un PC

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\zensical.exe serve
```

## Publication

Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
Vérifier ensuite le workflow dans l'onglet **Actions**.

**Confidentialité :** le dépôt et les pages sont publics. Ne jamais publier de secrets, mots de passe, jetons, clés SSH privées ou données personnelles.
