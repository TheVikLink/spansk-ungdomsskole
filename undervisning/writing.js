const params = new URLSearchParams(window.location.search);
if (params.has('elev')) {
  params.delete('elev');
  const cleanQuery = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
}

const accentMap = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', n: 'ñ',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', N: 'Ñ',
  '?': '¿', '!': '¡',
};

function insertCharacter(input, char) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.setRangeText(char, start, end, 'end');
  if (input.selectionEnd === input.value.length) {
    input.scrollLeft = input.scrollWidth;
    if (input.tagName === 'TEXTAREA') input.scrollTop = input.scrollHeight;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function setupAccentInput(inputElement) {
  if (!inputElement || inputElement.dataset.accentInputReady === 'true') return;
  inputElement.dataset.accentInputReady = 'true';
  const longPressTimers = new Map();
  const canHandle = (e) => !inputElement.disabled && !inputElement.readOnly && !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey;

  inputElement.addEventListener('keypress', (e) => {
    if (accentMap[e.key] && canHandle(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  inputElement.addEventListener('keydown', (e) => {
    const key = e.key;
    const physicalKey = e.code || key;
    if (!accentMap[key] || !canHandle(e)) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat) return;

    if (longPressTimers.has(physicalKey)) {
      clearTimeout(longPressTimers.get(physicalKey));
      longPressTimers.delete(physicalKey);
    }

    const start = inputElement.selectionStart ?? inputElement.value.length;
    const plainCharacter = e.shiftKey ? key.toUpperCase() : key;
    insertCharacter(inputElement, plainCharacter);
    const insertedPosition = start + 1;

    const timer = setTimeout(() => {
      const value = inputElement.value;
      const insertedChar = value.charAt(insertedPosition - 1);
      if ((!e.shiftKey || key === '?' || key === '!') && insertedChar === plainCharacter && !inputElement.disabled && !inputElement.readOnly) {
        const selectionStart = inputElement.selectionStart;
        const selectionEnd = inputElement.selectionEnd;
        inputElement.setRangeText(accentMap[key], insertedPosition - 1, insertedPosition, 'preserve');
        inputElement.selectionStart = selectionStart;
        inputElement.selectionEnd = selectionEnd;
        if (inputElement.selectionEnd === inputElement.value.length) {
          inputElement.scrollLeft = inputElement.scrollWidth;
          if (inputElement.tagName === 'TEXTAREA') inputElement.scrollTop = inputElement.scrollHeight;
        }
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      longPressTimers.delete(physicalKey);
    }, 400);
    longPressTimers.set(physicalKey, timer);
  }, true);

  inputElement.addEventListener('keyup', (e) => {
    const physicalKey = e.code || e.key;
    if (!longPressTimers.has(physicalKey)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    clearTimeout(longPressTimers.get(physicalKey));
    longPressTimers.delete(physicalKey);
  }, true);

  inputElement.addEventListener('blur', () => {
    for (const timer of longPressTimers.values()) clearTimeout(timer);
    longPressTimers.clear();
  });
}

const section = document.querySelector('[data-writing]');
const inputs = section ? [...section.querySelectorAll('textarea')] : [];
const examples = section?.querySelector('details') || null;
const allTextareas = [...document.querySelectorAll('textarea')];
let activeTextarea = inputs[0] || allTextareas[0] || null;

function updateExamples() {
  if (!examples) return;
  examples.hidden = inputs.some((input) => !input.value.trim());
  if (examples.hidden) examples.open = false;
}

if (section) {
  section.addEventListener('input', updateExamples);
  window.addEventListener('pageshow', updateExamples);
}

for (const textarea of allTextareas) {
  setupAccentInput(textarea);
  textarea.addEventListener('focus', () => {
    activeTextarea = textarea;
  });
}

const accentBar = document.querySelector('[data-accent-bar]');
if (accentBar && allTextareas.length) {
  for (const ch of ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'accent-btn';
    btn.textContent = ch;
    btn.setAttribute('aria-label', `Sett inn ${ch}`);
    btn.addEventListener('click', () => {
      const target = activeTextarea || inputs[0] || allTextareas[0];
      if (!target) return;
      target.focus();
      insertCharacter(target, ch);
    });
    accentBar.append(btn);
  }
}
