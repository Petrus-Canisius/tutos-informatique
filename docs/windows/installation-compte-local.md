---
title: Installer Windows 11 sans compte Microsoft
description: Créer un compte local pendant la configuration initiale de Windows 11, notamment dans une machine virtuelle Hyper-V.
tags:
  - Windows 11
  - Hyper-V
  - Installation
  - Compte local
---

# Installer Windows 11 sans compte Microsoft

<div class="dl-hero">
  <div class="dl-hero-copy">
    <span class="dl-eyebrow">GUIDE TECHNIQUE · WINDOWS 11 · HYPER-V</span>
    <p class="dl-hero-title">Terminer l'installation avec un compte local</p>
    <p>Contourner l'étape de connexion au compte Microsoft pendant la configuration initiale (OOBE), sous réserve des restrictions propres à la version de Windows installée.</p>
    <div class="dl-pills"><span>Windows 11</span><span>Compte local</span><span>OOBE</span><span>Hyper-V</span></div>
  </div>
  <div class="dl-hero-terminal" aria-hidden="true"><span>C:\&gt;</span> start ms-cxh:localonly<br><span>C:\&gt;</span> OOBE\BYPASSNRO<br><em>Disponibilité selon la version</em></div>
</div>

<div class="dl-facts">
  <div><strong>Objectif</strong><span>Installer Windows 11 avec un compte local.</span></div>
  <div><strong>Niveau</strong><span>Débutant à intermédiaire.</span></div>
  <div><strong>Contexte</strong><span>PC personnel ou machine virtuelle Hyper-V.</span></div>
  <div><strong>Publication</strong><span>22 octobre 2026.</span></div>
</div>

!!! warning "Compatibilité variable"
    Microsoft modifie régulièrement l'expérience de configuration initiale (OOBE). Les méthodes ci-dessous ne fonctionnent pas sur toutes les éditions ni toutes les versions de Windows 11. Elles ne doivent pas être interprétées comme une procédure garantie, notamment sur les versions récentes et les canaux Insider. Ce guide ne contourne pas un mot de passe existant, une gestion d'entreprise ou une protection de l'appareil.

## 1. Reconnaître l'écran concerné

Pendant la configuration initiale, Windows peut afficher **« Déverrouillez votre expérience Microsoft »**, suivi du bouton **« Se connecter »**. L'écran propose de lier l'appareil à un compte Microsoft.

Le but du guide est de créer un **compte local** pour cette installation, sans connecter de compte Microsoft.

## 2. Ouvrir l'invite de commandes

1. Restez sur l'écran de configuration de Windows 11.
2. Appuyez sur **Maj + F10**. Sur certains ordinateurs portables, utilisez **Maj + Fn + F10**.
3. Une fenêtre **Invite de commandes** doit apparaître.

!!! tip "Dans Hyper-V"
    Cliquez dans la fenêtre de connexion de la machine virtuelle avant d'utiliser le raccourci clavier. Le comportement des touches de fonction dépend du clavier et du mode de session.

## 3. Première méthode : ouvrir l'assistant de compte local

Dans l'invite de commandes, entrez :

```cmd
start ms-cxh:localonly
```

Si la version installée accepte encore ce protocole, une fenêtre de création de compte local apparaît.

1. Saisissez le nom du compte.
2. Configurez un mot de passe et les options de récupération proposées.
3. Validez et poursuivez l'installation.

**Résultat attendu :** Windows termine la configuration avec un compte local.

Si aucune fenêtre ne s'ouvre ou si Windows revient à l'obligation de connexion, cette méthode n'est pas disponible sur la version installée.

## 4. Deuxième méthode : vérifier la disponibilité de BYPASSNRO

Sur certaines versions antérieures de Windows 11, le mécanisme suivant permettait de reprendre l'installation avec les options hors connexion :

```cmd
OOBE\BYPASSNRO
```

Lorsque le script existe, la machine redémarre. Après redémarrage, sélectionnez **« Je n'ai pas Internet »**, puis **« Continuer avec une configuration limitée »**, si ces options sont effectivement proposées.

!!! warning "Commande supprimée dans certaines versions"
    Le script `OOBE\BYPASSNRO` a été retiré de certaines versions de Windows 11. Un message signalant un chemin ou une commande introuvable signifie que cette méthode n'est pas disponible dans cet environnement. Elle ne doit pas être répétée indéfiniment.

## 5. Alternative prise en charge : compte local après installation

Si aucune des méthodes précédentes n'est disponible, terminez la configuration selon le parcours proposé par Windows. Lorsque l'édition et les stratégies de l'appareil l'autorisent, vous pourrez ensuite créer un compte local via **Paramètres → Comptes → Autres utilisateurs → Ajouter un compte**, puis choisir les options d'ajout sans compte Microsoft.

Pour utiliser ce nouveau compte quotidiennement, connectez-vous avec lui. Si nécessaire, transférez vos fichiers personnels depuis le profil précédent, en respectant les permissions.

## 6. Vérifier le type de compte

Une fois sur le Bureau, ouvrez **Paramètres → Comptes → Vos informations**. Windows doit indiquer que la session utilise un **compte local**, et non un compte Microsoft.

Vous pouvez aussi exécuter :

```cmd
whoami
```

Cette commande affiche l'identité Windows courante, mais **ne prouve pas à elle seule** que le compte est local : le contrôle doit être effectué dans les paramètres du compte.

## 7. Dépannage

| Symptôme | Explication ou action |
| --- | --- |
| **Maj + F10** n'ouvre rien | Vérifiez les touches Fn et le focus clavier dans la VM. |
| `ms-cxh:localonly` ne lance rien | Protocole indisponible ou bloqué dans cette version. |
| `OOBE\BYPASSNRO` est introuvable | Script absent dans cette version de Windows. |
| L'option de configuration limitée est absente | Le parcours OOBE peut imposer un compte Microsoft. |
| Le compte est toujours connecté à Microsoft | Vérifiez **Paramètres → Comptes → Vos informations**. |

## 8. Considérations pour Hyper-V

L'installation dans Hyper-V suit le même parcours OOBE que sur une machine physique. Avant l'installation, contrôlez la **génération 2** de la VM, sa mémoire, son disque virtuel, le **TPM virtuel** et le démarrage sécurisé selon les exigences de Windows 11. La présence ou l'absence d'un commutateur virtuel connecté peut modifier les écrans affichés, mais ne garantit pas la disponibilité d'un compte local.

!!! info "Sécurité"
    Un compte local ne dispense pas de configurer un mot de passe robuste, les mises à jour de Windows et une sauvegarde adaptée. Sur une machine administrée par une organisation, respectez les règles de provisionnement et de gestion des identités.

---

*Guide rédigé le 22 octobre 2026. Les méthodes décrites sont dépendantes du support conservé par Microsoft dans chaque version de Windows 11 ; elles n'ont pas été validées sur toutes les builds.*
