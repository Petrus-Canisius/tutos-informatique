#!/usr/bin/env python3
"""Catalogue unique des procédures IT Knowledge Base.

Usage : python tools/build_catalog.py
Aucun service externe requis. Le script s'exécute avant « zensical build ».
Les blocs AUTO sont remplacés, sans toucher au reste des documents.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import tomllib
from dataclasses import dataclass
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CONFIG = ROOT / "zensical.toml"

CATEGORIES = {
    "deploiement": ("Déploiement et gestion de parc", "FOG Project, images système et déploiement des postes"),
    "windows": ("Windows", "Maintenance, configuration et postes clients"),
    "windows-server": ("Windows Server", "Active Directory, DNS, DHCP et GPO"),
    "linux": ("Linux", "Administration, services et supervision"),
    "reseaux": ("Réseaux", "VLAN, routage, diagnostic et connectivité"),
    "virtualisation": ("Virtualisation", "Proxmox, Hyper-V et infrastructures"),
    "powershell": ("PowerShell et automatisation", "Scripts et administration automatisée"),
    "securite": ("Cybersécurité et OSINT", "Sécurité, veille et sources publiques"),
    "git-github": ("Git et GitHub", "Versionnement et publication de projets"),
}
STATES = {
    "documentation_only": "Vérification documentaire ; exécution non confirmée",
    "partially_tested": "Test partiel déclaré",
    "lab_tested": "Test en laboratoire déclaré",
    "review_required": "Vérification technique à reprendre",
}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FRONT = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n", re.S)


@dataclass(frozen=True)
class Procedure:
    path: str
    title: str
    description: str
    category: str
    level: str
    published_at: str
    last_verified: str | None
    validation: str
    tags: tuple[str, ...]

    @property
    def url(self) -> str:
        return self.path[:-3] + "/"


def frontmatter(source: str) -> dict:
    """Lit le sous-ensemble YAML de métadonnées utilisé par les procédures.

    Refuse les constructions ambiguës ; aucun YAML arbitraire n'est interprété.
    """
    match = FRONT.match(source)
    if not match:
        raise ValueError("Frontmatter YAML absent")
    data: dict = {}
    collection: str | None = None
    for line in match.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith("  - ") and collection:
            data[collection].append(line[4:].strip().strip("'\""))
            continue
        found = re.fullmatch(r"([a-z][a-z_]*):(?:[ \t]*(.*))?", line)
        if not found:
            raise ValueError("Métadonnée non reconnue : " + line)
        key, value = found.groups()
        if key in data:
            raise ValueError("Métadonnée répétée : " + key)
        if not value:
            data[key] = []
            collection = key
        else:
            data[key] = None if value in ("null", "~") else value.strip().strip("'\"")
            collection = None
    return data


def parse_procedure(file: Path, docs: Path = DOCS) -> Procedure:
    rel = file.relative_to(docs).as_posix()
    values = frontmatter(file.read_text(encoding="utf-8"))
    for key in ("title", "description", "category", "level", "published_at", "validation"):
        if not isinstance(values.get(key), str) or not values[key].strip():
            raise ValueError(rel + " : champ obligatoire invalide : " + key)
    category = values["category"]
    if category not in CATEGORIES or not rel.startswith(category + "/"):
        raise ValueError(rel + " : catégorie absente ou différente du dossier")
    status = values["validation"]
    if status not in STATES:
        raise ValueError(rel + " : statut de validation inconnu : " + status)
    for key in ("published_at", "last_verified"):
        raw = values.get(key)
        if raw is not None:
            if not isinstance(raw, str) or not DATE_RE.fullmatch(raw):
                raise ValueError(rel + " : date invalide : " + key)
            try:
                date.fromisoformat(raw)
            except ValueError as error:
                raise ValueError(rel + " : date incorrecte : " + key) from error
    tags = values.get("tags", [])
    if not isinstance(tags, list) or any(not isinstance(v, str) for v in tags):
        raise ValueError(rel + " : tags doit être une liste")
    return Procedure(rel, values["title"], values["description"], category,
                     values["level"], values["published_at"], values.get("last_verified"),
                     status, tuple(tags))


def discover(docs: Path = DOCS) -> list[Procedure]:
    result = []
    for category in CATEGORIES:
        folder = docs / category
        if not (folder / "index.md").is_file():
            raise ValueError("Index manquant : " + str(folder))
        for file in sorted(folder.rglob("*.md")):
            if file.name == "index.md":
                continue
            result.append(parse_procedure(file, docs))
    if not result:
        raise ValueError("Aucune procédure publiée")
    return sorted(result, key=lambda p: (p.published_at, p.path), reverse=True)


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def replace_auto(text: str, name: str, body: str) -> str:
    start = "<!-- AUTO:" + name + ":BEGIN -->"
    end = "<!-- AUTO:" + name + ":END -->"
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError("Marqueurs manquants ou doublés : " + name)
    pattern = re.escape(start) + r".*?" + re.escape(end)
    return re.sub(pattern, lambda _: start + "\n" + body.strip() + "\n" + end, text, count=1, flags=re.S)


def write_changed(file: Path, contents: str) -> None:
    file.parent.mkdir(parents=True, exist_ok=True)
    if not file.exists() or file.read_text(encoding="utf-8") != contents:
        file.write_text(contents, encoding="utf-8")


def card(p: Procedure, href: str) -> str:
    tags = "".join('<span class="kb-guide-tag">' + esc(tag) + "</span>" for tag in p.tags[:4])
    return (
        '<article class="kb-guide-card"><div class="kb-guide-card-top">'
        '<span class="kb-guide-domain">' + esc(CATEGORIES[p.category][0]) + '</span>'
        '<span class="kb-guide-level">' + esc(p.level) + '</span></div>'
        '<h3><a href="' + esc(href) + '">' + esc(p.title) + '</a></h3>'
        '<p>' + esc(p.description) + '</p>'
        '<div class="kb-guide-tags">' + tags + '</div>'
        '<div class="kb-guide-card-bottom"><span class="kb-guide-validation">'
        + esc(STATES[p.validation]) + '</span>'
        '<a href="' + esc(href) + '" class="kb-guide-open" aria-label="Lire : '
        + esc(p.title) + '">Lire le guide →</a></div></article>'
    )


def home_guides(procedures: list[Procedure]) -> str:
    return (
        '<section class="kb-section kb-procedures" aria-labelledby="kb-procedures-heading">'
        '<div class="kb-section-title"><div><span class="kb-overline">GUIDES TECHNIQUES</span>'
        '<h2 id="kb-procedures-heading">Procédures disponibles</h2>'
        '<p>Des guides complets, avec prérequis, commandes et vérifications.</p></div>'
        '<span class="kb-section-count">' + str(len(procedures)) + ' procédures</span></div>'
        '<div class="kb-procedures-grid">'
        + "\n".join(card(p, p.url) for p in procedures)
        + '</div></section>'
    )


def home_categories(procedures: list[Procedure]) -> str:
    counts = {name: 0 for name in CATEGORIES}
    for p in procedures:
        counts[p.category] += 1
    entries = []
    for key, (title, description) in CATEGORIES.items():
        count = counts[key]
        label = (str(count) + (" procédure" if count == 1 else " procédures")) if count else "Aucune procédure"
        entries.append(
            '<a class="kb-cat-card' + (' kb-cat-card--active' if count else '') + '" href="' + key + '/">'
            '<div class="kb-cat-top"><span class="kb-cat-icon" aria-hidden="true">'
            + esc(title[:2].upper()) + '</span><span class="kb-cat-status'
            + (' kb-cat-status--live' if count else '') + '">' + label + '</span></div>'
            '<strong class="kb-cat-title">' + esc(title) + '</strong>'
            '<span class="kb-cat-description">' + esc(description) + '</span>'
            '</a>'
        )
    return (
        '<section class="kb-section kb-categories" id="categories" aria-labelledby="kb-categories-heading">'
        '<div class="kb-section-title"><div><span class="kb-overline">EXPLORER PAR DOMAINE</span>'
        '<h2 id="kb-categories-heading">Domaines informatiques</h2>'
        '<p>Consultez les rubriques ou découvrez les prochains sujets.</p></div>'
        '<span class="kb-section-count">' + str(len(CATEGORIES)) + ' catégories</span></div>'
        '<div class="kb-categories-grid">' + "\n".join(entries) + '</div></section>'
    )


def home_latest(procedures: list[Procedure]) -> str:
    p = procedures[0]
    display = date.fromisoformat(p.published_at).strftime("%d/%m/%Y")
    return (
        '<section class="kb-latest-banner" aria-labelledby="kb-latest-heading">'
        '<div class="kb-latest-icon" aria-hidden="true">↗</div>'
        '<div class="kb-latest-content"><p class="kb-latest-overline" id="kb-latest-heading">'
        'DERNIÈRE PROCÉDURE PUBLIÉE</p>'
        '<h2>' + esc(p.title) + '</h2><p class="kb-latest-description">'
        + esc(p.description) + '</p>'
        '<p class="kb-latest-publication">Publiée le <time datetime="'
        + p.published_at + '">' + display + '</time></p></div>'
        '<a class="kb-latest-link" href="' + esc(p.url) + '">Voir le tutoriel →</a>'
        '</section>'
    )


def metadata_box(p: Procedure) -> str:
    last = p.last_verified or "Non renseignée"
    return (
        '<aside class="kb-procedure-status" aria-label="Informations de vérification">'
        '<span class="kb-procedure-status-label">Fiabilité documentaire</span>'
        '<strong>' + esc(STATES[p.validation]) + '</strong>'
        '<dl><div><dt>Environnement</dt><dd>' + esc(CATEGORIES[p.category][0]) + '</dd></div>'
        '<div><dt>Niveau</dt><dd>' + esc(p.level) + '</dd></div>'
        '<div><dt>Publication</dt><dd>' + esc(p.published_at) + '</dd></div>'
        '<div><dt>Dernière vérification technique</dt><dd>' + esc(last) + '</dd></div></dl>'
        '<p>Un contrôle documentaire ne constitue pas un test complet en laboratoire.</p>'
        '</aside>'
    )


def category_index(procedures: list[Procedure], category: str) -> str:
    entries = [p for p in procedures if p.category == category]
    if not entries:
        return "*Aucune procédure publiée pour le moment.*"
    return '<div class="kb-category-guides">' + "\n".join(
        card(p, p.path.split("/", 1)[1][:-3] + "/") for p in entries
    ) + '</div>'


def nav_config(procedures: list[Procedure]) -> str:
    quote = lambda s: json.dumps(s, ensure_ascii=False)
    lines = ['nav = [', '  { "Accueil" = "index.md" },', '  { "Catégories" = [']
    for key, (title, _) in CATEGORIES.items():
        members = [p for p in procedures if p.category == key]
        if members:
            children = [quote(key + "/index.md")]
            children += ['{ ' + quote(p.title) + ' = ' + quote(p.path) + ' }' for p in members]
            lines.append('    { ' + quote(title) + ' = [' + ', '.join(children) + '] },')
        else:
            lines.append('    { ' + quote(title) + ' = ' + quote(key + "/index.md") + ' },')
    lines.extend(['  ] },', '  { "Mémoire de fin d’études" = "memoire/index.md" },', ']'])
    return "\n".join(lines)


def generate(root: Path = ROOT) -> list[Procedure]:
    docs = root / "docs"
    procedures = discover(docs)
    home_file = docs / "index.md"
    home = home_file.read_text(encoding="utf-8")
    home = replace_auto(home, "LATEST", home_latest(procedures))
    home = replace_auto(home, "GUIDES", home_guides(procedures))
    home = replace_auto(home, "CATEGORIES", home_categories(procedures))
    write_changed(home_file, home)

    for category in CATEGORIES:
        file = docs / category / "index.md"
        content = file.read_text(encoding="utf-8")
        write_changed(file, replace_auto(content, "CATEGORY_GUIDES", category_index(procedures, category)))

    for p in procedures:
        file = docs / p.path
        content = file.read_text(encoding="utf-8")
        write_changed(file, replace_auto(content, "STATUS", metadata_box(p)))

    config_file = root / "zensical.toml"
    config = config_file.read_text(encoding="utf-8")
    pattern = r"(?ms)^nav = \[.*?^\](?=\n\n\[project\.theme\])"
    if len(re.findall(pattern, config)) != 1:
        raise ValueError("Bloc nav introuvable dans zensical.toml")
    config = re.sub(pattern, lambda _: nav_config(procedures), config)
    tomllib.loads(config)
    write_changed(config_file, config)

    public = [
        {"title": p.title, "description": p.description, "category": p.category,
         "level": p.level, "tags": list(p.tags), "published_at": p.published_at,
         "last_verified": p.last_verified, "validation": p.validation, "url": p.url}
        for p in procedures
    ]
    data_folder = docs / "data"
    write_changed(data_folder / "catalog.json", json.dumps(public, ensure_ascii=False, indent=2) + "\n")
    write_changed(data_folder / "latest-procedure.json", json.dumps(public[0], ensure_ascii=False, indent=2) + "\n")
    return procedures


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate", action="store_true", help="Valider les métadonnées sans écrire de fichiers")
    args = parser.parse_args()
    if args.validate:
        data = discover()
        print("Métadonnées valides :", len(data), "procédures")
    else:
        data = generate()
        print("Catalogue actualisé :", len(data), "procédures")


if __name__ == "__main__":
    main()
