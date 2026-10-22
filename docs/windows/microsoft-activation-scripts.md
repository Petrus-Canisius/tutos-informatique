---
title: Comprendre et utiliser Microsoft Activation Scripts (MAS)
description: Présentation de la commande PowerShell irm https://get.activated.win | iex, analyse de sécurité, méthodes MAS et vérification du statut d'activation.
tags:
  - Windows 11
  - PowerShell
  - Activation
  - Sécurité
---

# Comprendre et utiliser Microsoft Activation Scripts (MAS)

<div class="dl-hero">
  <div class="dl-hero-copy">
    <span class="dl-eyebrow">GUIDE TECHNIQUE · WINDOWS · POWERSHELL</span>
    <p class="dl-hero-title">Comprendre une commande d'activation avant de l'exécuter</p>
    <p>Découvrir Microsoft Activation Scripts, examiner le script téléchargé, comprendre ses méthodes d'activation et vérifier le statut de Windows.</p>
    <div class="dl-pills"><span>Windows 10 / 11</span><span>PowerShell</span><span>MAS</span><span>Vérification de sécurité</span></div>
  </div>
  <div class="dl-hero-terminal" aria-hidden="true"><span>PS C:\&gt;</span> irm https://get.activated.win | iex<br><em>Exécution de code distant</em></div>
</div>

<div class="dl-facts">
  <div><strong>Objet</strong><span>Comprendre le lancement de Microsoft Activation Scripts.</span></div>
  <div><strong>Niveau</strong><span>Intermédiaire : PowerShell et administration Windows.</span></div>
  <div><strong>Prérequis</strong><span>Windows, connexion Internet et droits appropriés.</span></div>
  <div><strong>Publication</strong><span>22 octobre 2026.</span></div>
</div>

!!! danger "Logiciels et licences"
    **MAS est un outil tiers, non officiel.** Son utilisation pour activer un produit sans droits d'utilisation appropriés peut enfreindre les conditions de licence applicables. Une activation technique réussie ne prouve pas qu'une licence valide a été acquise. Sur un poste professionnel ou administré, utilisez uniquement les méthodes approuvées par votre organisation.

!!! warning "Exécution de script distant"
    La commande présentée ci-dessous **télécharge puis exécute immédiatement** du code disponible sur Internet. Le contenu distant peut évoluer. N'exécutez pas aveuglément une commande de ce type, en particulier avec des privilèges administrateur. Vérifiez l'URL, le code et la provenance avant toute exécution.

## 1. Présentation du projet {#presentation}

**Microsoft Activation Scripts (MAS)** est un projet open source maintenu par la communauté **Massgrave**. Il regroupe des fonctions relatives à l'activation de Windows, d'Office et aux diagnostics associés.

Sources du projet :

