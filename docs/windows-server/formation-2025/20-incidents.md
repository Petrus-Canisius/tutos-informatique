---
title: 20 · Journalisation, détection et réponse aux incidents
description: Journaux Windows, WEF, Sysmon, corrélation, chronologie et réponse défensive aux incidents.
---

# Module 20. Détection et réponse aux incidents

<div class="ws25-meta"><span>Cybersécurité</span><span>10 h conseillées</span><span>2 TP</span><span>Logs et diagnostic</span></div>

## 1. Observer sans confondre signal et preuve

Un événement Windows est un **indice horodaté**, pas toujours une preuve suffisante de compromission. Il faut relier :
- la machine qui enregistre l'événement ;
- le canal et le fournisseur ;
- l'ID et les champs structurés ;
- l'identité et la session concernées ;
- la zone réseau ;
- les activités précédentes et suivantes ;
- la précision et la synchronisation des horloges.

Un échec d'ouverture de session unique peut résulter d'un mot de passe oublié. Une série d'échecs suivie d'un succès inattendu sur un compte privilégié justifie davantage d'investigation.

## 2. Les journaux Windows

| Canal | Finalité |
| --- | --- |
| System | Pilotes, services, démarrage et incidents du système |
| Application | Applications et composants applicatifs |
| Security | Audits selon la stratégie de sécurité activée |
| Microsoft-Windows-PowerShell/Operational | Événements PowerShell, selon les versions et politiques |
| Microsoft-Windows-GroupPolicy/Operational | Traitement des stratégies de groupe |
| Microsoft-Windows-DNS-Server/... | Événements du service DNS |
| Microsoft-Windows-TaskScheduler/Operational | Activités du planificateur de tâches |

Le nom précis d'un canal dépend des composants installés. On peut les explorer avec **Get-WinEvent -ListLog**.

~~~powershell title="Serveur de laboratoire · Lecture seule"
Get-WinEvent -ListLog * | Where-Object LogName -match 'Security|GroupPolicy|PowerShell' |
    Select-Object LogName,RecordCount,IsEnabled
Get-WinEvent -FilterHashtable @{
    LogName='System'
    Level=2
    StartTime=(Get-Date).AddDays(-1)
} -MaxEvents 30 | Select-Object TimeCreated,Id,ProviderName,Message
~~~

Un filtrage très large de Security sur un DC occupé peut être coûteux. Pour de grands volumes, filtrer par plage horaire, ID et fournisseur.

## 3. Quelques identifiants de sécurité utiles

Selon les stratégies d'audit et le contexte :

| ID | Interprétation de départ |
| --- | --- |
| 4624 | Ouverture de session réussie |
| 4625 | Échec d'ouverture de session |
| 4634 | Fermeture de session |
| 4672 | Privilèges spéciaux attribués à une nouvelle session |
| 4688 | Création d'un processus, si audit correspondant activé |
| 4720 | Création d'un compte utilisateur |
| 4728 / 4732 | Ajout à certains types de groupes de sécurité |
| 4740 | Verrouillage d'un compte |

**Attention :** interpréter les types de logon, identifiants de session, machines source et champs associés. Un ID, pris isolément, ne démontre pas une attaque.

Exemple filtré sur **une VM de laboratoire autorisée** :

~~~powershell title="Lecture seule · Échecs de connexion récents"
Get-WinEvent -FilterHashtable @{
    LogName='Security'
    Id=4625
    StartTime=(Get-Date).AddHours(-6)
} -MaxEvents 20 | Select-Object TimeCreated,Id,MachineName,Message
~~~

La consultation du journal Security nécessite des autorisations adéquates. Ne pas publier des messages contenant des noms réels, adresses sensibles ou informations personnelles sans anonymisation.

## 4. Sysmon et Windows Event Forwarding

