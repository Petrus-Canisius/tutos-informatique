---
title: Installer et utiliser yt-dlp sur Ubuntu
description: Installer yt-dlp, FFmpeg et Deno sur Ubuntu, télécharger des vidéos et des pistes audio, gérer les playlists et les sous-titres, configurer et dépanner le logiciel.
tags:
  - Ubuntu
  - Linux
  - yt-dlp
  - FFmpeg
  - Deno
---

# Installer et utiliser yt-dlp sur Ubuntu

<div class="kb-doc-meta"><span>Linux · Ubuntu</span><span>yt-dlp</span><span>FFmpeg / Deno</span><span>Installation et utilisation</span></div>

## Objectif

Installer **yt-dlp**, un outil libre en ligne de commande permettant de récupérer des vidéos, des pistes audio, des sous-titres et des playlists depuis les sites compatibles. Apprendre à sélectionner les formats, organiser les fichiers et maintenir le logiciel à jour.

| Élément | Détail |
| --- | --- |
| Environnement | Ubuntu avec Python 3.10 ou plus récent |
| Niveau | Débutant à intermédiaire |
| Droits nécessaires | sudo pour l'installation système ; utilisateur normal pour les téléchargements |
| Méthode | Exécutable Unix officiel, FFmpeg via APT, Deno |
| Publication | 15 novembre 2026 |
| Validation | Procédure documentaire ; pas de test matériel réalisé |

!!! info "Droits d'utilisation"
    Télécharger uniquement les contenus pour lesquels le téléchargement est autorisé. Respecter les droits d'auteur et les conditions du service. yt-dlp ne déchiffre pas les contenus protégés par DRM.

## 1. Installer les dépendances

Ouvrir un terminal (Ctrl + Alt + T).

~~~bash
sudo apt update
sudo apt install -y curl ffmpeg python3 unzip ca-certificates
~~~

- **curl** : téléchargement de l'exécutable.
- **FFmpeg et FFprobe** : fusion vidéo/audio, conversion et inspection des fichiers.
- **Python 3** : exécution du fichier Unix yt-dlp.
- **unzip** : extraction de Deno.

~~~bash
python3 --version
ffmpeg -version
ffprobe -version
~~~

## 2. Installer yt-dlp

Installer l'exécutable Unix officiel depuis les publications GitHub du projet. Le fichier est indépendant des paquets APT et peut être mis à jour directement avec yt-dlp.

~~~bash
curl -fL --retry 3 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp
sudo install -m 755 /tmp/yt-dlp /usr/local/bin/yt-dlp
rm /tmp/yt-dlp
~~~

Vérifier l'installation :

~~~bash
yt-dlp --version
command -v yt-dlp
~~~

Le chemin attendu est /usr/local/bin/yt-dlp. Si une ancienne version installée par APT est prioritaire, contrôler les chemins avec la commande suivante :

~~~bash
type -a yt-dlp
~~~

Ne pas mélanger les méthodes de mise à jour : la commande yt-dlp -U concerne l'exécutable officiel, pas les paquets gérés par APT.

## 3. Installer Deno pour YouTube

YouTube utilise des défis JavaScript pour lesquels yt-dlp s'appuie sur un moteur externe. **Deno 2.3 ou plus récent** est recommandé et activé par défaut. Les scripts EJS sont inclus dans l'exécutable Unix officiel installé ci-dessus.

Télécharger le script officiel Deno, puis l'exécuter en tant qu'utilisateur normal :

~~~bash
curl -fsSLo /tmp/install-deno.sh https://deno.land/install.sh
bash /tmp/install-deno.sh
rm /tmp/install-deno.sh
~~~

Si nécessaire, ajouter Deno au PATH de Bash :

~~~bash
export PATH="$HOME/.deno/bin:$PATH"
grep -qxF 'export PATH="$HOME/.deno/bin:$PATH"' ~/.bashrc || printf '\nexport PATH="$HOME/.deno/bin:$PATH"\n' >> ~/.bashrc
~~~

~~~bash
deno --version
command -v deno
~~~

### Alternative : Node.js

Si Node.js 22 ou supérieur est déjà installé, il est possible de l'utiliser à la place de Deno :

~~~bash
node --version
yt-dlp --js-runtimes node "URL"
~~~

Remplacer URL par l'adresse réelle du contenu. Deno reste la méthode principale de ce guide.

## 4. Télécharger une vidéo

~~~bash
yt-dlp "URL"
~~~

Exemple de syntaxe (remplacer XXXXXXXXXXX par un identifiant réel) :

~~~bash
yt-dlp "https://www.youtube.com/watch?v=XXXXXXXXXXX"
~~~

