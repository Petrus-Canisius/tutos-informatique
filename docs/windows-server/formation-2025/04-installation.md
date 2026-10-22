---
title: 04 · Installer et configurer Windows Server 2025
description: Installer Server Core ou Desktop Experience dans Hyper-V, configurer nom, IP, temps et contrôles de démarrage.
---

# Module 04. Installer et préparer Windows Server 2025

<div class="ws25-meta"><span>Installation</span><span>9 h conseillées</span><span>3 ateliers</span><span>Hyper-V et Server Core</span></div>

!!! danger "Installation destructrice"
    Le programme d'installation peut **effacer le disque cible**. Dans ce cours, sélectionner exclusivement le **VHDX neuf de la VM de test**. Ne jamais démarrer la procédure d'installation sur le disque système de l'hôte ou une machine de production.

## 1. Préparatifs avant installation

Le [laboratoire Hyper-V](laboratoire/) doit être prêt : commutateur privé LAB-WS2025, VM Génération 2 nommée DC01, 2 vCPU, 4 Go de RAM de départ et disque virtuel neuf. Ces caractéristiques sont des exemples pédagogiques, pas des minima garantis pour tout usage.

Préparer une image ISO **officielle**, vérifier son origine, sa version, la licence et le bon fonctionnement du support. Ne pas utiliser d'image modifiée ou téléchargée depuis un distributeur non identifié.

### Core ou Desktop Experience

Une installation **Server Core** démarre sans bureau complet ; sa configuration s'effectue notamment avec **SConfig**, PowerShell ou des consoles distantes. L'interface **Desktop Experience** permet une administration graphique locale. Pour connaître les deux, créer successivement deux VM, sans changer de mode dans une installation existante.

### Démarrage UEFI

Les VM Hyper-V de **génération 2** utilisent un firmware UEFI. Vérifier la configuration de Secure Boot selon le système invité et l'image utilisée, ainsi que l'ordre de démarrage. Si l'ISO n'est pas amorcée, inspecter le lecteur DVD virtuel et son rang dans les entrées du firmware.

## 2. Installer le système dans la VM

1. Ouvrir Gestionnaire Hyper-V sur **l'hôte**.
2. Démarrer DC01 et ouvrir sa console via **Se connecter**.
3. Amorcer sur l'ISO du système.
4. Choisir langue, clavier, édition et option d'installation attendues.
5. Contrôler les conditions de licence.
6. Sélectionner **uniquement le disque virtuel vide** de DC01.
7. Lancer l'installation et laisser la VM redémarrer.
8. Définir un mot de passe administrateur unique et fort, jamais stocké dans un dépôt.
9. Ouvrir une session sur la console.
10. Noter le type d'installation retenu et la build.

L'affichage et l'ordre exact des écrans évoluent selon le média ; suivre les invites du programme d'installation officiel.

## 3. Première configuration : nom, réseau et fuseau

### Avec SConfig

Sur Server Core, **SConfig** s'ouvre normalement après connexion. On peut le démarrer explicitement :

~~~powershell title="VM DC01 · Console"
SConfig
~~~

SConfig permet notamment de renommer l'ordinateur, de configurer les adaptateurs et DNS, d'administrer les mises à jour, de joindre un domaine et de définir certains paramètres de gestion. **Le menu change selon les versions** ; lire les options réellement affichées plutôt que d'appliquer aveuglément un numéro mémorisé.

### Avec PowerShell

Relever **d'abord** la configuration :

~~~powershell title="VM DC01 · Lecture seule"
hostname
Get-NetAdapter
Get-NetIPConfiguration
Get-DnsClientServerAddress -AddressFamily IPv4
Get-TimeZone
Get-Date
~~~

Renommer le serveur si l'installation lui a donné un nom temporaire, en console locale administrateur :

~~~powershell title="VM DC01 · Modifie le nom et demande un redémarrage"
Rename-Computer -NewName "DC01" -Restart
~~~

