#!/usr/bin/env python3
"""Publie la dernière procédure documentée dans la navigation Zensical."""
import json
import re
import subprocess
import tomllib
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT = DOCS / "data" / "latest-procedure.json"

def walk_nav(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, list):
        for child in node:
            yield from walk_nav(child)
    elif isinstance(node, dict):
        for child in node.values():
            yield from walk_nav(child)

def is_procedure(path):
    return (path.endswith(".md")
            and Path(path).name != "index.md"
            and path != "nouveautes.md"
            and not path.startswith(("modeles/", "contribuer/", "memoire/", "windows-server/formation-2025/")))

def metadata(text):
    if not text.startswith("---\n"):
        return {}
    sections = text.split("---", 2)
    if len(sections) != 3:
        return {}
    result = {}
    for name in ("title", "description"):
        match = re.search(r"^" + name + r":\s*(.+)\s*$", sections[1], re.M)
        if match:
            result[name] = match.group(1).strip().strip("'\"")
    return result

def git_date(path, added):
    args = ["git", "log", "--follow", "-1", "--format=%cI"]
    if added:
        args.append("--diff-filter=A")
    args += ["--", "docs/" + path]
    process = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, check=True)
    return process.stdout.strip()

def date_score(value):
    return datetime.fromisoformat(value).timestamp() if value else 0

config = tomllib.loads((ROOT / "zensical.toml").read_text(encoding="utf-8"))
candidates = []
for rel in dict.fromkeys(walk_nav(config["project"]["nav"])):
    if not is_procedure(rel):
        continue
    path = DOCS / rel
    if not path.is_file():
        continue
    info = metadata(path.read_text(encoding="utf-8"))
    added = git_date(rel, added=True)
    changed = git_date(rel, added=False)
    published = added or changed
    candidates.append({
        "title": info.get("title", path.stem.replace("-", " ").capitalize()),
        "description": info.get("description", ""),
        "url": rel[:-3] + "/",
        "published_at": published[:10] if published else "",
        "_sort": date_score(published),
    })
if not candidates:
    raise SystemExit("Aucune procédure référencée dans la navigation ; impossible de générer le bandeau.")
latest = max(candidates, key=lambda item: (item["_sort"], item["url"]))
del latest["_sort"]
# Conserver le titre public utilisé dans l'accueil et la rubrique FOG.
if latest["url"] == "deploiement/fog-installation/":
    latest["title"] = "Installer et exploiter FOG Project"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(latest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Bandeau dernière procédure :", latest["title"], "-", latest["published_at"])
