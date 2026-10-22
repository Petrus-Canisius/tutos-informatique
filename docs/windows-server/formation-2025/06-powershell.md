---
title: 06 · PowerShell professionnel pour Windows Server
description: Pipeline, objets, scripts défensifs, gestion d'erreurs, inventaire et administration distante.
---

# Module 06. PowerShell pour administrateurs

<div class="ws25-meta"><span>Automatisation</span><span>12 h conseillées</span><span>2 TP</span><span>Scripts réutilisables</span></div>

## 1. Pourquoi PowerShell est central

PowerShell est à la fois un interpréteur de commandes et un environnement d'automatisation. Contrairement à une chaîne Unix traditionnelle, le pipeline PowerShell transporte **des objets typés**. Trier des services par leur propriété Status n'exige pas de découper manuellement une ligne de texte.

~~~powershell title="Lecture seule · Pipeline"
Get-Service |
    Where-Object Status -eq "Running" |
    Sort-Object Name |
    Select-Object -First 10 Name, DisplayName, Status
~~~

1. Get-Service renvoie des objets de service.
2. Where-Object filtre une propriété.
3. Sort-Object trie ces objets.
4. Select-Object projette les propriétés demandées.

### Inspecter les objets avant de travailler

~~~powershell title="Lecture seule"
Get-Service | Get-Member
Get-Command -Noun Service
Get-Help Get-Service -Full
Get-Module -ListAvailable | Select-Object Name,Version
~~~

Les valeurs affichées dépendent de la machine. **Get-Help** peut signaler une aide locale incomplète : consulter la documentation appropriée avant de paramétrer des modifications.

## 2. Variables, tableaux et conditions

~~~powershell title="Lecture seule · Exemples de types"
$serveurs = @("DC01", "DC02", "FS01")
$seuil = 20
foreach ($serveur in $serveurs) {
    [pscustomobject]@{
        Nom = $serveur
        PourcentageSeuil = $seuil
    }
}
~~~

Une variable stocke une valeur, un tableau regroupe plusieurs éléments. **[pscustomobject]** permet de construire des inventaires structurés exportables en CSV ou JSON.

Éviter de traiter toutes les valeurs comme de simples chaînes : une valeur de taille, une date, un booléen ou un identifiant doivent conserver leur sens.

## 3. L'idempotence et la sécurité des scripts

Un script **idempotent** converge vers un même état lorsqu'il est rejoué sans changement d'entrée. Pour des tâches courantes, cela signifie vérifier avant d'ajouter, ne pas dupliquer un objet, et afficher clairement les modifications nécessaires.

~~~powershell title="Exemple contrôlé · Créer un dossier de laboratoire"
$chemin = "C:\LabWS2025\Rapports"
if (-not (Test-Path -LiteralPath $chemin)) {
    New-Item -ItemType Directory -Path $chemin -Force |
        Out-Null
}
Get-Item -LiteralPath $chemin
~~~

Cette commande **crée un dossier** si celui-ci n'existe pas. Elle ne supprime rien ; le répertoire et son éventuel contenu doivent néanmoins être vérifiés avant nettoyage.

La propriété **SupportsShouldProcess** et le paramètre **-WhatIf** sont utiles pour les commandes qui les prennent en charge. Ils ne garantissent pas que **chaque commande** simule toutes les conséquences indirectes. Une fonction professionnelle doit intégrer contrôle et journalisation.

## 4. Traiter correctement les erreurs

~~~powershell title="Lecture/écriture contrôlée · Gestion d'erreur"
$chemin = "C:\LabWS2025\Rapports"
try {
    if (-not (Test-Path -LiteralPath $chemin)) {
        New-Item -Path $chemin -ItemType Directory -ErrorAction Stop |
            Out-Null
    }
    Write-Output "Répertoire disponible : $chemin"
}
catch {
    Write-Error "Échec de préparation : $($_.Exception.Message)"
    throw
}
~~~

Les exceptions **terminantes** sont interceptées par catch. Pour une commande susceptible de produire une erreur non terminante, l'utilisation appropriée de **-ErrorAction Stop** aide à obtenir le comportement attendu.

N'utilisez pas **SilentlyContinue** comme méthode générale pour masquer toutes les erreurs.

## 5. Inventaire reproductible

