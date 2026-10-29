---
title: Brave ne démarre plus après un changement de nom d’ordinateur sur Ubuntu
description: Corriger le verrouillage du profil Brave (Snap) après le renommage du PC, sans perdre favoris, mots de passe ou extensions.
---

# Réparer Brave qui ne démarre plus après le renommage d’Ubuntu

<div class="kb-doc-meta"><span>Linux · Ubuntu</span><span>Brave (Snap)</span><span>Dépannage</span><span>Intermédiaire</span></div>

## Objectif

Résoudre un refus de démarrage du navigateur **Brave** sur Ubuntu après un changement de nom d’ordinateur (*hostname*), **sans réinstaller le navigateur ni supprimer son profil**.

Ce cas a été rencontré lors d’un renommage du PC : Brave pensait que le profil était encore utilisé par un autre processus situé sur l’**ancien nom de machine**. La suppression ciblée des anciens liens de verrouillage a permis de rouvrir le navigateur.

## Informations générales

| Élément | Détail |
| --- | --- |
| Système | Ubuntu avec bureau GNOME |
| Navigateur | Brave installé au format Snap |
| Symptôme | Brave ne s’ouvre plus après changement du nom d’hôte |
| Cause observée | Verrouillage de profil Chromium/Brave (`ProcessSingleton`) |
| Privilèges | Compte utilisateur habituel ; `sudo` inutile |
| Vérification pratique | 29 octobre 2026 |

!!! warning "Avant d’intervenir"
    **Fermer toutes les fenêtres Brave** et vérifier qu’aucun processus Brave n’utilise encore le profil. **Ne jamais effacer les verrous si le profil est réellement ouvert sur une autre session ou un autre ordinateur**, notamment avec un répertoire personnel partagé. Ne pas supprimer les dossiers `~/snap/brave` ni `Brave-Browser` : ils peuvent contenir les favoris, mots de passe et données de navigation.

## 1. Identifier le type d’installation

Ouvrir un terminal (`Ctrl + Alt + T`) et exécuter :

```bash
command -v brave-browser || true
snap list brave
hostname
```

Si `brave-browser` est introuvable mais que `snap list brave` affiche Brave, le navigateur est installé en **Snap**. Dans ce cas, la commande de lancement adaptée est :

```bash
snap run brave
```

### Exemple de message d’erreur

Le terminal peut afficher un message ressemblant à :

```text
ERROR:chrome/browser/process_singleton_posix.cc
Le profil semble être utilisé dans le cadre d'un autre
processus Brave sur un autre ordinateur (ancien-nom-du-pc).
Le profil a été verrouillé pour éviter toute corruption.
```

Brave utilise un verrouillage de profil pour empêcher deux instances concurrentes de modifier les mêmes fichiers. Après un renommage, un **verrou obsolète contenant l’ancien hostname** peut être interprété comme une session sur une autre machine.

Le message annexe `Cannot show profile in-use dialog: no system dialog tool` signifie que Brave n’a pas pu afficher sa boîte de dialogue d’avertissement. Ce n’est pas, à lui seul, la cause du verrouillage.

## 2. Vérifier et arrêter les processus Brave

Commencer par fermer Brave normalement si une fenêtre est encore ouverte. Puis contrôler :

```bash
pgrep -a -u "$USER" -x brave || true
```

Si des processus Brave subsistent alors que toutes ses fenêtres sont fermées, demander leur arrêt :

```bash
pkill -TERM -u "$USER" -x brave
sleep 2
pgrep -a -u "$USER" -x brave || true
```

**Résultat attendu :** aucune ligne de processus Brave. Si des processus sont encore présents, **ne pas passer à l’étape suivante** avant de comprendre pourquoi ils tournent.

!!! tip "Pourquoi SIGTERM ?"
    Le signal `TERM` demande au processus de s’arrêter normalement. Éviter `kill -9` ou une suppression du profil tant que le diagnostic ne l’exige pas.

## 3. Repérer les anciens fichiers de verrouillage

Avec la version Snap, les fichiers de profil peuvent être situés dans les données de révision ou dans l’espace commun de Brave.

Afficher **uniquement les liens symboliques** utilisés comme verrous de profil :

```bash
find "$HOME/snap/brave" -maxdepth 8 -type l \\
  \( -name 'SingletonLock' -o -name 'SingletonCookie' \\
     -o -name 'SingletonSocket' \) -print
```

Les noms `SingletonLock`, `SingletonCookie` et `SingletonSocket` correspondent aux marqueurs de verrouillage utilisés par les navigateurs basés sur Chromium.

## 4. Supprimer uniquement les verrous obsolètes

**Uniquement après avoir confirmé qu’aucune instance Brave n’est active**, supprimer les liens détectés :

```bash
find "$HOME/snap/brave" -maxdepth 8 -type l \\
  \( -name 'SingletonLock' -o -name 'SingletonCookie' \\
     -o -name 'SingletonSocket' \) -print -delete
```

Cette commande est volontairement limitée aux **liens symboliques** portant ces trois noms dans l’arborescence Snap de Brave.

Elle **ne supprime pas** les favoris, mots de passe, cookies de navigation, historique ou extensions. Les verrous nécessaires seront recréés au prochain lancement.

!!! danger "À ne pas faire"
    Ne pas exécuter `rm -rf ~/snap/brave`, ne pas effacer tout le profil et ne pas utiliser `sudo` pour modifier ses fichiers utilisateur.

## 5. Relancer et valider

Relancer Brave normalement :

```bash
snap run brave
```

Si une fenêtre graphique ne s’ouvre toujours pas alors que le verrouillage est résolu, essayer temporairement le backend X11 sous GNOME/Wayland :

```bash
snap run brave --ozone-platform=x11
```

L’option `--ozone-platform=x11` est une **solution de diagnostic graphique**, distincte de la correction du verrouillage de profil.

**Validation :** Brave s’ouvre, les favoris et extensions sont présents, les pages se chargent, puis Brave peut être fermé et rouvert normalement depuis son icône Ubuntu.

## 6. Si le problème persiste

| Symptôme | Vérification recommandée |
| --- | --- |
| `brave-browser: commande introuvable` | Vérifier `snap list brave`, puis utiliser `snap run brave` |
| Profil déjà utilisé | Contrôler à nouveau les processus Brave et les liens `Singleton*` |
| Brave est ouvert sur une autre session ou machine | Fermer cette instance avant toute suppression ; ne pas forcer l’accès simultané au profil |
| Fenêtre blanche/noire ou invisible | Tester `--ozone-platform=x11` et examiner les messages du terminal |
| Autres erreurs Snap | Lire les diagnostics avec `snap logs brave` et vérifier l’état de Snap |

Ne pas confondre un **verrou de profil obsolète** avec un problème de pilote graphique : les symptômes et les solutions diffèrent.

## Retour arrière et prévention

Les fichiers `Singleton*` sont des verrous transitoires recréés par Brave. Aucune modification de configuration du navigateur ou du système n’est nécessaire pour revenir à un lancement normal.

Pour éviter le problème lors d’un futur changement de hostname :

1. Fermer Brave avant de renommer l’ordinateur.
2. Laisser les processus du navigateur se terminer.
3. Renommer puis rouvrir Brave.
4. Si le message `ProcessSingleton` réapparaît, vérifier les processus et les verrous avant toute suppression.

## Références

- [Brave — installation officielle sur Linux](https://brave.com/linux/)
- [Documentation Snapcraft — présentation de Snap](https://snapcraft.io/docs)

## Historique

| Date | Modification |
| --- | --- |
| 2026-10-29 | Première publication : résolution confirmée sur Ubuntu avec Brave Snap |
