const params = new URLSearchParams(window.location.search);
const hasStudentToken = params.has('elev');
const hasTeacherParam = params.get('laerer') === '1';

function isSameLessonTeacherReferrer(referrer, loc) {
  if (!referrer) return false;
  try {
    const refUrl = new URL(referrer);
    if (refUrl.origin !== loc.origin) return false;
    const dir = loc.pathname.replace(/elev\.html$/u, '');
    return refUrl.pathname === dir || refUrl.pathname === `${dir}index.html`;
  } catch {
    return false;
  }
}

const isTeacherPreview = !hasStudentToken && (hasTeacherParam || isSameLessonTeacherReferrer(document.referrer, window.location));

if (hasStudentToken || hasTeacherParam) {
  params.delete('elev');
  params.delete('laerer');
  const cleanQuery = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
}

if (isTeacherPreview) {
  const mainNav = document.querySelector('main > nav');
  if (mainNav) {
    const backLink = document.createElement('a');
    backLink.className = 'teacher-back-link';
    backLink.href = 'index.html';
    backLink.textContent = '← Tilbake til lærersiden';
    mainNav.prepend(backLink);

    const banner = document.createElement('p');
    banner.className = 'teacher-preview-banner';
    banner.setAttribute('role', 'note');
    banner.textContent = 'Lærerforhåndsvisning: Lenken tilbake til lærersiden vises bare for deg, ikke når elever åpner den delte elevlenken.';
    mainNav.after(banner);
  }
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
const clearDraftBtn = document.querySelector('[data-clear-draft]');
const draftStatus = document.querySelector('[data-draft-status]');
let activeTextarea = inputs[0] || allTextareas[0] || null;

const lessonIdForDraft = section?.dataset?.lessonId
  || window.location.pathname.split('/').filter(Boolean).slice(-2, -1)[0]
  || '';
const draftStorageKey = lessonIdForDraft ? `spansk123_lessonDraft_v1:${lessonIdForDraft}` : '';

function loadLocalDraft() {
  if (!draftStorageKey) return;
  try {
    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return;
    for (const textarea of allTextareas) {
      const key = textarea.dataset.draftKey;
      if (key && typeof saved[key] === 'string' && !textarea.value) {
        textarea.value = saved[key];
      }
    }
  } catch {
    // Ignore storage errors (e.g. private browsing).
  }
}

function saveLocalDraft() {
  if (!draftStorageKey) return;
  try {
    const payload = {};
    let hasContent = false;
    for (const textarea of allTextareas) {
      const key = textarea.dataset.draftKey;
      if (!key) continue;
      if (textarea.value) {
        payload[key] = textarea.value;
        hasContent = true;
      }
    }
    if (hasContent) {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    } else {
      window.localStorage.removeItem(draftStorageKey);
    }
  } catch {
    // Ignore storage errors.
  }
}

function updateExamples() {
  if (!examples) return;
  examples.hidden = inputs.some((input) => !input.value.trim());
  if (examples.hidden) examples.open = false;
}

loadLocalDraft();
updateExamples();

if (section) {
  section.addEventListener('input', updateExamples);
  window.addEventListener('pageshow', () => {
    loadLocalDraft();
    updateExamples();
  });
}

for (const textarea of allTextareas) {
  setupAccentInput(textarea);
  textarea.addEventListener('focus', () => {
    activeTextarea = textarea;
  });
  textarea.addEventListener('input', () => {
    saveLocalDraft();
    if (draftStatus && draftStatus.textContent) draftStatus.textContent = '';
  });
}

if (clearDraftBtn) {
  clearDraftBtn.addEventListener('click', () => {
    for (const textarea of allTextareas) textarea.value = '';
    if (draftStorageKey) {
      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {}
    }
    updateExamples();
    if (draftStatus) draftStatus.textContent = 'Svarene på denne siden er tømt.';
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

const audio = document.querySelector('audio');
const speedGroup = document.querySelector('[data-audio-speed]');
if (audio && speedGroup) {
  const speedButtons = [...speedGroup.querySelectorAll('button[data-rate]')];
  for (const btn of speedButtons) {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.rate) || 1;
      audio.playbackRate = rate;
      audio.defaultPlaybackRate = rate;
      for (const candidate of speedButtons) {
        candidate.setAttribute('aria-pressed', candidate === btn ? 'true' : 'false');
      }
    });
  }
}
