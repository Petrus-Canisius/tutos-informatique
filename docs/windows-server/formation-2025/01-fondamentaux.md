---
title: 01 · Fondamentaux des infrastructures Windows Server
description: Comprendre les rôles serveurs, les processus, les protocoles, l'identité et les dépendances d'une infrastructure d'entreprise.
---

# Module 01. Comprendre une infrastructure Windows Server

<div class="ws25-meta"><span>Fondamentaux</span><span>8 h d'étude conseillées</span><span>2 exercices</span><span>Théorie et diagnostic</span></div>

## Objectifs observables

Au terme de ce module, l'apprenant sait expliquer la différence entre **machine, système, rôle, service et ressource**, reconstituer le trajet d'une ouverture de session de domaine, distinguer authentification et autorisation, établir une carte de dépendances et diagnostiquer une panne sans modifier au hasard les paramètres.

## 1. Système d'exploitation serveur : définition

Windows Server est un système d'exploitation destiné à fournir et administrer des services à plusieurs systèmes et utilisateurs. Comme Windows 11, il possède un noyau, un gestionnaire de mémoire, des pilotes, une pile réseau et un système de fichiers. Il se distingue par ses **rôles** (services d'annuaire, résolution DNS, DHCP, fichiers, virtualisation, certificats, etc.), ses modèles d'administration et ses fonctions de haute disponibilité.

Il faut distinguer six niveaux :

| Niveau | Définition | Exemple |
| --- | --- | --- |
| Matériel / hôte | Ressources physiques | CPU, RAM, NIC, SSD |
| Système | Windows Server et noyau | Windows Server 2025 |
| Processus | Programme en exécution | Processus PowerShell, lsass.exe |
| Service | Processus ou fonctionnalité pilotée par le Service Control Manager | DNS Server, Windows Time |
| Rôle | Ensemble cohérent de composants répondant à un besoin | AD DS, DNS, serveur de fichiers |
| Ressource | Objet fourni à un client | Partage SMB, enregistrement DNS, compte AD |

**Erreur classique :** confondre le logiciel serveur et le service fourni. Une VM qui démarre correctement ne signifie pas que le rôle DNS fonctionne, et un service DNS démarré ne garantit pas que la zone attendue contient des enregistrements corrects.

### Exercice mental

« Le serveur est joignable, mais l'utilisateur ne peut pas accéder au partage ». Qu'est-ce qui fonctionne vraiment ? Tout au plus, une certaine partie du réseau répond. Il reste à contrôler la résolution de nom, le port TCP 445, l'authentification, les permissions de partage, les ACL NTFS et la disponibilité du stockage.

## 2. Les couches et les flux

Un poste client ne dialogue pas « avec Active Directory » de manière abstraite. Il échange avec des services identifiés par des protocoles et des ports. Dans un domaine typique :

1. Le client utilise son serveur **DNS** pour découvrir les contrôleurs de domaine via des enregistrements SRV.
2. Il contacte un contrôleur de domaine, selon le service et la méthode d'authentification.
3. **Kerberos** peut émettre des tickets permettant l'authentification sur un service.
4. **LDAP** donne accès aux informations d'annuaire selon les droits du compte.
5. Le client applique des paramètres de domaine et éventuellement des **GPO**.
6. Un accès **SMB** au serveur de fichiers est ensuite autorisé ou refusé selon les identités et permissions.

~~~text
CLIENT01
   | 1. SRV / résolution DNS
   v
DC01 / DNS --------> Base AD DS (comptes, groupes, ordinateurs)
   | 2. Authentification Kerberos / LDAP
   v
CLIENT01
   | 3. Accès SMB : identité + ACL
   v
FS01 -------> Dossier NTFS
~~~

Ce schéma est volontairement simplifié. En pratique, de multiples contrôleurs, caches, tickets, stratégies et dépendances interviennent.

### Les protocoles à reconnaître

| Protocole | Usage courant | Port usuel |
| --- | --- | --- |
| DNS | Noms, recherche de services AD | UDP/TCP 53 |
| DHCP | Configuration IP | UDP 67/68 |
| Kerberos | Authentification | UDP/TCP 88 |
| LDAP / LDAPS | Interrogation sécurisée ou non de l'annuaire | TCP/UDP 389, TCP 636 |
| SMB | Partages et SYSVOL | TCP 445 |
| RPC | Administration et réplication, nombreux scénarios | TCP 135 et ports dynamiques |
| RDP | Session graphique distante | TCP 3389, UDP selon configuration |
| WinRM | Administration distante | TCP 5985/5986 par défaut |