Par défaut, yt-dlp sélectionne les formats de meilleure qualité disponibles et utilise FFmpeg pour fusionner les pistes si nécessaire. Sans configuration particulière, le fichier est enregistré dans le répertoire courant. Garder les guillemets autour de l'URL.

## 5. Télécharger une vidéo en MP4

~~~bash
yt-dlp -t mp4 "URL"
~~~

Le preset MP4 privilégie les codecs compatibles, puis remuxe le fichier si nécessaire. Le conteneur MP4 ne garantit pas à lui seul que le codec vidéo soit H.264.

### 1080p maximum

~~~bash
yt-dlp -t mp4 -f "bv*[height<=1080]+ba/b[height<=1080]" "URL"
~~~

### 1440p maximum

~~~bash
yt-dlp -t mp4 -f "bv*[height<=1440]+ba/b[height<=1440]" "URL"
~~~

### 4K maximum

~~~bash
yt-dlp -t mp4 -f "bv*[height<=2160]+ba/b[height<=2160]" "URL"
~~~

La résolution obtenue dépend des formats réellement proposés. Une limite de 2160p ne transforme pas une source 1080p en 4K.

Pour privilégier strictement H.264 et AAC en 1080p maximum (si disponibles) :

~~~bash
yt-dlp -f "bv*[height<=1080][vcodec^=avc1]+ba[acodec^=mp4a]/b[height<=1080][ext=mp4][vcodec^=avc1]" --merge-output-format mp4 "URL"
~~~

## 6. Télécharger uniquement l'audio

### MP3

~~~bash
yt-dlp -x --audio-format mp3 --audio-quality 0 "URL"
~~~

### FLAC

~~~bash
yt-dlp -x --audio-format flac "URL"
~~~

### M4A

~~~bash
yt-dlp -x --audio-format m4a "URL"
~~~

La conversion en FLAC n'améliore pas la qualité d'une source déjà compressée avec perte.

## 7. Choisir le dossier de téléchargement

Sur un Ubuntu configuré en français :

~~~bash
mkdir -p "$HOME/Téléchargements"
yt-dlp -P "$HOME/Téléchargements" "URL"
~~~

Pour télécharger en MP4 :

~~~bash
yt-dlp -t mp4 -P "$HOME/Téléchargements" "URL"
~~~

Si le nom du dossier est différent, utiliser le chemin renvoyé par xdg-user-dir DOWNLOAD.

## 8. Télécharger une playlist

### Playlist complète

~~~bash
yt-dlp --yes-playlist "URL_PLAYLIST"
~~~

### Organiser les vidéos dans un dossier numéroté

~~~bash
yt-dlp --yes-playlist -o "%(playlist_title)s/%(playlist_index)03d - %(title)s.%(ext)s" "URL_PLAYLIST"
~~~

### Télécharger une seule vidéo d'une playlist

~~~bash
yt-dlp --no-playlist "URL"
~~~

Cette dernière option traite uniquement la vidéo lorsque l'adresse désigne à la fois une vidéo et une playlist.

## 9. Afficher et sélectionner les formats

~~~bash
yt-dlp -F "URL"
~~~

La liste indique notamment les identifiants, résolutions, codecs et pistes disponibles.

Sélectionner une vidéo et une piste audio séparément :

~~~bash
yt-dlp -f "137+140" "URL"
~~~

137 et 140 sont des exemples : utiliser les identifiants retournés par -F pour la vidéo concernée.

## 10. Télécharger les sous-titres

### Sous-titres français

~~~bash
yt-dlp --write-subs --sub-langs fr "URL"
~~~

### Sous-titres automatiques

~~~bash
yt-dlp --write-auto-subs --sub-langs fr "URL"
~~~

### Sous-titres sans vidéo

~~~bash
yt-dlp --skip-download --write-subs --sub-langs fr "URL"
~~~

Pour lister les langues disponibles ou convertir en SRT :

~~~bash
yt-dlp --list-subs "URL"
yt-dlp --write-subs --sub-langs fr --convert-subs srt "URL"
~~~

## 11. Utiliser les cookies du navigateur

Certaines vidéos autorisées nécessitent une session connectée. yt-dlp peut utiliser les cookies du profil du navigateur local.

~~~bash
# Firefox
yt-dlp --cookies-from-browser firefox "URL"

# Google Chrome
yt-dlp --cookies-from-browser chrome "URL"

# Chromium
yt-dlp --cookies-from-browser chromium "URL"
~~~

!!! warning "Confidentialité"
    Les cookies représentent une session authentifiée. Ne pas les publier, les partager ni les transmettre à des services tiers. Exécuter yt-dlp avec son compte utilisateur, jamais avec sudo pour cette opération. Fermer le navigateur si sa base de données est verrouillée. Les installations Snap ou Flatpak peuvent utiliser des profils situés ailleurs.

