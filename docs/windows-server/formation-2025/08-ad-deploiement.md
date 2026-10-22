---
title: 08 · Déployer et vérifier Active Directory 2025
description: Promotion de DC01, ajout de DC02, DNS AD, validation de SYSVOL et diagnostic de la réplication.
---

# Module 08. Déployer un domaine Active Directory

<div class="ws25-meta"><span>AD DS opérationnel</span><span>12 h conseillées</span><span>2 TP</span><span>Création d'une forêt de test</span></div>

!!! danger "Promotion de contrôleur : environnement isolé uniquement"
    Installer ou promouvoir AD DS transforme profondément le serveur, ses services et son identité. Les exemples suivants sont **destinés aux VM neuves du laboratoire privé 10.50.0.0/24**. Ne jamais promouvoir un serveur déjà utilisé en entreprise sans étude de migration, inventaire, sauvegarde et procédure approuvée.

## 1. Préparer les machines et le domaine

Avant toute promotion :

- **DC01** et **DC02** sont deux VMs Windows Server 2025 distinctes sur le vSwitch privé.
- DC01 possède le nom approprié et **10.50.0.10/24**.
- DC02 possède le nom approprié et **10.50.0.11/24**.
- Toutes les machines conservent un temps cohérent.
- Les disques possèdent un espace suffisant et leurs sauvegardes initiales sont identifiées.
- L'édition et l'image Windows Server sont conformes aux besoins.
- Le domaine **ad.entreprise.test** n'existe pas déjà dans le laboratoire.

!!! info "DNS avant et après installation"
    Pour la création de la première forêt, DC01 n'a pas encore d'enregistrements DNS AD. Le processus de promotion peut installer et configurer le rôle DNS. Après la promotion, il faut valider la zone, les enregistrements SRV et la résolution. Pour DC02, configurer initialement le client DNS vers **10.50.0.10**, puis définir une stratégie DNS interne redondante une fois les deux DC opérationnels.

## 2. Installer les binaires du rôle

Sur **DC01**, ouvrir PowerShell administrateur local :

~~~powershell title="DC01 · Installe le rôle"
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Get-WindowsFeature -Name AD-Domain-Services
~~~

Le succès de cette commande installe le rôle, mais **DC01 n'est pas encore un contrôleur de domaine**. C'est la promotion qui crée la base, les services et le domaine.

## 3. Créer la forêt

### Méthode graphique

Sur une installation avec bureau :
1. Ouvrir **Gestionnaire de serveur**.
2. Choisir l'ajout de rôles et fonctionnalités si AD DS n'est pas installé.
3. Utiliser la notification de promotion en contrôleur de domaine.
4. Choisir **Ajouter une nouvelle forêt**.
5. Indiquer **ad.entreprise.test**.
6. Sélectionner les options et les niveaux fonctionnels compatibles avec les DC prévus, et garder DNS pour le scénario.
7. Définir un mot de passe de restauration DSRM fort et distinct.
8. Examiner les chemins de base, journaux et SYSVOL.
9. Lancer les vérifications de prérequis.
10. Corriger les erreurs bloquantes puis confirmer la promotion.

### Méthode PowerShell

~~~powershell title="DC01 · Modifie le système et crée une forêt"
Install-ADDSForest -DomainName "ad.entreprise.test" -DomainNetbiosName "ENTREPRISE" -InstallDNS
~~~

La commande lance les contrôles et sollicite notamment un secret DSRM. **Ne pas saisir le mot de passe en clair dans une commande stockée dans Git.** La promotion redémarre le serveur. Pour forcer explicitement un niveau fonctionnel 2025, il faut vérifier les valeurs acceptées par la version installée et la compatibilité du projet : ne pas le faire sans raison.

**Point particulier au laboratoire :** si l'assistant affiche un avertissement relatif à l'absence de délégation DNS parent, cela peut être attendu avec un domaine fictif .test sans zone parente administrée. Une erreur bloquante doit en revanche être analysée et corrigée.

## 4. Contrôler la création

Après redémarrage, ouvrir une session avec un compte de domaine autorisé. Sur DC01 :

~~~powershell title="DC01 · Vérifications en lecture seule"
Get-ADDomain | Select-Object DNSRoot,DomainMode,PDCEmulator
Get-ADForest | Select-Object Name,ForestMode,GlobalCatalogs
Get-ADDomainController -Filter * | Select-Object HostName,IPv4Address,Site
Resolve-DnsName _ldap._tcp.dc._msdcs.ad.entreprise.test -Type SRV
dcdiag /q
net share
~~~

**Points attendus :** un domaine répondant, un DC reconnu, des enregistrements SRV et les partages SYSVOL/NETLOGON lorsqu'ils sont prêts. Une absence temporaire juste après démarrage doit faire l'objet de contrôles de journaux et non de manipulations improvisées.

Vérifier la réplication SYSVOL et l'état des services avant de déclarer le DC opérationnel. Conserver la sortie de **dcdiag** et les événements des services AD, DNS et DFS Replication si une erreur est signalée.

## 5. Ajouter un second contrôleur

DC02 doit d'abord résoudre le domaine via le DNS de DC01. Contrôler depuis DC02 :

~~~powershell title="DC02 · Diagnostic avant promotion"
Get-NetIPConfiguration
Resolve-DnsName _ldap._tcp.dc._msdcs.ad.entreprise.test -Type SRV
Test-NetConnection 10.50.0.10 -Port 53
~~~

