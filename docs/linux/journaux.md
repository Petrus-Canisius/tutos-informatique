# Consulter les journaux Linux

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
