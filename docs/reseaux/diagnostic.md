---
description: "Identifier le niveau auquel une connexion réseau échoue."
tags: ["Réseaux", "connectivité"]
---

# Diagnostic réseau sur Windows

<div class="kb-doc-meta"><span>Réseaux</span><span>Initiation</span><span>Exemple technique</span></div>

<div class="kb-doc-intro"><strong>Objectif.</strong> Identifier le niveau auquel une connexion réseau échoue.</div>


## Objectif
Déterminer si une panne provient de l'interface, de la passerelle, du DNS ou d'un service distant.

## Adressage IP
```powershell
ipconfig /all
```

## Tester un service distant
```powershell
Test-NetConnection example.com -Port 443
```

## Résolution DNS
```powershell
Resolve-DnsName example.com
```

## Chemin réseau
```powershell
tracert example.com
```

## Interprétation

| Constat | Hypothèse |
| --- | --- |
| Mauvaise adresse IP | DHCP ou configuration |
| Échec de résolution du nom | DNS ou connectivité |
| Port TCP injoignable | Service, filtrage ou routage |

!!! note
    Certains équipements bloquent ICMP : un échec de `tracert` n'est pas forcément une coupure.
