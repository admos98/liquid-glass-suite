"""Suite and measurement contracts. Run: python -m unittest discover -s tests -v."""
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILLS = {
    'liquid-glass': 4096,
    'liquid-glass-optics': 6144,
    'liquid-glass-debug': 6144,
    'liquid-glass-native': 6144,
}


def module(filename):
    spec = importlib.util.spec_from_file_location(
        filename.replace('-', '_'), ROOT / 'shared' / 'scripts' / filename)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


class PackageContract(unittest.TestCase):
    def test_skill_names_plugin_and_marketplace_match_the_installable_suite(self):
        plugin = json.loads((ROOT / '.claude-plugin/plugin.json').read_text())
        marketplace = json.loads((ROOT / '.claude-plugin/marketplace.json').read_text())
        self.assertEqual(plugin['name'], 'liquid-glass-suite')
        self.assertEqual(plugin['version'], '2.0.0')
        self.assertNotIn('skills', plugin, 'Standard skills/ discovery must not be replaced by a root skill path')
        self.assertEqual(marketplace['name'], 'admos98-skills')
        self.assertIn('name', marketplace['owner'])
        self.assertEqual(len(marketplace['plugins']), 1)
        entry = marketplace['plugins'][0]
        self.assertEqual(entry['name'], plugin['name'])
        self.assertEqual(entry['version'], plugin['version'])
        self.assertEqual(entry['source'], './')
        self.assertEqual({p.name for p in (ROOT / 'skills').iterdir() if p.is_dir()}, set(SKILLS))
        for name in SKILLS:
            text = (ROOT / 'skills' / name / 'SKILL.md').read_text(encoding='utf-8')
            self.assertRegex(text, rf'(?m)^name: {name}$')
            self.assertRegex(text, r'(?m)^description: .+')
            self.assertTrue(text.endswith('Part of liquid-glass-suite — install the suite, not this folder alone.\n'))

    def test_skill_byte_budgets_are_acceptance_criteria(self):
        for name, budget in SKILLS.items():
            actual = len((ROOT / 'skills' / name / 'SKILL.md').read_bytes())
            self.assertLessEqual(actual, budget, f'{name}: {actual} exceeds {budget}')
        readme = (ROOT / 'README.md').read_text(encoding='utf-8')
        self.assertLessEqual(len(readme.encode('utf-8')), 8192)
        self.assertIn('There are exactly two application paths:', readme)

    def test_shipped_internal_references_resolve(self):
        issues = []
        pattern = re.compile(r'(?:shared/(?:references|assets|scripts)|scripts|tests)/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+')
        for file in ROOT.rglob('*'):
            if any(part in {'node_modules', '.git', '.venv', 'test-results', 'playwright-report', '__pycache__'} for part in file.relative_to(ROOT).parts):
                continue
            if file.name in {Path(__file__).name, 'MIGRATION_MAP.md', 'PROVENANCE.md'}:
                continue
            if file.suffix not in ('.md', '.js', '.css', '.html', '.py', '.json'):
                continue
            for name in sorted(set(pattern.findall(file.read_text(encoding='utf-8-sig')))):
                if not (ROOT / name).is_file() and not (file.parent / name).is_file():
                    issues.append(f'{file.relative_to(ROOT)}: {name}')
        self.assertEqual(issues, [], '\n'.join(issues))

    def test_showcase_is_self_contained_and_suite_branded(self):
        showcase = ROOT / 'shared/assets/showcase.html'
        self.assertTrue(showcase.is_file(), 'The standalone showcase is missing')
        text = showcase.read_text(encoding='utf-8')
        self.assertIn('<h1>Liquid Glass Suite</h1>', text)
        self.assertIn('window.LiquidGlassShowcase', text)
        self.assertIn('const LiquidGlassField', text)
        self.assertNotRegex(text, r'<script[^>]+src=')
        self.assertNotRegex(text, r'<link[^>]+href=')
        runtime_files = [showcase, ROOT / 'shared/assets/liquid-glass.js', ROOT / 'shared/assets/liquid-glass.css',
                         ROOT / 'shared/assets/webgl-glass.js', ROOT / 'shared/assets/showcase/optics.js',
                         ROOT / 'shared/assets/showcase/controller.js', ROOT / 'shared/assets/showcase/template.html']
        for file in runtime_files:
            without_comments = re.sub(r'/\*.*?\*/|<!--.*?-->', '', file.read_text(encoding='utf-8'), flags=re.S)
            self.assertNotRegex(without_comments, r'https?://', str(file.relative_to(ROOT)))

    def test_clean_room_disposal_credit_and_owned_artifacts(self):
        for relative in ('tests/' + 'reference', 'shared/assets/showcase/' + 'backgrounds',
                         'shared/assets/showcase/' + 'source-' + 'manifest.json', 'PUBLISHING-BLOCKED.md'):
            self.assertFalse((ROOT / relative).exists(), relative)
        plates = sorted((ROOT / 'shared/assets/showcase/plates').glob('*.svg'))
        self.assertEqual(len(plates), 8)
        for plate in plates:
            self.assertIn('Authored procedurally for Liquid Glass Suite', plate.read_text(encoding='utf-8'))
        baselines = sorted((ROOT / 'tests/baselines').glob('*.png'))
        self.assertEqual({p.name for p in baselines}, {'css-navigation.png', 'webgl-media.png', 'split-loupe.png'})
        for image in baselines:
            self.assertEqual(image.read_bytes()[:8], b'\x89PNG\r\n\x1a\n')
        notice = (ROOT / 'NOTICE').read_text(encoding='utf-8')
        credit = next(line for line in notice.splitlines() if line.startswith('Technique follows'))
        for relative in ('README.md', 'shared/references/16-sources.md',
                         'shared/assets/liquid-glass.js', 'shared/assets/webgl-glass.js', 'PROVENANCE.md'):
            self.assertIn(credit, (ROOT / relative).read_text(encoding='utf-8'), relative)

    def test_showcase_preset_table_exactly_matches_product_bundles(self):
        bundles = json.loads((ROOT / 'shared/assets/showcase/presets.json').read_text(encoding='utf-8'))
        document = (ROOT / 'shared/references/14-showcase.md').read_text(encoding='utf-8')
        keys = ['specular', 'chroma', 'refraction', 'blur', 'lightAngle', 'fill', 'dim',
                'surface', 'bezel', 'thickness', 'gain', 'radius']
        self.assertEqual(set(bundles), {'navigation', 'toggle', 'slider', 'player', 'loupe', 'panelA', 'panelB'})
        for name, bundle in bundles.items():
            settings = bundle['settings']
            cells = [json.dumps(settings[key]) if isinstance(settings[key], (int, float)) else settings[key] for key in keys]
            row = f"| `{name}` | " + ' | '.join(cells) + f" | {settings['width']}×{settings['height']} |"
            self.assertIn(row, document)
            self.assertTrue(bundle['_derivation'])
        self.assertEqual(len(re.findall(r'(?m)^\| `(?:navigation|toggle|slider|player|loupe|panelA|panelB)` \|', document)), 7)

    def test_general_cap_and_webkit_budget_are_explicit(self):
        text = (ROOT / 'shared/references/08-performance.md').read_text(encoding='utf-8')
        self.assertIn('1024', text)
        self.assertIn('512', text)
        self.assertIn('Safari exception', text)

    def test_native_rules_do_not_force_unintended_shape_merging(self):
        text = (ROOT / 'shared/references/13-native-apple.md').read_text(encoding='utf-8')
        self.assertNotIn('spacing must exceed', text)
        self.assertNotIn('UIGlassEffectView(effect:', text)
        self.assertIn('UIVisualEffectView(effect:', text)
        self.assertIn('RoundedRectangle(cornerRadius:', text)

    def test_default_scaffold_has_clean_sdf_optics_and_production_wash(self):
        script = (ROOT / 'shared/assets/liquid-glass.js').read_text(encoding='utf-8')
        css = (ROOT / 'shared/assets/liquid-glass.css').read_text(encoding='utf-8')
        self.assertIn('const LiquidGlassField', script)
        self.assertIn('function roundedFrame', script)
        self.assertIn('function lateralTravel', script)
        self.assertIn('const discriminant', script)
        self.assertIn('function heightAt', script)
        self.assertIn('feDisplacementMap', script)
        self.assertIn('feComponentTransfer', script)
        self.assertIn('washTable', script)
        self.assertIn('Production and showcase share 1x maps', css)
        self.assertIn('specular/bezel fallback', css)
        self.assertNotIn('legacy scaffold', css.lower())

    def test_reference_set_recipes_and_evals_are_complete(self):
        references = list((ROOT / 'shared/references').glob('*.md'))
        self.assertEqual(len(references), 16)
        catalogue = (ROOT / 'shared/references/11-failure-catalogue.md').read_text(encoding='utf-8')
        for number in range(1, 34):
            self.assertIn(f'S{number:02d}', catalogue)
        recipes = (ROOT / 'skills/liquid-glass/recipes.md').read_text(encoding='utf-8')
        for surface in ('Navigation bar', 'Toolbar', 'Tab bar', 'Floating card', 'Modal / sheet',
                        'Dropdown / popover', 'Button and circular FAB', 'Search field', 'Sidebar', 'Slider'):
            self.assertIn(f'## {surface}', recipes)
        evals = list((ROOT / 'evals').glob('[0-9][0-9]-*.md'))
        self.assertEqual(len(evals), 10)
        for path in evals:
            text = path.read_text(encoding='utf-8')
            behavior = text.split('## Expected behavior\n', 1)[1]
            self.assertLessEqual(len(re.findall(r'(?m)^- ', behavior)), 6, path.name)


class ChromaMath(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.probe = module('chroma-retention.py')

    def test_highlight_weighted_wash_keeps_black_fixed(self):
        self.assertEqual(self.probe.wash((0, 0, 0), 0.5, (31, 29, 41)), (0, 0, 0))

    def test_cli_rejects_out_of_range_wash(self):
        run = subprocess.run([sys.executable, str(ROOT / 'shared/scripts/chroma-retention.py'),
                              '--in', '240,232,210', '--wash', '0.9'], capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0, 'Out-of-range wash must not silently invert highlights')

    def test_css_saturation_clamps_channels(self):
        out = self.probe.saturate((255, 0, 0), 4)
        self.assertTrue(all(0 <= x <= 255 for x in out), out)


class MeasurementFixtures(unittest.TestCase):
    def run_script(self, script, *args):
        result = subprocess.run([sys.executable, str(ROOT / 'shared/scripts' / script), *map(str, args)],
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
