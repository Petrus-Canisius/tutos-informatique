---
description: "Relever les informations et événements d'un poste sans modifier sa configuration."
tags: ["Windows", "diagnostic"]
---

# Maintenance Windows

<div class="kb-doc-meta"><span>Windows</span><span>Initiation</span><span>Exemple technique</span></div>

<div class="kb-doc-intro"><strong>Objectif.</strong> Relever les informations et événements d'un poste sans modifier sa configuration.</div>


## Objectif
Diagnostiquer un poste Windows sans modifier sa configuration.

## Informations système

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
```

## Services

```powershell
Get-Service | Where-Object Status -eq 'Stopped' | Select-Object -First 20 Name, DisplayName
```

!!! note
    De nombreux services sont normalement arrêtés. Ne démarrez pas un service sans connaître son rôle.

## Événements système

```powershell
Get-WinEvent -LogName System -MaxEvents 20 |
  Select-Object TimeCreated, Id, LevelDisplayName, Message
```

## Vérification
Consigner la version de Windows, les erreurs pertinentes et la date du diagnostic.