**Sysmon** (System Monitor) peut enregistrer des événements détaillés sur des processus, connexions et autres opérations selon sa configuration. Sa qualité dépend d'une politique de journalisation adaptée : collecter tout peut surcharger la machine et le SOC.

**Windows Event Forwarding (WEF)** permet une collecte centralisée d'événements Windows vers un collecteur, selon un mécanisme de souscription. Les paramètres WinRM, certificats éventuels, quotas, droits et stockage doivent être planifiés.

~~~text
CLIENT01 ─┐
FS01 ─────┼──► Collecteur WEF / SIEM ──► Corrélation
DC01 ─────┘                  │
                      Rétention / droits
~~~

Un collecteur n'est pas automatiquement un SIEM : ce dernier ajoute notamment normalisation, analyses, corrélations, règles et gestion des alertes.

## 5. Méthode de réponse : identifier, préserver, contenir

1. **Qualifier le signal.** Qui l'a reçu, quel actif, quel impact ?
2. **Préserver les preuves.** Éviter de réinitialiser ou supprimer des éléments avant collecte justifiée.
3. **Établir une chronologie.** Heure locale, fuseau, décalages, événements systèmes, réseau et comptes.
4. **Estimer la portée.** Utilisateurs, services, autres machines.
5. **Contenir selon procédure approuvée.** Éviter une action improvisée rendant l'entreprise inaccessible.
6. **Éradiquer et restaurer.** À partir de sauvegardes et composants de confiance.
7. **Vérifier et surveiller.** Tests d'identité, flux, journaux et fonctionnement métier.
8. **Documenter et améliorer.** Cause probable, incertitudes, mesures et propriétaires.

La réponse à un incident de domaine compromis peut exiger des procédures spécialisées de restauration et renouvellement de secrets ; ne pas appliquer de remédiation automatique à l'échelle de la forêt sans analyse approfondie.

## TP 20-A : chronologie d'un incident de connexion

**Simulation sûre :** sur CLIENT01 de laboratoire, réaliser une tentative de connexion erronée avec un compte de test, puis une connexion normale, sans outil offensif.

**Mission :** relever les événements disponibles sur les systèmes concernés et identifier l'heure, les types de connexion et les comptes. Certaines entrées seront sur le client, d'autres éventuellement sur le DC selon le protocole et l'audit activé.

**Validation :** une chronologie en trois colonnes, « événement observé / source / interprétation », sans données sensibles publiées. **Corrigé :** les événements sur deux hôtes ne sont comparables que si leurs horloges sont cohérentes.

## TP 20-B : construire une règle de détection

**Contexte :** alerter lorsqu'un compte à haut privilège fait l'objet de nombreux échecs de connexion, puis d'une réussite inhabituelle.

**Livrable :** champs à collecter, fenêtre temporelle hypothétique, règles d'exclusion, seuil test, procédure de validation et risque de faux positifs.

**Corrigé :** le nombre d'échecs seul ne suffit pas à conclure ; l'alerte est une piste d'investigation à corréler aux types de sessions et au contexte métier.

## Questions de contrôle

- Pourquoi un événement 4624 n'est-il pas nécessairement suspect ?
- Quelle différence entre WEF et SIEM ?
- Quel risque à collecter des événements très détaillés sans politique de rétention ?
- Pourquoi conserver l'heure et la machine source de chaque preuve ?

??? success "Correction"
    Une ouverture de session réussie peut être légitime ; WEF transporte des événements, un SIEM les exploite ; le stockage et les données personnelles peuvent poser problème ; des preuves sans contexte temporel perdent leur valeur d'analyse.

## Sources Microsoft

- [Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent)
- [Windows security auditing](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/)
- [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
- [Windows Event Forwarding](https://learn.microsoft.com/en-us/windows/security/operating-system-security/device-management/use-windows-event-forwarding-to-assist-in-intrusion-detection)

[← Module 19](19-securite.md) · [Module 21 : sauvegarde →](21-sauvegarde.md)
