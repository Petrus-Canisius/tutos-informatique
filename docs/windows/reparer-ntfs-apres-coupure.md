---
title: Réparer un volume NTFS refusé par Ubuntu
description: Diagnostiquer sous Windows un volume NTFS que Ubuntu refuse de monter, puis appliquer la correction ciblée proposée par CHKDSK.
tags:
  - Windows
  - Ubuntu
  - NTFS
  - CHKDSK
---

# Réparer un volume NTFS refusé par Ubuntu

<div class="kb-doc-meta"><span>Windows</span><span>Ubuntu</span><span>NTFS</span><span>Dépannage</span></div>

## Objectif

Ubuntu peut refuser de monter un volume NTFS et afficher une erreur générique (« mauvais type de système de fichiers », « mauvais superbloc » ou « programme d’aide manquant »). Si le volume reste lisible sous Windows, CHKDSK peut vérifier sa structure et proposer une réparation ciblée.

Cette procédure utilise d’abord l’analyse en ligne de CHKDSK, puis la réparation hors connexion ciblée uniquement si Windows la demande.

## Précautions

- Identifie chaque disque par son **nom de volume** et sa **lettre actuelle**. Les lettres peuvent changer.
- Copie les fichiers irremplaçables ailleurs avant toute réparation, si tu as un autre emplacement disponible.
- `/spotfix` modifie les métadonnées du système de fichiers et met brièvement le volume hors ligne. Ce n’est pas un formatage, mais aucune réparation de système de fichiers ne garantit un risque nul.
- Ne débranche pas le disque pendant l’analyse ou la réparation.

## 1. Repérer la lettre du volume

Dans l’Explorateur de fichiers, vérifie le nom du disque et sa lettre. Dans PowerShell, tu peux aussi afficher les volumes NTFS :

```powershell
Get-Volume | Where-Object FileSystem -eq 'NTFS' | Format-Table DriveLetter, FileSystemLabel, FileSystem, HealthStatus
```

Dans les commandes ci-dessous, remplace `E:` par la lettre réellement attribuée au disque.

## 2. Analyser le volume sans lancer de réparation

Ouvre **Invite de commandes** ou **Terminal** en administrateur, puis lance :

```cmd
chkdsk E: /scan
```

`/scan` analyse un volume NTFS en ligne. Il ne réalise pas la correction hors connexion. Lis la conclusion du rapport :

- Si Windows ne détecte aucun problème, éjecte proprement le disque, puis réessaie sous Ubuntu.
- Si Windows indique qu’une réparation hors connexion est nécessaire et recommande `chkdsk /spotfix`, passe à l’étape suivante.
- Note le nom du volume et le type d’erreur ; ne suppose pas que tous les disques ont le même problème.

## 3. Appliquer la réparation ciblée proposée

Ferme les fenêtres et applications qui utilisent le disque. Dans le terminal administrateur, lance la commande avec sa lettre :

```cmd
chkdsk E: /spotfix
```

Cette option applique une réparation ciblée aux erreurs relevées par Windows. Le volume peut être temporairement indisponible pendant l’intervention. Attends le message de fin avant de poursuivre.

### Exemple d’erreur de métadonnées

Une analyse peut signaler une entrée endommagée dans `$Secure:$SDS`, qui contient des métadonnées de sécurité NTFS. Si `/spotfix` indique que cette entrée a été corrigée et que tous les problèmes identifiés ont été résolus, la réparation ciblée s’est terminée correctement.

## 4. Confirmer le résultat et revenir à Ubuntu

Relance l’analyse :

```cmd
chkdsk E: /scan
```

Si elle ne signale plus de problème, éjecte le disque avec **Retirer le périphérique en toute sécurité** ou l’option **Éjecter** de l’Explorateur. Reconnecte-le ensuite sous Ubuntu et vérifie qu’il s’ouvre.

Répète la procédure séparément pour chaque volume concerné, en vérifiant sa lettre à chaque fois.

## Si Ubuntu refuse encore le montage

Ne formate pas le disque et ne force pas son montage. Récupère le message précis du noyau après avoir reproduit l’erreur :

```bash
sudo dmesg -T | grep -iE 'ntfs|I/O error|error' | tail -n 80
```

Le nom du périphérique Linux peut changer d’une session à l’autre. Vérifie-le avec `lsblk -f` avant toute commande et ne lance pas de réparation Linux au hasard.

## Références

- [Microsoft — commande CHKDSK](https://learn.microsoft.com/fr-fr/windows-server/administration/windows-commands/chkdsk)

## Historique

| Date | Modification |
| --- | --- |
| 18 novembre 2026 | Première version |
