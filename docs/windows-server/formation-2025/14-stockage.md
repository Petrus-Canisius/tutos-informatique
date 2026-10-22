---
title: 14 · Stockage, NTFS, ReFS et volumes
description: Maîtriser les volumes, systèmes de fichiers, ACL, quotas, déduplication et architecture de stockage serveur.
---

# Module 14. Stockage et systèmes de fichiers

<div class="ws25-meta"><span>Stockage</span><span>9 h conseillées</span><span>2 TP</span><span>FS01 et disques de laboratoire</span></div>

## 1. Concevoir le stockage selon les besoins

Un serveur de fichiers, un hôte Hyper-V et une base de données n'ont pas les mêmes besoins de stockage. Il faut distinguer **capacité**, **débit**, **latence**, **IOPS**, **intégrité** et **disponibilité**. Une grande capacité ne garantit pas de bonnes performances. Un stockage redondant ne remplace pas une sauvegarde.

Pour le laboratoire, prévoir un VHDX **supplémentaire et vierge** attaché à FS01. Ne pas utiliser le disque système.

## 2. Les couches de stockage

~~~text
Application / SMB / Hyper-V
          │
     Système de fichiers
       NTFS ou ReFS
          │
      Volume / partition
          │
    Disque virtuel VHDX
          │
Stockage physique de l'hôte
~~~

La saturation du volume de l'hôte peut faire échouer une VM même si son système invité affiche encore de l'espace libre. Un disque dynamique consomme progressivement de la place et nécessite un suivi.

### NTFS

NTFS offre notamment la gestion des ACL, quotas via des fonctionnalités adaptées, journalisation et de nombreuses capacités Windows historiques. Le système de fichiers est souvent choisi pour les volumes système et les partages classiques.

### ReFS

ReFS vise des scénarios de résilience et de stockage adaptés. Ses fonctions, limitations et comportements changent selon la version Windows Server, le rôle et la configuration. **Ne jamais affirmer que toutes les fonctions NTFS sont présentes sur ReFS**, ni que ReFS remplace les contrôles applicatifs, les sauvegardes ou le suivi du stockage.

## 3. Examiner les disques avant toute modification

~~~powershell title="FS01 · Lecture seule"
Get-Disk | Select-Object Number,FriendlyName,PartitionStyle,OperationalStatus,Size
Get-Partition | Select-Object DiskNumber,PartitionNumber,DriveLetter,Size
Get-Volume | Select-Object DriveLetter,FileSystem,Size,SizeRemaining
Get-PhysicalDisk | Select-Object FriendlyName,HealthStatus,MediaType
~~~

**Règle absolue :** identifier le disque par son numéro, sa taille, son emplacement et son rôle avant toute opération d'initialisation. Dans une VM, le numéro peut changer après ajout d'un disque.

## 4. Initialiser un disque de laboratoire

**À exécuter seulement** lorsque le résultat de Get-Disk montre un VHDX supplémentaire **RAW, vide, identifié par certitude**. Le numéro 2 ci-dessous est un **exemple à remplacer** ; ce n'est pas une valeur universelle.

~~~powershell title="FS01 · Opérations destructrices sur disque neuf"
$disqueLab = 2  # Vérifier manuellement le numéro exact !
Get-Disk -Number $disqueLab | Format-List Number,FriendlyName,PartitionStyle,Size
# Après validation expresse d'un disque RAW vierge :
# Initialize-Disk -Number $disqueLab -PartitionStyle GPT
# New-Partition -DiskNumber $disqueLab -UseMaximumSize -DriveLetter T |
#     Format-Volume -FileSystem NTFS -NewFileSystemLabel "LAB-DATA" -Confirm
~~~

Les lignes modifiant le disque restent volontairement commentées. Décommenter seulement après avoir vérifié le disque, l'absence de données et l'impact. La dernière commande formate **le volume créé** ; elle n'a aucun mécanisme de récupération automatique.

## 5. Permissions, stockage et partages

