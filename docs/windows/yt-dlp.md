---
title: Installer et utiliser yt-dlp sur Windows 11
description: Installation de yt-dlp, FFmpeg et Deno avec WinGet, téléchargement vidéo et audio, sous-titres, playlists, mises à jour et dépannage dans PowerShell.
tags:
  - Windows 11
  - PowerShell
  - yt-dlp
  - FFmpeg
  - Deno
category: "windows"
level: "Débutant à intermédiaire"
published_at: "2026-10-19"
last_verified: null
validation: documentation_only
---

# Installer et utiliser yt-dlp sur Windows 11

<!-- AUTO:STATUS:BEGIN -->
<!-- Généré par tools/build_catalog.py -->
<!-- AUTO:STATUS:END -->

<div class="dl-hero">
  <div class="dl-hero-copy">
    <span class="dl-eyebrow">GUIDE TECHNIQUE · WINDOWS 11</span>
    <p class="dl-hero-title">Télécharger, convertir et organiser les médias avec PowerShell</p>
    <p>Déployer yt-dlp, préparer ses dépendances et maîtriser les commandes essentielles de téléchargement vidéo et audio, sans installer Python.</p>
    <div class="dl-pills"><span>Windows 11</span><span>PowerShell</span><span>WinGet</span><span>FFmpeg</span><span>Deno</span></div>
  </div>
  <div class="dl-hero-terminal" aria-hidden="true"><span>PS C:\&gt;</span> yt-dlp --version<br><span>PS C:\&gt;</span> ffmpeg -version<br><span>PS C:\&gt;</span> deno --version<br><em>Environnement prêt</em></div>
</div>

<div class="dl-facts">
  <div><strong>Objectif</strong><span>Installer et exploiter yt-dlp en ligne de commande.</span></div>
  <div><strong>Niveau</strong><span>Débutant à intermédiaire.</span></div>
  <div><strong>Prérequis</strong><span>Windows 11, PowerShell, accès à Internet.</span></div>
  <div><strong>Publication</strong><span>19 octobre 2026.</span></div>
</div>

!!! info "Périmètre et droits d'utilisation"
    Utilisez ces commandes uniquement pour des médias dont le téléchargement est autorisé par leurs titulaires de droits et les conditions du service. yt-dlp ne donne pas accès aux vidéos protégées par DRM. Le comportement des plateformes peut évoluer et certaines vidéos peuvent nécessiter une authentification légitime.

## 1. Présentation et fonctionnement {#presentation}

