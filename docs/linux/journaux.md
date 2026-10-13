---
description: "Rechercher des messages importants dans les journaux système."
tags: ["Linux", "journaux"]
---

# Consulter les journaux Linux

<div class="kb-doc-meta"><span>Linux</span><span>Initiation</span><span>Exemple technique</span></div>

<div class="kb-doc-intro"><strong>Objectif.</strong> Rechercher des messages importants dans les journaux système.</div>


## Objectif
Identifier les erreurs signalées par les services Linux.

## Derniers événements système
```bash
journalctl -n 100 --no-pager
```

## Journaux d'un service
```bash
sudo journalctl -u ssh --since "1 hour ago"
```

Adapter le nom `ssh` à celui du service concerné.

## Vérification
Relever les horodatages, les messages d'erreur et le service source, en masquant les informations sensibles.
