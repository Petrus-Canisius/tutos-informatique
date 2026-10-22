---
title: 12 · DHCP, étendues et disponibilité
description: Comprendre DORA, installer DHCP en réseau privé, configurer options et failover IPv4.
---

# Module 12. DHCP, IPAM et haute disponibilité

<div class="ws25-meta"><span>Réseaux</span><span>8 h conseillées</span><span>2 TP</span><span>DHCPv4 et failover</span></div>

!!! danger "Un serveur DHCP peut perturber tout un réseau"
    Tous les exercices de ce chapitre doivent se dérouler sur **LAB-WS2025**, un commutateur Hyper-V **Privé**, sans pont externe. Un DHCP de test branché par erreur à un LAN réel peut distribuer de mauvaises adresses et mettre le réseau en panne.

## 1. DHCP, DORA et notion de bail

DHCP fournit dynamiquement certains paramètres réseau : adresse IPv4, masque, routeur, DNS et autres options. Le processus classique **DORA** signifie :

1. **Discover** : le client cherche un serveur DHCP.
2. **Offer** : un serveur propose un bail.
3. **Request** : le client demande une offre.
4. **Acknowledgment** : le serveur confirme l'attribution.

Le bail possède une durée. Son renouvellement dépend des temporisations et de la disponibilité du serveur. Une adresse obtenue via DHCP n'est donc pas nécessairement définitive.

### Étendues, exclusions, réservations

- **Étendue** : plage d'adresses et paramètres disponibles pour un sous-réseau.
- **Exclusion** : adresses retirées de l'allocation dynamique.
- **Réservation** : attribution prévue pour un client identifié.
- **Option 006** : liste de serveurs DNS IPv4.
- **Option 015** : suffixe DNS du domaine.

Une réservation n'est pas une garantie de sécurité : l'identité matérielle présentée par un client n'est pas un contrôle d'accès suffisant.

## 2. Architecture de laboratoire

Installer DHCP sur une VM membre **DHCP01** distincte de DC01, avec IP fixe **10.50.0.50/24** sur le commutateur privé. CLIENT01 est seul poste configuré pour recevoir une adresse automatiquement.

~~~text
LAB-WS2025, commutateur Hyper-V privé
   DC01/DNS 10.50.0.10       DC02/DNS 10.50.0.11
             \                   /
              DHCP01 10.50.0.50
                       |
                CLIENT01 (DHCP)
                10.50.0.100–149
~~~

Aucune passerelle n'est distribuée dans ce réseau fermé. Le réseau d'administration de l'hôte n'est pas branché au commutateur privé.

## 3. Installation sur DHCP01

Sur **DHCP01**, PowerShell administrateur :

~~~powershell title="DHCP01 · Vérification préalable"
Get-ComputerInfo | Select-Object CsName,WindowsProductName
Get-NetIPConfiguration
Get-WindowsFeature -Name DHCP
~~~

Si la VM est préparée, intégrée au domaine et isolée, installer le rôle :

~~~powershell title="DHCP01 · Modifie le système"
Install-WindowsFeature -Name DHCP -IncludeManagementTools
~~~

Dans un domaine AD, le serveur DHCP Windows doit être autorisé. Cette opération doit être effectuée par une identité disposant de droits appropriés ; ne pas attribuer Enterprise Admins à un opérateur habituel pour un exercice courant.

~~~powershell title="DHCP01 · Autorisation AD, laboratoire uniquement"
# À exécuter avec les droits AD adéquats
Add-DhcpServerInDC -DnsName "dhcp01.ad.entreprise.test" -IPAddress "10.50.0.50"
Get-DhcpServerInDC
~~~

**À ne pas exécuter avant la création du domaine.** Vérifier la résolution du nom de DHCP01 et que son IP correspond effectivement à la machine autorisée.

## 4. Créer une étendue contrôlée

~~~powershell title="DHCP01 · Modifie la configuration DHCP"
Add-DhcpServerv4Scope -Name "LAB-Clients" -StartRange 10.50.0.100 -EndRange 10.50.0.149 -SubnetMask 255.255.255.0
Set-DhcpServerv4OptionValue -ScopeId 10.50.0.0 -DnsServer 10.50.0.10,10.50.0.11 -DnsDomain "ad.entreprise.test"
Get-DhcpServerv4Scope
Get-DhcpServerv4OptionValue -ScopeId 10.50.0.0
~~~

L'absence de l'option routeur est **volontaire** : aucune sortie vers Internet n'est nécessaire. Si un autre serveur DHCP ou une étendue 10.50.0.0/24 existe déjà, s'arrêter avant de créer des doublons.

