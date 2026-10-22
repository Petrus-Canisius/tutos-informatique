---
title: 11 · Administrer le service DNS
description: Architecture DNS, zones intégrées à AD, enregistrements SRV, tests de résolution et diagnostic.
---

# Module 11. DNS : résolution, zones et diagnostic

<div class="ws25-meta"><span>Réseaux</span><span>9 h conseillées</span><span>2 TP</span><span>DNS et AD DS</span></div>

## 1. Pourquoi le DNS conditionne une infrastructure Windows

Le **Domain Name System** traduit un nom en informations exploitables : adresses IPv4/IPv6, noms de serveurs, services et autres données selon le type d'enregistrement. Dans Active Directory, DNS sert aussi à **découvrir les contrôleurs de domaine** et leurs services.

Un client qui peut joindre 10.50.0.10 directement mais ne peut pas résoudre **dc01.ad.entreprise.test** rencontre un problème distinct de la connectivité IP.

## 2. Architecture DNS

### Résolution récursive et autorité

Un **serveur faisant autorité** possède les données d'une zone. Un **résolveur récursif** cherche la réponse, éventuellement par cache ou interrogation d'autres serveurs. Dans une infrastructure AD, un DC DNS héberge généralement des zones intégrées à AD tout en pouvant utiliser des redirecteurs vers des DNS externes pour d'autres domaines, si la politique réseau l'autorise.

### Zones principales, secondaires et intégrées à AD

| Type de zone | Fonction | Conséquence opérationnelle |
| --- | --- | --- |
| Primaire standard | Source modifiable des enregistrements | Gestion du fichier de zone local |
| Secondaire | Copie d'une autre zone DNS | Dépend des transferts autorisés |
| Intégrée à AD | Zone conservée dans Active Directory | Réplication AD et mises à jour sécurisées possibles |
| Zone inverse | Correspondance IP vers noms PTR | Utile au diagnostic et à certains services |

Ne pas confondre **réplication AD d'une zone intégrée** et **transfert DNS AXFR/IXFR** d'une zone standard : les mécanismes et surfaces d'autorisation diffèrent.

## 3. Enregistrements essentiels

| Type | Exemple pédagogique | Fonction |
| --- | --- | --- |
| A | dc01 → 10.50.0.10 | Nom vers IPv4 |
| AAAA | serveur → adresse IPv6 | Nom vers IPv6 |
| CNAME | intranet → app01 | Alias vers un autre nom DNS |
| PTR | .10 → dc01 | Adresse vers nom |
| MX | Domaine vers serveur de courrier | Routage des messages |
| NS | Zone vers serveur faisant autorité | Délégation / autorité |
| SOA | Paramètres de zone | Serveur principal et informations de zone |
| SRV | _ldap._tcp... → DC | Localisation d'un service |

Les enregistrements SRV d'AD ne doivent pas être remplacés par un simple enregistrement A portant le nom du domaine. Le client cherche des informations de **service**.

## 4. Analyser l'état DNS sans modifier

Sur DC01 après déploiement AD DS :

~~~powershell title="DC01 · Consultation"
Get-Service -Name DNS
Get-DnsServerZone | Select-Object ZoneName,ZoneType,IsDsIntegrated
Get-DnsServerResourceRecord -ZoneName "ad.entreprise.test" -RRType SOA
Resolve-DnsName _ldap._tcp.dc._msdcs.ad.entreprise.test -Type SRV -Server 10.50.0.10
~~~

Pour distinguer les réponses de DC01 et DC02 :

~~~powershell title="Client du laboratoire · Lecture seule"
Resolve-DnsName dc01.ad.entreprise.test -Server 10.50.0.10
Resolve-DnsName dc01.ad.entreprise.test -Server 10.50.0.11
~~~

Ces tests supposent que **DC02 est déjà installé**. Une réponse divergente peut révéler une incohérence temporaire, une zone manquante ou une réplication en défaut.

## 5. Créer une zone de test distincte

On évite de modifier les enregistrements essentiels de la zone AD dans un TP de débutant. Sur DC01, créer une zone secondaire de test **lab-services.test** n'est pas une bonne option si l'objectif est de modifier des enregistrements ; on choisira une **zone primaire intégrée à AD**, distincte de la zone du domaine.

