---
title: 09 · Identités et gestion des privilèges
description: OU, groupes AGDLP, délégation, comptes de services, Windows LAPS et sécurité des identités.
---

# Module 09. Administrer les identités et les privilèges

<div class="ws25-meta"><span>Active Directory</span><span>10 h conseillées</span><span>2 TP</span><span>Moindre privilège</span></div>

## 1. Modéliser utilisateurs, ordinateurs et groupes

Une conception Active Directory robuste distingue les **personnes**, les **groupes de rôles**, les **ressources** et les **droits**. Donner directement des permissions aux comptes utilisateurs paraît rapide, mais complique le suivi des mouvements de personnel, audits et départs.

Exemple : une collaboratrice du service Comptabilité doit modifier le dossier des factures. La permission concerne la fonction exercée, pas son nom. Un groupe rassemble les utilisateurs de ce service et est autorisé à accéder au dossier par une politique de groupes.

### AGDLP

Le modèle **AGDLP** signifie *Accounts → Global groups → Domain Local groups → Permissions*. Il sépare l'appartenance métier de la permission technique :

~~~text
Compte utilisateur
      │
      ▼
GG_Comptabilite
      │
      ▼
DL_Factures_Modification
      │
      ▼
ACL du dossier \\FS01\Factures
~~~

Les groupes globaux expriment une population ou fonction ; les groupes locaux de domaine représentent une autorisation attribuée à la ressource. Pour des environnements multi-domaines, des variantes telles qu'AGUDLP sont possibles.

## 2. Organiser les OU

Une **unité d'organisation** est utile pour répartir les objets et leurs délégations, appliquer des GPO ou organiser l'exploitation. Les OU **ne constituent pas** une isolation de sécurité à la hauteur d'une frontière de forêt.

Éviter les OU correspondant aveuglément à l'organigramme, qui change souvent. Une structure par types d'objets et niveau d'administration est plus stable, mais elle doit répondre à un besoin documenté.

Exemple pédagogique :

~~~text
OU=Entreprise
  OU=Utilisateurs
  OU=Postes
  OU=Serveurs
  OU=Groupes
  OU=ComptesService
~~~

## 3. Créer des groupes et des utilisateurs de test

Sur un poste ou serveur doté du module **ActiveDirectory**, avec des droits d'écriture dans l'OU du laboratoire :

~~~powershell title="AD · Lecture seule avant changement"
Get-ADDomain | Select-Object DNSRoot, DistinguishedName
Get-ADOrganizationalUnit -Filter * | Select-Object Name, DistinguishedName
Get-ADGroup -Filter 'Name -like "GG_*"' | Select-Object Name,GroupScope
~~~

Exemple de création d'une **OU de laboratoire** :

~~~powershell title="AD · Crée des objets, uniquement dans le domaine de test"
$racine = "DC=ad,DC=entreprise,DC=test"
if (-not (Get-ADOrganizationalUnit -LDAPFilter "(ou=Groupes)" -SearchBase $racine -ErrorAction Stop)) {
    New-ADOrganizationalUnit -Name "Groupes" -Path $racine
}
New-ADGroup -Name "GG_Comptabilite" -GroupScope Global -GroupCategory Security -Path "OU=Groupes,$racine"
New-ADGroup -Name "DL_Factures_Lecture" -GroupScope DomainLocal -GroupCategory Security -Path "OU=Groupes,$racine"
Add-ADGroupMember -Identity "DL_Factures_Lecture" -Members "GG_Comptabilite"
~~~

**Attention :** cet exemple n'est pas idempotent pour les groupes ; il échoue si les groupes existent déjà. Vérifier les objets avant de le rejouer. Les changements d'appartenance ont des conséquences sur les droits ; ne pas les appliquer dans un domaine réel en copiant l'exemple.

Validation :

~~~powershell title="AD · Lecture seule"
Get-ADGroupMember "DL_Factures_Lecture" | Select-Object Name,ObjectClass
~~~

Créer les comptes d'utilisateur avec des secrets **saisis interactivement**, une politique de nommage et un processus d'arrivée/départ. Ne jamais incorporer des mots de passe de démonstration persistants dans un dépôt public.