Ce changement interrompt la session. **Ne pas lancer sur une machine déjà intégrée à un domaine** sans étudier ses dépendances et permissions.

Après redémarrage, configurer l'IPv4 fixe **uniquement sur l'interface du vSwitch privé** :

~~~powershell title="VM DC01 · Configure IP statique du laboratoire"
Get-NetAdapter
$interface = "Ethernet" # Remplacer par l'alias affiché
New-NetIPAddress -InterfaceAlias $interface -IPAddress "10.50.0.10" -PrefixLength 24
Set-DnsClientServerAddress -InterfaceAlias $interface -ServerAddresses "10.50.0.10"
Get-NetIPConfiguration -InterfaceAlias $interface
~~~

Sans passerelle dans le réseau privé. Avant la mise en place de DNS sur DC01, **Resolve-DnsName** n'a pas vocation à résoudre les noms via 10.50.0.10. C'est la suite AD DS/DNS qui permettra la résolution de domaine.

**Attention aux erreurs :** si l'adaptateur possède déjà une configuration IPv4 statique, la commande **New-NetIPAddress** peut échouer ou créer un état inattendu. Examiner l'existant avant toute modification ; ne pas supprimer une IP de production.

### Temps et synchronisation

Kerberos est sensible aux écarts d'horloge. En virtualisation, les sources de temps doivent être cohérentes avec l'architecture AD, en particulier après la promotion des contrôleurs de domaine. Ne pas paramétrer de manière arbitraire un ensemble de sources NTP contradictoires.

~~~powershell title="VM DC01 · Consultation du temps"
Get-Date
w32tm /query /status
w32tm /query /configuration
~~~

L'absence d'une source de temps AD avant création du domaine est normale ; le diagnostic doit tenir compte de l'étape du parcours.

## 4. Installer les rôles sans les confondre avec la configuration

Le rôle **DNS** ou **AD DS** s'installe comme une fonctionnalité, puis se **configure**. Installer les binaires d'AD DS ne transforme pas, à lui seul, une machine en contrôleur de domaine.

~~~powershell title="VM DC01 · Voir les rôles disponibles"
Get-WindowsFeature | Where-Object Name -in @("AD-Domain-Services", "DNS", "FS-FileServer")
~~~

~~~powershell title="VM de test · Installer le rôle DNS, sans créer de zone"
Install-WindowsFeature -Name DNS -IncludeManagementTools
Get-WindowsFeature -Name DNS
~~~

**Note pédagogique :** dans le scénario fil rouge, la promotion AD DS installe par défaut DNS lorsque l'option correspondante est conservée. Cette démonstration du rôle DNS peut donc être faite sur une **VM auxiliaire** pour éviter un état intermédiaire inutile de DC01. Ne pas installer des services simplement pour les essayer sur un serveur qui doit ensuite devenir contrôleur de domaine.

## 5. Administration distante et exposition

**RDP**, **WinRM** et **Windows Admin Center** ont des objectifs différents. L'accès distant ne doit pas être activé « partout » par facilité.

- RDP : accès à une session graphique lorsqu'elle est disponible.
- WinRM / PowerShell Remoting : administration à distance pilotée par des commandes.
- RSAT : outils d'administration depuis un poste de gestion.
- Windows Admin Center : interface d'administration web reposant sur des connexions vers les machines gérées.

Dans le laboratoire privé, privilégier initialement la **console Hyper-V**. Ne pas ouvrir 3389, 5985 ou 5986 depuis Internet. Pour un environnement professionnel, définir la zone d'administration, les identités autorisées et le chiffrement requis.

## 6. Contrôle de mise en service

Effectuer ces contrôles sur DC01 :

~~~powershell title="VM DC01 · Contrôle après installation"
Get-ComputerInfo | Select-Object CsName,WindowsProductName,OsBuildNumber
Get-NetIPConfiguration
Get-Service -Name W32Time
Get-Volume | Select-Object DriveLetter,FileSystem,SizeRemaining
Get-WinEvent -FilterHashtable @{LogName="System";Level=2;StartTime=(Get-Date).AddDays(-1)} -MaxEvents 10 |
    Select-Object TimeCreated,Id,ProviderName,Message
