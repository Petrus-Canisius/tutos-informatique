---
title: 19 · Durcissement et sécurité de Windows Server 2025
description: Stratégies de moindre privilège, VBS, Credential Guard, Defender, protection des protocoles et méthodes d'audit.
---

# Module 19. Durcir et sécuriser Windows Server 2025

<div class="ws25-meta"><span>Sécurité</span><span>12 h conseillées</span><span>2 TP</span><span>Administration défensive</span></div>

## Objectifs

Identifier les surfaces d'attaque d'un serveur, concevoir un socle de durcissement tenant compte de l'édition et du matériel, mesurer les protections **réellement actives**, réduire les privilèges et traiter les incompatibilités sans dégrader l'exploitation.

## 1. Le durcissement n'est pas une simple liste de cases

Un serveur bien protégé doit satisfaire plusieurs conditions simultanément :

1. **Identités sûres** : comptes administrateurs distincts, authentification forte lorsque prise en charge, délégations minimales.
2. **Surface exposée maîtrisée** : uniquement les services, ports et protocoles nécessaires.
3. **Plateforme protégée** : démarrage fiable, contrôles matériels, correctifs.
4. **Données et secrets sécurisés** : permissions, chiffrement, sauvegardes, gestion des clés.
5. **Détection** : logs exploitables, centralisation, alertes et capacité d'enquête.
6. **Récupération** : plan de restauration testé et validé.

La sécurité ne doit pas rendre une panne impossible à diagnostiquer. Tout paramètre imposé doit avoir un objectif, un propriétaire, une méthode de test et un retour arrière.

## 2. Stratégie Zero Trust et séparation des privilèges

Le principe du **moindre privilège** consiste à donner uniquement les permissions nécessaires à une tâche, pour une durée et un périmètre définis. Une session administrative sur DC01 n'a pas à utiliser le même compte que la navigation Internet.

Sur un domaine, distinguer :
- comptes ordinaires des collaborateurs ;
- comptes d'administration des postes ;
- comptes d'administration des serveurs membres ;
- comptes à privilèges de domaine/forêt ;
- comptes de service gérés quand ils sont compatibles.

Le modèle traditionnel de **tiering** peut guider cette séparation. Les architectures actuelles doivent également tenir compte de la gestion des identités hybrides, des postes d'administration privilégiée et des chemins d'élévation de privilèges.

### Vérifier le contexte de sécurité

~~~powershell title="Lecture seule · Identité et groupes"
whoami /user
whoami /groups
whoami /priv
Get-LocalGroupMember -Group "Administrators"
~~~

La dernière commande interroge les administrateurs locaux sur un **serveur membre**. Sur un contrôleur de domaine, le modèle de comptes et de groupes locaux diffère : **ne pas appliquer sans distinction les procédures de serveurs membres aux DC**.

## 3. Le rôle de VBS, de Credential Guard et de Secure Boot

**Virtualization-Based Security (VBS)** utilise la virtualisation matérielle pour isoler certains composants sensibles. **Credential Guard** peut protéger certains secrets d'authentification contre des attaques sur l'OS principal. **Secure Boot** vérifie des aspects de la chaîne de démarrage.

Ces protections dépendent de la plateforme, des capacités matérielles, du firmware et de la configuration. Une VM avec Secure Boot actif n'implique pas automatiquement que Credential Guard soit opérationnel.

Vérification :

~~~powershell title="Lecture seule · VBS et protections"
Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard |
    Select-Object -Property VirtualizationBasedSecurityStatus,SecurityServicesConfigured,SecurityServicesRunning
Confirm-SecureBootUEFI
~~~

**Confirm-SecureBootUEFI** ne fonctionne pas dans tous les contextes, notamment sans firmware UEFI ou privilèges appropriés. Le résultat VBS doit être interprété selon la documentation de la version réellement installée.

Ne pas activer des protections de virtualisation sur un hôte critique sans étudier leur effet sur les performances, la compatibilité et les fonctionnalités disponibles.

## 4. Microsoft Defender et réduction de surface d'attaque

Microsoft Defender Antivirus analyse les fichiers et comportements pris en charge. Il convient de vérifier les modes de fonctionnement et les politiques d'exclusions. Une exclusion trop large, comme tout le lecteur système, neutralise une partie significative des contrôles.

~~~powershell title="Lecture seule · État Defender"
Get-MpComputerStatus |
    Select-Object AMServiceEnabled,AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureLastUpdated
Get-MpPreference |
    Select-Object ExclusionPath,ExclusionProcess,PUAProtection
~~~

Une politique **Defender for Endpoint**, le cas échéant, apporte une couche de détection et réponse différente des fonctions de l'antivirus local. Sa disponibilité dépend de licences et de l'intégration choisie.

### Baselines de sécurité

