---
title: 05 · Administrer Windows Server 2025
description: Consoles, RSAT, PowerShell Remoting et Windows Admin Center, avec bonnes pratiques de sécurité.
---

# Module 05. Administrer localement et à distance

<div class="ws25-meta"><span>Administration</span><span>7 h d'étude</span><span>2 TP</span><span>RSAT, WinRM, WAC</span></div>

## 1. Une administration adaptée au service

L'administration de Windows Server 2025 s'organise à plusieurs niveaux : console locale, serveur distant, ensemble de serveurs, annuaire central et services cloud éventuels. Le choix d'un outil ne dispense jamais de définir **qui peut intervenir**, **depuis quelle machine**, **sur quels ports** et **avec quel suivi**.

| Outil | Périmètre | Avantage | Limite principale |
| --- | --- | --- | --- |
| Gestionnaire de serveur | Rôles et serveurs Windows | Vue familière et gestion de rôles | N'est pas une supervision complète |
| MMC et RSAT | Consoles de rôles Windows | Administration de DNS, AD, GPO | Fonctionnalité dépend des modules installés |
| SConfig | Configuration de Server Core | Configuration initiale rapide | Ne remplace pas les outils de rôle |
| PowerShell | Opérations, scripts, automatisation | Reproductibilité et inventaire | Exige compréhension et contrôle |
| PowerShell Remoting | Exécuter des commandes sur un serveur distant | Gestion à distance et standardisation | Authentification et filtrage à maîtriser |
| Windows Admin Center | Administration web centralisée | Expérience unifiée, rôles serveur | Dépend de la version/extension et de la connectivité |
| RDP | Session interactive | Dépannage graphique | Surface d'exposition à limiter |

**Principe :** préférer une station de gestion dédiée et des comptes d'administration distincts du compte utilisé pour la navigation Web et la messagerie.

## 2. RSAT et consoles de rôles

RSAT signifie *Remote Server Administration Tools*. Sur un poste Windows compatible, il fournit notamment des consoles AD, DNS et GPO. Il n'est pas nécessaire de travailler chaque jour directement sur la console d'un contrôleur de domaine.

Dans notre laboratoire, **MGMT01** est destiné à ces outils une fois la forêt créée. Avant d'installer un outil, identifier la machine d'administration et la version requise.

~~~powershell title="Windows Server · Inventaire en lecture seule"
Get-WindowsFeature | Where-Object { $_.Name -like "RSAT-*" } |
    Select-Object Name, InstallState
~~~

Les noms et modalités d'installation des outils RSAT **diffèrent entre Windows Server et Windows 11** ; sous Windows client, ils sont généralement présentés comme capacités facultatives. Ne pas exécuter aveuglément Install-WindowsFeature sur un poste client.

## 3. Fonctionnement de PowerShell Remoting

PowerShell Remoting permet de créer des sessions ou d'exécuter des blocs de commandes sur un système distant. En environnement Windows de domaine, l'authentification Kerberos est souvent privilégiée. WinRM utilise généralement **5985 pour HTTP** et **5986 pour HTTPS** ; **HTTP dans WinRM ne signifie pas automatiquement que les échanges PowerShell sont en clair**, car le message peut être chiffré par le mécanisme d'authentification. Cela ne dispense pas de vérifier les règles et les identités.

En **laboratoire isolé**, après avoir configuré les noms et accès :

~~~powershell title="Depuis MGMT01 · Lecture seule"
Test-NetConnection DC01 -Port 5985
Test-WSMan DC01
~~~

**Test-NetConnection** teste l'accès TCP, et **Test-WSMan** interroge l'interface de gestion. Aucun des deux ne prouve que votre compte possède les autorisations nécessaires pour administrer le serveur.

~~~powershell title="Depuis MGMT01 · Administration distante autorisée"
Invoke-Command -ComputerName DC01 -ScriptBlock {
    Get-Service | Where-Object Status -eq 'Running' |
        Select-Object -First 10 Name, Status
}
~~~

