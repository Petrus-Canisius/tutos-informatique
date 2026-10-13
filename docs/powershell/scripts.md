# Premiers scripts PowerShell

## Objectif
Créer des sorties utiles pour le diagnostic.

## Lister les services
```powershell
Get-Service |
    Sort-Object DisplayName |
    Select-Object Status, Name, DisplayName |
    Format-Table -AutoSize
```

## Exporter les processus
```powershell
Get-Process |
    Select-Object ProcessName, Id, CPU |
    Export-Csv -Path .\processus.csv -NoTypeInformation -Encoding UTF8
```

## Vérification
Le fichier `processus.csv` apparaît dans le répertoire courant.

!!! warning
    Relire les fichiers exportés avant de les publier : ils peuvent contenir des informations internes.