Les **baselines Microsoft** fournissent des configurations recommandées. Leur application doit suivre un cycle :
1. inventorier les rôles et logiciels ;
2. comparer la baseline à l'existant ;
3. tester dans une OU pilote ;
4. constater les impacts ;
5. valider le changement ;
6. appliquer par groupes contrôlés ;
7. surveiller et conserver un retour arrière.

Une baseline destinée à un serveur membre peut être inadaptée à un contrôleur de domaine ou à un serveur d'application.

## 5. Protéger Kerberos, LDAP, SMB, NTLM et RDP

| Service | Risque | Contrôle de défense |
| --- | --- | --- |
| Kerberos | Secrets exposés, mauvaise configuration des comptes de service | Comptes de service gérés, chiffrement approprié, synchronisation temporelle |
| LDAP | Connexion ou liaison insuffisamment protégée | Signature LDAP, protection du canal selon scénario, TLS adapté |
| SMB | Protocoles anciens et accès trop larges | Désactivation de SMB1, signature/chiffrement quand requis, ACL et filtrage |
| NTLM | Héritage et mécanismes faibles | Inventaire des dépendances puis stratégie progressive de réduction |
| RDP | Accès administrateur exposé | Réseau de gestion, authentification forte et restriction d'accès |
| WinRM | Exécution de commandes à distance | Portée réseau, identité, journalisation, configuration sécurisée |

**Ne pas désactiver NTLM ou imposer LDAP signing sans mesurer les dépendances** : certains équipements, applications ou services anciens peuvent perdre la connexion. La séquence professionnelle est *observer, tester, migrer, imposer*.

Inspection du pare-feu :

~~~powershell title="Lecture seule · Pare-feu"
Get-NetFirewallProfile | Select-Object Name,Enabled,DefaultInboundAction,DefaultOutboundAction
Get-NetFirewallRule -Enabled True -Direction Inbound |
    Group-Object Action | Select-Object Name,Count
~~~

L'absence de règle explicite ne signifie pas automatiquement qu'un port est accessible ou fermé : tenir compte des profils, politiques de domaine et règles effectives.

## 6. Journaliser et préparer la réponse

Le journal **Security** de Windows permet d'examiner des événements d'authentification et d'administration. Le volume d'événements doit rester compatible avec le stockage et la centralisation. Il faut configurer l'audit selon les objectifs : trop peu de journaux empêche l'analyse, trop d'événements rend la détection inexploitable.

Le module suivant détaille Windows Event Forwarding, Sysmon et la méthode d'investigation.

## TP 19-A : audit d'une baseline

**Contexte.** APP01 doit être administré depuis MGMT01 et héberger une application interne, sans exposition Internet.

**Livrable :** matrice « contrôle / état observé / risque / action envisagée / validation ». Relever les états Defender, pare-feu, comptes administrateurs, RDP/WinRM et VBS.

**Critères de succès :** chaque mesure est justifiée ; les commandes restent en lecture seule ; aucune règle n'est supprimée arbitrairement. **Corrigé :** une protection « configurée » n'est pas toujours « active » ; il faut utiliser des indicateurs d'exécution et examiner les causes d'incompatibilité.

## TP 19-B : concevoir une réduction de NTLM

**Contexte.** Une application ancienne utilise peut-être NTLM. La direction souhaite l'interdire immédiatement.

**Mission :** produire un plan de migration incluant inventaire des dépendances, journalisation, identité de test, démonstration de compatibilité Kerberos, groupes pilotes, déploiement progressif et retour arrière.

**Corrigé :** une interdiction globale sans inventaire pourrait provoquer des interruptions de service. Il faut identifier l'application et son fonctionnement avant d'imposer la nouvelle politique.

## Contrôle des acquis

1. Pourquoi Credential Guard ne peut-il pas être déclaré actif sur la seule base de sa disponibilité ?
2. Une exclusion antivirus large est-elle une optimisation anodine ?
3. Pourquoi les paramètres d'un DC doivent-ils être distingués de ceux d'un serveur membre ?
4. Quel est l'ordre pertinent pour réduire un protocole hérité ?

??? success "Correction"
    1. Il faut contrôler les services effectivement exécutés et les prérequis matériels. 2. Non, elle réduit la surface protégée. 3. Les rôles et les frontières d'identité diffèrent. 4. Inventaire, observation, tests pilotes, migration, application et supervision.

## Références Microsoft

- [Windows Server security](https://learn.microsoft.com/en-us/windows-server/security/security-and-assurance)
- [Credential Guard](https://learn.microsoft.com/en-us/windows/security/identity-protection/credential-guard/)
- [Windows LAPS](https://learn.microsoft.com/fr-fr/windows-server/identity/laps/laps-overview)
- [Windows Firewall](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/)

[← Module 18](18-clustering.md) · [Module 20 : investigation →](20-incidents.md)
