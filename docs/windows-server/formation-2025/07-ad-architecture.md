---
title: 07 · Architecture d'Active Directory Domain Services
description: Domaines, forêts, sites, DNS, Kerberos, réplication, rôles FSMO et nouveautés de l'annuaire 2025.
---

# Module 07. Architecture Active Directory Domain Services

<div class="ws25-meta"><span>Annuaire</span><span>12 h conseillées</span><span>2 TP</span><span>AD DS et Kerberos</span></div>

## 1. Ce qu'est réellement Active Directory

Active Directory Domain Services (AD DS) est un service d'annuaire hiérarchisé. Il contient des **objets** (utilisateurs, groupes, ordinateurs, etc.) décrits par des **attributs**, associés à des identités et des permissions. Un annuaire ne se réduit pas à une base de mots de passe : il comprend un **schéma**, une base de données, des services de réplication, des mécanismes de sécurité et un espace de noms.

| Notion | Portée et fonction |
| --- | --- |
| Objet | Représentation d'une identité ou d'une ressource, par exemple un ordinateur |
| Attribut | Propriété définie par le schéma, par exemple un nom ou un identifiant |
| OU | Conteneur d'organisation et de délégation ; pas une frontière de sécurité |
| Domaine | Ensemble d'objets et de contrôleurs partageant le domaine AD |
| Forêt | Ensemble de domaines partageant schéma, configuration et relations de confiance |
| Site | Représentation de la topologie réseau et des sous-réseaux |
| Contrôleur de domaine | Serveur exécutant AD DS et participant à ses opérations |
| Catalogue global | Index de certaines informations d'objets dans la forêt |

Une OU n'est pas automatiquement un domaine ni une frontière de sécurité. Le niveau de privilège d'un compte doit être pensé à l'échelle correcte.

## 2. DNS et découverte de service

AD DS dépend de DNS pour orienter les clients vers les contrôleurs de domaine. Les enregistrements **SRV** indiquent notamment les services disponibles et leurs cibles. Une panne DNS peut ressembler à une panne d'identification, bien que le contrôleur de domaine fonctionne.

Exemples après création du domaine :

~~~powershell title="Depuis un client du domaine · Lecture seule"
Resolve-DnsName ad.entreprise.test -Type SOA
Resolve-DnsName _ldap._tcp.dc._msdcs.ad.entreprise.test -Type SRV
Resolve-DnsName dc01.ad.entreprise.test
~~~

Les résultats attendus dépendent des enregistrements publiés par les contrôleurs et des DNS consultés par le client. La résolution d'un nom d'hôte seul ne suffit pas à valider tous les enregistrements AD.

## 3. LDAP et Kerberos

**LDAP** sert notamment à interroger et modifier l'annuaire selon les autorisations. **Kerberos** permet une authentification par tickets via un centre de distribution des clés (KDC) présent sur les DC du domaine.

Le client obtient typiquement un ticket initial puis peut demander un ticket de service. Les identités de service (SPN), l'heure système, la résolution DNS et la confiance entre machines comptent. Un écart temporel trop important peut entraîner un échec d'authentification.

Un ticket Kerberos ne donne **pas** à lui seul le droit de lire tous les fichiers : le serveur de destination contrôle encore les autorisations.

~~~powershell title="Client joint au domaine · Lecture seule"
klist
whoami /all
w32tm /query /status
~~~

**klist** affiche les tickets de la session. **whoami /all** affiche les informations de sécurité du jeton courant, utiles pour examiner les groupes. L'absence de ticket attendu demande une analyse du contexte de session.

## 4. Réplication et topologie

Un domaine AD dispose d'une réplication **multimaître** pour de nombreuses données, sauf les opérations réservées aux détenteurs de rôles FSMO. La topologie tient compte des **sites**, des sous-réseaux, des connexions et des paramètres de réplication.

Le dossier **SYSVOL** contient notamment des éléments de GPO ; sa cohérence dépend de mécanismes de réplication distincts de la seule base AD. Une GPO peut donc être visible dans l'annuaire, mais manquer de contenu synchronisé si SYSVOL n'est pas sain.

Examiner le fonctionnement sans effectuer de changement :

~~~powershell title="Contrôleur de domaine · Lecture seule"
repadmin /replsummary
repadmin /showrepl
dcdiag /q
~~~

Une sortie d'erreur doit être reliée à son DC, sa partition, son partenaire et son code précis. Ne pas forcer la réplication ou supprimer des métadonnées au hasard.

## 5. Les cinq rôles FSMO

