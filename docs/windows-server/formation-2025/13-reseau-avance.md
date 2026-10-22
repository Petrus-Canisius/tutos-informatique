---
title: 13 · Réseaux avancés, routage, VPN et NPS
description: Comprendre le routage, les VLAN, le filtrage, les accès distants et les politiques NPS/RADIUS.
---

# Module 13. Réseaux avancés et accès distants

<div class="ws25-meta"><span>Réseaux</span><span>9 h conseillées</span><span>2 TP</span><span>Sécurité des flux</span></div>

## 1. Passer du sous-réseau à l'infrastructure multisite

Un serveur peut être parfaitement configuré et néanmoins inaccessible en raison d'un problème de **routage**, de **filtrage** ou de résolution de noms. Dans le laboratoire initial, les machines communiquent sur 10.50.0.0/24 sans routeur. En entreprise, plusieurs VLAN et sous-réseaux nécessitent des équipements de couche 3 ou des fonctions de routage adaptées.

| Élément | Fonction | Erreur fréquente |
| --- | --- | --- |
| Adresse IP | Identifie une interface dans un contexte réseau | Doublon d'adresse |
| Masque/préfixe | Détermine le périmètre du réseau local | Mauvaise longueur de préfixe |
| Passerelle | Acheminement hors du sous-réseau | Passerelle absente ou erronée |
| VLAN | Segmente des domaines de diffusion Ethernet | Confondre VLAN et règle de pare-feu |
| Pare-feu | Autorise ou bloque des flux selon critères | Ouvrir tous les ports pour corriger un test |
| Relais DHCP | Transporte certaines requêtes DHCP entre segments | Penser que DHCP traverse seul les routeurs |

Ne pas configurer une passerelle fictive sur le réseau privé de base : elle ne fournirait aucun accès utile.

## 2. Diagnostic routage et ports

Sur une VM Windows :

~~~powershell title="Lecture seule · Réseau"
Get-NetIPConfiguration
Get-NetRoute -AddressFamily IPv4 | Sort-Object RouteMetric
Get-NetNeighbor -AddressFamily IPv4
Test-NetConnection 10.50.0.10 -Port 53
Get-NetFirewallProfile | Select-Object Name,Enabled,DefaultInboundAction
~~~

**Get-NetRoute** affiche les routes, dont celles directement connectées. **Test-NetConnection** vérifie un flux TCP déterminé. Une absence de réponse ICMP ne doit pas être interprétée sans examiner la politique de pare-feu.

### Matrice de flux

Pour toute application, noter :
- la machine source ;
- l'adresse ou zone destination ;
- le protocole TCP, UDP ou autre ;
- le port et le sens de la connexion ;
- le composant applicatif ;
- les contrôles de sécurité ;
- la raison métier ;
- la personne qui a approuvé le flux.

Un tableau de ports générique ne remplace pas une matrice propre à l'infrastructure et à la version logicielle.

## 3. IPv6

IPv6 n'est pas simplement IPv4 avec des adresses plus longues. Il fait intervenir des mécanismes propres de découverte de voisins et de configuration des adresses. Dans un domaine Windows moderne, **désactiver IPv6 partout** pour contourner un problème DNS est une mauvaise pratique, sauf justification explicite dans une architecture particulière.

Définir une stratégie cohérente : routage IPv6, DNS AAAA, pare-feu IPv6, supervision et compatibilité des applications. Ne pas laisser des règles IPv6 moins strictes que les règles IPv4.

## 4. VPN et rôle Accès à distance

Le rôle **Accès à distance** de Windows Server peut fournir des services VPN, routage et proxy d'application selon les composants retenus. Un VPN doit reposer sur une méthode d'authentification appropriée, des certificats lorsque nécessaire, une politique d'autorisation et un filtrage des ressources auxquelles l'utilisateur peut accéder.

Une connexion VPN chiffrée n'est pas un droit implicite d'accès à tout le réseau. La segmentation et les ACL s'appliquent toujours.

