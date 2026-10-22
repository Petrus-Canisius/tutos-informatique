---
title: Catalogue de travaux pratiques Windows Server 2025
description: Liste progressive de 52 scénarios pratiques répartis sur les 26 modules du parcours.
---

# Catalogue des 52 travaux pratiques

Cette page présente **le référentiel d'exercices du cursus**, distinct des fiches réellement rédigées. Les exercices des modules [01](01-fondamentaux/), [02](02-editions/), [03](03-architecture/) et [04](04-installation/) sont décrits et corrigés dans leurs chapitres. Les autres thèmes constituent un **plan de production**, pas des procédures exécutables ni des corrigés déjà fournis.

!!! warning "Portée et sécurité"
    Tous les scénarios de pannes, de suppression, de restauration, d'administration privilégiée et de changement réseau sont prévus sur un laboratoire autorisé, isolé du réseau réel. Aucune expérience ne doit être directement transposée en production.

## Parcours pratique, par modules

| Module | Exercice A | Exercice B |
| --- | --- | --- |
| **01** · Fondamentaux | 01-A · Inventaire système et journaux | 01-B · Diagnostic d'un partage SMB inaccessible |
| **02** · Éditions | 02-A · Choisir une édition selon la charge | 02-B · Matrice de compatibilité des nouveautés |
| **03** · Conception | 03-A · Architecture d'un site de 80 personnes | 03-B · Identifier les fausses redondances |
| **04** · Installation | 04-A · Installer Server Core | 04-B · Installer Desktop Experience |
| **05** · Administration | 05-A · Utiliser RSAT depuis MGMT01 | 05-B · Sécuriser PowerShell Remoting |
| **06** · PowerShell | 06-A · Script d'inventaire CSV robuste | 06-B · Administration à distance avec journalisation |
| **07** · Architecture AD | 07-A · Lire les rôles FSMO et sites | 07-B · Identifier les chemins Kerberos / DNS |
| **08** · Déploiement AD | 08-A · Promouvoir DC01 avec DNS | 08-B · Ajouter DC02 et contrôler la réplication |
| **09** · Identités | 09-A · Déployer OU/groupes AGDLP | 09-B · Configurer et vérifier Windows LAPS |
| **10** · GPO | 10-A · Déployer une stratégie ciblée | 10-B · Diagnostiquer l'héritage GPO |
| **11** · DNS | 11-A · Créer des zones et des enregistrements | 11-B · Corriger une panne SRV |
| **12** · DHCP | 12-A · Distribuer des baux en réseau isolé | 12-B · Tester DHCP Failover |
| **13** · Réseau | 13-A · Analyser les règles de pare-feu | 13-B · Déployer NPS pour un cas autorisé |
| **14** · Stockage | 14-A · Pool de stockage et quotas | 14-B · Contrôler déduplication et performance |
| **15** · SMB / DFS | 15-A · Permissions partages + NTFS | 15-B · DFS Namespace et résolution d'incident |
| **16** · Services | 16-A · Site IIS et certificat de test | 16-B · Autorité de certification de laboratoire |
| **17** · Hyper-V | 17-A · VM génération 2, stockage et réseau | 17-B · Test de réplication ou migration selon moyens |
| **18** · Clustering | 18-A · Simuler un basculement de rôle | 18-B · Étudier quorum, perte de nœud et témoin |
| **19** · Durcissement | 19-A · Évaluer une baseline | 19-B · Mettre en place les protections adaptées |
| **20** · Sécurité | 20-A · Analyser une connexion suspecte simulée | 20-B · Centraliser des événements de sécurité |
| **21** · Sauvegarde | 21-A · Sauvegarder les données et System State | 21-B · Restaurer en environnement isolé |
| **22** · Supervision | 22-A · Mesurer CPU, mémoire, disque et réseau | 22-B · Établir seuils et journal d'incident |
| **23** · Maintenance | 23-A · Documenter une mise à jour | 23-B · Conduire un diagnostic multi-service |
| **24** · Hybride | 24-A · Dessiner le flux Azure Arc | 24-B · Étudier une identité hybride et ses risques |
| **25** · Automatisation | 25-A · Provisionner des objets avec contrôle | 25-B · Construire une validation idempotente |
| **26** · Conteneurs | 26-A · Comparer VM et conteneur Windows | 26-B · Déployer une charge de test compatible |

Le module 04 possède aussi un [troisième exercice sur l'échec DNS avant installation AD](04-installation/#tp-04-c-panne-de-dns-volontaire). Le laboratoire contient [L-01, exercice préalable d'isolement](laboratoire/#travail-pratique-l-01-isolement-du-reseau).

## Format imposé pour chaque futur TP

1. **Contexte et résultat mesurable.** Quel besoin métier, quelle preuve du succès ?
2. **Prérequis.** VMs, versions, IP, outils, privilèges, espace disque.
3. **État initial.** Services et configuration avant le changement.
4. **Procédure.** Interface ou commandes avec commentaires et risques.
5. **Validation.** Tests fonctionnels et résultats attendus.
6. **Diagnostic.** Symptômes, hypothèses, logs et commandes de vérification.
7. **Retour arrière.** Restauration et preuves d'intégrité.
8. **Corrigé.** Interprétation et erreurs classiques.

## Barème applicable à chaque exercice

| Critère | Points |
| --- | ---: |
| Analyse préalable et prérequis | 15 |
| Précision des opérations | 25 |
| Validation par tests reproductibles | 25 |
| Sécurité et maîtrise des privilèges | 15 |
| Diagnostic et retour arrière | 15 |
| Documentation remise | 5 |
| **Total** | **100** |

**Seuil indicatif de validation : 80/100**, à compléter par la réussite obligatoire des points de sécurité. Une manipulation qui modifie involontairement le réseau réel ou expose des identifiants est un échec critique, quel que soit le score.

[Retour au parcours](index.md) · [Projet final](projet-final/)
