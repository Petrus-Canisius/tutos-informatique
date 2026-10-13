---
title: Contrôles préalables Proxmox
description: Vérifier les machines virtuelles et les sauvegardes avant une maintenance Proxmox VE.
niveau: Intermédiaire
systeme: Linux
versions: À adapter à la version Proxmox VE installée
validation: non_teste
type: Liste de contrôle
---

# Contrôles préalables à une intervention sur Proxmox VE

Exemple documentaire **non testé en laboratoire** pour cette publication. Vérifier les droits d'administration et l'existence d'un retour arrière.

## Vérifier l'hôte

Depuis une session d'administration autorisée :

~~~bash
pveversion -v
df -h
free -h
~~~

Contrôler aussi l'état du stockage et, s'il existe, du cluster dans l'interface Proxmox VE.

## Identifier les machines virtuelles

~~~bash
qm list
~~~

Relever les identifiants, le statut, le stockage et les interfaces virtuelles concernés avant toute modification.

## Contrôler les sauvegardes

Vérifier la destination et le résultat de la dernière sauvegarde dans l'interface. Une sauvegarde récente n'est pas une preuve de restaurabilité ; un essai de restauration doit s'effectuer sur une VM isolée.

## Préparer un retour arrière

Un snapshot ne remplace pas une sauvegarde indépendante. Définir le périmètre et les conséquences d'un retour arrière avant l'intervention.

## Référence

[Documentation officielle Proxmox VE](https://pve.proxmox.com/pve-docs/)
