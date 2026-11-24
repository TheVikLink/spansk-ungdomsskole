"""Build student and teacher review PDFs from the same culture JSON as the local preview.

Uses the Codex bundled Python/reportlab runtime. No student data or remote assets.
"""
import argparse
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urljoin, urlsplit, urlunsplit
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable, KeepTogether

parser = argparse.ArgumentParser()
parser.add_argument('--font-dir', required=True)
parser.add_argument('--pack', action='append', default=[], help='Pack ID; repeat to build several packs')
parser.add_argument('--site-base-url', required=True, help='Absolute HTTP(S) directory containing the app index.html')
parser.add_argument('--output-dir', default='output/pdf')
args = parser.parse_args()
try:
    base = urlsplit(args.site_base_url)
    if (base.scheme not in ('http', 'https') or not base.hostname
            or base.username is not None or base.password is not None
            or '?' in args.site_base_url or '#' in args.site_base_url
            or any(char.isspace() or ord(char) < 32 for char in args.site_base_url)):
        raise ValueError('Use an absolute HTTP(S) URL without user info, query or fragment')
    base.port  # Validate malformed port numbers before writing anything.
except ValueError as error:
    parser.error('Invalid --site-base-url: ' + str(error))
site_base_url = urlunsplit((base.scheme, base.netloc, base.path.rstrip('/') + '/', '', ''))
local_links = base.hostname.lower() in ('localhost', '127.0.0.1', '::1')
build_date = datetime.now(ZoneInfo('Europe/Oslo')).date().isoformat()
font_dir = Path(args.font_dir)
pdfmetrics.registerFont(TTFont('Lesson', str(font_dir / 'NotoSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('LessonBold', str(font_dir / 'NotoSans-Bold.ttf')))
pdfmetrics.registerFontFamily('Lesson', normal='Lesson', bold='LessonBold', italic='Lesson', boldItalic='LessonBold')
catalog = json.loads(Path('data/culture-packages.json').read_text())['packages']
selected = [item for item in catalog if item['id'] in args.pack] if args.pack else catalog[:1]
if args.pack and {item['id'] for item in selected} != set(args.pack):
    parser.error('Unknown culture pack ID')
pack = selected[0]
land = json.loads(Path('data/maps/ne_110m_land.geojson').read_text())
terms = {word['id']: word for word in pack['vocabulary'] + pack['supportTerms']}
out = Path(args.output_dir); out.mkdir(parents=True, exist_ok=True)
INK = colors.HexColor('#252b3b'); ACCENT = colors.HexColor('#4338ca'); MUTED = colors.HexColor('#606779')
styles = getSampleStyleSheet()
for name in ['Normal', 'BodyText', 'Heading1', 'Heading2', 'Heading3']:
    styles[name].fontName = 'LessonBold' if name.startswith('Heading') else 'Lesson'
    styles[name].textColor = INK
styles['Normal'].fontSize = 10; styles['Normal'].leading = 14
styles['Heading1'].fontSize = 23; styles['Heading1'].leading = 28; styles['Heading1'].spaceAfter = 12
styles['Heading2'].fontSize = 17; styles['Heading2'].leading = 21; styles['Heading2'].spaceBefore = 8
styles['Heading3'].fontSize = 11; styles['Heading3'].leading = 15; styles['Heading3'].spaceAfter = 6
styles.add(ParagraphStyle('Small', fontName='Lesson', fontSize=8, leading=11, textColor=MUTED, spaceAfter=7))
styles.add(ParagraphStyle('Glossary', fontName='Lesson', fontSize=9.5, leading=13, textColor=INK))
styles.add(ParagraphStyle('Spanish', fontName='Lesson', fontSize=11, leading=16, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle('Banner', fontName='LessonBold', fontSize=8, leading=11, textColor=ACCENT, spaceAfter=7))
styles.add(ParagraphStyle('WebLink', fontName='Lesson', fontSize=9, leading=13, spaceAfter=5, splitLongWords=True))
styles.add(ParagraphStyle('AnswerSpace', fontName='Lesson', fontSize=10, leading=14, spaceAfter=7))

def p(text, style='Normal'):
    return Paragraph(escape(text), styles[style])

def bullet(text):
    return p('- ' + text)

def heading(title, variant):
    return [p('Spansk på 1-2-3 | Kultur', 'Banner'), p(title, 'Heading1'),
            p(variant + ' | Arbeidsutkast til lærervurdering', 'Small')]

def lines(count=2):
    rows = [[''] for _ in range(count)]
    table = Table(rows, colWidths=[470], rowHeights=18)
    table.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), .35, colors.HexColor('#d9dce5'))]))
    return table