## 12. Créer une configuration permanente

~~~bash
mkdir -p ~/.config/yt-dlp
nano ~/.config/yt-dlp/config
~~~

Insérer :

~~~ini
# Dossier de destination
-P "~/Téléchargements"

# Meilleure qualité vidéo/audio ; éviter les playlists involontaires
-f bv*+ba/b
--no-playlist

# Nom du fichier
-o "%(title)s.%(ext)s"

# Reprendre les téléchargements interrompus
--continue
~~~

Pour privilégier MP4 systématiquement, ajouter :

~~~ini
-t mp4
~~~

Pour utiliser Node.js plutôt que Deno, ajouter :

~~~ini
--js-runtimes node
~~~

Enregistrer avec Ctrl + O, Entrée, puis quitter avec Ctrl + X.

La commande habituelle devient :

~~~bash
yt-dlp "URL"
~~~

Pour une playlist, préciser --yes-playlist. Pour ignorer ponctuellement toute configuration :

~~~bash
yt-dlp --ignore-config "URL"
~~~

## 13. Mettre à jour yt-dlp

Pour l'installation dans /usr/local/bin :

~~~bash
sudo /usr/local/bin/yt-dlp -U
~~~

Si un changement du site bloque la version stable, essayer la version nightly officielle :

~~~bash
sudo /usr/local/bin/yt-dlp --update-to nightly
~~~

Revenir à la version stable :

~~~bash
sudo /usr/local/bin/yt-dlp --update-to stable
~~~

Contrôler la version :

~~~bash
yt-dlp --version
~~~

## 14. Dépannage et validation

| Symptôme | Vérification / solution |
| --- | --- |
| Commande introuvable | Vérifier avec command -v yt-dlp et type -a yt-dlp. |
| FFmpeg absent | Installer ffmpeg via APT et vérifier ffmpeg -version. |
| Erreur de défi JavaScript YouTube | Vérifier Deno, le PATH, puis mettre yt-dlp à jour. |
| Format indisponible | Relancer yt-dlp -F et sélectionner un format proposé. |
| Vidéo privée ou connexion exigée | Utiliser un compte autorisé et les cookies du navigateur si nécessaire. |
| Téléchargement interrompu | Relancer la même commande pour reprendre le fichier partiel, si le serveur le permet. |
| Erreur de permission | Vérifier les droits sur le dossier de destination ; ne pas télécharger avec sudo. |

Tester l'extraction d'informations sans télécharger la vidéo :

~~~bash
yt-dlp --simulate --no-playlist --print "%(title)s" "URL"
~~~

Le résultat attendu est le titre du contenu accessible. Pour diagnostiquer un échec, ajouter -v à la commande ; éviter de publier les journaux contenant des données privées.

## 15. Désinstaller yt-dlp

~~~bash
sudo rm /usr/local/bin/yt-dlp
~~~

Pour retirer également la configuration personnelle (les paramètres seront perdus) :

~~~bash
rm -f ~/.config/yt-dlp/config
~~~

FFmpeg, Python et Deno restent installés : ils peuvent être utilisés par d'autres logiciels. Les médias déjà téléchargés ne sont pas supprimés.

## Récapitulatif des commandes

| Action | Commande |
| --- | --- |
| Télécharger une vidéo | <code>yt-dlp "URL"</code> |
| MP4 | <code>yt-dlp -t mp4 "URL"</code> |
| MP3 | <code>yt-dlp -x --audio-format mp3 "URL"</code> |
| Formats disponibles | <code>yt-dlp -F "URL"</code> |
| Playlist | <code>yt-dlp --yes-playlist "URL"</code> |
| Vidéo seule | <code>yt-dlp --no-playlist "URL"</code> |
| Cookies Firefox | <code>yt-dlp --cookies-from-browser firefox "URL"</code> |
| Version | <code>yt-dlp --version</code> |
| Mise à jour | <code>sudo /usr/local/bin/yt-dlp -U</code> |
| Arrêt | Ctrl + C |
| Reprise | Relancer la même commande |

## Références

- [Documentation officielle de yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Installation de yt-dlp](https://github.com/yt-dlp/yt-dlp/wiki/Installation)
- [Configuration JavaScript et EJS](https://github.com/yt-dlp/yt-dlp/wiki/EJS)
- [Installation de Deno](https://docs.deno.com/runtime/getting_started/installation/)
- [FFmpeg](https://ffmpeg.org/documentation.html)
- [Version Windows 11 du tutoriel](../windows/yt-dlp.md)

## Historique

| Date | Modification |
| --- | --- |
| 2026-11-15 | Première version du tutoriel Ubuntu. |
