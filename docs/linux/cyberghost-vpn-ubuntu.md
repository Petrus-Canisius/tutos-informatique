---
title: Installer et utiliser CyberGhost VPN sur Ubuntu
description: Installation du client Linux CyberGhost, connexion OpenVPN en Belgique, vérification du VPN et dépannage de WireGuard sous Ubuntu.
---

# Installer et utiliser CyberGhost VPN sur Ubuntu

<div class="kb-doc-meta"><span>Linux · Ubuntu</span><span>CyberGhost VPN</span><span>OpenVPN / WireGuard</span><span>Installation et dépannage</span></div>

## Objectif

Installer l'application **CyberGhost VPN en ligne de commande (CLI)**, se connecter à un serveur dans le pays de son choix, vérifier l'adresse IP publique et savoir se déconnecter. Ce tutoriel détaille aussi deux erreurs rencontrées lors d'une installation sous **Ubuntu 26.04.1 LTS**.

| Élément | Détail |
| --- | --- |
| Système vérifié | Ubuntu 26.04.1 LTS, 64 bits |
| Application utilisée lors du test | CyberGhost CLI 1.5.0, archive étiquetée Ubuntu 22.04 |
| Prérequis | Abonnement CyberGhost actif, accès Internet et droits <code>sudo</code> |
| Protocole ayant fonctionné | OpenVPN |
| Pays testé | Belgique (<code>BE</code>) |
| Vérification pratique | 4 novembre 2026 |

!!! warning "Compatibilité des versions"
    Le package utilisé pour ce test portait le nom <code>cyberghostvpn-ubuntu-22.04-1.5.0</code>, alors que le système était sous Ubuntu 26.04.1. La connexion OpenVPN a fonctionné dans ce cas précis, mais **cela ne constitue pas une garantie de compatibilité officielle de ce package avec Ubuntu 26.04**. Préférer la version correspondant à sa distribution lorsqu'elle est proposée dans le compte CyberGhost. Ne pas modifier artificiellement la version déclarée d'Ubuntu pour forcer l'installateur.

## 1. Vérifier le système

Ouvrir un terminal avec <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd> :

~~~bash
lsb_release -a
uname -m
~~~

La valeur <code>x86_64</code> indique une architecture AMD64 / Intel 64 bits.

Mettre à jour l'index des paquets :

~~~bash
sudo apt update
~~~

Les mises à niveau système, si nécessaires, peuvent être effectuées séparément après examen des modifications proposées par APT.

## 2. Télécharger CyberGhost depuis le site officiel

