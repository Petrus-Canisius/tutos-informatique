#!/usr/bin/env python3
"""Contrôle des pages essentielles après compilation Zensical."""
from pathlib import Path
import json
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "site")
for page in ("index.html", "deploiement/fog-installation/index.html",
             "windows/yt-dlp/index.html", "memoire/index.html"):
    if not (root / page).is_file():
        raise SystemExit("Page manquante : " + page)
home = (root / "index.html").read_text(encoding="utf-8")
if "kb-guide-card" not in home:
    raise SystemExit("Catalogue non généré sur l'accueil")
catalog = json.loads((root / "data" / "catalog.json").read_text(encoding="utf-8"))
if len(catalog) < 2:
    raise SystemExit("Catalogue incomplet")
for item in catalog:
    if not (root / item["url"] / "index.html").is_file():
        raise SystemExit("Page guide absente : " + item["url"])
print("Compilation vérifiée :", len(catalog), "guides")
