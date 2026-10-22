---
title: 02 · Éditions, licences et nouveautés de Windows Server 2025
description: Choisir l'édition adaptée, différencier Core et Desktop, et comprendre les nouveautés sous conditions.
---

# Module 02. Éditions, licences et nouveautés

<div class="ws25-meta"><span>Planification</span><span>7 h conseillées</span><span>Choix technologiques</span><span>Windows Server 2025</span></div>

## Objectifs

Identifier une édition adaptée à une charge de travail, différencier édition et option d'installation, analyser le modèle de licences sans conclusions hâtives et savoir vérifier si une nouveauté est effectivement utilisable.

## 1. Une version, plusieurs éditions et plusieurs modes d'installation

**Windows Server 2025** désigne une génération du système. L'**édition** définit des droits et fonctionnalités ; l'**option d'installation** définit l'expérience d'administration locale.

| Choix | Positionnement | Vigilance |
| --- | --- | --- |
| Standard | Environnements physiques ou faiblement virtualisés | Droits de virtualisation, fonctionnalités particulières |
| Datacenter | Environnements fortement virtualisés et infrastructures avancées | Coût, droits d'usage, exigences des fonctionnalités |
| Datacenter: Azure Edition | Scénarios cloud/hybrides pris en charge | Disponibilité liée aux plateformes et images prises en charge |
| Server Core | Installation sans bureau complet | Administration principalement distante et par commandes |
| Desktop Experience | Bureau et consoles graphiques locales | Surface et maintenance potentiellement plus importantes |

Ne pas confondre **Azure Edition** avec un serveur Standard simplement enregistré dans **Azure Arc**, ni avec **Azure Local**, plateforme d'infrastructure distincte.

### Standard ou Datacenter : réfléchir en termes de besoins

Deux serveurs offrant AD DS et DNS peuvent convenir à Standard. Une plateforme de virtualisation dense avec besoins propres à Datacenter conduit plutôt à étudier Datacenter. Les fonctionnalités et leurs exceptions doivent être vérifiées dans le tableau Microsoft, ligne par ligne.

**Exemple de décision :** un petit site possède deux VM serveur. On commence par inventorier les rôles, les hôtes physiques, le nombre de machines virtuelles, les processeurs physiques, les CAL et les licences réellement détenues ; on ne décide pas à partir du nom de l'édition seulement.

## 2. Comprendre les licences sans raccourci

Pour un déploiement classique, les licences Windows Server s'articulent notamment autour de droits par cœur, avec minima et règles applicables au serveur physique. Les **CAL** d'accès sont une question distincte ; certaines charges telles que RDS ont aussi leurs propres droits. Les modalités de licence peuvent varier avec les contrats, droits de virtualisation et offres de souscription.

- Une licence d'OS ne signifie pas que toutes les connexions utilisateur sont couvertes.
- La présence d'Hyper-V ne signifie pas la gratuité de toutes les VM Windows Server.
- Le mode **Pay-as-you-go** existe pour Windows Server 2025 sous conditions Azure et de connectivité ; ce n'est pas un droit de licence universel hors ligne.
- Les ISO d'évaluation sont destinées aux essais selon leurs conditions, pas à un usage permanent de production.

!!! warning "Vérification contractuelle obligatoire"
    Les nombres de cœurs, minimums, droits d'instances et CAL doivent être validés à partir des termes de licence en vigueur et de l'inventaire réel. Une documentation pédagogique ne remplace pas le contrat Microsoft.

## 3. Core ou interface graphique ?

**Server Core** réduit l'interface locale et privilégie PowerShell, SConfig, RSAT, MMC à distance et Windows Admin Center. Il ne s'agit pas de « Windows sans commandes » ; c'est un mode d'installation disposant d'une administration spécifique. **Desktop Experience** facilite les consoles locales mais ne dispense ni du durcissement ni de l'automatisation.

Un choix raisonnable :
- Core pour des rôles compatibles, une exploitation automatisée et une équipe équipée pour l'administration distante ;
- Desktop Experience lorsque des composants ou un scénario de support nécessitent l'interface.

Le choix n'est pas un simple interrupteur après installation ; planifier une **réinstallation/migration** si une autre option est nécessaire.

## 4. Ce que Windows Server 2025 apporte

### Active Directory : niveau fonctionnel 2025

Windows Server 2025 introduit de nouveaux niveaux fonctionnels de domaine et de forêt. La montée de niveau est une **décision d'architecture** : au niveau 2025, les contrôleurs de domaine admis doivent exécuter Windows Server 2025. Windows Server 2019 et 2022 n'ont pas apporté de nouveaux niveaux fonctionnels au-delà de Windows Server 2016.

La capacité **pages 32K** de la base AD DS demande des conditions spécifiques. Il ne faut pas en déduire qu'une simple mise à jour sur place convertit instantanément toutes les bases historiques au format souhaité. La conversion nécessite une planification à l'échelle de la forêt, conformément à Microsoft Learn.

