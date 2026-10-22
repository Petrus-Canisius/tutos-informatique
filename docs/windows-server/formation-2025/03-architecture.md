---
title: 03 · Concevoir une infrastructure Windows Server
description: Analyse de besoins, dimensionnement, plan IP, noms, DNS, disponibilité et règles d'architecture.
---

# Module 03. Conception d'une infrastructure

<div class="ws25-meta"><span>Architecture</span><span>9 h conseillées</span><span>2 études de cas</span><span>Documentation</span></div>

## 1. De la demande métier à un système vérifiable

Un bon déploiement commence **avant** l'installation. La phrase « il nous faut un serveur » ne constitue pas un besoin exploitable. Il faut identifier les utilisateurs, les services, les dépendances, le niveau de protection des données, les contraintes de disponibilité et la croissance attendue.

Pour chaque application, compléter cette fiche :

| Question | Exemple de réponse |
| --- | --- |
| Qui utilise le service ? | 90 collaborateurs, 2 sites |
| Quel service ? | Authentification et partage de documents |
| À quels horaires ? | 7 h à 20 h en semaine |
| Quelles contraintes ? | Accès intersite via réseau administré |
| Quelle perte admissible ? | RPO 4 h (hypothèse, à faire valider) |
| Quel arrêt acceptable ? | RTO 8 h (hypothèse, à faire valider) |
| Quelles données ? | Identités, fichiers internes |
| Qui exploite ? | Équipe IT interne |
| Quel budget et quelle licence ? | À confirmer contractuellement |

Une architecture sans RPO/RTO approuvés ne peut prétendre fournir un plan de reprise satisfaisant.

## 2. Disponibilité et séparation des responsabilités

**Tout placer sur une seule VM** simplifie le laboratoire, mais crée des dépendances et un domaine de panne partagé. Une architecture professionnelle peut séparer :
- les contrôleurs de domaine (DC01 / DC02) ;
- les services de fichiers (FS01) ;
- les outils d'administration (MGMT01) ;
- les applications (APP01) ;
- les hôtes de virtualisation et le stockage.

Deux DC sont utiles si leur disponibilité n'est pas soumise au même point de défaillance. Deux VM sur le même SSD et le même hôte ne constituent pas une résilience physique.

**Principe de conception :** tout composant déclaré critique doit avoir une analyse de dépendances, une stratégie de sauvegarde et un scénario de perte.

## 3. Réseau : adressage, segmentation, DNS et routage

Le réseau de démarrage de notre laboratoire, **10.50.0.0/24**, est isolé. Pour un contexte réel, on réserverait plutôt plusieurs segments logiques.

| Segment proposé (exemple, non appliqué au lab initial) | Sous-réseau exemple | Usage |
| --- | --- | --- |
| Serveurs | 10.60.10.0/24 | DC, DNS, fichiers |
| Postes | 10.60.20.0/24 | Clients utilisateurs |
| Gestion | 10.60.30.0/24 | Administrateurs et outils |
| Sauvegarde | 10.60.40.0/24 | Réseau spécialisé selon architecture |
| DMZ | 10.60.50.0/24 | Services exposés contrôlés |

Les frontières de sécurité ne découlent pas du simple choix de VLAN : il faut des règles de filtrage entre zones, une administration maîtrisée et des flux explicitement autorisés.

### Concevoir les noms

Un nom de serveur doit renseigner sur **l'identité stable**, pas sur tous ses usages temporaires. Exemple de convention : **PAR-DC01**, **LYO-FS01**, **PAR-MGMT01**. Documenter le site et les rôles, éviter les caractères ambigus et la réutilisation rapide de noms existants.

Pour notre laboratoire pédagogique, les noms restent volontairement courts (**DC01**, **FS01**, etc.). Le domaine est **ad.entreprise.test** : le suffixe **.test** est destiné aux essais. En entreprise, le choix DNS et UPN s'aligne sur les domaines possédés et les contraintes d'identité hybride.

### DNS d'un domaine Active Directory

Les clients du domaine doivent pouvoir interroger des résolveurs capables de trouver les enregistrements AD du domaine. Ils ne doivent **pas** recevoir arbitrairement un résolveur public comme second DNS si ce résolveur ignore les zones privées.

La redondance DNS s'obtient avec plusieurs serveurs DNS internes appropriés, et une stratégie de transfert/redirecteurs pour les noms externes.

## 4. Dimensionner sans additionner au hasard

La capacité se calcule à partir de **charges réelles**, de pics, de SLA et de marges. Le nombre de VM ne suffit pas.

### Processeur

Mesurer l'utilisation par charge, distinguer cœurs physiques et processeurs logiques, et analyser l'effet du surengagement. La surallocation de vCPU est parfois acceptable sur des charges modestes, mais devient risquée si toutes les VM demandent du CPU simultanément.