Sur un serveur autorisé :

~~~powershell title="Lecture et export CSV · Serveur local"
$racine = "C:\LabWS2025\Rapports"
New-Item -ItemType Directory -Path $racine -Force | Out-Null
$donnees = Get-Service | Select-Object Name,DisplayName,Status,StartType
$donnees | Export-Csv -Path (Join-Path $racine "services.csv") -NoTypeInformation -Encoding utf8
Import-Csv -Path (Join-Path $racine "services.csv") |
    Select-Object -First 5
~~~

**Export-Csv** crée ou remplace le fichier de destination. Dans une vraie procédure d'audit, utiliser un nom daté ou refuser d'écraser des résultats de référence. Éviter d'exporter des identifiants secrets.

### Distinguer inventaire et remédiation

Le meilleur automatisme commence en mode **lecture seule** : comparer l'état observé à l'état souhaité. Ce n'est qu'après validation qu'il propose ou exécute une modification. La sortie doit indiquer la cible, la date, le résultat, et les erreurs.

## 6. Exécution distante

Quand AD, DNS et la sécurité WinRM sont prêts :

~~~powershell title="Depuis MGMT01 · Inventaire sur serveur autorisé"
Invoke-Command -ComputerName DC01 -ScriptBlock {
    Get-ComputerInfo |
        Select-Object CsName,OsBuildNumber,WindowsProductName
}
~~~

Dans un environnement distant, le code s'exécute **sur l'ordinateur distant** : les chemins C:\ représentent son disque, pas celui de l'administrateur. Attention aux doubles sauts d'authentification, à l'accès à des partages externes et aux différences de modules entre systèmes.

## TP 06-A : script d'inventaire

**Objectif.** Enregistrer nom, build, adresses IP et état de services d'une VM, sans secret. **Déroulement.** Lire les données, créer des objets structurés, exporter un fichier CSV horodaté, réimporter puis comparer les valeurs.

**Validation :** relancer l'inventaire ne modifie pas le système ; chaque export porte une référence temporelle ; les erreurs sont visibles. **Retour arrière :** supprimer uniquement les fichiers d'inventaire de laboratoire après vérification de leur chemin.

**Corrigé conceptuel :** isoler collecte (Get-*), transformation (Select-Object/PSCustomObject), export (Export-Csv) et contrôle (Import-Csv). Une exportation réussie ne garantit pas que les données ont été correctement sélectionnées.

## TP 06-B : script de conformité

**Objectif.** Contrôler que le service W32Time est présent, que la machine possède l'IP attendue et que son nom correspond au plan. **Déroulement.** Produire un résultat « conforme / non conforme » sans lancer de modification.

~~~powershell title="Lecture seule · Exemple de contrôle local"
$nomAttendu = "DC01"
$ipAttendue = "10.50.0.10"
$nomOk = $env:COMPUTERNAME -eq $nomAttendu
$ipOk = @((Get-NetIPAddress -AddressFamily IPv4).IPAddress) -contains $ipAttendue
[pscustomobject]@{
    Machine = $env:COMPUTERNAME
    NomConforme = $nomOk
    AdresseConforme = $ipOk
    Conforme = $nomOk -and $ipOk
}
~~~

**Corrigé :** un résultat Faux constitue un **signal à analyser**, pas une justification pour renommer ou adresser automatiquement une VM sans vérification. Le script peut être adapté aux autres serveurs en changeant les valeurs attendues.

## Contrôle des connaissances

1. Que transporte un pipeline PowerShell ?
2. Quelle différence entre -ErrorAction Stop et SilentlyContinue ?
3. Pourquoi exporter un PSCustomObject plutôt que parser une sortie Format-Table ?
4. Quelle est l'utilité d'un script de contrôle sans remédiation ?

??? success "Correction"
    Des objets typés ; Stop rend l'erreur appropriée interceptable, SilentlyContinue masque l'affichage des erreurs non terminantes ; les objets préservent la structure ; un audit sans écriture permet de vérifier avant d'agir.

**Références :** [Documentation PowerShell](https://learn.microsoft.com/fr-fr/powershell/), [PowerShell Remoting](https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/).

[← Module 05](05-administration.md) · [Module 07 : architecture AD DS →](07-ad-architecture.md)
