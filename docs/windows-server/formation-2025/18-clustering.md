---
title: 18 · Clustering et haute disponibilité
description: Nœuds, quorum, témoins, clusters Hyper-V, CSV, S2D et simulations de basculement.
---

# Module 18. Haute disponibilité et clustering

<div class="ws25-meta"><span>Résilience</span><span>9 h conseillées</span><span>2 TP</span><span>Conception de cluster</span></div>

## 1. Haute disponibilité : ce que l'on garantit vraiment

La haute disponibilité vise à réduire l'interruption d'un service face à certaines défaillances. **Un deuxième serveur ne suffit pas**. Il faut définir les composants redondants, les détecteurs de panne, les mécanismes de basculement, les données partagées ou répliquées, la topologie réseau et les tests.

La meilleure question n'est pas « avons-nous deux serveurs ? », mais **quel élément unique peut encore interrompre le service ?**

## 2. Architecture d'un cluster Windows

Un **Failover Cluster** regroupe plusieurs **nœuds** qui peuvent héberger des rôles clusterisés. En cas de perte d'un nœud, certaines ressources peuvent démarrer ailleurs selon la configuration et l'état des dépendances.

~~~text
           CLUSTER HYPER-V
       ┌───────────┬───────────┐
       │  HV01     │  HV02     │
       │  Nœud A   │  Nœud B   │
       └─────┬─────┴─────┬─────┘
             │           │
          Données et stockage compatibles
             │
          Témoin / quorum
~~~

Ce schéma est logique. Selon le modèle, le stockage peut être partagé, répliqué ou mis en commun. Les choix de réseau, noms de cluster et identités doivent être conçus explicitement.

## 3. Le quorum

Le **quorum** détermine si un ensemble de nœuds possède assez de votes pour maintenir les ressources clusterisées. Il évite les scénarios de **split-brain**, dans lesquels des fragments isolés tenteraient de s'approprier simultanément les mêmes ressources.

Un **témoin** peut contribuer au vote selon le mode. Son emplacement doit éviter de recréer une dépendance partagée avec les nœuds qu'il est censé départager.

| Situation | Analyse |
| --- | --- |
| Deux nœuds sans témoin approprié | Risque de disponibilité réduite selon le quorum |
| Deux nœuds et témoin indépendant | Meilleur arbitrage selon scénario |
| Nœuds avec stockage commun unique | Panne du stockage encore possible |
| Nœuds répartis sur sites éloignés | Latence, réplication, réseaux et cohérence à qualifier |

Le quorum ne remplace pas une sauvegarde. Il ne restaure pas des fichiers supprimés.

## 4. Cluster Shared Volumes

Les **Cluster Shared Volumes** (CSV) peuvent permettre à plusieurs nœuds d'accéder à un même espace de stockage dans des scénarios pris en charge. Leur configuration ne consiste pas à monter un dossier NTFS quelconque depuis plusieurs machines.

Il faut un stockage compatible, un cluster correctement validé, des performances réseau adéquates et une politique de surveillance.

## 5. Storage Spaces Direct

**Storage Spaces Direct (S2D)** permet de mutualiser les disques locaux de nœuds dans une solution de stockage logiciel. L'architecture nécessite des équipements, versions, éditions, interconnexions et disques répondant aux **exigences officielles**.

Les guides Microsoft mentionnent notamment au minimum deux nœuds et une interconnexion réseau performante, souvent **10 Gb/s ou davantage** selon le scénario. Un laboratoire Hyper-V improvisé ne démontre pas que le montage est certifié pour la production.

!!! warning "Ne pas tenter de déployer S2D en production sur une maquette non validée"
    Avant toute activation, consulter la matrice de prise en charge du matériel, réseau, disques et édition. Prévoir un plan de perte d'un nœud et de restauration des données.

## 6. Tester plutôt que supposer

Un plan de haute disponibilité doit préciser :
- scénario de panne de nœud ;
- panne réseau isolée ;
- rupture ou corruption du stockage ;
- panne du DNS ou du service d'identité ;
- perte du témoin ;
- retour en service et resynchronisation ;
- temps constaté de récupération.

Pour un cluster existant, sans action perturbatrice :

~~~powershell title="Nœud avec module FailoverClusters · Lecture seule"
Get-Cluster
Get-ClusterNode | Select-Object Name,State
Get-ClusterGroup | Select-Object Name,State,OwnerNode
Get-ClusterQuorum
~~~

Ces cmdlets supposent l'existence d'un cluster sain et les autorisations adaptées. **Test-Cluster** est une opération de validation potentiellement intensive ; ses effets doivent être étudiés avant d'être lancés sur une infrastructure en service.

## 7. Comparer disponibilité et reprise d'activité

**Cluster** : réduire une indisponibilité locale ou celle d'un nœud. **Réplication** : conserver une copie des données ou systèmes selon délai. **Sauvegarde** : disposer d'un état récupérable antérieur. **PRA** : organiser la reprise globale après un sinistre.

Une architecture mature utilise plusieurs de ces moyens selon le besoin métier, pas une seule fonctionnalité magique.

## TP 18-A : dossier de cluster à deux nœuds

**Mission.** Concevoir HV01/HV02, leurs flux d'administration, un témoin et le stockage, puis dessiner le comportement en perte d'un nœud ou du témoin.

**Validation.** Le diagramme distingue les zones de panne et démontre le quorum prévu. **Corrigé :** deux nœuds dont les VM sont sur un unique stockage non redondé ne suffisent pas.

## TP 18-B : matrice d'incidents

**Mission.** Sur papier ou simulateur isolé, produire une matrice pour quatre scénarios : arrêt HV01, perte du témoin, panne DNS, corruption du stockage.

**Corrigé :** la panne du témoin n'a pas le même impact qu'une panne de disque ; le résultat dépend des votes et de l'état des nœuds. Un cluster ne restaure pas automatiquement des données corrompues.

## Questions

1. À quoi sert le quorum ?
2. Un témoin est-il une copie de la sauvegarde ?
3. Pourquoi S2D exige-t-il une attention particulière au matériel ?
4. Quelle différence entre service « clusterisé » et « sauvegardé » ?

??? success "Correction"
    Le quorum évite des décisions concurrentes sans majorité ; le témoin arbitre et ne sauvegarde pas les données ; S2D dépend fortement des disques et interconnexions ; un cluster réduit certains arrêts, une sauvegarde permet de revenir à un état récupérable.

**Sources :** [Failover Clustering](https://learn.microsoft.com/en-us/windows-server/failover-clustering/failover-clustering-overview), [Storage Spaces Direct](https://learn.microsoft.com/fr-fr/windows-server/storage/storage-spaces/storage-spaces-direct-overview), [Exigences S2D](https://learn.microsoft.com/fr-fr/windows-server/storage/storage-spaces/storage-spaces-direct-hardware-requirements).

[← Module 17](17-hyper-v.md) · [Module 19 : durcissement →](19-securite.md)
