// This local review preview keeps only transient UI state. It never stores or sends answers.
const terms = JSON.parse(document.getElementById('picture-terms')?.textContent || '{}');
for (const figure of document.querySelectorAll('[data-word-picture]')) {
  const panel = figure.querySelector('.word-panel');
  const content = figure.querySelector('.word-panel-content');
  const buttons = [...figure.querySelectorAll('[data-term]')];
  const image = figure.querySelector('img');
  let current = null;
  let pinned = false;
  let suppressed = null;
  function close({ returnFocus = false } = {}) {
    const previous = current;
    if (previous) { previous.setAttribute('aria-expanded', 'false'); suppressed = previous; }
    current = null; pinned = false; panel.hidden = true;
    if (returnFocus && previous) previous.focus();
  }
  function show(button, pin = false) {
    if (suppressed === button && !pin) return;
    const term = terms[button.dataset.term];
    if (!term) return;
    for (const other of buttons) other.setAttribute('aria-expanded', String(other === button));
    current = button; pinned = pin; suppressed = null;
    content.replaceChildren();
    const spanish = document.createElement('strong'); spanish.lang = 'es'; spanish.textContent = term.es;
    const norwegian = document.createElement('p'); norwegian.textContent = term.no;
    content.append(spanish, norwegian); panel.hidden = false;
  }
  function clearSuppression(button) {
    if (suppressed === button && document.activeElement !== button && !button.matches(':hover')) suppressed = null;
  }
  for (const button of buttons) {
    button.addEventListener('mouseenter', () => { if (!pinned && matchMedia('(hover: hover)').matches) show(button); });
    button.addEventListener('focus', () => show(button));
    button.addEventListener('click', () => {
      if (current === button && pinned) close();
      else show(button, true);
    });
    button.addEventListener('mouseleave', () => clearSuppression(button));
    button.addEventListener('blur', () => clearSuppression(button));
  }
  figure.addEventListener('mouseleave', () => {
    if (!pinned && !figure.contains(document.activeElement)) close();
    buttons.forEach(clearSuppression);
  });
  figure.addEventListener('focusout', event => {
    if (!pinned && !figure.contains(event.relatedTarget) && !figure.matches(':hover')) close();
  });
  figure.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current) { event.preventDefault(); close({ returnFocus: document.activeElement === figure.querySelector('[data-close-label]') }); }
  });
  figure.querySelector('[data-close-label]').addEventListener('click', () => close({ returnFocus: true }));
  function imageFailed() {
    close(); figure.querySelector('.hotspots').hidden = true;
    figure.querySelector('.image-error').hidden = false;
    figure.querySelector('.picture-fallback').hidden = false;
  }
  image.addEventListener('error', imageFailed);
  if (image.complete && !image.naturalWidth) imageFailed();
}

