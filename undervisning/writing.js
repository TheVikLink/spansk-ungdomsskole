const section = document.querySelector('[data-writing]');
const inputs = [...section.querySelectorAll('textarea')];
const examples = section.querySelector('details');
function updateExamples() {
  examples.hidden = inputs.some(input => !input.value.trim());
  if (examples.hidden) examples.open = false;
}
section.addEventListener('input', updateExamples);
window.addEventListener('pageshow', updateExamples);