~~~powershell title="DC01 · Modifie la configuration DNS"
$zone = "lab-services.test"
if (-not (Get-DnsServerZone -Name $zone -ErrorAction SilentlyContinue)) {
    Add-DnsServerPrimaryZone -Name $zone -ReplicationScope "Domain" -DynamicUpdate "Secure"
}
~~~

Puis ajouter un A de test :

~~~powershell title="DC01 · Modifie une zone de test"
Add-DnsServerResourceRecordA -ZoneName "lab-services.test" -Name "application" -IPv4Address "10.50.0.30"
Resolve-DnsName application.lab-services.test -Server 10.50.0.10
~~~

**Validation :** application.lab-services.test renvoie **10.50.0.30**. Cela ne garantit pas qu'un serveur Web écoute sur cette IP ; DNS n'effectue qu'une résolution.

**Retour arrière :** relever l'enregistrement créé et le supprimer **uniquement dans la zone de test** après validation, via la console DNS ou une commande de suppression ciblée et confirmée. Ne jamais supprimer la zone AD principale pour corriger un exercice.

## 6. TTL, cache et changements

Un serveur et un client peuvent conserver une réponse DNS pendant sa durée de vie (**TTL**). Lorsque l'adresse d'un serveur change, une réponse historique peut rester en cache. Le TTL doit être choisi selon les besoins opérationnels et le volume de requêtes, pas toujours réduit au minimum.

~~~powershell title="Client · Contrôles du cache"
Get-DnsClientCache | Select-Object -First 20
ipconfig /displaydns
~~~

Un nettoyage du cache peut aider un test, mais **ne corrige pas** un enregistrement erroné sur le serveur faisant autorité. Comprendre d'abord la différence entre la source et le cache.

## 7. DNSSEC, sécurité et flux

DNSSEC permet de vérifier l'authenticité de certaines données DNS lorsqu'il est correctement déployé, avec une chaîne de confiance valide. Il ne chiffre pas le contenu des requêtes. Les transferts de zone doivent être limités aux serveurs autorisés et les mises à jour dynamiques sécurisées lorsque le scénario le permet.

Le pare-feu et les ACL doivent refléter les flux nécessaires. DNS utilise **UDP et TCP 53** ; ne pas conclure qu'un test TCP seul suffit.

## TP 11-A : zone et enregistrement de test

**Objectif.** Créer lab-services.test, ajouter application → 10.50.0.30, interroger DC01 et DC02, documenter les différences éventuelles. **Prérequis.** AD opérationnel, DC01/DC02 DNS, droits délégués appropriés. **Validation.** Réponses correctes et zone visible. **Retour arrière.** Supprimer les seuls objets de test validés, pas la zone du domaine.

**Corrigé.** Distinguer la création de la zone, sa réplication et la réponse à une requête. Une réponse DNS valide ne signifie pas qu'APP01 héberge un service Web.

## TP 11-B : panne SRV simulée

**Scénario.** CLIENT01 utilise un résolveur externe ne connaissant pas la zone AD. **Conséquence :** les recherches de SRV privés échouent alors que les noms publics peuvent réussir.

**Méthode.** Inspecter Get-DnsClientServerAddress, comparer les résultats selon -Server, constater la correction après retour au DNS interne du laboratoire. **Ne pas utiliser de DNS externe sur le laboratoire privé dépourvu de passerelle.**

**Corrigé.** Il faut restaurer la découverte des services AD et non créer à la main des enregistrements fictifs sur un résolveur public.

## Révision

- Quelle différence entre zone intégrée à AD et zone secondaire ?
- Pourquoi les SRV sont-ils cruciaux pour un domaine ?
- Le DNS prouve-t-il qu'un service applicatif est disponible ?
- DNSSEC chiffre-t-il les requêtes ?

??? success "Correction"
    Les zones AD se répliquent via AD et sont modifiables selon les autorisations ; une secondaire est une copie obtenue par transferts. Les SRV localisent les services. DNS ne valide pas la couche applicative. DNSSEC authentifie des données, sans les chiffrer.

**Références :** [Installer et configurer DNS](https://learn.microsoft.com/fr-fr/windows-server/networking/dns/quickstart-install-configure-dns-server), [Microsoft Learn DNS](https://learn.microsoft.com/en-us/windows-server/networking/dns/).

[← Module 10](10-gpo.md) · [Module 12 : DHCP →](12-dhcp.md)
