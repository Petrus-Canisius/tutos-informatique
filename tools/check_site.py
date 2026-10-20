#!/usr/bin/env python3
"""Contrôles des pages Zensical : catalogue et liens locaux."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "site").resolve()
BASE = "/tutos-informatique"

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in ("a", "link") and values.get("href"):
            self.links.append((tag, values["href"]))
        elif tag in ("img", "script", "source") and values.get("src"):
            self.links.append((tag, values["src"]))


def destination(page: Path, href: str) -> Path | None:
    url = urlsplit(href)
    if url.scheme or url.netloc or not url.path:
        return None
    path = unquote(url.path)
    if path.startswith(BASE + "/"):
        path = path[len(BASE) + 1:]
        target = ROOT / path
    elif path == BASE or path == BASE + "/":
        target = ROOT
    elif path.startswith("/"):
        target = ROOT / path.lstrip("/")
    else:
        target = page.parent / path
    target = target.resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError("Chemin local en dehors du site : " + href)
    if target.is_dir() or path.endswith("/"):
        return target / "index.html"
    if target.exists():
        return target
    if not target.suffix:
        return target / "index.html"
    return target


def main() -> None:
    for page in ("index.html", "deploiement/fog-installation/index.html",
                 "windows/yt-dlp/index.html", "memoire/index.html"):
        if not (ROOT / page).is_file():
            raise SystemExit("Page obligatoire manquante : " + page)
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    if "kb-guide-card" not in home:
        raise SystemExit("Accueil : le catalogue n'a pas été généré")
    catalog_file = ROOT / "data" / "catalog.json"
    if not catalog_file.is_file():
        raise SystemExit("JSON du catalogue manquant")
    catalog = json.loads(catalog_file.read_text(encoding="utf-8"))
    if len(catalog) < 2:
        raise SystemExit("Catalogue incomplet")
    for entry in catalog:
        page = ROOT / entry["url"] / "index.html"
        if not page.is_file():
            raise SystemExit("Tutoriel absent : " + entry["url"])

    missing = []
    pages = list(ROOT.rglob("*.html"))
    for page in pages:
        parser = Assets()
        parser.feed(page.read_text(encoding="utf-8"))
        for tag, url in parser.links:
            try:
                target = destination(page, url)
                if target is not None and not target.is_file():
                    missing.append((page.relative_to(ROOT).as_posix(), url))
            except ValueError as exc:
                missing.append((page.relative_to(ROOT).as_posix(), str(exc)))
    if missing:
        examples = "\n".join("  " + page + " → " + url for page, url in missing[:25])
        raise SystemExit(str(len(missing)) + " liens ou ressources locaux manquants :\n" + examples)
    print("Contrôle terminé :", len(pages), "pages HTML,", len(catalog), "guides, liens locaux valides.")


if __name__ == "__main__":
    main()