### SMB et partage de fichiers

Les évolutions de SMB comprennent des fonctions de sécurité, de performances et, selon les éditions/configurations, **SMB over QUIC**. La prise en charge exacte d'une fonction doit être vérifiée côté serveur, côté client et au niveau des certificats. Ne pas exposer SMB/TCP 445 sur Internet pour obtenir un « accès à distance facile ».

### Credential Guard et sécurité

**Credential Guard** peut être activé par défaut sur du matériel compatible. Une option « présente » dans le produit n'est pas la preuve qu'elle est active sur la VM : il faut vérifier VBS, UEFI, Secure Boot et les dépendances du processeur.

### Hotpatch

Hotpatch applique certains correctifs sans redémarrage immédiat de l'OS, mais il reste soumis à des correctifs de base, des conditions d'éligibilité et un calendrier. La documentation Microsoft d'octobre 2026 décrit notamment son utilisation sur Windows Server 2025 connecté à **Azure Arc** ou sur des plateformes Azure prises en charge. Ne pas promettre « plus aucun redémarrage » : les mises à jour de référence et certains autres changements nécessitent toujours des redémarrages.

### Azure Arc

Azure Arc permet d'enregistrer et de gérer des machines présentes hors Azure par l'intermédiaire d'un agent et de services connectés. Il ne transforme pas magiquement une VM locale en machine virtuelle Azure et n'offre pas toutes les fonctionnalités d'Azure Edition.

## 5. Identifier la machine, l'édition et l'état du système

Sur un Windows Server **de laboratoire**, PowerShell administrateur :

~~~powershell title="Lecture seule · Inventaire du système"
Get-ComputerInfo | Select-Object CsName, WindowsProductName, OsBuildNumber
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber
Get-WindowsEdition -Online
Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName
~~~

**Interprétation :** les API de version, édition Windows et liste des rôles doivent converger. Get-WindowsFeature est disponible sur Windows Server avec les outils appropriés, pas nécessairement sur n'importe quel poste Windows client.

~~~powershell title="Lecture seule · Détails Hyper-V / virtualisation"
Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer, Model, TotalPhysicalMemory
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
~~~

Ces informations ne démontrent pas à elles seules qu'une option de sécurité VBS particulière est activée.

## TP 02-A : recommander une édition

Une PME veut deux contrôleurs de domaine, un serveur de fichiers, un serveur applicatif et un seul hôte Hyper-V. Préparer deux propositions : Standard et Datacenter. Pour chacune, documenter :
1. rôles et fonctions nécessaires ;
2. quantité de VM et hôtes ;
3. exigences de licences/CAL à faire valider ;
4. avantages et limites ;
5. décision argumentée, sans supposer un prix.

**Corrigé attendu :** le choix dépend du nombre réel de VM, des droits d'usage et des fonctionnalités nécessaires ; « Datacenter est forcément meilleur pour AD » est une mauvaise justification.

## TP 02-B : matrice de nouveauté

Comparer dans un tableau trois fonctionnalités : niveaux fonctionnels AD 2025, pages 32K et Hotpatch. Pour chacune, relever **version**, **conditions**, **effet opérationnel** et **risque d'une activation mal préparée**.

**Corrigé attendu :** niveau fonctionnel 2025 : compatibilité des DC à valider ; pages 32K : prérequis forestiers et bases ; Hotpatch : plateforme/Arc/VBS et cycles de correctifs, ne supprime pas tout redémarrage.

## Contrôle des connaissances

- Quelle différence entre édition et mode d'installation ?
- Pourquoi ne faut-il pas élever immédiatement le niveau fonctionnel d'une forêt mixte ?
- Quelle différence entre l'enregistrement Azure Arc et Azure Edition ?
- Pourquoi un serveur éligible au Hotpatch doit-il garder un plan de maintenance ?

??? success "Correction"
    Édition = droits/capacités, mode = expérience locale. Le niveau 2025 exclut des contrôleurs antérieurs ; Azure Arc apporte une gestion hybride, pas l'identité d'édition ; Hotpatch ne couvre ni tous les correctifs ni tous les changements.

## Sources Microsoft

- [Comparaison des éditions](https://learn.microsoft.com/fr-fr/windows-server/get-started/editions-comparison?pivots=windows-server-2025)
- [Nouveautés de Windows Server 2025](https://learn.microsoft.com/fr-fr/windows-server/get-started/whats-new-windows-server-2025)
- [Niveaux fonctionnels AD DS](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/active-directory-functional-levels)
- [Pages 32K pour Active Directory](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/32k-pages-optional-feature)
- [Hotpatch et conditions d'éligibilité](https://learn.microsoft.com/en-us/windows-server/get-started/hotpatch)

[← Module 01](01-fondamentaux/) · [Module 03 : conception →](03-architecture/)
