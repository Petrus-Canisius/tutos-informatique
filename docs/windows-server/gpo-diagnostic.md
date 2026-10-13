---
title: Diagnostiquer une GPO
description: Contrôler le ciblage, les rapports gpresult et les journaux de stratégie de groupe.
niveau: Intermédiaire
systeme: Windows
versions: Windows Server et clients de domaine (selon installation)
validation: non_teste
---

# Diagnostiquer une GPO qui ne s'applique pas

## Vérifier le périmètre

Dans GPMC, contrôler le lien de la GPO à l'OU, le filtrage de sécurité, l'héritage et les filtres WMI. Vérifier si les paramètres ciblent un utilisateur ou un ordinateur.

## Examiner le résultat sur le poste

~~~powershell
gpresult /r
gpresult /h rapport-gpo.html
~~~

Vérifier les stratégies appliquées, exclues et leurs raisons dans le rapport. Utiliser le contexte d'exécution adapté aux paramètres inspectés.

## Examiner les journaux

Ouvrir **Observateur d'événements → Journaux des applications et des services → Microsoft → Windows → GroupPolicy → Operational**.

## Contrôler les services de domaine

Vérifier DNS, la disponibilité du contrôleur de domaine et SYSVOL. Une actualisation par gpupdate /force ne corrige ni un filtre inadapté ni une réplication défaillante.

## Liens utiles

- [Diagnostic DNS et Active Directory](dns-ad.md)
- [Assistant GPO](../depannage/assistant.md)
