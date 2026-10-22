---
title: 22 · Supervision et performances Windows Server
description: Analyse CPU, mémoire, stockage, réseau, journaux, alertes et capacité.
---

# Module 22. Supervision et performances

<div class="ws25-meta"><span>Exploitation</span><span>9 h conseillées</span><span>2 TP</span><span>Performance Monitor</span></div>

## Objectifs

Mesurer plutôt que deviner, définir des indicateurs de service, analyser les tendances, identifier les goulets d'étranglement et produire un diagnostic documenté.

## 1. Mesure et perception du service

Une plainte « le serveur est lent » ne précise ni le symptôme, ni le service ni la période. Distinguer :
- **ressources** : CPU, mémoire, réseau, stockage ;
- **disponibilité** : le serveur et le service répondent-ils ?
- **fonctionnement applicatif** : la transaction utilisateur aboutit-elle ?
- **journaux** : des erreurs sont-elles corrélées au symptôme ?
- **historique** : le comportement diffère-t-il de la normale ?

Un pic CPU n'est pas forcément un incident. Un CPU presque inactif peut masquer une application bloquée en attente de disque ou d'une ressource distante.

## 2. Inspection des ressources

~~~powershell title="VM de laboratoire · Lecture seule"
Get-ComputerInfo | Select-Object CsName,OsBuildNumber
Get-Process | Sort-Object CPU -Descending |
    Select-Object -First 12 Name,Id,CPU,WorkingSet64
Get-Volume | Select-Object DriveLetter,FileSystem,Size,SizeRemaining
Get-NetAdapterStatistics | Select-Object Name,ReceivedBytes,SentBytes
~~~

La propriété **CPU** de Get-Process reflète généralement du temps CPU cumulé : elle n'est pas l'occupation instantanée en pourcentage.

## 3. Performance Monitor et compteurs

**Performance Monitor** peut échantillonner des compteurs sur la durée. Les familles utiles incluent :

| Catégorie | Indicateurs à rechercher |
| --- | --- |
| CPU | Charge sur plusieurs intervalles, files d'attente selon contexte |
| Mémoire | Mémoire disponible, défauts de page et pression mémoire |
| Disque | Latences lecture/écriture, transferts, espaces restants |
| Réseau | Débit, erreurs, pertes et saturation d'interface |
| Hyper-V | Ressources consommées par les VM et l'hôte |
| Application | Temps de réponse, requêtes et erreurs métier |

Les chemins de compteurs peuvent être localisés. Ne pas supposer que la commande copiée depuis un Windows anglophone fonctionne sur toute installation francophone.

~~~powershell title="Lecture seule · Découverte des compteurs disponibles"
Get-Counter -ListSet * |
    Select-Object -First 25 CounterSetName
~~~

Exemple **indicatif** à adapter selon les chemins réels :

~~~powershell title="Lecture seule · Exemple sur OS avec compteurs anglais"
# Get-Counter '\Processor(_Total)\% Processor Time',
#             '\Memory\Available MBytes' -SampleInterval 2 -MaxSamples 8
~~~

Les seuils pertinents dépendent des applications. Mesurer une baseline en charge ordinaire, durant les sauvegardes et pendant les périodes d'activité élevée.

## 4. Tester le service de bout en bout

Pour le partage réseau FS01 :
1. vérifier que FS01 est démarré ;
2. vérifier DNS et le chemin réseau ;
3. tester TCP/445 ;
4. vérifier la session SMB et les droits ;
5. lire un document de test avec un compte représentatif ;
6. relever latence et erreurs.

Le simple état **Running** d'un service Windows ne valide pas la disponibilité métier.

### Analyser les événements

~~~powershell title="Lecture seule · Erreurs système récentes"
Get-WinEvent -FilterHashtable @{
    LogName="System"; Level=2; StartTime=(Get-Date).AddDays(-1)
} -MaxEvents 30 |
    Select-Object TimeCreated,Id,ProviderName,Message
~~~

Une erreur isolée n'a pas systématiquement d'impact. Vérifier la coïncidence temporelle et répéter le test fonctionnel.

## 5. Alertes et supervision centralisée

Une alerte utile comporte une machine, une métrique, un seuil, une période, une criticité, une action possible et un responsable. Un seuil trop strict déclenche des alertes inutiles ; un seuil trop large retarde le diagnostic.

Le **runbook d'alerte** doit préciser :
- comment confirmer le signal ;
- comment distinguer une panne réelle d'une anomalie transitoire ;
- quels journaux conserver ;
- qui prévenir ;
- ce qui peut être modifié et avec quelle approbation ;
- quels tests valident la résolution.

## 6. Capacity planning

L'anticipation inclut la croissance des fichiers, les IO de sauvegarde, les pics utilisateurs, la mémoire de l'hôte Hyper-V et l'espace pris par les VHDX dynamiques. Le dimensionnement doit permettre une reprise après panne lorsque c'est exigé.

Ne pas extrapoler des besoins sur une seule journée atypique. Mesurer des cycles représentatifs et noter les événements exceptionnels.

## TP 22-A : analyser une lenteur de FS01

**Scénario :** les utilisateurs signalent des lenteurs pendant une sauvegarde.

**Mission :** réaliser deux profils, pendant et hors sauvegarde, avec CPU, débit et latence disque, mémoire et journaux. Comparer sur les mêmes durées. **Validation :** graphiques ou tableau datés, hypothèse et tests. **Corrigé :** corrélation ne signifie pas causalité ; regarder aussi l'impact de l'anti-malware, de la réplication et du stockage physique de l'hôte.

## TP 22-B : détecter le manque d'espace

**Mission :** produire un inventaire des volumes en pourcentage libre et proposer deux seuils d'alerte, avec une politique de traitement.

~~~powershell title="Lecture seule · Capacités"
Get-Volume |
    Where-Object { $_.Size -gt 0 -and $_.DriveLetter } |
    Select-Object DriveLetter,Size,SizeRemaining,
      @{Name="LibrePourcent";Expression={[math]::Round(100 * $_.SizeRemaining / $_.Size,1)}}
~~~

**Corrigé :** une alerte de capacité ne justifie pas une suppression automatique de fichiers métier. Prévoir validation, augmentation de capacité ou politique de rétention.

## Auto-évaluation

1. Pourquoi le temps CPU cumulé diffère-t-il du pourcentage instantané ?
2. Un port réseau ouvert démontre-t-il que l'application fonctionne ?
3. Pourquoi conserver une baseline de performance ?
4. Quelle est la valeur d'une alerte sans propriétaire d'action ?

??? success "Réponses"
    Le temps cumulé s'additionne depuis le lancement du processus ; il ne représente pas un intervalle. Un port confirme une couche de communication, pas la transaction. La baseline permet les comparaisons. Une alerte sans responsable risque de ne pas être traitée.

**Références :** [Get-Counter](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-counter), [Performance Monitor](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/perfmon), [System Insights](https://learn.microsoft.com/en-us/windows-server/manage/system-insights/overview).

[← Module 21](21-sauvegarde.md) · [Module 23 : maintenance →](23-maintenance.md)
