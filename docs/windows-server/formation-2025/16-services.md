---
title: 16 · IIS, RDS et services de certificats AD CS
description: Comprendre les serveurs Web IIS, accès RDS et gestion des certificats avec une PKI d'entreprise.
---

# Module 16. Services applicatifs et infrastructure de certificats

<div class="ws25-meta"><span>Rôles complémentaires</span><span>8 h conseillées</span><span>2 TP</span><span>IIS, RDS et AD CS</span></div>

## 1. Choisir un rôle selon les exigences métier

Windows Server peut héberger des rôles applicatifs variés. Il faut distinguer les services intégrés à l'OS, les applications tierces et la responsabilité de chacun.

Les trois familles étudiées ici sont :
- **IIS** : hébergement de sites et applications Web.
- **RDS** : accès à des bureaux ou applications publiés à distance.
- **AD CS** : émission, gestion et révocation de certificats par une infrastructure de clé publique.

Le fait qu'un rôle soit disponible dans Windows Server n'implique pas qu'il soit adapté à tous les scénarios de production, ni que sa licence soit automatiquement couverte.

## 2. IIS : de la requête au site

**Internet Information Services** écoute des requêtes HTTP et HTTPS. Un site est défini par des liaisons (adresse, port et éventuellement nom d'hôte), un répertoire racine, des pools d'applications et des paramètres de sécurité.

~~~text
CLIENT01 ──HTTP(S)──> APP01 : IIS
                         │
                    liaison du site
                         │
                   pool d'applications
                         │
                   contenu/application
~~~

Les liaisons HTTPS nécessitent des certificats valides. Le certificat identifie le serveur et protège le canal, mais ne corrige pas une mauvaise autorisation applicative.

### Installer IIS dans le laboratoire

Sur APP01, VM membre du domaine et sans service Web préexistant :

~~~powershell title="APP01 · Installe le rôle IIS"
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
Get-WindowsFeature -Name Web-Server
~~~

Contrôler localement :

~~~powershell title="APP01 · Vérification de réponse"
Get-Service -Name W3SVC
Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing |
    Select-Object StatusCode,StatusDescription
~~~

Dans le laboratoire isolé, le site IIS initial peut répondre en HTTP. En production, imposer les liaisons HTTPS adaptées et une politique de certificats. **Ne pas exposer un site de test sans authentification sur Internet.**

## 3. Pools d'applications et identité

Une application IIS s'exécute dans un **pool d'applications**. L'identité du pool détermine ses permissions locales et éventuellement ses accès réseau. L'attribuer à Domain Admins est une erreur de sécurité grave. Préférer le minimum de droits et des identités gérées compatibles lorsque cela est possible.

La disponibilité d'un site n'est pas seulement l'état W3SVC : tester la page, l'application, son stockage et ses dépendances d'identité.

## 4. Remote Desktop Services

**RDS** peut fournir des sessions ou applications distantes. L'architecture peut comprendre les rôles de session, de licence, de passerelle et de broker selon l'usage.

Les accès RDS d'entreprise requièrent l'étude de licences spécifiques, des mécanismes de sécurisation et de l'expérience utilisateur. Un accès RDP d'administration à un serveur n'est pas équivalent à une ferme RDS destinée à 200 collaborateurs.

**Sécurité :** ne pas rendre directement le port RDP d'un hôte serveur accessible depuis Internet. Déployer des points de contrôle approuvés, une authentification forte et une limitation des ressources.

## 5. AD CS et la chaîne de confiance

**Active Directory Certificate Services** fournit des services de certificats au sein d'une PKI. Il faut comprendre quatre concepts :

| Notion | Rôle |
| --- | --- |
| Autorité de certification (CA) | Signe et délivre les certificats selon les politiques |
| Certificat | Associe une clé publique et une identité/usage |
| Clé privée | Secret essentiel à protéger |
| CRL / OCSP | Information de révocation et de validité selon configuration |

Une **autorité racine hors ligne** et des **autorités émettrices** peuvent contribuer à une architecture d'entreprise, mais le choix dépend du besoin, du budget, du niveau de protection de clés et des opérations de renouvellement. Les certificats doivent avoir des modèles, durées de vie et périmètres d'émission maîtrisés.

### Risques propres à une PKI AD

Une mauvaise configuration des modèles d'inscription ou des ACL de certificats peut permettre à des utilisateurs d'obtenir des certificats portant des identités non autorisées. Le déploiement doit donc être **conçu, audité et testé** avant toute émission en production.

Ne pas installer une Enterprise CA sur un contrôleur de domaine juste pour « faire fonctionner HTTPS » : l'autorité possède un cycle de vie et une sensibilité propres.

## 6. Diagnostics

~~~powershell title="Lecture seule · Serveur IIS de laboratoire"
Get-Service W3SVC
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in @(80,443)
Get-WinEvent -LogName Application -MaxEvents 20 |
    Select-Object TimeCreated,Id,ProviderName
~~~

La présence d'un port en écoute ne prouve pas qu'un certificat est valide ni que l'application est disponible pour un utilisateur.

## TP 16-A : serveur Web de laboratoire

**Mission.** Installer IIS sur APP01, consulter la page initiale depuis CLIENT01 en réseau privé et produire les résultats du test HTTP. **Prérequis.** APP01 prête, pare-feu maîtrisé, aucun site sensible sur la machine. **Validation.** Une réponse HTTP attendue, serveur identifié, absence d'exposition externe. **Retour arrière.** Restaurer la VM de laboratoire à son état initial ou supprimer le rôle selon les dépendances contrôlées.

**Corrigé :** distinguer la disponibilité de TCP, la réponse HTTP, le contenu attendu et l'authentification.

## TP 16-B : concevoir une PKI

**Mission.** Concevoir une chaîne de certificats pour IIS interne, RDS et une application VPN, sans installer de CA de production. Décrire autorités, certificats, clés, révocation, renouvellement et audit.

**Corrigé :** un certificat doit posséder un usage, un nom, une validité et une autorité approuvée. Un certificat autosigné peut servir à un laboratoire fermé, mais ne constitue pas, par défaut, une chaîne de confiance d'entreprise.

## Questions

1. À quoi sert l'identité d'un pool d'applications ?
2. Pourquoi un serveur RDS a-t-il des besoins de licence propres ?
3. À quoi sert la révocation d'un certificat ?
4. Pourquoi une CA d'entreprise est-elle une infrastructure sensible ?

??? success "Correction"
    Elle limite les ressources accessibles par le code Web ; RDS fournit un service utilisateur soumis à ses droits ; la révocation invalide un certificat avant son expiration ; une CA délivre des justificatifs d'identité et doit protéger ses clés, modèles et droits.

**Sources :** [IIS](https://learn.microsoft.com/en-us/iis/), [Remote Desktop Services](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/), [AD CS](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/active-directory-certificate-services-overview).

[← Module 15](15-smb.md) · [Module 17 : Hyper-V →](17-hyper-v.md)