### Mémoire vive

La mémoire doit couvrir l'OS hôte, l'hyperviseur, les VM et les marges d'incident. Un hôte ayant 32 Go de RAM ne dispose **pas** de 32 Go entièrement allouables aux VM. Les charges AD, IIS, fichiers, SQL et RDS ont des profils distincts.

### Stockage

Choisir IOPS, latence, débit, capacité et résilience selon l'usage. Un disque dynamique économise l'espace initial mais peut saturer le volume hôte lorsque les VM grandissent. L'usage de **ReFS** doit être étudié selon les fonctionnalités réellement prises en charge ; ReFS ne remplace ni la sauvegarde ni le contrôle d'intégrité d'une application.

### Réseau

Calculer les débits de sauvegarde, réplication, migrations et accès aux fichiers, pas seulement le débit moyen des postes. Une carte 10 Gb/s n'améliore pas un stockage incapable de suivre.

## 5. Matrice de dépendances

| Service | Dépendances essentielles | Tests prioritaires |
| --- | --- | --- |
| Connexion de domaine | DNS, contrôleur, Kerberos, temps | Résolution SRV, synchronisation, journaux |
| Ouverture d'un partage | Réseau, DNS, identité, SMB, ACL, disque | Port 445, sessions, droits, volume |
| GPO | AD, DNS, SYSVOL, client | gpresult, journaux GroupPolicy, réplication |
| Sauvegarde de VM | Agent/outil, espace, cohérence, réseau | Job, intégrité, test de restauration |
| Accès distant | Identité, certificats, autorisations, pare-feu | Port, chaîne de confiance, événements |

**Point central :** la haute disponibilité de la fonction A n'assure rien si une dépendance B reste unique.

## 6. Documentation minimale d'exploitation

Le livrable de conception doit comprendre :

1. Diagrammes **logique** et **physique**.
2. Inventaire des serveurs, versions, éditions, adresses et propriétaires.
3. Plan IP, DNS, VLAN, flux applicatifs et flux de gestion.
4. Rôles AD, topologie des sites et politique des comptes privilégiés.
5. Sauvegardes, RPO/RTO et tests de restauration datés.
6. Procédure d'installation et configuration initiale.
7. Supervision, journaux, fenêtres de maintenance et escalade.
8. Plan de retour arrière, critères de validation après changement.

Un secret ne doit jamais figurer dans les schémas, scripts versionnés ou inventaires publics.

## TP 03-A : concevoir le premier site

**Cahier des charges.** Entreprise de 80 collaborateurs, un site, 2 applications internes, 100 Go de documents et croissance supposée de 25 % par an (hypothèse d'exercice).

**À produire :**
- liste des rôles et répartition sur VM ;
- plan IP et DNS ;
- points de défaillance uniques ;
- stratégie de sauvegarde ;
- liste des inconnues empêchant un chiffrage.

**Corrigé d'architecture :** deux DC/DNS sur des dépendances aussi distinctes que possible, serveur de fichiers séparé, VM de gestion, sauvegarde indépendante de l'hôte. Il faut interroger les métiers sur la criticité et dimensionner les volumes avec données observées. Pas de SLA inventé.

## TP 03-B : analyser une fausse redondance

Deux DC virtuels exécutés sur le même hôte perdent l'accès au stockage partagé ; l'entreprise ne peut plus se connecter.

**Question :** pourquoi les deux DC n'ont-ils pas évité la panne ?

**Corrigé :** redondance logicielle sans diversité du stockage ni de l'hôte. Il faut étudier l'indépendance des zones de panne, pas seulement compter les VM. Prévoir une architecture d'hébergement réellement résiliente et des sauvegardes restaurables.

## Auto-évaluation

1. Pourquoi distinguer schéma logique et physique ?
2. Quel risque à placer les deux DC sur un même stockage ?
3. Pourquoi un VLAN ne suffit-il pas comme contrôle de sécurité ?
4. Une sauvegarde prouve-t-elle la restaurabilité ?
5. Quel est le premier document à demander avant de promettre un RTO ?

??? success "Correction"
    Logique = relations des services ; physique = dépendances concrètes. Un stockage commun reste un point de défaillance. Un VLAN segmente, mais ne remplace pas un filtrage. Une sauvegarde doit être restaurée en test. Il faut un besoin de continuité métier et les contraintes de reprise validés.

## Sources

- [Microsoft Learn : Windows Server](https://learn.microsoft.com/fr-fr/windows-server/)
- [Planification du déploiement AD DS](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/)
- [Présentation d'Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/overview)

[← Module 02](02-editions.md) · [Module 04 : installation →](04-installation.md)
