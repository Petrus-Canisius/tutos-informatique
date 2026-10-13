---
title: Contribuer
description: Ajouter des procédures à la documentation informatique.
---

# Rédiger et publier une procédure

<div class="kb-doc-meta"><span>Documentation</span><span>Markdown</span><span>GitHub</span></div>

## 1. Créer la page

Ouvrez le [dépôt GitHub](https://github.com/Petrus-Canisius/tutos-informatique), puis la catégorie appropriée dans `docs/`. Cliquez sur **Add file → Create new file**.

Nom de fichier conseillé : `diagnostic-vpn.md`. Utilisez le [modèle de procédure](../modeles/modele-procedure.md).

## 2. Présenter la procédure

Indiquez l'objectif, la version du système, les droits requis, les précautions, les commandes, le résultat attendu, les tests et la méthode de retour arrière.

## 3. Ajouter au menu

Dans `zensical.toml`, ajoutez le chemin du fichier dans la section `nav`, par exemple :

```toml
{ "Diagnostic VPN" = "reseaux/diagnostic-vpn.md" },
```

## 4. Publier

Enregistrez les modifications avec **Commit changes**. Vérifiez la publication dans l'[onglet Actions](https://github.com/Petrus-Canisius/tutos-informatique/actions).

## Captures d'écran

Placez les images dans `docs/images/` puis insérez-les avec une référence Markdown relative.

!!! warning "Site public"
    Ne jamais publier de mot de passe, jeton, clé privée ni de capture contenant des données confidentielles.

## Contrôles avant publication

- [ ] Instructions adaptées au système concerné
- [ ] Commandes relues et risques annoncés
- [ ] Vérification du résultat documentée
- [ ] Retour arrière prévu si nécessaire
- [ ] Aucune donnée sensible

Ne marquer une procédure « Validée » que lorsqu'elle a réellement été testée.
