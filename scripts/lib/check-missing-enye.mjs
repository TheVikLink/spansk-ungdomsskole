// A small, explicit bilingual guard, not a Spanish spellchecker. The Norwegian
// context matters: ano, cana and sueno can themselves be valid Spanish words.
const rules = [
  ['año años', 'år året årene alder'],
  ['mañana mañanas', 'morgen morgenen morgener morgentid'],
  ['niño niña niños niñas', 'barn barnet barna barnene gutt gutten gutter guttene jente jenta jenter jentene'],
  ['pequeño pequeña pequeños pequeñas', 'liten lite lille små'],
  ['español española españoles españolas', 'spansk spanske spansklærer spanjol spanjoler'],
  ['sueño sueños', 'drøm drømmen drømmer søvn søvnig trøtt'],
  ['daño daños', 'skade skaden skader'],
  ['otoño otoños', 'høst høsten'],
  ['piña piñas', 'ananas ananasen'],
  ['caña cañas', 'siv stokk sukkerrør'],
  ['montaña montañas', 'fjell fjellet fjellene'],
  ['tamaño tamaños', 'størrelse størrelsen størrelser'],
  ['engaño engaños', 'bedrag bedraget lureri'],
  ['enseñanza enseñanzas', 'undervisning undervisningen'],
  ['añadir', 'tilføye legge']
].map(([forms, meanings]) => ({ forms: forms.split(' '), meanings: meanings.split(' ') }));

const words = value => String(value || '').normalize('NFC').toLowerCase().match(/\p{L}+/gu) || [];

export function findMissingEnye(glossary) {
  return glossary.flatMap(card => {
    const norwegian = new Set(words(card.no));
    const spanish = new Set(words(card.es));
    return rules.filter(rule => rule.meanings.some(word => norwegian.has(word)))
      .flatMap(rule => rule.forms.filter(form => spanish.has(form.replaceAll('ñ', 'n')))
        .map(expected => ({ no: card.no, es: card.es, actual: expected.replaceAll('ñ', 'n'), expected })));
  });
}