class AnswerBox(Flowable):
    def __init__(self):
        super().__init__(); self.width = 10; self.height = 10
    def draw(self):
        self.canv.setStrokeColor(INK); self.canv.setLineWidth(.6)
        self.canv.rect(0, 0, 9, 9, stroke=1, fill=0)

def answer_choices(question):
    rows = [[AnswerBox(), p(option['text'])] for option in question['options']]
    table = Table(rows, colWidths=[20, 450], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2)]))
    return table

class LabeledPicture(Flowable):
    def __init__(self, visual, width=228):
        super().__init__(); self.visual = visual; self.width = min(width, 170 * visual['width'] / visual['height']); self.height = self.width * visual['height'] / visual['width']
    def draw(self):
        c = self.canv
        c.drawImage(self.visual['path'], 0, 0, self.width, self.height, preserveAspectRatio=True)
        for point in self.visual['hotspots']:
            x = point['x'] * self.width; y = (1 - point['y']) * self.height
            c.setFillColor(colors.white); c.setStrokeColor(ACCENT); c.setLineWidth(1.3)
            c.circle(x, y, 9, stroke=1, fill=1); c.setFillColor(ACCENT); c.setFont('LessonBold', 9)
            c.drawCentredString(x, y - 3, str(point['number']))

class LocatorMap(Flowable):
    def __init__(self):
        super().__init__(); self.width = 350; self.height = 86
    def draw(self):
        c = self.canv; c.setFillColor(colors.HexColor('#f3f1ea')); c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        c.setFillColor(colors.HexColor('#d7d4c9'))
        for feature in land['features']:
            geometry = feature['geometry']; polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
            for poly in polygons:
                path = c.beginPath()
                for i, point in enumerate(poly[0]):
                    x = (point[0] + 180) * self.width / 360; y = (point[1] + 90) * self.height / 180
                    (path.moveTo if i == 0 else path.lineTo)(x, y)
                path.close(); c.drawPath(path, fill=1, stroke=0)
        c.setFillColor(ACCENT); c.setFont('LessonBold', 9)
        points = pack.get('orientation', {}).get('points', [{'name':'Spania','lon':-4,'lat':40},{'name':'Chile','lon':-71,'lat':-35}])
        for point in points:
            name, lon, lat, dy = point['name'], point['lon'], point['lat'], 4
            x = (lon + 180) * self.width / 360; y = (lat + 90) * self.height / 180
            c.circle(x, y, 2.4, fill=1, stroke=0); c.drawString(x + 6, y + dy, name)

def word_table(words, notes=False):
    rows = [[p('Spansk', 'Small'), p('Norsk', 'Small')]]
    for word in words:
        no = word['no'] + (' - ' + word['note'] if notes else '')
        rows.append([p(word['es']), p(no)])
    table = Table(rows, colWidths=[165, 305], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('BOTTOMPADDING',(0,0),(-1,-1),5), ('TOPPADDING',(0,0),(-1,-1),5), ('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#dedfe7'))]))
    return table

def footer(c, doc):
    c.saveState(); c.setStrokeColor(colors.HexColor('#dedfe7')); c.line(42, 37, A4[0]-42, 37)
    c.setFont('Lesson', 8); c.setFillColor(MUTED)
    c.drawString(42, 23, pack['title'] + ' | Bygget ' + build_date)
    c.drawRightString(A4[0]-42, 23, str(doc.page)); c.restoreState()

def build(filename, story):
    doc = SimpleDocTemplate(str(out / filename), pagesize=A4, rightMargin=54, leftMargin=54, topMargin=40, bottomMargin=50,
                            title=pack['title'], author='Spansk på 1-2-3', pageCompression=1)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(out / filename)

