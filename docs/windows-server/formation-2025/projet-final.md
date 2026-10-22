---
title: Projet final · Infrastructure Windows Server 2025 à deux sites
description: Cahier des charges et critères d'évaluation pour une infrastructure de 250 collaborateurs sur deux sites.
---

# Projet final. Infrastructure d'une entreprise multisite

<div class="ws25-meta"><span>Étude d'architecture</span><span>250 collaborateurs</span><span>Deux sites</span><span>Projet intégrateur</span></div>

!!! info "Statut pédagogique"
    Ce document fixe le **cahier des charges du projet final**. Le corrigé d'implémentation complet des modules avancés sera produit avec leurs chapitres ; il n'est pas présenté comme déjà réalisé ici.

## 1. Le contexte

Une entreprise de 250 personnes dispose de **180 utilisateurs au site principal** et de **70 utilisateurs sur un site secondaire**. Elle souhaite disposer d'une identité centralisée, de dossiers partagés, d'applications internes et d'une stratégie de reprise d'activité.

Les deux sites communiquent par une liaison WAN sécurisée, dont la latence, la disponibilité et la bande passante restent à relever. Une politique de sécurité et de sauvegarde doit être formalisée.

## 2. Livrables exigés

| Lot | Livrable | Vérification |
| --- | --- | --- |
| Architecture | Diagrammes logique/physique, matrice de flux, analyse des risques | Dépendances et points de panne identifiés |
| Réseau | Plan IP, VLAN, DNS, sites AD | Aucune plage superposée, résolution démontrée |
| Identités | OU, groupes, comptes, délégations | Moindre privilège et traçabilité |
| AD DS | DC multiples, DNS, réplication, temps | Repadmin, dcdiag, SRV et ouverture de session |
| Fichiers | SMB, ACL, organisation des droits | Utilisateur autorisé/refusé vérifié |
| Virtualisation | VM, stockage, exploitation et capacité | Configuration et plan de reprise documentés |
| Protection | Durcissement, journaux, administration privilégiée | Tests de contrôles et preuves |
| Sauvegarde | Politique RPO/RTO, supports indépendants, restauration | Restaurabilité prouvée |
| Automatisation | Scripts validés et journalisés | Réexécution sûre et contrôle |
| Exploitation | Runbooks, supervision et procédure d'escalade | Diagnostic d'incident reproductible |

## 3. Architecture logique de référence

~~~text
           SITE PRINCIPAL                      SITE SECONDAIRE
         180 collaborateurs                     70 collaborateurs
      ┌────────────────────┐                 ┌──────────────────┐
      │ Postes et VLAN     │                 │ Postes et VLAN   │
      │ gestion distincte  │                 │ gestion distincte│
      └──────────┬─────────┘                 └────────┬─────────┘
                 │                                    │
          DNS/DC01 + FS01  ── lien WAN filtré ── DNS/DC02 + ressources
                 │                                    │
           hôtes Hyper-V                         hôtes/ressources
                 │                                    │
           sauvegardes et copie externe indépendante du site
~~~

Ce schéma est une **illustration fonctionnelle** et non une architecture complète de haute disponibilité. Le dimensionnement dépendra des contraintes réelles, des fonctions à héberger et du stockage disponible.

## 4. Décisions à justifier

- Un domaine ou plusieurs ? Justifier selon administration, autonomie, sécurité et besoins, pas selon le nombre de sites.
- Quels rôles possèdent une instance de secours ? Quels points de panne restent partagés ?
- Comment les clients découvrent-ils le DC et le serveur DNS de leur site ?
- Comment les utilisateurs mobiles accèdent-ils aux services, avec quels contrôles ?
- Quelle est la matrice des accès aux dossiers et aux applications ?
- Quelle restauration devient nécessaire en cas de suppression d'OU, de compromission ou de destruction du site ?
- Quels changements exigent une fenêtre de maintenance ou des sauvegardes ?
- Quelles licences, CAL et abonnements devront être vérifiés avant mise en production ?

## 5. Incidents imposés dans le laboratoire

**Incident A : panne DNS du site principal.** Le client ne localise plus le DC attendu. Relever les requêtes DNS, les entrées SRV et le choix de DNS du client ; restaurer sans modifier le réseau réel.

**Incident B : problème de réplication.** Modifier dans le laboratoire un élément réseau contrôlé, mesurer l'erreur de réplication et sa correction avec journaux, dcdiag et repadmin. Ne pas pratiquer de restauration de snapshot comme réparation improvisée d'AD.

**Incident C : accès SMB refusé.** Une modification de groupes ou de permissions invalide l'accès attendu. Diagnostiquer la différence entre authentification et ACL effective.

**Incident D : perte d'une VM.** Décrire puis exécuter une restauration à partir d'une sauvegarde cohérente de laboratoire, avec preuves de récupération.

**Incident E : compte privilégié compromis (simulation).** Définir l'isolation, la révocation, les journaux à conserver et les étapes de remise en confiance, sans reproduire de techniques d'intrusion.

## 6. Critères de réussite

Le projet est validé si les besoins sont reliés à des décisions techniques vérifiables, si les opérations peuvent être reproduites par un autre administrateur, et si les scénarios de panne ne reposent pas sur des hypothèses non démontrées.

| Domaine | Pondération |
| --- | ---: |
| Architecture et documentation | 20 % |
| Identités, DNS, GPO et réseau | 20 % |
| Sécurité et gestion des privilèges | 20 % |
| Sauvegarde, restauration, disponibilité | 20 % |
| Exploitation, automatisation, diagnostic | 20 % |

Aucune note globale ne compense une exposition non maîtrisée de secrets ou de services sensibles.

## 7. Format du dossier final

1. Synthèse d'architecture et hypothèses approuvées.
2. Inventaire et licences à contrôler.
3. Diagrammes, plan d'adressage et flux.
4. Procédures de déploiement et vérifications.
5. Politique des identités et accès.
6. Sécurité, sauvegarde, PRA/PCA.
7. Preuves de tests et retours arrière.
8. Journal des risques résiduels et décisions en attente.

[Retour au programme](index.md) · [Catalogue d'exercices](travaux-pratiques.md)