## 4. Délégation d'administration

Tous les administrateurs n'ont pas besoin d'être **Domain Admins**. La délégation AD permet d'accorder la création de certains comptes, le reset de mots de passe ou d'autres opérations sur des OU ciblées. Un groupe Helpdesk peut avoir un droit sur des utilisateurs sans pouvoir administrer l'ensemble de la forêt.

Il faut vérifier les droits **effectifs** sur les objets et les conséquences d'héritage. La délégation doit être recensée, revue périodiquement et retirée lors des changements de rôle.

## 5. Comptes de services gérés

Les comptes **gMSA** et **dMSA**, lorsqu'ils sont pris en charge par les rôles, niveaux et configurations nécessaires, permettent de réduire la gestion manuelle de secrets de services. Ils ne doivent pas être imposés sans vérifier la compatibilité de l'application et les conditions de récupération ou rotation du mot de passe.

Un compte de service ne doit pas être utilisé pour une session interactive standard ni recevoir Domain Admins par confort.

## 6. Windows LAPS

**Windows LAPS** gère automatiquement les secrets de comptes administrateurs locaux sur les systèmes compatibles. Sa valeur : éviter qu'un même mot de passe local soit réutilisé sur des centaines de postes. Selon le scénario, les secrets peuvent être stockés dans Windows Server Active Directory ou Entra ID.

Un déploiement AD implique de contrôler le schéma, les GPO, les autorisations des objets ordinateur, les autorisations de lecture des secrets et le chiffrement selon niveau fonctionnel.

!!! danger "Protéger les mots de passe LAPS"
    Les commandes de consultation de mot de passe ne sont pas destinées à être intégrées dans un tutoriel public avec valeurs en sortie. Ne capturer ni afficher les secrets dans les rapports, journaux ou copies d'écran de cours. Prévoir une traçabilité des accès aux secrets.

**Windows LAPS est distinct de l'ancien produit Microsoft LAPS**, désormais déconseillé sur les versions récentes prises en charge.

## TP 09-A : groupes AGDLP

**Mission :** créer dans le domaine de test deux groupes pour autoriser la lecture d'une ressource. **Validation :** un utilisateur autorisé peut lire le dossier, un utilisateur hors du groupe est refusé. **Diagnostic :** distinguer appartenance, jeton, permissions de partage et ACL NTFS. **Retour arrière :** relever puis retirer uniquement les permissions et groupes de test, après avoir vérifié leurs dépendances.

**Corrigé :** les permissions doivent être attribuées au groupe de ressource ; modifier le compte d'un utilisateur n'est pas nécessaire pour gérer chaque dossier.

## TP 09-B : préparer Windows LAPS

**Mission :** rédiger un dossier de prérequis LAPS pour CLIENT01 sans divulguer de secret. Relever versions, état de jonction au domaine, stratégie cible, droits de lecture et emplacement de stockage.

**Validation :** aucune identité ordinaire ne peut lire des secrets d'autres postes. **Corrigé :** la sécurité dépend des ACL AD, des politiques de rotation et des autorisations précises. L'existence de l'outil ne suffit pas.

## Questions de contrôle

1. Quel avantage principal apporte AGDLP ?
2. Une OU isole-t-elle des comptes administrateur compromis ?
3. Pourquoi éviter un compte de service disposant de Domain Admins ?
4. Windows LAPS empêche-t-il tout accès aux secrets administrateurs ?

??? success "Correction"
    AGDLP sépare rôles et droits ; une OU n'est pas une frontière de sécurité ; un compte de service sur-privilégié amplifie les risques ; LAPS protège et renouvelle les mots de passe, mais impose de contrôler strictement qui peut les consulter.

**Sources :** [Windows LAPS](https://learn.microsoft.com/fr-fr/windows-server/identity/laps/laps-overview), [LAPS avec Windows Server Active Directory](https://learn.microsoft.com/fr-fr/windows-server/identity/laps/laps-scenarios-windows-server-active-directory), [Documentation AD DS](https://learn.microsoft.com/fr-fr/windows-server/identity/ad-ds/).

[← Module 08](08-ad-deploiement.md) · [Module 10 : stratégies de groupe →](10-gpo.md)
