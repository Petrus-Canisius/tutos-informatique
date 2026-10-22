---
title: 15 · Serveurs de fichiers, SMB et DFS
description: Sécuriser les partages, comprendre SMB, DFS, les ACL et SMB over QUIC.
---

# Module 15. Partage de fichiers : SMB et DFS

<div class="ws25-meta"><span>Services de fichiers</span><span>8 h conseillées</span><span>2 TP</span><span>FS01</span></div>

## 1. Le service de fichiers en entreprise

Un serveur de fichiers ne se réduit pas à un chemin UNC. Il doit gérer **l'identité**, **les droits**, **la disponibilité**, **la capacité**, **les versions de fichiers**, **les sauvegardes** et **l'audit**.

Le protocole **Server Message Block** (SMB) assure l'accès aux ressources partagées sur Windows et d'autres systèmes compatibles. L'utilisateur ouvre généralement un chemin tel que :

~~~text
\\FS01\Commun
~~~

Le nom doit d'abord être résolu ; le client doit atteindre le service ; l'identité doit être acceptée ; les autorisations de partage et du système de fichiers doivent permettre l'opération demandée.

## 2. Les deux couches de permissions

Les permissions **de partage SMB** encadrent l'accès via le réseau. Les **ACL NTFS** contrôlent les accès aux fichiers et dossiers, notamment depuis le réseau. Le résultat effectif dépend des deux couches ainsi que de l'identité, de l'héritage et des refus explicites.

| Identité | Partage | NTFS | Résultat schématique |
| --- | --- | --- | --- |
| Groupe A | Lecture | Lecture | Lecture |
| Groupe B | Modification | Lecture | Lecture |
| Groupe C | Aucun accès | Modification | Refus via réseau |
| Groupe D | Modification | Modification | Modification |

C'est un modèle pédagogique simplifié : les droits NTFS détaillés, héritages, privilèges et chemins d'accès peuvent nuancer les résultats.

## 3. Inventorier les partages

Sur **FS01**, après ajout du rôle approprié :

~~~powershell title="FS01 · Lecture seule"
Get-SmbShare | Select-Object Name,Path,Description
Get-SmbSession | Select-Object ClientComputerName,ClientUserName,NumOpens
Get-SmbServerConfiguration | Select-Object EnableSMB1Protocol,EnableSMB2Protocol,RequireSecuritySignature
~~~

Les valeurs dépendent des stratégies en vigueur. **SMB1** est obsolète pour des usages modernes et doit être évité. Une application demandant SMB1 exige une étude de remplacement ou une exception isolée et dûment approuvée, pas son activation générale.

## 4. Construire un partage test

Préparer sur le **volume de laboratoire** de FS01 un dossier T:\Commun (voir [module Stockage](14-stockage.md)). Créer dans AD les groupes de ressource puis décider des permissions.

~~~powershell title="FS01 · Crée un dossier de test"
$repertoire = "T:\Commun"
if (-not (Test-Path -LiteralPath $repertoire)) {
    New-Item -ItemType Directory -Path $repertoire -Force | Out-Null
}
Get-Acl $repertoire | Format-List Owner,Access
~~~

**Avant de publier un partage, appliquer des ACL NTFS adaptées**, par exemple par GPO, console graphique ou procédure encadrée. Ne pas reprendre une ACL par défaut sans l'analyser.

Exemple de partage à n'utiliser **qu'après** vérification des ACL et du groupe AD :

~~~powershell title="FS01 · Crée un partage sur le réseau privé"
# Vérifier le chemin et l'existence du groupe avant exécution
# New-SmbShare -Name "Commun" -Path "T:\Commun" -ReadAccess "ENTREPRISE\DL_Factures_Lecture"
~~~

L'exemple est volontairement commenté car un partage mal protégé peut diffuser des données. Une fois créé, contrôler **Get-SmbShareAccess -Name Commun** et tester depuis CLIENT01 avec un utilisateur autorisé **et** un utilisateur non autorisé.

## 5. Signature, chiffrement et compression SMB

