"""PDF contract tests. Run with the bundled Python and CULTURE_PDF_FONT_DIR."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import urljoin
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PACKS = json.loads((ROOT / 'data/culture-packages.json').read_text())['packages']
LOCAL_NOTICE = 'Lokalt arbeidsutkast – nettlenkene virker bare på denne maskinen.'


def normalize(text):
    return ' '.join(text.split())


def inspect(path):
    reader = PdfReader(path)
    text = normalize(' '.join(page.extract_text() for page in reader.pages))
    urls = {
        str(annotation.get_object().get('/A', {}).get('/URI'))
        for page in reader.pages for annotation in page.get('/Annots', [])
        if annotation.get_object().get('/A', {}).get('/S') == '/URI'
    }
    return text, urls


class CulturePdfLinks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        value = os.environ.get('CULTURE_PDF_FONT_DIR')
        if not value:
            raise RuntimeError('Sett CULTURE_PDF_FONT_DIR til mappen med NotoSans-Regular.ttf og NotoSans-Bold.ttf.')
        cls.font_dir = Path(value)
        for name in ['NotoSans-Regular.ttf', 'NotoSans-Bold.ttf']:
            if not (cls.font_dir / name).is_file():
                raise RuntimeError(f'Mangler PDF-skrift: {cls.font_dir / name}')

    def build(self, out, *args):
        return subprocess.run(
            [sys.executable, str(ROOT / 'scripts/build-culture-pdfs.py'),
             '--font-dir', str(self.font_dir), '--output-dir', str(out), *args],
            cwd=ROOT, capture_output=True, text=True,
        )

    def assert_links(self, directory, pack, base):
        for role in ['elev', 'laererveiledning']:
            text, urls = inspect(directory / f"{pack['id']}-{role}.pdf")
            for relative in [f"docs/kultur/{pack['id']}/index.html", f"index.html#gloser/{pack['id']}"]:
                expected = urljoin(base, relative)
                self.assertIn(expected, urls)
                self.assertIn(expected, text.replace(' ', ''))
            self.assertIn('Fortsett på nett', text)
            self.assertIn(normalize(pack['title'] if role != 'elev' or len(pack['countries']) > 1 else pack['countries'][0]['spanishTitle']), text)
            for word in pack['vocabulary']:
                self.assertIn(normalize(word['es']), text)
                self.assertIn(normalize(word['no']), text)
            if role == 'elev':
                for country in pack['countries']:
                    for paragraph in country['paragraphs']:
                        self.assertIn(normalize(paragraph), text)
                for question in pack['questions']:
                    self.assertIn(normalize(question['prompt']), text)
                self.assertIn(normalize(pack['recall']['instruction']), text)
                self.assertIn(normalize(pack['pairTask']['instruction']), text)
                self.assertIn(normalize(pack['recall']['returnMessage']), text)
                self.assertNotIn('Fasit og vurderingsstøtte', text)
                for index, answer in enumerate(pack['teacher']['answers'], 1):
                    self.assertNotIn(f"{index}. " + normalize(answer['answer']), text)
            else:
                for answer in pack['teacher']['answers']:
                    self.assertIn(normalize(answer['answer']), text)

    def test_peru_and_christmas_have_real_links(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            result = self.build(out, '--site-base-url', 'http://127.0.0.1:8768/', '--pack', 'un-dia-en-peru', '--pack', 'jul-spania-chile')
            self.assertEqual(result.returncode, 0, result.stderr)
            for pack in PACKS:
                if pack['id'] in ['un-dia-en-peru', 'jul-spania-chile']:
                    self.assert_links(out, pack, 'http://127.0.0.1:8768/')
                    for role in ['elev', 'laererveiledning']:
                        self.assertIn(LOCAL_NOTICE, inspect(out / f"{pack['id']}-{role}.pdf")[0])

    def test_all_seven_packs_keep_content_and_links(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            args = [arg for pack in PACKS for arg in ['--pack', pack['id']]]
            result = self.build(out, '--site-base-url', 'https://example.org/classroom/', *args)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(len(list(out.glob('*.pdf'))), 14)
            for pack in PACKS:
                self.assert_links(out, pack, 'https://example.org/classroom/')

    def test_base_normalization_and_local_hosts(self):
        for raw, base, local in [
            ('https://example.org', 'https://example.org/', False),
            ('https://example.org/classroom', 'https://example.org/classroom/', False),
            ('https://example.org/classroom///', 'https://example.org/classroom/', False),
            ('http://localhost:8768', 'http://localhost:8768/', True),
            ('http://[::1]:8768/classroom/', 'http://[::1]:8768/classroom/', True),
            ('https://example.org/a-very-long-classroom-directory-for-spanish-lessons/another-long-subdirectory/', 'https://example.org/a-very-long-classroom-directory-for-spanish-lessons/another-long-subdirectory/', False),
        ]:
            with self.subTest(base=raw), tempfile.TemporaryDirectory() as directory:
                out = Path(directory)
                result = self.build(out, '--site-base-url', raw, '--pack', 'un-dia-en-peru')
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assert_links(out, next(p for p in PACKS if p['id'] == 'un-dia-en-peru'), base)
                self.assertEqual(LOCAL_NOTICE in inspect(out / 'un-dia-en-peru-elev.pdf')[0], local)

    def test_invalid_inputs_write_no_pdfs(self):
        bad = [None, '/classroom/', 'file:///tmp/', 'javascript:alert(1)', 'https://example.org/#x', 'https://example.org/?x=1',
               'https://demo@example.org/', 'https://demo:pass@example.org/', 'https://', 'https://example.org:bad/', 'https://example.org/has space/']
        for base in bad:
            with self.subTest(base=base), tempfile.TemporaryDirectory() as directory:
                out = Path(directory)
                args = [] if base is None else ['--site-base-url', base]
                result = self.build(out, *args)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('error:', result.stderr)
                self.assertEqual(list(out.glob('*.pdf')), [])
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            result = self.build(out, '--site-base-url', 'https://example.org/', '--pack', 'jul-spania-chile', '--pack', 'unknown')
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Unknown culture pack ID', result.stderr)
            self.assertEqual(list(out.glob('*.pdf')), [])


if __name__ == '__main__':
    unittest.main()
