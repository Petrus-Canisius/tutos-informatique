#!/usr/bin/env python3
"""Génère un catalogue depuis les pages Markdown et l'historique Git."""
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "data" / "procedures.json"
EXCLUDED = {"nouveautes.md", "recherche-avancee.md", "modeles/modele-procedure.md",
            "depannage/fiche-incident.md", "depannage/assistant.md", "outils/schemas.md"}

def git_date(path, first=False):
    cmd = ["git", "-C", str(ROOT), "log", "--follow"]
    if first:
        cmd.append("--diff-filter=A")
    cmd += ["-1", "--format=%cI", "--", path]
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        return ""

def frontmatter(content):
    if not content.startswith("---\n"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    meta = {}
    for line in parts[1].splitlines():
        match = re.match(r"^([A-Za-z_]+):\s*(.*)", line)
        if match and match.group(2):
            meta[match.group(1)] = match.group(2).strip().strip('"').strip("'")
    return meta, parts[2]

def excerpt(content):
    text = re.sub(r"<[^>]*>", " ", content)
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith(("#", "!", "|", "-", "[", "{")) and len(line) > 45:
            return re.sub(r"\s+", " ", line)[:180]
    return "Consulter les contrôles et vérifications de la procédure."

def domain(rel):
    return {"windows":"Windows","windows-server":"Windows Server","linux":"Linux",
            "reseaux":"Réseaux","deploiement":"Déploiement","virtualisation":"Virtualisation",
            "osint":"OSINT","securite":"Sécurité","powershell":"PowerShell",
            "git-github":"Git et GitHub","depannage":"Dépannage"}.get(rel.parts[0], "Documentation")

def platform(rel, title):
    category = rel.parts[0]
    if category in ("windows","windows-server","powershell"):
        return "Windows"
    if category in ("linux","virtualisation"):
        return "Linux"
    if category == "reseaux" and "Windows" in title:
        return "Windows"
    return "Multiplateforme"

items = []
for file in sorted(DOCS.rglob("*.md")):
    rel = file.relative_to(DOCS)
    if rel.name == "index.md" or rel.as_posix() in EXCLUDED:
        continue
    raw = file.read_text(encoding="utf-8")
    meta, body = frontmatter(raw)
    head = re.search(r"(?m)^#\s+(.+?)\s*$", body)
    title = meta.get("title") or (head.group(1) if head else rel.stem.replace("-", " ").title())
    matched_level = re.search(r'kb-doc-meta.*?<span>[^<]*</span>\s*<span>([^<]+)</span>', body, re.S)
    level = meta.get("niveau") or (matched_level.group(1) if matched_level else "Non renseigné")
    path = file.relative_to(ROOT).as_posix()
    words = len(re.findall(r"\b[\wÀ-ÿ-]+\b", re.sub(r"<[^>]+>", " ", body)))
    items.append({
        "id": rel.as_posix().removesuffix(".md"),
        "title": title,
        "description": meta.get("description") or excerpt(body),
        "url": rel.as_posix().removesuffix(".md") + "/",
        "domain": domain(rel),
        "os": meta.get("systeme") or platform(rel,title),
        "level": level,
        "type": meta.get("type", "Procédure"),
        "versions": meta.get("versions", ""),
        "validation": meta.get("validation", "non_renseigne"),
        "verified_at": meta.get("derniere_verification", ""),
        "published_at": git_date(path, first=True),
        "updated_at": git_date(path),
        "minutes": max(1, (words+209)//210),
    })
items.sort(key=lambda x: x["updated_at"] or x["published_at"], reverse=True)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(),
                           "procedures": items}, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
print(f"Catalogue de {len(items)} procédures généré.")