Cette commande suppose une configuration et des droits adéquats. Elle n'a pas vocation à être utilisée depuis Internet. Le nom d'hôte et l'identité doivent être vérifiés avant toute opération distante.

### Sécurité du remoting

Éviter d'ajouter en masse des machines à **TrustedHosts**, de désactiver les protections TLS ou de rendre les ports de gestion publics. Dans un groupe de travail, les exigences de confiance et d'authentification sont différentes de celles d'un domaine. Définir une politique d'administration distante, vérifier les pare-feu et préférer les méthodes d'authentification appropriées.

## 4. Windows Admin Center

Windows Admin Center est une interface d'administration centralisée. Il convient de distinguer **la passerelle WAC**, le navigateur du poste administrateur et les serveurs cibles. Pour une installation en entreprise, définir l'emplacement de la passerelle, le certificat HTTPS, l'authentification, les rôles WAC, les flux autorisés et la mise à jour des extensions.

Une installation réussie de WAC n'accorde pas, à elle seule, de droits sur tous les serveurs.

## 5. Préparer une intervention propre

Avant un changement : identifier la cible, sauvegarder les paramètres, déterminer une plage de maintenance, prévoir l'accès console, annoncer l'impact et définir une vérification métier. Après : constater le résultat, collecter les journaux et consigner le changement dans la documentation.

**Exemple :** « Déployer le rôle serveur de fichiers » ne se termine pas quand Install-WindowsFeature affiche Success. Il faut vérifier le service SMB, le partage, les identités, les ACL et l'accès depuis un vrai client.

## TP 05-A : console RSAT

**But.** Sur MGMT01, lister les outils RSAT disponibles et identifier ceux nécessaires aux scénarios DNS et AD. **Préparation.** Domaine du laboratoire opérationnel, compte limité aux droits nécessaires. **Contrôles.** Prouver que les consoles se connectent à DC01 et que les paramètres sont consultables. **Retour arrière.** Désinstaller uniquement un outil ajouté spécifiquement pour l'exercice, après vérification des dépendances.

**Corrigé :** documenter l'outil, la cible, le compte utilisé et l'opération de lecture réalisée. Une console ouverte ne prouve pas qu'une opération d'écriture sera autorisée.

## TP 05-B : diagnostic Remoting

**Symptôme simulé.** Test-NetConnection sur 5985 échoue ou Test-WSMan refuse la connexion.

1. Vérifier la résolution DNS, l'IP et le réseau virtuel.
2. Sur le serveur, consulter **Get-Service WinRM** et les écouteurs WinRM.
3. Examiner la portée et les règles de pare-feu.
4. Refaire un test de connexion avec une identité autorisée.
5. Ne modifier que l'élément démontré défaillant.

**Corrigé :** un échec réseau, un service arrêté et un refus d'authentification ont des causes différentes ; relever le message exact avant correction. Ne pas contourner la difficulté en désactivant globalement le pare-feu.

## Questions de contrôle

- Pourquoi une station de gestion est-elle préférable à une connexion de bureau sur le DC ?
- Quelles différences entre Test-NetConnection et Test-WSMan ?
- Quel est le rôle d'une passerelle Windows Admin Center ?
- Pourquoi ne pas utiliser TrustedHosts comme correction universelle ?

??? success "Correction"
    Séparer l'administration réduit la surface d'exposition. Le premier teste TCP, le second le service WinRM. WAC coordonne l'administration via une passerelle ; ses accès doivent être protégés. TrustedHosts change les mécanismes de confiance sans régler le réseau ni les droits.

### Documentation Microsoft

- [Administration de Windows Server](https://learn.microsoft.com/en-us/windows-server/administration/)
- [PowerShell Remoting](https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/)
- [Windows Admin Center](https://learn.microsoft.com/en-us/windows-server/manage/windows-admin-center/overview)

[← Module 04](04-installation.md) · [Module 06 : PowerShell →](06-powershell.md)