Un port usuel **n'est pas** une invitation à l'ouvrir à tous. Restreindre les flux selon source, destination et rôle. Les communications AD et la réplication utilisent d'autres ports selon le scénario : ne pas confondre cette table pédagogique avec une matrice de pare-feu exhaustive.

## 3. Identité, authentification et autorisation

Une **identité** représente un utilisateur, un ordinateur ou un service. L'**authentification** établit que l'entité est bien celle qu'elle prétend être. L'**autorisation** détermine ensuite l'accès autorisé à une ressource.

L'utilisateur peut réussir son ouverture de session et recevoir « Accès refusé » sur un dossier : authentification réussie, autorisation insuffisante.

Les comptes locaux résident dans la base SAM de la machine ; les comptes de domaine sont gérés par AD DS et dépendent de la disponibilité des mécanismes d'authentification de domaine. Il faut aussi distinguer la connexion interactive, l'identité utilisée par un service et les autorisations effectives sur la ressource.

### Workgroup et domaine

Un **groupe de travail** correspond à des postes autonomes, gérant leurs comptes locaux. Un **domaine AD** centralise les identités et facilite les règles d'administration, mais introduit des dépendances critiques : DNS, réplication des contrôleurs de domaine, temps cohérent et sauvegardes appropriées.

La forêt définit une frontière logique majeure et un espace de confiance AD. Le domaine n'est ni un sous-réseau IP, ni un simple suffixe DNS. Une forêt peut comprendre plusieurs domaines ; plusieurs sous-réseaux et sites peuvent appartenir à un même domaine.

## 4. OS, processus, services et journaux

Le **noyau** arbitre les ressources, les appels système et la communication avec les pilotes. Les processus s'exécutent dans un contexte de sécurité. Certains services sont essentiels à l'identification, au réseau ou aux composants Windows ; leur désactivation arbitraire peut empêcher la connexion.

Le **Service Control Manager** démarre, arrête et surveille les services. Les journaux Windows enregistrent des événements système, applicatifs et de sécurité. Ils constituent des preuves, mais ne remplacent pas les tests fonctionnels.

Première inspection sur **une VM Windows Server**, dans PowerShell administrateur :

~~~powershell title="Lecture seule · Vue système"
Get-ComputerInfo | Select-Object CsName, WindowsProductName, WindowsVersion, OsBuildNumber
Get-Service | Group-Object Status | Select-Object Name, Count
Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Name, Id, CPU
Get-NetIPConfiguration
Get-NetTCPConnection -State Listen | Select-Object -First 20 LocalAddress,LocalPort,OwningProcess
~~~

- **Get-ComputerInfo** rapporte des informations système ; la version marketing et la build doivent être interprétées ensemble.
- **Get-Service** examine l'état déclaré des services, pas leur comportement complet.
- **Get-Process** identifie les processus consommant du temps CPU cumulé ; cela ne prouve pas une consommation instantanée.
- **Get-NetIPConfiguration** liste les paramètres réseau.
- **Get-NetTCPConnection** donne les ports TCP en écoute. Il ne liste pas les sockets UDP.

Inspection des événements système récents :

~~~powershell title="Lecture seule · Événements système"
Get-WinEvent -FilterHashtable @{LogName='System'; Level=2; StartTime=(Get-Date).AddHours(-24)} -MaxEvents 20 |
    Select-Object TimeCreated, ProviderName, Id, Message
~~~

La commande peut ne rien renvoyer si aucun événement répond au filtre. Certains journaux nécessitent une élévation de privilèges.

## 5. Méthode de diagnostic en couches

Une pratique professionnelle consiste à **formuler une hypothèse testable** et à recueillir une preuve pour chaque maillon.

Exemple : CLIENT01 échoue à ouvrir le partage nommé \\FS01\Commun.