### Test client

Sur CLIENT01, après avoir vérifié qu'il s'agit bien du réseau privé, configurer IPv4 en automatique, puis inspecter :

~~~powershell title="CLIENT01 · État réseau"
ipconfig /all
Get-NetIPConfiguration
Resolve-DnsName dc01.ad.entreprise.test -Server 10.50.0.10
~~~

La machine doit obtenir une adresse dans la plage, des DNS internes et un suffixe correct. Les commandes de renouvellement DHCP peuvent interrompre une session distante ; préférer la console Hyper-V pour les essais.

## 5. DHCP Failover

Le **DHCP Failover** Windows permet à **deux serveurs DHCPv4** d'échanger les informations de baux d'une même étendue pour améliorer la disponibilité. Deux modes fréquents :

| Mode | Comportement |
| --- | --- |
| Load Balance | Les deux serveurs se répartissent les réponses aux clients selon la relation |
| Hot Standby | Serveur actif principal, partenaire prêt à reprendre le service |

Le service ne fournit pas un failover identique pour des étendues DHCPv6. Il faut également distinguer la disponibilité des serveurs DHCP de celle du routage, des relais DHCP, du DNS et du réseau de diffusion.

**Procédure pédagogique :** créer DHCP02 avec IP statique **10.50.0.51**, installer le rôle, autoriser l'hôte dans AD, puis configurer une relation DHCP Failover de l'étendue **10.50.0.0/24** depuis la console DHCP. Vérifier les partenaires et les baux ; simuler l'arrêt du serveur actif **uniquement dans le laboratoire**. Certaines contraintes et délais de basculement rendent les premiers tests trompeurs si l'on ne comprend pas la relation.

## 6. Diagnostiquer un bail absent

| Hypothèse | Contrôle |
| --- | --- |
| Mauvais commutateur | Carte de VM reliée à LAB-WS2025 |
| Serveur non autorisé dans AD | Get-DhcpServerInDC et événements DHCP |
| Service arrêté | Get-Service DHCPServer |
| Aucune étendue active | Get-DhcpServerv4Scope |
| Plage saturée | Baux et adresses restantes |
| Relais nécessaire | Topologie et frontières de diffusion |
| Pare-feu | Échanges UDP 67/68 et flux du rôle |

Un serveur DHCP peut fonctionner correctement, mais être sur un autre VLAN sans relais adapté. Un client IPv4 autoconfiguré en 169.254.0.0/16 signale souvent l'absence de bail compatible, pas nécessairement une panne physique.

## TP 12-A : attribuer un bail

**Objectif.** Faire obtenir à CLIENT01 une adresse 10.50.0.100–149, les DNS 10.50.0.10/11 et le suffixe ad.entreprise.test. **Prérequis.** DHCP01, AD, DNS et vSwitch privé. **Validation.** Lire ipconfig /all et les baux côté serveur, puis tester la résolution du DC. **Retour arrière.** Remettre CLIENT01 en configuration initiale et supprimer les seuls objets DHCP de test après enregistrement de leur portée.

**Corrigé :** vérifier l'étendue, l'autorisation AD, l'état du service et la liaison de la carte au réseau privé, dans cet ordre logique.

## TP 12-B : analyser une panne de disponibilité

**Objectif.** Concevoir une relation de failover entre DHCP01 et DHCP02, relever son mode et identifier les délais qui interviennent lorsqu'un serveur disparaît.

**Validation :** un client obtient un bail valide pendant le scénario documenté ; la configuration et les événements du partenariat sont consultables. **Corrigé :** l'état de la relation, les baux répliqués, la disponibilité du partenaire et les délais sont à examiner. Une interruption momentanée n'indique pas automatiquement une mauvaise configuration.

## Questions de contrôle

- DHCP remplace-t-il DNS ?
- Pourquoi un serveur DHCP isolé ne doit-il pas annoncer une passerelle fictive ?
- Combien de partenaires DHCPv4 une relation failover Windows associe-t-elle ?
- Le failover couvre-t-il de la même manière les étendues DHCPv6 ?

??? success "Correction"
    DHCP distribue des paramètres, DNS résout les noms. Une fausse passerelle gênerait les routes et diagnostics. Une relation failover associe deux serveurs. Le mécanisme DHCP Failover décrit ici concerne IPv4, pas DHCPv6.

**Références :** [DHCP Failover](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-failover), [Documentation DHCP](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/).

[← Module 11](11-dns.md) · [Retour au parcours](index.md)