def reading_word_table(words):
    half = (len(words) + 1) // 2
    rows = [[p('Spansk', 'Small'), p('Norsk', 'Small'), p('Spansk', 'Small'), p('Norsk', 'Small')]]
    for i in range(half):
        row = []
        for index in [i, i + half]:
            word = words[index] if index < len(words) else {'es': '', 'no': ''}
            row += [p(word['es'], 'Glossary'), p(word['no'], 'Glossary')]
        rows.append(row)
    table = Table(rows, colWidths=[110, 130, 110, 130], hAlign='LEFT')
    pad = 2 if len(pack['countries']) == 1 else 4
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),3),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),pad),('BOTTOMPADDING',(0,0),(-1,-1),pad),('LINEBELOW',(0,0),(-1,-1),.3,colors.HexColor('#dedfe7'))]))
    return table


def link_markup(url, label):
    return '<link href=' + quoteattr(url) + '>' + escape(label) + '</link>'


def online_links():
    student_url = urljoin(site_base_url, f"docs/kultur/{pack['id']}/index.html")
    vocabulary_url = urljoin(site_base_url, f"index.html#gloser/{pack['id']}")
    block = [p('Fortsett på nett', 'Heading3')]
    if local_links:
        block.append(p('Lokalt arbeidsutkast – nettlenkene virker bare på denne maskinen.', 'Small'))
    for label, url in [('Elevøkt', student_url), ('Gloser', vocabulary_url)]:
        block.append(Paragraph(escape(label) + ': ' + link_markup(url, url), styles['WebLink']))
    return KeepTogether(block)


def photo_credit(photo):
    author = link_markup(photo['authorUrl'], photo['author']) if photo.get('authorUrl') else escape(photo['author'])
    text = 'Foto: ' + author + ' (' + escape(photo['date']) + '). ' + link_markup(photo['sourceUrl'], photo['originalTitle']) + '. ' + link_markup(photo['licenseUrl'], 'CC BY 2.0') + '. ' + escape(photo['changes'])
    return [Paragraph(text, styles['Small'])]


def student():
    story = []
    for i, country in enumerate(pack['countries']):
        if i: story.append(PageBreak())
        single = len(pack['countries']) == 1
        story += heading(country['spanishTitle'] if single else (pack['title'] if not i else 'Les om ' + country['name']), 'Elevark med ordlister | ' + country['name'])
        if not i:
            story.append(p('Les tekstene høyt sammen og oversett muntlig til norsk. Bytt på å lese ett avsnitt hver. Bruk ordlisten på neste side når dere trenger hjelp.', 'Small'))
        story.append(p(country['region'] if single else country['spanishTitle'] + ' | ' + country['region'], 'Small' if single else 'Heading2'))
        picture = [LabeledPicture(country['visual']), Spacer(1, 6), p(country['visual']['caption'], 'Small')]
        support = [p('Bildeord', 'Heading3')]
        for point in country['visual']['hotspots']:
            term = terms[point['termId']]
            support.append(p(f"{point['number']}: {term['es']} - {term['no']}", 'Small'))
        if country['visual']['kind'] == 'photograph':
            support += photo_credit(country['visual'])
        panel = Table([[picture, support]], colWidths=[245, 240], hAlign='LEFT')
        panel.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
        story += [panel, Spacer(1, 9)]
        for text in country['paragraphs']: story.append(p(text, 'Spanish'))
        sources = [source for source in pack['sources'] if source['id'] in country['sourceIds']]
        story.append(p('Faktakilder: ' + '; '.join(source['url'] for source in sources), 'Small'))
        story += [PageBreak()] + heading('Ordliste til ' + country['name'] + '-teksten', 'Les og oversett i par')
        story += [p('Ord og uttrykk fra teksten. Les ned venstre del av ordlisten før høyre del.', 'Small'), reading_word_table(country['readingGlossary'])]
    story += [PageBreak()] + heading('Spørsmål og sammenligning', 'Elevark')
    story.append(p('Kryss av for ett svar på hvert spørsmål.', 'Small'))
    for i, q in enumerate(pack['questions'], 1): story += [p(f'{i}. '+q['prompt']), answer_choices(q), Spacer(1, 8)]
    story.append(p('Sammenlign og spør', 'Heading2'))
    for question in pack['comparison']: story += [p(question), lines(1), Spacer(1, 5)]
    story += [PageBreak()] + heading(pack['recall'].get('title', 'Bruk juleglosene'), 'Elevark')
    story += [p(pack['recall']['instruction'], 'Small'), word_table(pack['vocabulary']), Spacer(1, 10)]
    story += [online_links(), p(pack['recall']['returnMessage'], 'Small')]
    story += [p('Bruk språket i par', 'Heading3'), p(pack['pairTask']['instruction'], 'Small'), p('Setningsstartere: ' + ' / '.join(pack['pairTask']['starters']), 'Small')]
    story += [p('Prøv en utvidelse', 'Heading3'), p(pack['pairTask']['extension'], 'Small')]
    story += [Spacer(1, 8), LocatorMap(), p(pack.get('orientation', {}).get('caption', 'Spania i Europa; Chile i Sør-Amerika. Kartgrunnlag: Natural Earth.'), 'Small')]
    return story