| Rôle | Portée | Fonction |
| --- | --- | --- |
| Maître de schéma | Forêt | Coordonne les modifications du schéma |
| Maître d'attribution des noms | Forêt | Contrôle certaines opérations d'ajout/suppression de domaines |
| Maître RID | Domaine | Gère l'allocation des plages d'identifiants relatifs |
| Émulateur PDC | Domaine | Fonctionnement lié notamment au temps et à certaines opérations d'authentification et d'administration |
| Maître d'infrastructure | Domaine | Gère certaines références d'objets interdomaine selon contexte |

La plupart des opérations de lecture AD ne nécessitent pas un contact permanent avec chacun des cinq rôles. Le bon placement dépend du nombre de domaines, de la topologie et des contraintes d'exploitation.

~~~powershell title="Depuis un DC · Lecture seule"
netdom query fsmo
Get-ADDomain | Select-Object PDCEmulator,RIDMaster,InfrastructureMaster
Get-ADForest | Select-Object SchemaMaster,DomainNamingMaster
~~~

Les cmdlets **Get-ADDomain** et **Get-ADForest** nécessitent le module ActiveDirectory et des droits d'interrogation appropriés.

## 6. Niveaux fonctionnels 2025 et pages de base 32K

Le **niveau fonctionnel** contrôle les capacités AD disponibles et les versions de DC admissibles. Au niveau Windows Server 2025, tous les DC de la forêt ou du domaine concerné doivent respecter les exigences de version correspondantes.

La fonctionnalité de **pages 32K** de la base ESE constitue une évolution majeure de Windows Server 2025. Elle est distincte du simple numéro de build Windows et doit respecter les prérequis documentés. Les nouvelles bases 2025 peuvent être compatibles 32K tout en utilisant des paramètres visant la compatibilité antérieure ; ne pas confondre compatibilité de format et activation définitive. Les DC mis à niveau depuis une base antérieure conservent certaines contraintes.

**Ne pas activer 32K comme manipulation d'introduction.** Étudier d'abord la compatibilité forestière, les sauvegardes, les partenaires et la procédure officielle.

## 7. Sécuriser les frontières

Un compte Domain Admins sur un poste utilisateur banal peut exposer le domaine entier. L'architecture d'administration distingue comptes ordinaires, comptes dédiés, stations de gestion et accès aux DC. Les OU servent à organiser et déléguer, mais pas à isoler des domaines de confiance.

La forêt constitue une frontière majeure de sécurité dans AD traditionnel. Toute approbation entre forêts ou domaines doit être justifiée, filtrée et documentée.

## TP 07-A : cartographier une forêt

**Prérequis.** AD DS déployé dans [le module 08](08-ad-deploiement.md). **Mission.** Relever forêt, domaine, DC, FSMO, niveau fonctionnel et principaux sites.

~~~powershell title="Sur MGMT01 équipé du module ActiveDirectory"
Get-ADForest | Select-Object Name,ForestMode,GlobalCatalogs,Domains
Get-ADDomain | Select-Object DNSRoot,DomainMode,PDCEmulator
Get-ADDomainController -Filter * | Select-Object HostName,Site,IsGlobalCatalog
~~~

**Validation :** les résultats concordent avec le schéma d'architecture. **Corrigé :** on ne déduit pas le niveau fonctionnel de la version de Windows seule. Aucune commande ci-dessus ne modifie AD.

## TP 07-B : panne de découverte AD

**Symptôme.** Le client ne trouve pas un contrôleur de domaine alors que DC01 répond au ping.

1. Lire l'IP et les DNS du client.
2. Interroger les enregistrements SRV du domaine.
3. Vérifier l'adresse IP retournée et le service DNS sur DC01.
4. Contrôler les journaux DNS/Netlogon selon l'erreur.
5. Rétablir le DNS du laboratoire s'il a été intentionnellement modifié.

**Corrigé :** ICMP et DNS sont des tests différents. Vérifier le serveur DNS réellement interrogé et les enregistrements de service avant d'accuser Kerberos.

## Révision

- Pourquoi une OU ne représente-t-elle pas un domaine ?
- À quoi servent les enregistrements SRV ?
- Les cinq FSMO signifient-ils cinq contrôleurs obligatoires ?
- Pourquoi un plan de montée de niveau fonctionnel commence-t-il par l'inventaire des DC ?

??? success "Réponses"
    Une OU organise des objets ; le domaine a une portée et des services propres. Les SRV localisent les services. Un DC peut porter plusieurs rôles FSMO, y compris les cinq. Une montée de niveau impose de connaître les DC admissibles et leurs dépendances.

## Sources

- [Niveaux fonctionnels d'AD DS](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/active-directory-functional-levels)
- [Comprendre les rôles FSMO](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/manage/understand-fsmo-roles)
- [Pages de base de données 32K](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/32k-pages-optional-feature)

[← Module 06](06-powershell.md) · [Module 08 : déploiement AD →](08-ad-deploiement.md)
