---
title: "17 · Hyper-V : virtualisation professionnelle"
description: Architecture, virtual switches, génération 2, VHDX, mémoire, checkpoints, réplication et sécurité des VM.
---

# Module 17. Hyper-V approfondi

<div class="ws25-meta"><span>Virtualisation</span><span>12 h conseillées</span><span>2 TP</span><span>Hôte de laboratoire</span></div>

## 1. L'hyperviseur et ses frontières

Hyper-V est la plateforme de virtualisation Microsoft intégrée à Windows Server et à certaines éditions professionnelles de Windows. Un **hyperviseur de type 1** fournit un environnement isolé dans lequel plusieurs systèmes invités peuvent fonctionner.

~~~text
HÔTE PHYSIQUE
  Processeur / RAM / NIC / Disques
             │
      Hyperviseur Hyper-V
       ┌─────┼─────────┐
      VM1   VM2       VM3
      DC01  FS01     CLIENT01
~~~

En pratique, la **partition parent** Windows gère de nombreux périphériques, contrôles et services de gestion. L'isolation d'une VM ne garantit pas qu'elle résistera à toutes les erreurs d'hôte, de stockage ou d'administrateur.

### Type 1 versus hôte

Une VM n'est pas un serveur physique indépendant. Les ressources CPU, RAM, disque et réseau restent limitées par l'hôte. Un hôte unique crée un point de panne partagé pour toutes les VM.

## 2. Générations et firmware

Les VM **Génération 2** utilisent UEFI et les mécanismes modernes de démarrage ; privilégier ce choix pour les systèmes Windows Server 2025 compatibles. Les VM Génération 1 répondent à certains besoins de compatibilité hérités.

**Secure Boot** et **vTPM**, quand utilisés, doivent être associés à une politique adaptée de protection des clés. Une VM chiffrée ou équipée d'un vTPM exige une sauvegarde cohérente de ses paramètres de sécurité.

## 3. Trois types de commutateur virtuel

| Type | Liaison | Usage |
| --- | --- | --- |
| Privé | Entre VM du même hôte | Exercices DHCP/AD isolés |
| Interne | Entre VM et système hôte | Gestion/laboratoire avec accès de l'hôte |
| Externe | Relié à une interface réseau physique | Charges à exposer sur le réseau prévu |

Le **commutateur privé LAB-WS2025** est la base de formation. Ne pas changer le type de commutateur sans vérifier si DHCP et AD pourraient atteindre des machines réelles.

~~~powershell title="Hôte Hyper-V · Lecture seule"
Get-VMSwitch | Select-Object Name,SwitchType
Get-VM | Select-Object Name,State,Generation,MemoryAssigned
Get-VMNetworkAdapter -All | Select-Object VMName,Name,SwitchName,MacAddress
~~~

## 4. CPU et mémoire

Un processeur virtuel n'équivaut pas nécessairement à un cœur physique réservé. Une charge VM peut souffrir d'un hôte saturé. La **mémoire dynamique** peut améliorer la consolidation, mais certaines charges sensibles exigent un paramétrage spécifique.

Dimensionner :
1. mesurer l'usage de CPU et mémoire ;
2. identifier les heures de pointe ;
3. conserver une marge pour le système hôte et les défaillances ;
4. documenter toute surallocation ;
5. comparer les performances avant/après migration ou changement.

Ne pas attribuer toutes les ressources physiques aux VM simplement parce que l'interface le permet.

## 5. Stockage VHDX

Un **VHDX** héberge des blocs de disque virtuel. On distingue généralement les disques virtuels de taille **fixe** et **dynamique**. La capacité maximale affichée à l'intérieur de la VM n'est pas nécessairement égale à l'espace actuellement occupé sur l'hôte.

Un VHDX dynamique peut croître jusqu'à saturer son volume physique. Le stockage doit être supervisé aux deux niveaux.

~~~powershell title="Hôte Hyper-V · Inventaire des disques VM"
Get-VMHardDiskDrive -VMName "FS01" |
    Select-Object VMName,ControllerType,ControllerNumber,Path
~~~

Si le disque est dans un chemin identifié :

~~~powershell title="Hôte Hyper-V · Lecture seule, chemin à adapter"
# Get-VHD -Path "D:\HyperV\LAB-WS2025\FS01.vhdx" |
#     Select-Object VhdType,Size,FileSize
~~~

## 6. Checkpoints : standard et production

Un checkpoint **standard** conserve notamment un état de VM, pouvant inclure la mémoire. Un checkpoint **de production** vise une capture cohérente des données via les mécanismes pris en charge par l'invité, tels que VSS. **Aucun checkpoint ne remplace une sauvegarde.**

Les services distribués, particulièrement AD DS, doivent être restaurés par des procédures cohérentes, et non par une utilisation improvisée des checkpoints.

Pour tester les checkpoints, créer une **VM auxiliaire sans AD** puis vérifier le type configuré :

~~~powershell title="Hôte Hyper-V · Lecture seule"
Get-VM -Name "APP01" | Select-Object Name,CheckpointType
Get-VMSnapshot -VMName "APP01" | Select-Object Name,CreationTime
~~~

## 7. Réplication, migration et haute disponibilité

- **Storage Migration** déplace le stockage VM sous les conditions prises en charge.
- **Live Migration** déplace une VM en exécution entre hôtes compatibles, avec une architecture réseau et stockage adaptée.
- **Hyper-V Replica** réplique une VM à des fins de reprise. La réplication **ne fournit pas automatiquement** un cluster avec basculement transparent.
- **Failover Clustering** orchestre des ressources entre nœuds pour certains scénarios de disponibilité.

La différence est importante : une copie répliquée peut être en retard, donc posséder un RPO non nul.

## TP 17-A : caractéristiques et performance

**Mission.** Sur l'hôte Hyper-V de laboratoire, relever commutateurs, génération, RAM, vCPU, stockage de DC01 et FS01. Vérifier que les adaptateurs sont confinés à LAB-WS2025.

**Validation.** Produire un tableau réconciliant les ressources invitées et hôte. **Corrigé :** aucune VM ne doit être considérée isolée physiquement lorsque l'hôte/stockage sont communs.

## TP 17-B : checkpoint de VM non critique

**Mission.** Sur **APP01** sans rôle distribué critique, créer un fichier témoin, prendre un checkpoint de production dans les conditions compatibles, modifier le fichier puis tester un retour d'état dans un scénario contrôlé.

**Validation.** Expliquer la différence entre checkpoint et sauvegarde, les paramètres de type de checkpoint et l'état constaté après la restauration. **Retour arrière :** restaurer la VM auxiliaire depuis une sauvegarde indépendante si le checkpoint échoue ; ne pas pratiquer cet exercice sur un DC.

## Révision

- Pourquoi la génération 2 est-elle le choix habituel pour Windows Server 2025 ?
- Pourquoi deux VM sur le même hôte ne sont-elles pas physiquement redondantes ?
- En quoi Hyper-V Replica diffère-t-il d'une haute disponibilité par cluster ?
- Un checkpoint de production est-il une sauvegarde complète indépendante ?

??? success "Correction"
    UEFI et capacités modernes ; hôte/stockage communs ; Replica est une technologie de reprise et non un basculement transparent de cluster ; non, un checkpoint reste dépendant de l'infrastructure VM.

**Sources :** [Hyper-V](https://learn.microsoft.com/fr-fr/windows-server/virtualization/hyper-v/overview), [Créer une VM](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/create-a-virtual-machine-in-hyper-v), [Checkpoints Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/checkpoints).

[← Module 16](16-services.md) · [Module 18 : haute disponibilité →](18-clustering.md)
