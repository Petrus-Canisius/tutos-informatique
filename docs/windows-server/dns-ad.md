# Diagnostic DNS et Active Directory

## Objectif
Vérifier la résolution DNS et l'annonce des contrôleurs de domaine.

## Prérequis
Disposer du nom DNS du domaine à diagnostiquer et d'un accès réseau autorisé.

## Serveurs DNS configurés
```powershell
Get-DnsClientServerAddress -AddressFamily IPv4
```

## Résolution DNS
```powershell
Resolve-DnsName exemple.local -Type A
```

## Enregistrements Active Directory
```powershell
Resolve-DnsName _ldap._tcp.dc._msdcs.exemple.local -Type SRV
```

Remplacer `exemple.local` par le domaine concerné.

## Vérification
Comparer les réponses aux serveurs DNS et aux contrôleurs de domaine attendus.