**Nuance :** Test-NetConnection avec Port 53 vérifie TCP 53 ; DNS peut aussi utiliser UDP. La réussite du test ne valide pas toutes les requêtes DNS.

Installer ensuite le rôle :

~~~powershell title="DC02 · Installe le rôle"
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
~~~

En tant qu'administrateur du domaine approprié, utiliser l'assistant **Ajouter un contrôleur de domaine à un domaine existant**, ou PowerShell :

~~~powershell title="DC02 · Modifie le système, nécessite des identifiants autorisés"
$identite = Get-Credential
Install-ADDSDomainController -DomainName "ad.entreprise.test" -Credential $identite -InstallDNS
~~~

Le mot de passe DSRM est demandé de manière sécurisée selon le mode d'installation. Le serveur redémarre. Ne pas réutiliser cette commande si DC02 est déjà promu.

## 6. Validation après ajout de DC02

Une fois DC01 et DC02 en service :

~~~powershell title="Depuis un DC · Lecture seule"
Get-ADDomainController -Filter * | Select-Object HostName,Site,IsGlobalCatalog
repadmin /replsummary
repadmin /showrepl
dcdiag /e /q
Resolve-DnsName dc02.ad.entreprise.test
~~~

Les deux DC doivent être connus de l'annuaire, leurs enregistrements DNS doivent exister et les résultats de réplication doivent être sains. Si la réplication n'a pas encore eu lieu, attendre la convergence prévue et analyser les erreurs ; ne pas tenter de restaurer des snapshots de DC pour « annuler » une configuration.

### DNS secondaire et clients

Après vérification de DNS sur les deux DC, définir pour les clients un ordre de résolveurs **internes** cohérent avec la résilience prévue. La configuration DNS propre aux DC nécessite une attention particulière : éviter d'en faire une simple règle universelle « toujours DNS préféré = lui-même ».

## 7. Diagnostiquer la réplication

| Symptôme | Contrôles |
| --- | --- |
| DC02 ne résout pas le domaine | IP, DNS configuré, zone et SRV |
| Promotion refuse les identifiants | Compte, appartenance aux groupes, domaine cible |
| Réplication en erreur | repadmin, RPC, DNS, pare-feu, temps et connectivité |
| SYSVOL/NETLOGON absents | Journaux DFSR, état initial du domaine, partages |
| Connexion client lente | DNS, site AD, SRV, temps, connectivité |

Ne pas transférer ou **saisir** les rôles FSMO à titre de dépannage avant d'avoir établi une panne du détenteur et un plan de récupération.

## TP 08-A : forêt neuve

**Mission.** Installer AD DS sur DC01, créer ad.entreprise.test et démontrer l'existence de la zone DNS, d'un contrôleur reconnu et des partages SYSVOL/NETLOGON.

**Prérequis.** Nouveau serveur, réseau privé, accès console, IP stable et ressources de laboratoire. **Validation.** Relever Get-ADDomain, Get-ADForest, Resolve-DnsName SRV, dcdiag et net share ; relever le niveau fonctionnel réel.

**Corrigé.** La réussite d'Install-ADDSForest est une condition, pas la preuve complète : des DNS SRV cohérents, une base AD accessible et une infrastructure SYSVOL opérationnelle sont requis.

**Retour arrière.** Pour un domaine **strictement de laboratoire sans aucune dépendance**, réinstaller les VM à partir d'un état vierge connu est souvent plus sûr que tenter une suppression improvisée du domaine. Ne pas simuler une restauration AD de production en réappliquant un checkpoint.

## TP 08-B : second DC et réplication

**Mission.** Installer DC02, le promouvoir, prouver sa présence et examiner l'état de la réplication.

**Validation.** Deux DC reconnus, zones DNS disponibles, pas d'erreur bloquante de réplication et ouverture de session fonctionnelle. **Dépannage contrôlé :** examiner les événements et sorties repadmin lors d'une erreur, sans rompre volontairement la réplication d'un domaine réel.

**Corrigé.** La présence de deux VM ne prouve pas la redondance. Il faut vérifier l'authentification avec chaque DC, la découverte DNS, les services, le temps et les sauvegardes.

## Questions de contrôle

1. À quel moment un serveur devient-il réellement contrôleur de domaine ?
2. Pourquoi le DNS est-il vérifié avant l'ajout de DC02 ?
3. Quelle différence entre les commandes Get-ADDomain et repadmin ?
4. Pourquoi SYSVOL doit-il être contrôlé distinctement ?
5. Quel est le danger d'un snapshot utilisé comme « réparation » d'AD ?

??? success "Correction"
    Lors de la promotion terminée ; DNS permet de localiser les services AD ; Get-ADDomain lit des informations du domaine et repadmin mesure la réplication ; SYSVOL transporte des éléments indispensables, dont des données de GPO ; un retour incontrôlé d'état peut créer des incohérences d'annuaire et ne remplace pas une restauration cohérente.

## Documentation Microsoft

- [Installer les services de domaine AD DS](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/deploy/install-active-directory-domain-services--level-100-)
- [Niveaux fonctionnels](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/active-directory-functional-levels)
- [Rôles FSMO et récupération](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/manage/understand-fsmo-roles)

[← Module 07](07-ad-architecture.md) · [Retour au programme](index.md)