- [Documentation Massgrave](https://massgrave.dev/)
- [Dépôt source GitHub](https://github.com/massgravel/Microsoft-Activation-Scripts)

Selon sa documentation consultée le 22 octobre 2026, le projet présente plusieurs méthodes :

| Méthode | Principe annoncé par le projet |
| --- | --- |
| **HWID** | Activation numérique liée au matériel pour certaines versions de Windows |
| **Ohook** | Méthode proposée pour Office |
| **TSforge** | Méthode proposée pour Windows, Office et certaines mises à jour de sécurité étendues |
| **Online KMS** | Activation temporaire renouvelable utilisant un mécanisme KMS |

Ces fonctionnalités sont décrites par les auteurs du projet ; leur présence ne garantit **ni leur légalité dans chaque contexte ni leur compatibilité avec chaque édition**.

## 2. Comprendre la commande PowerShell {#commande}

La commande affichée dans la documentation est :

```powershell
irm https://get.activated.win | iex
```

Elle est composée de trois parties :

| Élément | Signification | Fonction |
| --- | --- | --- |
| `irm` | Alias PowerShell de `Invoke-RestMethod` | Récupère le contenu à l'adresse indiquée |
| `https://get.activated.win` | Adresse distante | Désigne le point de téléchargement du lanceur |
| `| iex` | Pipe vers `Invoke-Expression` | Exécute comme instructions PowerShell le contenu récupéré |

**Important :** `irm` seul récupère un contenu ; l'ajout de `| iex` transforme immédiatement ce contenu en commandes exécutables. Le risque est donc lié à l'exécution de code distant, non au simple téléchargement.

## 3. Vérifier le contenu avant de l'exécuter {#verification}

### 3.1 Examiner la provenance

Avant d'utiliser une commande publiée en ligne, vérifiez que l'adresse correspond exactement à celle indiquée sur le dépôt officiel. Méfiez-vous des liens raccourcis, domaines ressemblants et copies trouvées dans des vidéos ou forums.

### 3.2 Télécharger le script sans l'exécuter

Dans une fenêtre PowerShell, utilisez cette variante **sans `iex`** :

```powershell
$destination = Join-Path $env:TEMP "mas-launcher-review.ps1"
Invoke-WebRequest -Uri "https://get.activated.win" -OutFile $destination
Get-Content -LiteralPath $destination
```

La commande enregistre le contenu reçu dans un fichier temporaire, puis l'affiche. **Elle ne l'exécute pas.** Le fichier doit néanmoins être considéré comme non fiable tant que son contenu n'a pas été contrôlé.

### 3.3 Calculer une empreinte du fichier

```powershell
Get-FileHash -LiteralPath $destination -Algorithm SHA256
```

Une empreinte SHA-256 sert à identifier précisément la version téléchargée et à la comparer à une empreinte obtenue indépendamment. **Le simple affichage d'un hash ne démontre pas qu'un script est sûr.**

### 3.4 Lire le code source

Consultez le [dépôt GitHub officiel](https://github.com/massgravel/Microsoft-Activation-Scripts) et inspectez le contenu des scripts appelés par le lanceur. Un lanceur peut télécharger d'autres fichiers : vérifier seulement la première commande ne constitue pas un audit complet.

## 4. Exécution présentée dans la documentation MAS {#execution}

La documentation du projet indique d'ouvrir PowerShell, puis d'utiliser :

```powershell
irm https://get.activated.win | iex
```

Cette commande est fournie **à titre documentaire**. Son exécution suppose une décision explicite, après inspection et dans le respect des licences et de la politique informatique applicable.

Le projet annonce l'affichage d'un menu interactif proposant ses méthodes et des outils de diagnostic. Les options exactes peuvent changer selon la version du projet : ne vous fiez pas à des numéros de menu recopiés d'anciennes captures.

!!! note "Alternative de téléchargement"
    Les auteurs publient également une version `MAS_AIO.cmd` et une archive de leurs scripts dans leurs sources officielles. Le téléchargement préalable permet de consulter les fichiers avant lancement, sans supprimer les risques liés à leur exécution.

## 5. Contrôler le statut d'activation de Windows {#controle}

Pour connaître le statut affiché par Windows, utilisez d'abord la méthode native :

**Paramètres → Système → Activation**

Vous pouvez également exécuter ces commandes dans PowerShell ou l'invite de commandes :

```powershell
slmgr /xpr
```

La boîte de dialogue affiche les informations d'expiration ou de permanence de l'activation enregistrées par Windows.

```powershell
slmgr /dlv
```

Cette commande présente des informations détaillées sur le canal et l'état d'activation.

!!! info "Activation et droit d'usage"
    Ces contrôles renseignent l'état **technique** déclaré par Windows. Ils ne permettent pas à eux seuls de démontrer l'existence ou la conformité d'une licence Microsoft.

## 6. Alternative officielle : activer avec une licence valable {#alternative}

Pour activer Windows avec une clé de produit valide :

1. Ouvrez **Paramètres → Système → Activation**.
2. Sélectionnez l'option permettant de **modifier la clé de produit**, si elle est proposée.
3. Saisissez la clé correspondant à votre édition de Windows.
4. Suivez les instructions d'activation.

Une licence numérique peut aussi être associée à votre appareil ou à votre compte Microsoft, selon les modalités de licence. En environnement professionnel, les méthodes KMS, Active Directory ou les services cloud d'activation doivent être déployés conformément aux droits et contrats de l'organisation.

## 7. Erreurs et diagnostics {#depannage}

| Observation | Vérification |
| --- | --- |
| PowerShell ne connaît pas `irm` | Vérifier qu'il s'agit bien de PowerShell et non de `cmd.exe` |
| Impossible d'atteindre l'URL | Vérifier DNS, proxy, TLS et accès réseau, sans désactiver les contrôles de sécurité |
| Le code téléchargé diffère du dépôt connu | Suspendre l'exécution et vérifier la provenance |
| L'antivirus signale le script | Examiner l'alerte ; ne pas désactiver les protections pour forcer l'exécution |
| Windows indique « non activé » | Vérifier l'édition de Windows et la licence réellement détenue |
| Une machine d'entreprise utilise déjà un KMS | Se référer à l'équipe informatique et au contrat de licence |

## 8. Références et traçabilité {#references}

- [Documentation officielle du projet MAS](https://massgrave.dev/)
- [Code source Microsoft Activation Scripts](https://github.com/massgravel/Microsoft-Activation-Scripts)
- [État de l'activation Windows : documentation Microsoft](https://support.microsoft.com/windows/activate-windows)

*Documentation rédigée le 22 octobre 2026 à partir des ressources du projet MAS. Le script n'a pas été exécuté pour rédiger ce guide. Les fonctions du projet et leurs URL peuvent évoluer.*