Les **ACL NTFS** s'appliquent aux objets du système de fichiers ; les **permissions SMB de partage** encadrent l'accès via le réseau. Leur interaction doit être contrôlée par un test avec une identité réelle de laboratoire.

Exemple de lecture :

~~~powershell title="FS01 · Lecture seule"
Get-Acl "C:\LabWS2025" | Format-List Owner,Access
Get-SmbShare | Select-Object Name,Path,Description
~~~

Un compte qui voit le partage peut encore être refusé par NTFS, et inversement. Les deux couches doivent être analysées.

## 6. Pools, espaces de stockage et déduplication

**Storage Spaces** agrège des disques dans un pool et expose des disques virtuels selon des dispositions de résilience. Le nombre de disques, les contraintes de capacité et la fiabilité des médias conditionnent ce que le pool peut tolérer. Un espace en miroir ne signifie pas « je peux supprimer n'importe quel disque ».

**La déduplication** réduit l'usage de capacité lorsque des blocs répétés peuvent être identifiés. Ses gains dépendent du profil de données, du système de fichiers, de la charge et des versions prises en charge. On ne déploie pas automatiquement la déduplication sur tous les volumes : analyser compatibilité et performances.

**Storage Spaces Direct (S2D)** appartient aux architectures de stockage distribué et de haute disponibilité particulières. Ne pas tenter d'activer S2D sur deux VM de test sans vérifier les exigences d'édition, matériels, réseau et support.

## 7. FSRM, quotas et classification

**File Server Resource Manager** (FSRM) permet de mettre en œuvre des quotas, des filtrages et certaines stratégies de gestion des fichiers. Les quotas peuvent alerter ou empêcher de nouvelles écritures selon la configuration. Un quota correctement conçu doit être accompagné d'une politique d'alerte, de seuils et de traitement des incidents.

## TP 14-A : préparation du volume de FS01

**Objectif.** Ajouter un VHDX vierge à FS01, documenter son identité, l'initialiser en GPT, créer un volume NTFS et contrôler l'espace disponible. **Prérequis.** Sauvegarde de VM, console Hyper-V, VHDX de test distinct.

**Validation.** Get-Disk et Get-Volume affichent un volume LAB-DATA avec capacité et lettre correctes ; le volume système est inchangé. **Retour arrière.** Déconnecter et supprimer uniquement le VHDX neuf de test après avoir confirmé son chemin et l'absence de données utiles.

**Corrigé :** différencier le disque VHDX sur l'hôte, sa présentation à la VM, sa table de partitions et le volume formaté.

## TP 14-B : quotas et analyse de capacité

**Scénario.** Un partage de laboratoire doit alerter lorsqu'il approche d'un seuil défini. Étudier la mise en place d'un quota FSRM et vérifier le message d'alerte sur des données fictives.

**Validation.** Capturer le seuil, le chemin ciblé et l'événement généré. **Retour arrière.** Supprimer uniquement le modèle/les paramètres de quota propres au test. **Corrigé :** le quota ne corrige pas une panne de stockage physique, et une alerte n'équivaut pas à une sauvegarde.

## Révision

- Pourquoi ReFS ne remplace-t-il pas une sauvegarde ?
- Pourquoi identifier explicitement le disque avant Initialize-Disk ?
- Quelle différence entre droits de partage et ACL NTFS ?
- Qu'est-ce qui doit être mesuré avant d'activer la déduplication ?

??? success "Correction"
    ReFS n'est pas un mécanisme de reprise universelle ; une erreur de cible peut effacer les données ; les deux couches d'autorisation interviennent selon le chemin d'accès ; il faut mesurer profil des données, compatibilité, charge et gains attendus.

**Sources :** [Stockage Windows Server](https://learn.microsoft.com/en-us/windows-server/storage/), [ReFS](https://learn.microsoft.com/en-us/windows-server/storage/refs/refs-overview), [FSRM](https://learn.microsoft.com/en-us/windows-server/storage/fsrm/fsrm-overview).

[← Module 13](13-reseau-avance.md) · [Module 15 : SMB et DFS →](15-smb.md)
