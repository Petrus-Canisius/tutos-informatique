---
title: Collecte OSINT passive
description: Structurer une recherche publique sans scanner directement le site cible.
niveau: Initiation
systeme: Multiplateforme
versions: Services tiers et bases publiques ; conditions à vérifier
validation: non_teste
---

# Réaliser une collecte OSINT passive

## Définir le périmètre

Documenter l'objectif, les domaines couverts et les sources ; exclure les données personnelles non nécessaires et les contenus non publics.

## Utiliser des sources tierces

- Rechercher les pages indexées dans un moteur.
- Examiner les informations publiques d'enregistrement d'un domaine avec RDAP.
- Comparer les certificats publiés dans les journaux de transparence.
- Consulter une archive web pour contextualiser les évolutions publiques.

## Vérifier les observations

Noter la date, le service interrogé, les URL et la fiabilité de chaque résultat. Ne pas confondre des informations historiques avec l'état actuel d'une infrastructure.

## Limites techniques

Interroger directement un site, lancer un crawler ou sonder ses ports produit un trafic potentiellement observable. Respecter les autorisations et les conditions d'utilisation des sources.

## Références

- [RDAP — ICANN](https://www.icann.org/rdap)
- [Certificate Transparency](https://certificate.transparency.dev/)