1. Ouvrir [le compte CyberGhost](https://my.cyberghostvpn.com/) et se connecter.
2. Choisir le **centre de téléchargement (Download Hub)**.
3. Sélectionner **CyberGhost VPN for Linux**, puis **Configure**.
4. Choisir la distribution et, lorsqu'elle est proposée, la version d'Ubuntu correspondante.
5. Télécharger l'archive ZIP et l'extraire dans le dossier <code>Téléchargements</code>.

!!! danger "Source du logiciel"
    Télécharger l'application uniquement depuis l'espace client officiel de CyberGhost. Ne pas utiliser de scripts d'installation publiés sur des sites inconnus.

Le nom du dossier extrait varie selon la version de l'archive. Dans cet exemple, il s'agit de :

~~~text
~/Téléchargements/cyberghostvpn-ubuntu-22.04-1.5.0/
~~~

## 3. Installer le client

**Se placer impérativement dans le dossier extrait** : le script utilise des chemins relatifs et a besoin de trouver le sous-dossier <code>cyberghost</code>.

~~~bash
cd ~/Téléchargements/cyberghostvpn-ubuntu-22.04-1.5.0
ls -la
ls -la cyberghost/
~~~

Adapter le chemin si le dossier téléchargé porte un autre nom. Une fois le fichier <code>install.sh</code> et le répertoire <code>cyberghost/</code> présents :

~~~bash
sudo bash ./install.sh
~~~

Le script installe les dépendances nécessaires, notamment <code>curl</code>, <code>openvpn</code>, <code>wireguard</code> et <code>wireguard-tools</code>, si elles ne sont pas déjà installées. Il peut demander le mot de passe administrateur et les identifiants CyberGhost.

!!! note "Ne pas lancer le script depuis un autre répertoire"
    Exécuter une commande comme <code>sudo bash /chemin/vers/install.sh</code> depuis un autre dossier peut échouer même si le chemin du script est correct : le programme cherche <code>cyberghost/*</code> dans le **répertoire courant**. Utiliser d'abord <code>cd</code>, puis <code>sudo bash ./install.sh</code>.

### Confirmer l'installation

~~~bash
command -v cyberghostvpn
sudo cyberghostvpn --help
~~~

La première commande doit afficher le chemin de l'exécutable ; la seconde affiche les options disponibles.

## 4. Se connecter à un serveur en Belgique avec OpenVPN

Cette commande a **réussi sur Ubuntu 26.04.1 LTS** lors du test :

~~~bash
sudo cyberghostvpn --country-code BE --openvpn --connect
~~~

Exemple de sortie obtenue (le nom du serveur peut changer) :

~~~text
Prepare OpenVPN connection ...
Select server ... brussels-s427-i11
Connecting ...
Downloading configuration ...
Installing configuration ...
VPN connection established.
~~~

Le code pays <code>BE</code> désigne la **Belgique**. CyberGhost sélectionne un serveur disponible ; il n'est pas nécessaire de saisir son nom.

### Autres pays

~~~bash
# France
sudo cyberghostvpn --country-code FR --openvpn --connect

# Allemagne
sudo cyberghostvpn --country-code DE --openvpn --connect

# Belgique
sudo cyberghostvpn --country-code BE --openvpn --connect
~~~

Afficher les codes pays proposés par CyberGhost :

~~~bash
sudo cyberghostvpn --traffic --country-code
~~~

!!! tip "OpenVPN plutôt que WireGuard dans ce cas"
    Sur le système utilisé pour cette procédure, **WireGuard n'a pas réussi à établir le tunnel**, tandis qu'**OpenVPN a fonctionné immédiatement**. Ce résultat concerne ce poste et ne signifie pas que WireGuard est défaillant sur toutes les installations d'Ubuntu.

## 5. Vérifier que le VPN fonctionne

Contrôler l'état du client :

~~~bash
sudo cyberghostvpn --status
~~~

Résultat attendu :

~~~text
VPN connection found.
~~~

Vérifier l'adresse IP publique IPv4 :

~~~bash
curl -4 ifconfig.io
~~~

Vérifier le pays associé à cette adresse IP :

~~~bash
curl -4 https://ipinfo.io/country
~~~

Pour la connexion de test, la dernière commande a retourné :

~~~text
BE
~~~

Cela confirme que la sortie **IPv4** était géolocalisée en Belgique. Ce test ne suffit pas, à lui seul, à établir l'absence de fuites **DNS**, **IPv6** ou **WebRTC**.

!!! info "Vérification complémentaire"
    Pour un contrôle de confidentialité complet, vérifier séparément les résolutions DNS, les éventuelles connexions IPv6 et le navigateur. Un VPN n'assure pas à lui seul l'anonymat.

## 6. Se déconnecter

~~~bash
sudo cyberghostvpn --stop
~~~

Puis vérifier :

~~~bash
sudo cyberghostvpn --status
~~~

Après déconnexion, la commande doit normalement signaler qu'aucune connexion VPN n'est active.

## 7. Dépannage

### Erreur : <code>cp: impossible d'évaluer 'cyberghost/*'</code>

**Symptômes :**

~~~text
Installing application ...
cp: impossible d'évaluer 'cyberghost/*': Aucun fichier ou dossier de ce nom
cyberghostvpn: commande introuvable
~~~

**Cause observée :** le script <code>install.sh</code> a été lancé depuis un dossier différent de celui de l'archive extraite.

**Solution :**

~~~bash
cd ~/Téléchargements/cyberghostvpn-ubuntu-22.04-1.5.0
ls -la cyberghost/
sudo bash ./install.sh
~~~

Si <code>cyberghost/</code> est absent, vérifier que l'archive téléchargée a été entièrement extraite et que le bon dossier est utilisé. Ne pas créer artificiellement un répertoire vide.

### WireGuard : connexion impossible

La commande suivante peut être utilisée si le protocole est pris en charge :

~~~bash
sudo cyberghostvpn --traffic --country-code BE --wireguard --connect
~~~

Lors du test, CyberGhost créait l'interface <code>cyberghost</code>, ajoutait les routes et tentait de configurer le DNS puis les règles <code>nftables</code>, avant de supprimer l'interface. Le message était :

~~~text
WIREGUARD error: cannot connect to server
No VPN connections found.
~~~

Le journal seul ne permet **pas** d'attribuer précisément l'échec au DNS, au pare-feu ou à une incompatibilité logicielle.

**Contournement confirmé :** se connecter avec OpenVPN :

~~~bash
sudo cyberghostvpn --country-code BE --openvpn --connect
~~~

En cas d'échec d'OpenVPN, tester le transport TCP :

~~~bash
sudo cyberghostvpn --country-code BE --tcp --connect
~~~

### Contrôles réseau non destructifs

~~~bash
ls -l /etc/resolv.conf
cat /etc/resolv.conf
systemctl is-active systemd-resolved
sudo nft list ruleset | head -60
~~~

!!! danger "Ne pas désactiver la sécurité réseau au hasard"
    Ne pas effacer les règles <code>nftables</code>, supprimer <code>/etc/resolv.conf</code> ni désactiver les services réseau pour essayer de forcer la connexion. Ces éléments peuvent être utilisés par Ubuntu, Docker et d'autres applications.

## 8. Tableau récapitulatif des commandes

| Action | Commande |
| --- | --- |
| Installer depuis le dossier extrait | <code>sudo bash ./install.sh</code> |
| Afficher l'aide | <code>sudo cyberghostvpn --help</code> |
| Liste des pays | <code>sudo cyberghostvpn --traffic --country-code</code> |
| Belgique avec OpenVPN | <code>sudo cyberghostvpn --country-code BE --openvpn --connect</code> |
| France avec OpenVPN | <code>sudo cyberghostvpn --country-code FR --openvpn --connect</code> |
| Belgique avec WireGuard | <code>sudo cyberghostvpn --traffic --country-code BE --wireguard --connect</code> |
| Vérifier l'état | <code>sudo cyberghostvpn --status</code> |
| Vérifier le pays de l'IP | <code>curl -4 https://ipinfo.io/country</code> |
| Se déconnecter | <code>sudo cyberghostvpn --stop</code> |
| Désinstaller | <code>sudo cyberghostvpn --uninstall</code> |

## 9. Désinstaller CyberGhost

~~~bash
sudo cyberghostvpn --uninstall
~~~

L'outil peut demander si la configuration existante doit être conservée en vue d'une réinstallation.

## Références officielles

- [CyberGhost — Installer l'application CLI sur Linux](https://support.cyberghostvpn.com/hc/fr/articles/360020436274-Installer-l-application-CLI-de-CyberGhost-VPN-sur-Linux)
- [CyberGhost — Commandes CLI sous Linux](https://support.cyberghostvpn.com/hc/fr/articles/360016669140-Commandes-CLI-de-CyberGhost-VPN-sous-Linux)
- [CyberGhost — Sélectionner un pays ou une ville](https://support.cyberghostvpn.com/hc/fr/articles/360020673194-S%C3%A9lectionner-un-pays-ou-une-ville-avec-l-application-CLI-de-CyberGhost-VPN-sous-Linux)
- [CyberGhost — Désinstaller sur Linux](https://support.cyberghostvpn.com/hc/fr/articles/360023116213-D%C3%A9sinstaller-CyberGhost-sur-Linux)

## Historique

| Date | Modification |
| --- | --- |
| 2026-11-04 | Première publication : installation et connexion OpenVPN en Belgique validées sous Ubuntu 26.04.1 ; dépannage de WireGuard documenté |
