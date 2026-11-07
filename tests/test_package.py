"""Package and measurement contracts. Run: python -m unittest discover -s tests -v."""
import importlib.util
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(filename):
    spec = importlib.util.spec_from_file_location(filename.replace('-', '_'), ROOT / 'scripts' / filename)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


class PackageContract(unittest.TestCase):
    def test_skill_name_and_plugin_path_match_the_installable_directory(self):
        text = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
        self.assertRegex(text, r'(?m)^name: ultimate-liquid-glass$')
        plugin = json.loads((ROOT / '.claude-plugin/plugin.json').read_text())
        self.assertEqual(plugin['name'], 'ultimate-liquid-glass')
        for entry in plugin['skills']:
            target = (ROOT / entry).resolve()
            self.assertTrue(target.is_dir(), f'Skill entry must be a directory: {entry}')
            self.assertTrue((target / 'SKILL.md').is_file())

    def test_shipped_internal_references_resolve(self):
        issues = []
        pattern = re.compile(r'(?:references|assets|scripts|tests|licenses)/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+')
        for file in ROOT.rglob('*'):
            if any(part in {'node_modules', '.git', 'test-results', 'playwright-report', '__pycache__'} for part in file.relative_to(ROOT).parts):
                continue
            if file.suffix not in ('.md', '.js', '.css', '.html', '.py', '.json'):
                continue
            if file.name == Path(__file__).name:
                continue
            for name in sorted(set(pattern.findall(file.read_text(encoding='utf-8-sig')))):
                if not (ROOT / name).is_file() and not (file.parent / name).is_file():
                    issues.append(f'{file.relative_to(ROOT)}: {name}')
        self.assertEqual(issues, [], '\n'.join(issues))

    def test_showcase_is_self_contained_and_skill_branded(self):
        showcase = ROOT / 'assets/showcase.html'
        self.assertTrue(showcase.is_file(), 'The approved standalone showcase is missing')
        text = showcase.read_text(encoding='utf-8')
        self.assertIn('<h1>Ultimate Liquid Glass</h1>', text)
        self.assertIn('window.UltimateLiquidGlass', text)
        self.assertNotRegex(text, r'<script[^>]+src=')
        self.assertNotRegex(text, r'<link[^>]+href=')
        self.assertNotIn('D:/azmoon', text)
        self.assertNotIn('Azmoon glass</h1>', text)

    def test_general_cap_and_webkit_budget_are_explicit(self):
        text = (ROOT / 'references/performance.md').read_text(encoding='utf-8')
        self.assertIn('1024', text)
        self.assertIn('512', text)
        self.assertIn('Safari exception', text)

    def test_native_rules_do_not_force_unintended_shape_merging(self):
        text = (ROOT / 'references/native-apple.md').read_text(encoding='utf-8')
        self.assertNotIn('spacing must exceed', text)
        self.assertNotIn('UIGlassEffectView(effect:', text)
        self.assertIn('UIVisualEffectView(effect:', text)
        self.assertIn('RoundedRectangle(cornerRadius:', text)


class ChromaMath(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.probe = module('chroma-retention.py')

    def test_highlight_weighted_wash_keeps_black_fixed(self):
        self.assertEqual(self.probe.wash((0, 0, 0), 0.5, (31, 29, 41)), (0, 0, 0))

    def test_cli_rejects_out_of_range_wash(self):
        run = subprocess.run([sys.executable, str(ROOT / 'scripts/chroma-retention.py'),
                              '--in', '240,232,210', '--wash', '0.9'], capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0, 'Out-of-range wash must not silently invert highlights')

    def test_css_saturation_clamps_channels(self):
        out = self.probe.saturate((255, 0, 0), 4)
        self.assertTrue(all(0 <= x <= 255 for x in out), out)


class MeasurementFixtures(unittest.TestCase):
    def run_script(self, script, *args):
        result = subprocess.run([sys.executable, str(ROOT / 'scripts' / script), *map(str, args)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result.stdout

    def test_fixture_lens_map_is_a_real_pass(self):
        output = self.run_script('measure-displacement-map.py', ROOT / 'tests/fixtures/lens-map.png', '--scale', '40')
        self.assertIn('VERDICT: PASS (0 fail, 0 warn)', output)

    def test_edge_fixture_classes_are_distinct(self):
        for name, verdict in [('rim', 'RIM'), ('glow', 'GLOW'), ('cutout', 'CUTOUT')]:
            output = self.run_script('edge-profile.py', ROOT / f'tests/fixtures/{name}-swatch.png', '--at', '0.45', '--span', '40')
            self.assertIn(verdict, output)

    def test_warm_cream_retention_matches_the_documented_fixture(self):
        output = self.run_script('chroma-retention.py', '--in', '240,232,210', '--sat', '1.4',
                                 '--wash', '0.30', '--tint', '31,29,41')
        self.assertIn('chroma retention: 64%', output)


if __name__ == '__main__':
    unittest.main()
