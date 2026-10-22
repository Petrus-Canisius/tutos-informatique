---
title: 10 · Stratégies de groupe et gestion des GPO
description: Conception, héritage, ciblage, diagnostic gpresult et mesures de sécurité des stratégies Windows.
---

# Module 10. Stratégies de groupe

<div class="ws25-meta"><span>AD DS / GPO</span><span>10 h conseillées</span><span>2 TP</span><span>Configuration centralisée</span></div>

## 1. À quoi sert une GPO ?

Une **Group Policy Object** rassemble des paramètres de configuration utilisateur et ordinateur. Un administrateur peut, selon le besoin, appliquer des paramètres de sécurité, de bureau, d'accès aux ressources, de scripts ou de composants Windows.

Une GPO possède une partie enregistrée dans **Active Directory** et des contenus de stratégie présents dans **SYSVOL**. Ce double aspect rend la bonne réplication essentielle à une application cohérente.

## 2. Comprendre le traitement

Une stratégie peut être liée à un **site**, un **domaine** ou une **OU**. L'application suit des règles de traitement, incluant ordre des liens, héritage et priorités. Les paramètres utilisateur et ordinateur n'ont pas exactement le même cycle.

**LSDOU** est une aide mnémotechnique : Local, Site, Domain, Organizational Unit. Ce schéma doit être complété par les particularités telles que l'héritage bloqué, le lien imposé, le filtrage de sécurité, les filtres WMI et le traitement en boucle (*loopback*).

### Un exemple

- GPO **SEC-Postes** : configuration générale des postes.
- GPO **SEC-Serveurs** : paramètres spécifiques aux serveurs membres.
- GPO **RDP-Admins** : autorisation limitée à une population et aux machines concernées.

La bonne pratique n'est pas « une GPO gigantesque pour tout », mais une organisation justifiée, documentée et testée.

## 3. Éviter les erreurs d'architecture

- Ne pas appliquer des paramètres expérimentaux directement à la racine du domaine sans évaluation.
- Ne pas modifier par hasard la **Default Domain Policy** et la **Default Domain Controllers Policy**.
- Ne pas croire qu'une GPO non appliquée est nécessairement cassée : l'objet peut ne pas appartenir à la portée, être filtré ou attendre un rafraîchissement.
- Éviter de distribuer des secrets par des paramètres ou préférences de stratégie.
- Tester les modifications sur une OU pilote et prévoir un retour arrière.

## 4. Vérifier les stratégies reçues

Sur un **client Windows 11 joint au domaine**, un utilisateur peut consulter :

~~~powershell title="Client · Lecture seule"
gpresult /r
gpresult /scope computer /r
gpresult /scope user /r
~~~

Pour obtenir un rapport HTML dans un répertoire de test accessible :

~~~powershell title="Client · Génère un fichier de rapport"
$dest = "C:\LabWS2025\Rapports"
New-Item -ItemType Directory -Path $dest -Force | Out-Null
gpresult /h "$dest\gpo.html" /f
~~~

Le rapport dépend des droits, du compte et du contexte d'exécution. Certains états de stratégie ordinateur exigent une console élevée.

**gpupdate /force** peut déclencher un nouveau traitement, mais ne doit pas être la première réaction à chaque problème : vérifier d'abord DNS, liaison de l'OU, filtres, AD/SYSVOL et journaux.

## 5. Administration avec GPMC et PowerShell

Dans **Gestion de stratégie de groupe**, il est possible de créer un objet, le lier à une OU, préparer un filtrage et examiner les paramètres. La console présente aussi les possibilités de sauvegarde et de restauration des GPO, essentielles avant les changements.

Commande d'inventaire sur une machine possédant le module GroupPolicy :

~~~powershell title="MGMT01 · Lecture seule"
Get-GPO -All | Select-Object DisplayName,Id,GpoStatus
~~~

Ne pas supprimer une GPO sur la seule base d'un nom ou d'une absence supposée d'utilisation. Il faut rechercher les liens, la portée et les dépendances.

## TP 10-A : GPO pilote

**Mission.** Créer une GPO de laboratoire destinée à un paramètre sans impact critique, la lier à une **OU de test** et démontrer son application à CLIENT01.

**Préparation.** Domaine fonctionnel, OU dédiée, compte autorisé, sauvegarde des GPO. **Validation.** gpresult montre la GPO appliquée et le paramètre attendu. **Retour arrière.** Retirer le lien de test ou restaurer la GPO à partir de son export après vérification de la portée.

**Corrigé :** le nom de l'OU, le lien et le filtrage doivent tous concorder avec l'emplacement du compte ordinateur ou utilisateur.

## TP 10-B : diagnostiquer une GPO absente

**Symptôme.** Une GPO créée ne figure pas dans la liste des stratégies appliquées.

1. Relever l'OU de l'objet cible.
2. Examiner les liens de GPO et l'héritage.
3. Vérifier le filtrage de sécurité.
4. Vérifier la résolution DNS du domaine.
5. Examiner gpresult et les journaux GroupPolicy.
6. Corriger un seul élément identifié et refaire le test.

**Corrigé :** une GPO non liée à la bonne OU ne s'appliquera pas, même si son contenu est correct. Un problème de réplication peut produire des effets différents selon le DC contacté.

## Contrôle

- La portée d'une GPO dépend-elle seulement de son nom ?
- Où sont stockées les composantes d'une GPO ?
- Pourquoi faut-il une OU pilote ?
- Le résultat de gpresult est-il une preuve de la conformité de tous les paramètres ?

??? success "Correction"
    Non, la portée dépend des liens, de l'héritage et des filtres. AD et SYSVOL jouent un rôle. L'OU pilote limite l'impact. gpresult montre le traitement, qu'il faut compléter par la vérification fonctionnelle.

**Références :** [Documentation Group Policy](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/), [Utilitaire gpresult](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult).

[← Module 09](09-identites.md) · [Module 11 : DNS →](11-dns.md)