| Étape | Hypothèse | Contrôle | Interprétation |
| --- | --- | --- | --- |
| 1 | Mauvaise IP | Get-NetIPConfiguration | Adresse et masque plausibles ? |
| 2 | DNS incorrect | Resolve-DnsName FS01.ad.entreprise.test | Adresse attendue obtenue ? |
| 3 | Service inaccessible | Test-NetConnection FS01 -Port 445 | Connectivité TCP établie ? |
| 4 | Authentification | klist | Ticket pertinent présent ? |
| 5 | Autorisation | Get-SmbShareAccess et ACL NTFS côté serveur | Droits effectifs suffisants ? |
| 6 | Stockage | Get-Volume côté serveur | Volume disponible ? |

**Nuance importante :** un test TCP 445 réussi ne confirme pas que SMB, les tickets et les ACL fonctionnent. Un test ICMP échoué ne démontre pas non plus que le serveur est hors ligne.

## 6. Disponibilité, résilience et continuité

- **Disponibilité :** aptitude à fournir le service au moment demandé.
- **Redondance :** duplication planifiée d'un composant, pas nécessairement basculement automatique.
- **Haute disponibilité :** mécanismes permettant de maintenir le service malgré certaines défaillances.
- **Sauvegarde :** copie récupérable de données et configurations.
- **PRA :** organisation de la reprise après incident majeur.
- **RPO :** quantité maximale de données qu'on accepte de perdre, exprimée en durée.
- **RTO :** durée maximale ciblée avant reprise.

Deux contrôleurs de domaine peuvent améliorer la résilience de l'authentification, mais **ne remplacent pas** la sauvegarde d'Active Directory. Un cluster qui réplique une suppression accidentelle ne restaure pas cette donnée.

## TP 01-A : dresser l'inventaire

**Scénario.** Vous arrivez dans une entreprise dont les serveurs sont peu documentés. À partir d'une VM de laboratoire, relevez nom du système, build, interfaces réseau, DNS, services arrêtés et cinq erreurs système récentes.

1. Exécuter les commandes de la section 4.
2. Produire une fiche de configuration datée, sans mot de passe ni information personnelle.
3. Distinguer observation, anomalie et hypothèse. Un service arrêté peut simplement être à démarrage manuel.

**Validation :** les IP et DNS affichés correspondent au plan du laboratoire ; les journaux portent une date et un ID d'événement ; aucune commande n'a modifié la VM.

**Corrigé :** les deux premières colonnes d'une fiche d'inventaire sont « valeur observée » et « source/commande ». On ne qualifie pas d'incident un événement isolé sans contexte.

## TP 01-B : expliquer une panne SMB

**Scénario.** Un client résout le nom FS01 vers 10.50.0.20, mais la connexion SMB échoue.

1. Relever la résolution DNS.
2. Tester **Test-NetConnection FS01 -Port 445**.
3. Établir deux arbres de décision : TCP échoue / TCP réussit.
4. Proposer les contrôles suivants avant toute modification.

**Corrigé :** si TCP échoue, examiner l'IP du serveur, l'acheminement, le pare-feu et l'écoute du service. Si TCP réussit, poursuivre avec les identités, le service SMB, le chemin du partage et les permissions. Le simple succès DNS ne prouve rien au-delà de la résolution de nom.

## Auto-évaluation

1. Pourquoi un serveur accessible en ICMP peut-il être inutilisable ?
2. Pourquoi DNS est-il une dépendance critique d'AD DS ?
3. Quelle différence entre authentification et autorisation ?
4. Pourquoi une seconde VM n'est-elle pas automatiquement une architecture haute disponibilité ?
5. Quelle preuve minimale garder avant de modifier une configuration réseau ?

??? success "Éléments de correction"
    1. ICMP ne valide ni les ports applicatifs ni les services. 2. AD utilise DNS, notamment ses enregistrements SRV, pour découvrir les contrôleurs de domaine. 3. L'authentification établit l'identité ; l'autorisation attribue les droits. 4. Il faut prévoir mécanismes de basculement, dépendances, tests et ressources distinctes. 5. Sauvegarde de la configuration, accès console et retour arrière documenté.

**Sources :** [Windows Server](https://learn.microsoft.com/fr-fr/windows-server/), [Active Directory Domain Services](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/), [Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/).

[← Laboratoire](laboratoire/) · [Module 02 : éditions et nouveautés →](02-editions/)