[yt-dlp](https://github.com/yt-dlp/yt-dlp) est un outil libre de téléchargement audio et vidéo qui fonctionne dans un terminal. Il prend en charge de nombreux sites et permet de sélectionner les pistes vidéo et audio, de gérer les sous-titres et de traiter des playlists.

<div class="dl-pipeline" aria-label="Étapes du traitement"><div><b>01</b><strong>Adresse</strong><small>URL de la vidéo</small></div><span aria-hidden="true">→</span><div><b>02</b><strong>yt-dlp</strong><small>Analyse des formats</small></div><span aria-hidden="true">→</span><div><b>03</b><strong>FFmpeg</strong><small>Fusion et conversion</small></div><span aria-hidden="true">→</span><div><b>04</b><strong>Fichier</strong><small>Stockage local</small></div></div>

| Composant | Fonction | Statut |
| --- | --- | --- |
| **yt-dlp** | Extraction des informations et téléchargement des flux | Indispensable |
| **FFmpeg / FFprobe** | Fusion audio/vidéo, extraction audio, conversions et inspection | Fortement recommandé |
| **Deno** | Exécution des défis JavaScript requis par YouTube | Recommandé pour YouTube |
| **yt-dlp-ejs** | Scripts de résolution de défis JavaScript | Inclus dans l'exécutable officiel ; à vérifier pour les distributions tierces |

**Méthode principale :** installation avec WinGet. **Alternative :** exécutable autonome téléchargé depuis le GitHub officiel. Il n'est pas nécessaire de cloner le dépôt ni d'installer Python pour ces deux méthodes.

## 2. Installer yt-dlp avec WinGet {#installation}

Ouvrez **Windows Terminal** ou **PowerShell** depuis le menu Démarrer. Les commandes suivantes peuvent être exécutées dans une session utilisateur classique, sous réserve des permissions demandées par WinGet.

### 2.1 Contrôler WinGet

~~~powershell
winget --version
~~~

La commande doit afficher un numéro de version. Si WinGet est absent, installez ou réparez **App Installer** depuis le Microsoft Store.

### 2.2 Installer yt-dlp

~~~powershell
winget install --id yt-dlp.yt-dlp --exact --source winget
~~~

Fermez puis rouvrez PowerShell pour actualiser les chemins des exécutables.

~~~powershell
yt-dlp --version
Get-Command yt-dlp
~~~

**Résultat attendu :** un numéro de version et le chemin de la commande.

!!! tip "Logiciel déjà présent"
    Si WinGet affiche « Found an existing package already installed » puis « No available upgrade found », le paquet est déjà installé et aucune version plus récente n'est proposée par les sources configurées. Contrôlez simplement son exécution.

### 2.3 Installer FFmpeg

~~~powershell
winget install --id Gyan.FFmpeg --exact --source winget
~~~

Après réouverture du terminal :

~~~powershell
ffmpeg -version
ffprobe -version
~~~

Sans FFmpeg, le téléchargement de certains flux reste possible, mais la fusion de pistes audio et vidéo et les conversions ne fonctionneront pas correctement.

### 2.4 Installer Deno

~~~powershell
winget install --id DenoLand.Deno --exact --source winget
~~~

Après réouverture du terminal :

~~~powershell
deno --version
~~~

Deno **2.3 ou plus récent** est recommandé par la documentation yt-dlp actuelle. Il est activé par défaut si son exécutable est accessible dans le chemin système. Sur YouTube, yt-dlp exploite également les scripts **yt-dlp-ejs**, intégrés à l'exécutable officiel ; un paquet tiers peut les distribuer différemment.

!!! note "Deno déjà installé"
    Un message WinGet signalant qu'aucune mise à jour n'est disponible n'est pas une erreur d'installation. Exécutez la commande de contrôle ci-dessus.

### 2.5 Valider l'environnement

~~~powershell
yt-dlp --version
ffmpeg -version
deno --version
yt-dlp --verbose --simulate "URL_DE_LA_VIDEO"
~~~

La dernière commande affiche des informations de diagnostic, notamment les composants détectés. En cas d'échec, consultez le [dépannage](#depannage).

## 3. Premier téléchargement {#premier-telechargement}

Récupérez l'adresse d'une vidéo que vous avez le droit de télécharger. Remplacez les valeurs d'exemple placées entre guillemets par les URL réelles.

### 3.1 Télécharger dans le dossier Téléchargements

~~~powershell
yt-dlp -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Le dossier cible est celui de l'utilisateur Windows actif, quel que soit le répertoire depuis lequel PowerShell est ouvert. Par défaut, yt-dlp choisit une combinaison de formats appropriée selon les disponibilités.

### 3.2 Obtenir la meilleure qualité disponible

~~~powershell
yt-dlp -f "bv*+ba/b" -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

- <code>bv*+ba</code> : privilégie une piste vidéo et une piste audio séparée lorsque c'est possible.
- <code>/b</code> : utilise un format combiné si la sélection précédente échoue.
- **FFmpeg** assemble les pistes lorsqu'une fusion est nécessaire.

!!! info "Qualité et conteneur"
    La meilleure résolution ne garantit pas un fichier MP4 : le format final dépend des codecs et des flux proposés. Pour préparer un MP4, utilisez la section suivante.

## 4. Choisir la qualité et le format {#formats}

### 4.1 Afficher les formats disponibles

~~~powershell
yt-dlp -F "URL_DE_LA_VIDEO"
~~~

La liste affiche les identifiants des formats, les résolutions, les codecs et les pistes audio. Les identifiants diffèrent d'une vidéo à l'autre.

Pour télécharger une combinaison précise après inspection (identifiants **fictifs** dans cet exemple) :

~~~powershell
yt-dlp -f "137+140" "URL_DE_LA_VIDEO"
~~~

### 4.2 Préférer une vidéo de 1080p ou moins

~~~powershell
yt-dlp -f "bv*+ba/b" -S "res:1080" -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Le tri privilégie une résolution **proche de 1080p sans la dépasser dans les conditions habituelles de sélection**. Ce n'est pas une conversion vidéo ; si la résolution exacte n'existe pas, une autre qualité est sélectionnée.

### 4.3 Demander un fichier MP4

~~~powershell
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

<code>--merge-output-format mp4</code> indique le conteneur à utiliser **quand une fusion est effectuée**. Il ne convertit pas automatiquement tous les codecs et ne change pas un téléchargement déjà fourni dans un fichier unique.

Si un fichier doit absolument être converti en MP4, une conversion avec FFmpeg peut être nécessaire :

~~~powershell
yt-dlp --recode-video mp4 -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

**Attention :** le réencodage peut être long, mobiliser fortement le processeur et dégrader légèrement la qualité. Le MP4 peut contenir plusieurs codecs ; la compatibilité avec un appareil donné doit être vérifiée.

### 4.4 Choisir un dossier et un nom de fichier

~~~powershell
yt-dlp -P "D:\Videos" -o "%(title)s [%(id)s].%(ext)s" "URL_DE_LA_VIDEO"
~~~

Le dossier doit être accessible en écriture. Les champs du modèle de nom sont remplacés automatiquement : titre, identifiant et extension. Dans **PowerShell**, les signes <code>%</code> restent tels quels entre guillemets ; leur interprétation diffère dans les fichiers batch Windows.

## 5. Télécharger uniquement l'audio {#audio}

### 5.1 Extraire au format MP3

~~~powershell
yt-dlp -x --audio-format mp3 --audio-quality 0 -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

| Option | Utilité |
| --- | --- |
| <code>-x</code> | Extraction audio |
| <code>--audio-format mp3</code> | Conversion au format MP3 grâce à FFmpeg |
| <code>--audio-quality 0</code> | Meilleure qualité d'encodage demandée pour le MP3 |
| <code>-P</code> | Choix du répertoire |

La conversion **ne restaure pas** une qualité absente de la source. Pour éviter une conversion inutile, il est également possible de conserver le format audio disponible :

~~~powershell
yt-dlp -f "ba" -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Le fichier obtenu peut être en M4A, WebM ou un autre format.

## 6. Sous-titres et langues {#sous-titres}

### 6.1 Télécharger les sous-titres français disponibles

~~~powershell
yt-dlp --write-subs --sub-langs "fr,fr-CA" --convert-subs srt -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Ce téléchargement inclut la vidéo. Les sous-titres sont enregistrés dans un fichier distinct lorsque des pistes françaises existent.

### 6.2 Inclure les sous-titres automatiques

~~~powershell
yt-dlp --write-subs --write-auto-subs --sub-langs "fr.*" --convert-subs srt -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Cette commande accepte les variantes de français reconnues par le site. Les sous-titres générés automatiquement peuvent être imprécis.

### 6.3 Télécharger uniquement les sous-titres

~~~powershell
yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "fr.*" --convert-subs srt -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Pour connaître les langues disponibles :

~~~powershell
yt-dlp --list-subs "URL_DE_LA_VIDEO"
~~~

## 7. Playlists et téléchargements groupés {#playlists}

Pour enregistrer une playlist complète :

~~~powershell
yt-dlp --yes-playlist -P "$env:USERPROFILE\Downloads" "URL_DE_LA_PLAYLIST"
~~~

Pour ne télécharger que la vidéo ciblée par une URL comportant aussi un identifiant de playlist :

~~~powershell
yt-dlp --no-playlist -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

Pour traiter une liste d'URL enregistrée dans un fichier texte (une adresse par ligne) :

~~~powershell
yt-dlp -a "$env:USERPROFILE\Downloads\urls.txt" -P "$env:USERPROFILE\Downloads"
~~~

Pour ne pas retélécharger les fichiers déjà traités lors d'exécutions ultérieures :

~~~powershell
yt-dlp --download-archive "$env:USERPROFILE\Downloads\archive-yt-dlp.txt" -P "$env:USERPROFILE\Downloads" "URL_DE_LA_PLAYLIST"
~~~

Le fichier d'archive mémorise les identifiants téléchargés avec succès. Conservez-le si vous souhaitez reprendre une collecte ultérieurement.

## 8. Créer une configuration permanente {#configuration}

Il est possible de définir un dossier et des options par défaut plutôt que de les ressaisir à chaque téléchargement.

Dans PowerShell, créez le répertoire puis ouvrez le fichier de configuration avec le Bloc-notes :

~~~powershell
New-Item -ItemType Directory -Force "$env:APPDATA\yt-dlp"
notepad "$env:APPDATA\yt-dlp\config"
~~~

Si le Bloc-notes propose de créer le fichier, acceptez. Inscrivez par exemple :

~~~text
# Dossier des téléchargements Windows
-P "~/Downloads"

# Nommage explicite
-o "%(title)s [%(id)s].%(ext)s"

# Fusion des pistes lorsque cela est possible
-f "bv*+ba/b"
~~~

Enregistrez, puis utilisez simplement :

~~~powershell
yt-dlp "URL_DE_LA_VIDEO"
~~~

La configuration utilisateur est généralement lue depuis <code>%APPDATA%\yt-dlp\config</code>. Pour identifier les fichiers réellement chargés :

~~~powershell
yt-dlp --verbose --simulate "URL_DE_LA_VIDEO"
~~~

Pour désactiver temporairement les paramètres enregistrés :

~~~powershell
yt-dlp --ignore-config -P "$env:USERPROFILE\Downloads" "URL_DE_LA_VIDEO"
~~~

!!! warning "Ne mélangez pas les méthodes"
    Un exécutable portable peut charger un fichier <code>yt-dlp.conf</code> placé à côté de lui. Pour éviter toute configuration inattendue, contrôlez les lignes <code>Config</code> dans la sortie de diagnostic.

## 9. Mise à jour et désinstallation {#maintenance}

### 9.1 Installation WinGet

~~~powershell
winget upgrade --id yt-dlp.yt-dlp --exact --source winget
winget upgrade --id Gyan.FFmpeg --exact --source winget
winget upgrade --id DenoLand.Deno --exact --source winget
~~~

### 9.2 Exécutable officiel autonome

Téléchargez [yt-dlp.exe depuis les publications officielles](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe), placez-le par exemple dans <code>C:\Tools\yt-dlp\</code> et exécutez :

~~~powershell
& "C:\Tools\yt-dlp\yt-dlp.exe" --version
~~~

Contrairement à la méthode WinGet, la version autonome peut utiliser son mécanisme intégré de mise à jour :

~~~powershell
& "C:\Tools\yt-dlp\yt-dlp.exe" -U
~~~

Les mainteneurs publient les canaux **stable**, **nightly** et **master**. En cas de dysfonctionnement lié à un changement sur une plateforme, ils recommandent souvent de tester le canal nightly avec l'exécutable officiel :

~~~powershell
& "C:\Tools\yt-dlp\yt-dlp.exe" --update-to nightly
~~~

N'utilisez pas en parallèle plusieurs copies de yt-dlp sans savoir laquelle est appelée par PowerShell.

### 9.3 Désinstaller les paquets WinGet

~~~powershell
winget uninstall --id yt-dlp.yt-dlp --exact
~~~

FFmpeg et Deno peuvent être conservés s'ils sont utilisés par d'autres logiciels.

## 10. Dépannage {#depannage}

| Symptôme | Cause possible | Contrôle ou correction |
| --- | --- | --- |
| <code>yt-dlp</code> non reconnu | Terminal non rouvert ou exécutable absent du chemin | Rouvrir PowerShell ; exécuter <code>Get-Command yt-dlp</code> |
| <code>ffmpeg</code> non reconnu | FFmpeg absent du PATH | Installer FFmpeg, rouvrir le terminal et exécuter <code>ffmpeg -version</code> |
| <code>deno</code> non reconnu | Deno absent du PATH | Vérifier <code>deno --version</code> et l'installation WinGet |
| Vidéo sans son / fusion impossible | FFmpeg manquant ou formats incompatibles | Vérifier FFmpeg puis lister les formats avec <code>-F</code> |
| Avertissement JavaScript / EJS | Runtime ou scripts manquants ou obsolètes | Mettre à jour yt-dlp et Deno ; vérifier la [documentation EJS](https://github.com/yt-dlp/yt-dlp/wiki/EJS) |
| <code>HTTP Error 403</code> ou extraction impossible | URL, restriction d'accès ou modification du site | Mettre à jour yt-dlp, vérifier les droits d'accès et produire un diagnostic |
| Sous-titres absents | Langue indisponible ou non publiée | Exécuter <code>yt-dlp --list-subs</code> |
| Fichier absent du dossier attendu | Répertoire de sortie implicite | Définir systématiquement <code>-P</code> |
| MP4 non créé | Pas de fusion ou codec inadapté | Examiner les flux et envisager <code>--recode-video mp4</code> |

Pour analyser un problème :

~~~powershell
yt-dlp --verbose --simulate "URL_DE_LA_VIDEO"
~~~

Le mode <code>--simulate</code> examine les informations **sans télécharger le média**. Il ne reproduit pas tous les problèmes qui surviennent uniquement pendant le téléchargement ou la fusion. Masquez les URL privées, cookies et jetons d'authentification avant de partager un journal.

!!! danger "Sécurité"
    Ne transmettez pas vos fichiers de cookies, mots de passe ou URL contenant des jetons personnels. Ne téléchargez pas d'« installeurs yt-dlp » depuis des sites inconnus : utilisez le dépôt officiel et des gestionnaires de paquets identifiés.

## 11. Commandes de référence {#reference-rapide}

| Besoin | Option ou commande |
| --- | --- |
| Version | <code>yt-dlp --version</code> |
| Aide intégrée | <code>yt-dlp --help</code> |
| Formats disponibles | <code>yt-dlp -F "URL"</code> |
| Liste des sous-titres | <code>yt-dlp --list-subs "URL"</code> |
| Télécharger l'audio | <code>yt-dlp -x --audio-format mp3 "URL"</code> |
| Télécharger une playlist | <code>yt-dlp --yes-playlist "URL"</code> |
| Ne prendre qu'une vidéo | <code>yt-dlp --no-playlist "URL"</code> |
| Analyser sans télécharger | <code>yt-dlp --simulate "URL"</code> |
| Diagnostic détaillé | <code>yt-dlp --verbose "URL"</code> |

## 12. Sources officielles {#sources}

- [Dépôt officiel yt-dlp](https://github.com/yt-dlp/yt-dlp) : fonctionnalités, dépendances et options.
- [Installation sous Windows avec WinGet](https://github.com/yt-dlp/yt-dlp/wiki/Installation#windows) : instructions maintenues par le projet.
- [EJS et runtimes JavaScript](https://github.com/yt-dlp/yt-dlp/wiki/EJS) : configuration du moteur JavaScript.
- [FFmpeg](https://ffmpeg.org/) : documentation du traitement multimédia.
- [Documentation Deno](https://docs.deno.com/runtime/getting_started/installation/) : installation et versions.
- [Versions officielles de yt-dlp](https://github.com/yt-dlp/yt-dlp/releases) : exécutables et notes de publication.

!!! note "État de la procédure"
    Rédaction fondée sur les documentations officielles consultées en octobre 2026. Les commandes n'ont pas été exécutées sur une installation Windows 11 pour cette publication. Les options et la prise en charge des sites peuvent changer.

## Historique

| Date | Modification |
| --- | --- |
| 2026-10-19 | Première publication : installation, utilisation, configuration, maintenance et dépannage. |
