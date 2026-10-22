---
title: Laboratoire Hyper-V Windows Server 2025
description: Concevoir un réseau Hyper-V isolé et construire les machines virtuelles de la formation sans exposer le LAN réel.
---

# Laboratoire fil rouge : infrastructure d'entreprise

<div class="ws25-meta"><span>Prérequis</span><span>Hyper-V</span><span>2 à 4 h de préparation</span><span>Niveau initial</span></div>

## 1. Objectif et frontière de sécurité

Une entreprise fictive, **Entreprise**, dispose à terme de plusieurs serveurs Windows Server 2025 et d'un client Windows 11. L'exercice se déroule **sur un commutateur virtuel privé**, sans connexion directe au réseau réel. On active Internet uniquement si le besoin l'exige, au moyen d'un accès NAT explicitement maîtrisé ou d'un second adaptateur temporaire, jamais en pontant par erreur le domaine de test au réseau familial ou professionnel.

!!! danger "Réseau isolé obligatoire"
    Un serveur DHCP de test, une résolution DNS Active Directory ou un pare-feu reconfiguré peuvent perturber des postes réels. **N'utilisez pas le commutateur Externe pour les exercices DHCP/AD.** Travaillez dans un réseau virtuel sans pont vers le réseau physique. Conservez une sauvegarde de la configuration réseau de l'hôte.

## 2. Matériel et licences

| Composant | Démarrage progressif | Ensemble du cursus |
| --- | --- | --- |
| Hôte Windows | Windows 11 Pro/Enterprise compatible Hyper-V ou serveur Hyper-V | Machine dédiée, virtualisation matérielle activée |
| CPU | 4 cœurs physiques recommandés | 8 cœurs ou plus |
| RAM | 16 Go pour 1–2 VM légères | 32 à 64 Go selon nombre de VM simultanées |
| Stockage libre | 120 Go SSD pour démarrer | 400 Go à 1 To SSD |
| Images ISO | Windows Server 2025 d'évaluation et Windows 11 licite | ISO appropriées selon la licence |

Ces chiffres sont des hypothèses pédagogiques, **pas les exigences matérielles minimales du produit**. Chaque VM ne doit pas dépasser la mémoire et les ressources réellement disponibles. Pour les essais de cluster et de virtualisation imbriquée, un équipement plus puissant est nécessaire.

Les éditions d'évaluation sont soumises à leurs propres conditions et durées d'utilisation ; elles ne deviennent pas des licences de production.

## 3. Plan de nommage et d'adressage