def teacher():
    story = heading(pack['title'], 'Lærerveiledning og fasit')
    story += [p('45 minutter | ungdomsskolen og spansk nivå I i videregående', 'Small'), p('Mål og forkunnskaper', 'Heading2')]
    story += [bullet(text) for text in pack['objectives'] + pack['prerequisites']]
    story += [Spacer(1, 10), p('Forløp', 'Heading2')]
    rows = [[p('Tid', 'Small'), p('Gjennomføring', 'Small')]]
    for step in pack['teacher']['schedule']:
        rows.append([p(f"{step['start']}-{step['end']} min"), Paragraph('<b>'+escape(step['activity'])+'</b><br/>'+escape(step['guidance']), styles['Normal'])])
    table = Table(rows, colWidths=[70, 400]); table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#dedfe7'))]))
    story += [table, PageBreak()] + heading('Fasit og vurderingsstøtte', 'Lærerveiledning')
    for i, answer in enumerate(pack['teacher']['answers'], 1): story += [p(f'{i}. '+answer['answer']), Spacer(1,5)]
    story.append(p('Sammenligning og kultur', 'Heading2'))
    story += [bullet(text) for text in pack['teacher']['comparisonNotes']]
    story.append(p('Mulige spanske setninger', 'Heading3'))
    story += [p(text, 'Spanish') for text in pack['teacher']['modelSentences']]
    story.append(p('Formativ tilbakemelding', 'Heading3'))
    story += [bullet(text) for text in pack['teacher']['assessment']]
    story.append(p('Om tekst og bilder', 'Heading3'))
    protocol = 'docs/kultur/mundo-am/bilde-og-kildeprotokoll.md' if len(pack['countries']) == 1 else 'docs/kultur/genererte-bilder-jul-spania-chile.md'
    description = 'Fotografiene viser virkelige steder. Personene i fortellingen er fiktive. Bildekilder og lisenser finnes i docs/kultur/stedsfoto.md.' if pack['countries'][0]['visual']['kind'] == 'photograph' else 'Illustrasjonene er generert med image_gen og viser fiktive eksempler. Nøyaktige prompter og gjennomgang finnes i ' + protocol + '.'
    story.append(p('Tekstene er originale. ' + description + ' Kulturrefleksjoner har ikke én automatisk fasit. Ingen elevdata sendes eller lagres i nettprøven.', 'Small'))
    story += [PageBreak()] + heading('Tilpasninger og kilder', 'Lærerveiledning')
    story += [bullet(text) for text in pack['teacher']['adaptations']]
    story += [Spacer(1,8), p('Ti nøkkelord', 'Heading3'), word_table(pack['vocabulary'])]
    story.append(p('Kilder og illustrasjoner', 'Heading3'))
    for source in pack['sources']: story.append(p(source['title']+': '+source['url'], 'Small'))
    for country in pack['countries']:
        if country['visual']['kind'] == 'photograph': story += photo_credit(country['visual'])
    story += [Spacer(1, 8), online_links()]
    return story

for pack in selected:
    terms = {word['id']: word for word in pack['vocabulary'] + pack['supportTerms']}
    if len(pack['countries']) == 1:
        styles['Spanish'].fontSize = 10.2; styles['Spanish'].leading = 14.2
        styles['Glossary'].fontSize = 8.5; styles['Glossary'].leading = 11
    build(pack['id'] + '-elev.pdf', student())
    build(pack['id'] + '-laererveiledning.pdf', teacher())
