---
title: 21 · Sauvegarde, restauration et PRA
description: VSS, System State, récupération Active Directory, RTO, RPO et stratégies de sauvegarde testables.
---

# Module 21. Sauvegarde et continuité d'activité

<div class="ws25-meta"><span>Continuité</span><span>12 h conseillées</span><span>2 TP</span><span>RTO / RPO</span></div>

## Objectifs

Concevoir une politique de sauvegarde, distinguer une copie d'une sauvegarde restaurable, reconnaître les limites des checkpoints et planifier une reprise d'activité documentée.

## 1. Définir les besoins de reprise

Une **sauvegarde** doit permettre de récupérer une donnée ou un système à un état connu, indépendant du système d'origine. Une **réplication** reproduit un état, y compris parfois des suppressions. Un **checkpoint** dépend de l'infrastructure virtuelle et n'est pas une sauvegarde indépendante.

Le **RPO** (*Recovery Point Objective*) représente l'ancienneté maximale acceptable des données restaurées. Le **RTO** (*Recovery Time Objective*) représente la durée de reprise attendue.

| Service fictif | RPO | RTO | Conséquence |
| --- | --- | --- | --- |
| Partage des factures | 4 h | 8 h | Copies suffisamment rapprochées et restauration vérifiée |
| Application interne | 24 h | 12 h | Configuration, certificats, données et dépendances à conserver |
| Domaine AD DS | À valider | À valider | Redondance de DC et stratégie spécialisée de récupération |

Ces valeurs sont **hypothétiques** : les objectifs doivent être approuvés par le métier et le responsable du service.

## 2. Protéger les copies

Le principe classique **3-2-1** vise trois copies de données, sur deux types de supports, dont au moins une hors site. Pour mieux résister à une compromission des identifiants administrateurs, ajouter des copies **immuables ou hors ligne**, et tester les accès d'urgence.

Une sauvegarde sur un volume de FS01 connecté en permanence avec les mêmes comptes à privilèges peut disparaître avec les données de production. Le chiffrement des sauvegardes suppose une gestion séparée des clés et des procédures de récupération.

## 3. Cohérence applicative et VSS

**Volume Shadow Copy Service (VSS)** coordonne des instantanés via des fournisseurs et des composants applicatifs appelés writers. L'existence d'un snapshot de volume ne garantit pas à elle seule la cohérence d'une application ou de sa base.

~~~powershell title="Serveur de laboratoire · Lecture seule"
vssadmin list writers
vssadmin list providers
Get-Service VSS
~~~

Consigner les erreurs des writers avant de relancer des sauvegardes. Redémarrer les services sans analyse peut provoquer d'autres indisponibilités.

## 4. Windows Server Backup

Le rôle **Windows Server Backup** prend en charge certains scénarios de sauvegarde et de restauration. Dans une entreprise, le choix de l'outil dépend aussi de la rétention, du catalogue, du stockage extérieur, des VM et des tests.

~~~powershell title="Lecture seule · Présence du rôle"
Get-WindowsFeature -Name Windows-Server-Backup
~~~

~~~powershell title="Sur un serveur de laboratoire · Installation"
Install-WindowsFeature -Name Windows-Server-Backup
~~~

Ne pas lancer de sauvegarde sur un disque de destination non vérifié : certains processus de préparation ou opérations de restauration peuvent écraser les données.

~~~powershell title="Lecture seule · Inventaire de versions sauvegardées"
wbadmin get versions
~~~

Une liste vide ne prouve pas qu'aucun logiciel tiers ne sauvegarde le serveur. Elle ne montre que les données accessibles à cet outil dans son contexte.

## 5. Active Directory : restauration sous contraintes

Sur un contrôleur de domaine, la sauvegarde du **System State** peut inclure les composants nécessaires à certains scénarios de récupération d'AD DS. La **corbeille Active Directory** aide à récupérer certains objets supprimés lorsqu'elle est activée, mais ne remplace pas une stratégie de sauvegarde.

Il faut distinguer :

- **Restauration non autoritaire** : l'annuaire restauré peut se resynchroniser à partir d'autres DC selon les mécanismes de réplication.
- **Restauration autoritaire** : certains objets sont restaurés avec une priorité de réplication spécifique, selon une procédure contrôlée.
- **Restauration de forêt** : reconstruction après perte majeure ou compromission, suivant un plan spécialisé.

!!! danger "Ne pas utiliser un checkpoint comme plan de restauration AD"
    Un contrôleur de domaine contient des identités et une base répliquée. Un retour arbitraire à un VHDX ancien ne constitue pas un plan de reprise. Tester les procédures officielles dans un environnement entièrement isolé.

## 6. Construire le PRA

Le plan inclut le responsable, les déclencheurs, les priorités métier, la liste des services critiques, les sauvegardes disponibles, les accès administratifs de secours, les dépendances et les preuves de retour en service.

~~~text
Matériel / hyperviseurs / stockage
                │
        Réseau et DNS
                │
        Identité / AD DS
                │
      Données et applications
                │
      Validation métier finale
~~~

Ce dessin est un guide de dépendances : certains services peuvent être rétablis simultanément ou dans un autre ordre selon l'architecture.

## 7. Valider réellement une sauvegarde

Pour chaque famille de données :

1. Identifier un jeu de sauvegarde, sa date et son origine.
2. Restaurer vers un **environnement non productif isolé**.
3. Contrôler le contenu, les permissions, la cohérence applicative et les secrets nécessaires.
4. Mesurer le temps de reprise.
5. Comparer les résultats aux RPO/RTO cibles.
6. Enregistrer le compte rendu et la correction des écarts.

## TP 21-A : preuve de restauration

**Contexte.** FS01 contient des documents de test. Définir une stratégie avec copies hors du volume source et restaurer un fichier supprimé **dans une VM de laboratoire**.

**Validation :** documenter la source, le jeu de sauvegarde, l'heure, le chemin de restauration et le contrôle du contenu. **Retour arrière :** supprimer uniquement les fichiers restaurés de test après avoir comparé les résultats.

**Corrigé :** la réussite du programme de sauvegarde ne prouve pas la restaurabilité ; il faut ouvrir les fichiers récupérés et contrôler les ACL.

## TP 21-B : plan de récupération AD

**Contexte.** Une OU fictive du domaine a été supprimée. Préparer un arbre de décision entre corbeille AD, restauration d'objet et récupération de forêt.

**Mission :** établir les prérequis, la liste des objets et les risques. **Corrigé :** commencer par déterminer l'étendue réelle de la perte et les options de restauration ciblée ; restaurer toute la forêt serait souvent excessif.

## Auto-évaluation

1. Pourquoi la réplication n'est-elle pas une sauvegarde ?
2. Quelle différence entre RPO et RTO ?
3. Pourquoi un test de récupération doit-il inclure les permissions ?
4. Un checkpoint Hyper-V constitue-t-il une copie indépendante ?

??? success "Réponses"
    Les suppressions et corruptions peuvent être répliquées. Le RPO exprime la perte de données tolérée, le RTO le délai de reprise. Un fichier sans ACL fonctionnelles n'est pas pleinement restauré. Un checkpoint dépend de la VM et de son stockage.

## Références

- [Windows Server Backup et wbadmin](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin)
- [Sauvegarder Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/ad-forest-recovery-backing-up-a-full-server)
- [Récupération de forêt AD](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide)
- [Volume Shadow Copy Service](https://learn.microsoft.com/en-us/windows-server/storage/file-server/volume-shadow-copy-service)

[← Module 20](20-incidents.md) · [Module 22 : supervision →](22-supervision.md)