// Reading help uses authored local translations, including whole expressions.
const readingPanel = document.getElementById('reading-translation');
if (readingPanel) {
  const words = [...document.querySelectorAll('.reading-word')];
  const spanish = readingPanel.querySelector('[data-reading-spanish]');
  const norwegian = readingPanel.querySelector('#reading-translation-text');
  let current = null, pinned = false, suppressed = null, dismissTimer, scrollTimer;
  let pointerPosition = null, dismissedPointer = null;
  function close({ returnFocus = false } = {}) {
    clearTimeout(dismissTimer);
    clearTimeout(scrollTimer);
    const previous = current;
    if (previous) {
      previous.setAttribute('aria-expanded', 'false');
      previous.removeAttribute('aria-describedby');
      suppressed = previous;
    }
    dismissedPointer = pointerPosition;
    current = null; pinned = false; readingPanel.hidden = true;
    if (returnFocus && previous) previous.focus();
  }
  function position() {
    if (!current) return;
    const inset = 12, gap = 8;
    const width = Math.min(310, window.innerWidth - inset * 2);
    readingPanel.style.width = `${width}px`;
    readingPanel.style.maxHeight = `${Math.max(44, window.innerHeight - inset * 2)}px`;
    const anchor = current.getBoundingClientRect();
    const height = readingPanel.getBoundingClientRect().height;
    const below = anchor.bottom + gap;
    const top = below + height <= window.innerHeight - inset ? below : anchor.top - height - gap;
    readingPanel.style.left = `${Math.max(inset, Math.min(anchor.left, window.innerWidth - width - inset))}px`;
    readingPanel.style.top = `${Math.max(inset, Math.min(top, window.innerHeight - height - inset))}px`;
  }
  function show(word, pin = false) {
    if (suppressed === word && !pin) return;
    clearTimeout(dismissTimer);
    if (current && current !== word) {
      current.setAttribute('aria-expanded', 'false');
      current.removeAttribute('aria-describedby');
    }
    current = word; pinned = pin; suppressed = null;
    spanish.textContent = word.textContent;
    norwegian.textContent = word.dataset.translation;
    word.setAttribute('aria-expanded', 'true');
    word.setAttribute('aria-describedby', 'reading-translation-text');
    readingPanel.hidden = false; position();
  }
  function dismissLater() {
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      if (current && !pinned && !current.matches(':hover') && !readingPanel.matches(':hover') && document.activeElement !== current && !readingPanel.contains(document.activeElement)) close();
    }, 150);
  }
  function clearSuppression(word) {
    if (suppressed === word && document.activeElement !== word && !word.matches(':hover')) suppressed = null;
  }
  function pointerHover(word, event) {
    if (pinned || !matchMedia('(hover: hover)').matches) return;
    // Closing the overlay can expose a different word at the same pointer position.
    if (dismissedPointer && Math.hypot(event.clientX - dismissedPointer.x, event.clientY - dismissedPointer.y) < 2) return;
    dismissedPointer = null;
    show(word);
  }
  for (const word of words) {
    word.disabled = false;
    word.addEventListener('mouseenter', event => pointerHover(word, event));
    word.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') pointerHover(word, event); });
    word.addEventListener('focus', () => show(word));
    word.addEventListener('click', () => {
      if (current === word && pinned) close(); else show(word, true);
    });
    word.addEventListener('mouseleave', () => { clearSuppression(word); dismissLater(); });
    word.addEventListener('blur', () => { clearSuppression(word); dismissLater(); });
  }
  readingPanel.addEventListener('mouseenter', () => clearTimeout(dismissTimer));
  readingPanel.addEventListener('mouseleave', dismissLater);
  readingPanel.addEventListener('focusout', dismissLater);
  readingPanel.querySelector('[data-close-translation]').addEventListener('click', () => close({ returnFocus: true }));
  document.addEventListener('pointermove', event => {
    pointerPosition = { x: event.clientX, y: event.clientY };
  }, true);
  document.addEventListener('pointerdown', event => {
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (current && !readingPanel.contains(event.target) && !current.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current) { event.preventDefault(); close({ returnFocus: readingPanel.contains(document.activeElement) }); }
  });
  window.addEventListener('resize', position);
  document.addEventListener('scroll', event => {
    if (!current || readingPanel.contains(event.target)) return;
    position();
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!current) return;
      const anchor = current.getBoundingClientRect();
      if (anchor.bottom < 0 || anchor.top > window.innerHeight) close();
    }, 150);
  }, true);
}

for (const form of document.querySelectorAll('form.question')) {
  const feedback = form.querySelector('.answer-feedback');
  const hint = form.querySelector('.answer-hint');
  const explanation = form.querySelector('.answer-explanation');
  const reveal = form.querySelector('[data-show-explanation]');
  form.addEventListener('change', event => {
    if (!event.target.matches('input[type="radio"]') || event.target.form !== form) return;
    feedback.textContent = '';
    feedback.classList.remove('correct');
    hint.hidden = true; explanation.hidden = true; reveal.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const choice = form.querySelector('input:checked');
    if (!choice) { feedback.textContent = 'Velg et svar først.'; feedback.classList.remove('correct'); return; }
    const correct = choice.value === form.dataset.answer;
    feedback.textContent = correct ? 'Riktig.' : 'Prøv igjen. Du kan lese teksten en gang til.';
    feedback.classList.toggle('correct', correct);
    hint.hidden = correct; explanation.hidden = !correct; reveal.hidden = correct;
  });
  reveal.addEventListener('click', () => { explanation.hidden = false; reveal.hidden = true; });
}

for (const button of document.querySelectorAll('[data-print]')) button.addEventListener('click', () => {
  window.print();
});