~~~

**Critères de succès :** le serveur porte le nom attendu, ne dépend pas du réseau physique, dispose d'une IP du segment privé, d'un volume avec espace libre et peut redémarrer sur son VHDX sans l'ISO. Les journaux sont examinés, pas simplement ignorés.

## 7. Stratégie de retour arrière

Avant installation ou changement IP : garder la console de la VM, relever les adresses, sauvegarder les fichiers de configuration et vérifier qu'aucune dépendance réelle n'existe. Une VM de laboratoire encore vierge peut être **supprimée et recréée** après validation de la cible. Cela ne convient pas à une VM tenant un rôle AD ou contenant des données.

**Ne jamais considérer un checkpoint comme substitut de sauvegarde**, notamment après ajout d'AD DS. Planifier des sauvegardes cohérentes et des tests de restauration.

## TP 04-A : installation Core

**Objectif.** Installer un système Server Core dans une VM neuve. **Prérequis.** Hyper-V, ISO légitime, vSwitch privé. **Étapes.** Choisir l'image Core ; installer sur VHDX neuf ; configurer mot de passe ; afficher SConfig ; relever build et nom. **Validation.** Le système démarre sans bureau classique et SConfig répond. **Retour arrière.** Restaurer une VM vierge conservée à l'arrêt, ou supprimer uniquement la VM de test vérifiée.

## TP 04-B : installation Desktop Experience

Même procédure sur une VM **TEST-GUI** distincte. Comparer les outils locaux, ressources utilisées et administration distante. **Corrigé :** Desktop facilite les consoles locales ; Core privilégie l'automatisation. Les deux gardent leurs obligations de correctifs et de durcissement.

## TP 04-C : panne de DNS volontaire

**Scénario.** DC01 dispose de 10.50.0.10 et tente de résoudre **ad.entreprise.test** avant l'installation du rôle DNS.

**Questions :** l'IP est-elle en panne ? la résolution peut-elle fonctionner ? quel résultat attend-on après promotion AD DS et création de la zone ?

**Corrigé :** la connectivité IP et la disponibilité DNS sont indépendantes. Avant création du service/zone, l'échec DNS est prévisible. Après configuration, interroger les enregistrements de la zone et les SRV du domaine avec Resolve-DnsName. Éviter de remplacer le DNS interne par un DNS public : cela masquerait le problème sans fournir les zones AD.

## QCM de contrôle

1. L'installation du rôle AD DS suffit-elle à créer un domaine ?
2. Quelle est la méthode la plus sûre pour configurer le premier serveur sans réseau externe ?
3. Pourquoi vérifier un alias d'interface avant New-NetIPAddress ?
4. Peut-on considérer un checkpoint comme sauvegarde de contrôleur de domaine ?
5. Une installation Core peut-elle être administrée à distance ?

??? success "Correction"
    1. Non, il faut promouvoir/configurer un contrôleur de domaine. 2. Console Hyper-V avec vSwitch privé. 3. Pour éviter de modifier la mauvaise carte. 4. Non. 5. Oui, par des outils appropriés tels que PowerShell Remoting, RSAT ou WAC.

## Sources Microsoft

- [Installer Windows Server](https://learn.microsoft.com/fr-fr/windows-server/get-started/install-windows-server)
- [SConfig sur Server Core](https://learn.microsoft.com/fr-fr/windows-server/administration/server-core/server-core-sconfig)
- [Exigences matérielles](https://learn.microsoft.com/fr-fr/windows-server/get-started/hardware-requirements)
- [Administration et rôles](https://learn.microsoft.com/en-us/windows-server/administration/)

[← Module 03](03-architecture/) · [Retour au programme](index.md)