Domaine de test : **ad.entreprise.test** (suffixe réservé à l'usage des tests).

| VM | Rôle prévu | IPv4 fixe prévue | Mémoire de départ indicative |
| --- | --- | --- | --- |
| DC01 | AD DS / DNS | 10.50.0.10 | 2–4 Go |
| DC02 | AD DS / DNS secondaire | 10.50.0.11 | 2–4 Go |
| FS01 | Fichiers / FSRM | 10.50.0.20 | 2–4 Go |
| APP01 | IIS / application | 10.50.0.30 | 2–4 Go |
| MGMT01 | Administration | 10.50.0.40 | 2–4 Go |
| CLIENT01 | Client Windows 11 | DHCP ou 10.50.0.101 | 4 Go ou plus |

Plage isolée : **10.50.0.0/24**. Aucune passerelle n'est nécessaire si le laboratoire ne sort pas sur Internet. Après la création du domaine, les serveurs et clients du domaine doivent utiliser les DNS des contrôleurs de domaine ; un DNS public configuré directement comme DNS secondaire ne remplace pas le DNS interne AD.

### Topologie initiale

~~~text
                HÔTE HYPER-V (hors domaine de test)
                         │
                    vSwitch privé
                    LAB-WS2025
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
   DC01 10.50.0.10  CLIENT01 .101     autres VM
   DNS puis AD DS      Windows 11     (plus tard)
~~~

L'hôte n'est pas connecté à ce commutateur de type Privé. L'administration initiale des machines se fait par la console Hyper-V (VMConnect). Un commutateur **Interne** relierait aussi l'hôte au segment : possible pour d'autres scénarios, mais cela modifie la frontière réseau.

## 4. Vérifier l'hôte Hyper-V

Sur **l'hôte Windows**, PowerShell administrateur :

~~~powershell title="Hôte Hyper-V · Diagnostic en lecture seule"
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
Get-VMSwitch | Select-Object Name, SwitchType
Get-VM | Select-Object Name, State, MemoryAssigned
~~~

Si Hyper-V n'est pas disponible, contrôler l'édition de Windows, les extensions processeur, les options firmware et la compatibilité d'autres hyperviseurs. Ne pas tenter d'activer une fonctionnalité absente par un contournement non pris en charge.

## 5. Créer un commutateur privé

Dans **Gestionnaire Hyper-V → Gestionnaire de commutateur virtuel → Nouveau commutateur réseau virtuel**, sélectionner **Privé**, nommer **LAB-WS2025**, créer puis vérifier. Alternative PowerShell administrateur :

~~~powershell title="Hôte Hyper-V · Crée un réseau privé"
New-VMSwitch -Name "LAB-WS2025" -SwitchType Private
Get-VMSwitch -Name "LAB-WS2025" | Format-List Name,SwitchType
~~~

La première ligne **modifie la configuration de l'hôte**. Ne l'exécuter que si ce nom n'existe pas déjà. Un commutateur privé ne distribue pas d'adresse IP et ne fournit pas d'accès Internet.

## 6. Créer une première machine virtuelle

Depuis Gestionnaire Hyper-V, choisir **Nouveau → Machine virtuelle**, génération **2**, 2 Go ou 4 Go de RAM, commutateur **LAB-WS2025**, disque VHDX dynamique de 60 Go à 80 Go, puis monter l'ISO officielle de Windows Server 2025.

Alternative sur l'hôte, après avoir remplacé les deux chemins par des répertoires existants et vérifié leur capacité :

~~~powershell title="Hôte Hyper-V · Exemples à adapter"
$vmName = "DC01"
$vmRoot = "D:\HyperV\LAB-WS2025"
$iso = "D:\ISO\WindowsServer2025.iso"
New-VM -Name $vmName -Generation 2 -MemoryStartupBytes 4GB -NewVHDPath "$vmRoot\DC01.vhdx" -NewVHDSizeBytes 80GB -SwitchName "LAB-WS2025"
Set-VMProcessor -VMName $vmName -Count 2
Add-VMDvdDrive -VMName $vmName -Path $iso
Get-VM -Name $vmName | Format-List Name,Generation,State
~~~

**Attention :** l'exemple crée des ressources, peut échouer si les chemins n'existent pas, et ne doit pas être relancé sans contrôle (une VM du même nom existe peut-être). Dans la console Hyper-V, vérifiez l'ordre de démarrage du firmware UEFI : le lecteur DVD doit permettre de démarrer sur l'ISO au premier lancement. Les captures de configuration et chemins d'ISO dépendent de la machine.

## 7. Installation réseau de DC01

Après installation du système, dans la console de **DC01**, en PowerShell administrateur :

~~~powershell title="VM DC01 · État avant configuration"
Get-NetAdapter
Get-NetIPConfiguration
Get-DnsClientServerAddress -AddressFamily IPv4
~~~

Identifier précisément l'alias de l'interface réseau avant de modifier l'adresse. Sur une installation vierge, adapter l'alias constaté :

~~~powershell title="VM DC01 · Adresse fixe du laboratoire"
$if = "Ethernet"
New-NetIPAddress -InterfaceAlias $if -IPAddress 10.50.0.10 -PrefixLength 24
Set-DnsClientServerAddress -InterfaceAlias $if -ServerAddresses 10.50.0.10
Get-NetIPConfiguration -InterfaceAlias $if
~~~

Cette configuration est destinée **uniquement à DC01, sur le réseau privé**. Une adresse déjà présente, une ancienne passerelle ou un alias différent exigent un traitement distinct. Avant l'installation DNS, la requête vers 10.50.0.10 peut échouer : ce sera normal tant que le service n'existe pas.

## 8. Vérifications, restauration et preuves

1. Confirmer que tous les adaptateurs des VM visent **LAB-WS2025**, pas le commutateur Externe.
2. Vérifier que l'hôte n'a pas reçu une interface virtuelle sur ce commutateur privé.
3. Relever l'adresse de DC01 et conserver la sortie de **Get-NetIPConfiguration**.
4. Tester la communication entre deux VM configurées sur le même sous-réseau.
5. Avant les exercices risqués, créer une sauvegarde de VM à l'arrêt ou une copie cohérente de VHDX. **Un checkpoint Hyper-V n'est pas une sauvegarde**, et son utilisation sur des contrôleurs de domaine exige une vigilance particulière.

Retour arrière du commutateur **uniquement s'il a été créé pour ce laboratoire et qu'aucune VM n'en dépend** :

~~~powershell title="Hôte Hyper-V · Destructif : à confirmer avant exécution"
# Inspecter d'abord les dépendances :
Get-VMNetworkAdapter -All | Where-Object SwitchName -eq "LAB-WS2025"
# Puis, après déconnexion et vérification des VM :
# Remove-VMSwitch -Name "LAB-WS2025"
~~~

### Travail pratique L-01 : isolement du réseau

**Mission.** Fournir une capture de la configuration du vSwitch privé, une liste des adaptateurs de VM et le tableau IP. **Succès** : aucun adaptateur invité n'est branché au LAN physique et chaque machine future dispose d'une IP unique. **Incident à analyser** : deux VM ne communiquent pas ; vérifier commutateurs et masques avant de désactiver un pare-feu.

**Corrigé méthodologique.** On constate SwitchType = Private, les cartes VM sont attachées à LAB-WS2025 et leurs IP sont dans le même /24. On teste d'abord Get-NetIPConfiguration et Test-NetConnection vers un service effectivement ouvert plutôt que de supposer que l'ICMP est autorisé.

### Références

- [Créer une machine virtuelle Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/create-a-virtual-machine-in-hyper-v)
- [Créer un commutateur virtuel Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/create-a-virtual-switch)
- [Installer Windows Server depuis un support](https://learn.microsoft.com/fr-fr/windows-server/get-started/install-windows-server)

[Suite : fondamentaux](01-fondamentaux/)
