"""Contrôles unitaires du générateur, sans dépendance supplémentaire."""
import tempfile
import unittest
from pathlib import Path
from dataclasses import replace

from tools.build_catalog import (
    CATEGORIES, STATES, discover, frontmatter, home_guides,
    home_categories, nav_config, parse_procedure, replace_auto
)


class CatalogueTests(unittest.TestCase):
    def test_procedures_actuelles(self):
        procedures = discover()
        paths = {p.path for p in procedures}
        self.assertIn("windows/yt-dlp.md", paths)
        self.assertIn("deploiement/fog-installation.md", paths)
        self.assertEqual(len(paths), len(procedures))
        self.assertTrue(all(p.validation in STATES for p in procedures))

    def test_liens_catalogue(self):
        procedures = discover()
        rendered = home_guides(procedures)
        for item in procedures:
            self.assertIn(item.url, rendered)
        self.assertIn("kb-guide-card", rendered)
        self.assertIn("kb-categories-grid", home_categories(procedures))

    def test_securite_html(self):
        test = replace(discover()[0], title="<script>alert(1)</script>")
        rendered = home_guides([test])
        self.assertNotIn("<script>", rendered)
        self.assertIn("&lt;script&gt;", rendered)

    def test_navigation(self):
        output = nav_config(discover())
        self.assertIn("deploiement/fog-installation.md", output)
        self.assertIn("windows/yt-dlp.md", output)
        self.assertEqual(output.count("index.md"), len(CATEGORIES) + 1)

    def test_remplacement_idempotent(self):
        original = "<!-- AUTO:GUIDES:BEGIN -->\nancien\n<!-- AUTO:GUIDES:END -->"
        once = replace_auto(original, "GUIDES", "nouveau")
        self.assertEqual(replace_auto(once, "GUIDES", "nouveau"), once)
        with self.assertRaises(ValueError):
            replace_auto("aucun marqueur", "GUIDES", "x")

    def test_metadonnees_incompletes(self):
        sample = "---\ntitle: Test\ncategory: linux\n---\n# Test"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            file = root / "linux" / "test.md"
            file.parent.mkdir()
            file.write_text(sample, encoding="utf-8")
            with self.assertRaises(ValueError):
                parse_procedure(file, root)

    def test_metadonnees_tags(self):
        source = '---\ntitle: "Test"\ntags:\n  - Linux\n  - Python\n---\n# Test'
        self.assertEqual(frontmatter(source)["tags"], ["Linux", "Python"])


if __name__ == "__main__":
    unittest.main()