**Projet de déploiement :**
1. Identifier le protocole VPN réellement pris en charge par les clients.
2. Concevoir l'identité et les facteurs d'authentification.
3. Préparer certificats et DNS.
4. Définir le pool d'adresses et les routes.
5. Décrire les règles de pare-feu et les ressources accessibles.
6. Tester l'accès autorisé et refusé.
7. Centraliser les journaux.

!!! warning "Ne pas exposer le laboratoire"
    Le présent cursus ne déploie aucun VPN de test sur l'IP publique du domicile ou de l'entreprise. Tous les essais d'accès distant restent confinés à une topologie isolée. Un rôle RAS mal exposé constitue une surface d'attaque.

## 5. NPS et RADIUS

**Network Policy Server** (NPS) peut agir comme serveur RADIUS pour appliquer des politiques d'accès réseau. Dans une architecture Wi-Fi entreprise ou VPN, il s'agit de distinguer :
- l'équipement **client RADIUS** (contrôleur Wi-Fi, VPN ou commutateur) ;
- le service **NPS** ;
- la source d'identité ;
- la règle d'autorisation ;
- les certificats ou secrets partagés, gérés hors dépôt public.

Ne pas confondre l'authentification réussie avec une autorisation réseau illimitée. Établir aussi la politique de journalisation et le traitement des refus.

## 6. Sécurité de l'hôte et sécurité du réseau

Windows Defender Firewall protège un hôte mais ne remplace pas un filtrage inter-VLAN. Un service peut nécessiter plusieurs flux. Créer une règle permissive pour « voir si ça marche » sans documentation rend la solution difficile à sécuriser par la suite.

Inspection sans changement :

~~~powershell title="Lecture seule · Pare-feu"
Get-NetFirewallProfile
Get-NetFirewallRule -Enabled True | Group-Object Direction,Action |
    Select-Object Name,Count
~~~

Les commandes modifiant des règles devraient être préparées dans un plan de changement avec test, validation et retour arrière.

## TP 13-A : établir une matrice de flux

**Scénario.** CLIENT01 ne peut pas consulter le service de fichiers FS01. Identifier les flux nécessaires entre client, DNS/AD et serveur de fichiers. Préparer une matrice sans ouvrir de nouveau port.

**Critères.** Les services DNS, Kerberos/LDAP selon scénario et SMB sont correctement distingués ; les tests correspondent à des ports et cibles. **Corrigé :** un seul test TCP/445 ne prouve ni l'autorisation SMB ni l'état des dépendances d'identité.

## TP 13-B : dossier d'architecture VPN/RADIUS

**Scénario.** 30 employés mobiles doivent accéder à une application interne sans visibilité sur le réseau d'administration.

**Livrables.** Flux, identité, certificats, politiques NPS envisagées, segmentation, supervision et plan de test. **Corrigé :** le VPN doit donner accès à une destination métier définie, pas à l'intégralité du LAN, et les secrets ne figurent pas dans le dossier public.

## Révision

1. Pourquoi une VLAN ne garantit-il pas un contrôle des flux ?
2. Quelle différence entre serveur RADIUS et client RADIUS ?
3. Pourquoi ne pas désactiver IPv6 simplement parce qu'un nom DNS ne se résout pas ?

??? success "Correction"
    Le VLAN sépare des domaines de diffusion, le filtrage doit être explicite. Le client RADIUS est généralement l'équipement d'accès, le serveur NPS applique les règles. Le problème doit être diagnostiqué sur les mécanismes DNS/IPv6 sans suppression aveugle d'une pile réseau.

**Sources :** [Accès à distance Windows Server](https://learn.microsoft.com/fr-fr/windows-server/remote/remote-access/remote-access), [Installer un VPN RAS](https://learn.microsoft.com/fr-fr/windows-server/remote/remote-access/get-started-install-ras-as-vpn), [Windows Firewall](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/).

[← Module 12](12-dhcp.md) · [Module 14 : stockage →](14-stockage.md)
