const params = new URLSearchParams(window.location.search);
if (params.has('elev')) {
  params.delete('elev');
  const cleanQuery = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`);
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
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      target.value = target.value.slice(0, start) + ch + target.value.slice(end);
      target.focus();
      target.setSelectionRange(start + ch.length, start + ch.length);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    });
    accentBar.append(btn);
  }
}