- **SMB Signing** protège l'intégrité de certains échanges ; son comportement dépend des versions et stratégies cliente/serveur.
- **SMB Encryption** protège la confidentialité des données en transit.
- **Compression SMB** vise des gains de transfert selon la charge.
- **SMB Multichannel** peut utiliser plusieurs connexions ou interfaces dans les conditions prises en charge.

Le niveau de sécurité requis doit être validé par la configuration **effective**, pas seulement par une case dans une interface. Mesurer aussi l'effet sur les performances.

## 6. SMB over QUIC

Windows Server 2025 propose **SMB over QUIC** dans les éditions prises en charge, avec des clients Windows appropriés. QUIC fournit une connexion sécurisée reposant notamment sur TLS 1.3, généralement via **UDP 443** ; il évite d'exposer le traditionnel TCP 445 à un réseau non approuvé.

Préparer :
1. nom DNS du serveur correspondant au certificat ;
2. certificat valide et chaîne de confiance ;
3. configuration du service de fichiers pour QUIC ;
4. politique d'identité et d'accès ;
5. restriction des clients et du pare-feu ;
6. supervision et renouvellement des certificats.

**Particularité documentaire importante :** Microsoft indique que, pour Windows Server 2025, la configuration initiale de SMB over QUIC doit utiliser la **méthode PowerShell**, et non la procédure WAC destinée à certains autres scénarios. Toujours vérifier la documentation actuelle avant de produire les commandes de déploiement.

!!! warning "Ne pas exposer le laboratoire sur Internet"
    Le cursus décrit l'architecture QUIC ; il ne publie aucun serveur de test sur une interface externe. La présence de TLS ne dispense pas de contrôle d'identité, filtrage et mises à jour.

## 7. DFS Namespace et DFS Replication

**DFS Namespace** permet de présenter des chemins logiques plus stables que les noms directs des serveurs. **DFS Replication** réplique certains dossiers entre partenaires. Ces deux composants ne sont pas interchangeables.

Attention : DFS Replication n'est pas une solution universelle de synchronisation multiutilisateur de fichiers ouverts ni une sauvegarde. Il faut comprendre les conflits, les tailles de dossiers, les changements simultanés et les limites de prise en charge.

## TP 15-A : permissions effectives

**Mission.** Fournir à un membre de GG_Comptabilite un accès en lecture à \\FS01\Commun et le refuser à un compte hors du groupe. Mesurer permissions du partage et ACL NTFS.

**Validation :** le test est exécuté sous les deux identités ; les résultats sont documentés ; les groupes possèdent le bon type et la bonne portée. **Corrigé :** l'appartenance d'un utilisateur ne remplace pas les droits explicites de la ressource ; une déconnexion/reconnexion peut être nécessaire après modification d'un jeton de groupe.

## TP 15-B : haute disponibilité logique

**Mission.** Comparer un accès direct \\FS01\Commun et un chemin DFS logique proposé pour la société. Définir ce qui se passe lors d'une indisponibilité du serveur et si une cible secondaire existe réellement.

**Corrigé :** un espace de noms ne rend pas les données disponibles tout seul. Il faut prévoir des cibles, stockage, mécanismes de cohérence et tests de reprise.

## Contrôle

- Pourquoi un utilisateur peut-il avoir accès au partage mais pas au fichier ?
- Quelle fonction distingue DFS Namespace de DFS Replication ?
- Pourquoi SMB over QUIC ne signifie-t-il pas « ouvrir TCP 445 » ?
- Un volume ReFS protège-t-il automatiquement contre la suppression accidentelle ?

??? success "Correction"
    ACL NTFS plus restrictives ; namespace présente des chemins logiques, replication transporte les données dans certains scénarios ; QUIC est un transport distinct basé sur UDP/TLS ; ReFS ne remplace pas les sauvegardes.

**Sources :** [SMB over QUIC](https://learn.microsoft.com/fr-fr/windows-server/storage/file-server/smb-over-quic), [Sécurisation SMB](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-security-hardening), [Services de fichiers](https://learn.microsoft.com/en-us/windows-server/storage/file-server/).

[← Module 14](14-stockage.md) · [Module 16 : services d'entreprise →](16-services.md)
