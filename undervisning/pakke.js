const searchInput = document.getElementById('lessonSearchInput');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const resultCount = document.getElementById('catalogCount');
const catalogItems = [...document.querySelectorAll('.catalog li[data-lesson-id]')];
const catalogSections = [...document.querySelectorAll('.catalog-section')];
const licensePanel = document.getElementById('licensePanel');
const lockedNotice = document.getElementById('lockedNotice');

let activeFilter = 'all';

function applyCatalogFilter() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  let visibleTotal = 0;

  for (const item of catalogItems) {
    const isFree = item.dataset.free === 'true';
    const group = item.dataset.group;
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'free' && isFree)
      || (activeFilter === 'theme' && group === 'theme')
      || (activeFilter === 'culture' && group === 'culture');
    const text = item.textContent.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const visible = matchesFilter && matchesQuery;
    item.hidden = !visible;
    if (visible) visibleTotal += 1;
  }

  for (const section of catalogSections) {
    const hasVisible = [...section.querySelectorAll('li[data-lesson-id]')].some((li) => !li.hidden);
    section.hidden = !hasVisible;
  }

  if (resultCount) {
    resultCount.textContent = visibleTotal === catalogItems.length
      ? `Viser alle ${catalogItems.length} undervisningstimer`
      : `Viser ${visibleTotal} av ${catalogItems.length} undervisningstimer`;
  }
}

for (const btn of filterButtons) {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter || 'all';
    for (const candidate of filterButtons) {
      candidate.setAttribute('aria-pressed', candidate === btn ? 'true' : 'false');
    }
    applyCatalogFilter();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', applyCatalogFilter);
}

function updateCardBadges(active) {
  for (const item of catalogItems) {
    const badge = item.querySelector('.lesson-badge');
    if (!badge) continue;
    if (item.dataset.free === 'true') {
      badge.textContent = 'Gratis prøve';
      badge.className = 'lesson-badge badge-free';
    } else if (active) {
      badge.textContent = 'Åpen med skolekode';
      badge.className = 'lesson-badge badge-active';
    } else {
      badge.textContent = 'Undervisningspakken';
      badge.className = 'lesson-badge badge-paid';
    }
  }
}

function showLockedLessonBanner(lessonId) {
  if (!lockedNotice) return;
  const matching = catalogItems.find((li) => li.dataset.lessonId === lessonId);
  const title = matching?.querySelector('strong')?.textContent || lessonId;
  lockedNotice.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `«${title}» inngår i Undervisningspakken.`;
  const copy = document.createElement('p');
  copy.textContent = 'Skriv inn skolens lisenskode nedenfor for å åpne alle 46 timer og utskrivbare samtalekort, eller prøv de 3 gratis prøvetimene (Spansk du kjenner igjen, Hilsener og Tall).';
  lockedNotice.append(heading, copy);
  lockedNotice.hidden = false;
}

function renderLicensePanel(state, initialMessage = '', isError = false) {
  if (!licensePanel) return;
  licensePanel.replaceChildren();

  if (state?.active) {
    const title = document.createElement('h2');
    title.textContent = `Aktiv skolelisens: ${state.school}`;
    const info = document.createElement('p');
    info.textContent = `Alle 46 undervisningstimer, 46 lytteøvelser, elevark og utskrivbare A/B-kort er låst opp på denne enheten til og med ${state.expiresAt}.`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-secondary';
    btn.textContent = 'Fjern skolekode fra denne enheten';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await fetch('/api/license/deactivate', { method: 'POST', credentials: 'same-origin' });
      updateCardBadges(false);
      renderLicensePanel({ active: false, enforcePaywall: state.enforcePaywall }, 'Skolekoden er fjernet fra denne nettleseren.');
    });
    licensePanel.className = 'license-card license-active';
    licensePanel.append(title, info, btn);
    return;
  }

  licensePanel.className = 'license-card';
  const title = document.createElement('h2');
  title.textContent = 'Har skolen allerede kjøpt Undervisningspakken?';
  const desc = document.createElement('p');
  desc.textContent = 'Skriv inn skolekode eller demokode for å låse opp alle 46 timer, elevark, lytteøvelser og A/B-kort. Ingen elevkontoer eller persondata kreves.';
  const form = document.createElement('form');
  form.className = 'license-form';
  const label = document.createElement('label');
  label.htmlFor = 'licenseCodeInput';
  label.className = 'sr-only';
  label.textContent = 'Skolekode';
  const input = document.createElement('input');
  input.id = 'licenseCodeInput';
  input.type = 'text';
  input.placeholder = 'Skolekode eller demokode';
  input.autocomplete = 'off';
  input.required = true;
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn-primary';
  submit.textContent = 'Lås opp alle 46 timer';
  const status = document.createElement('p');
  status.className = isError ? 'license-status error' : 'license-status';
  status.setAttribute('role', 'status');
  status.textContent = initialMessage;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) return;
    submit.disabled = true;
    status.className = 'license-status';
    status.textContent = 'Kontrollerer skolekode …';
    try {
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.active) {
        status.className = 'license-status error';
        status.textContent = data.error || 'Ugyldig skolekode.';
        submit.disabled = false;
        return;
      }
      if (lockedNotice) lockedNotice.hidden = true;
      updateCardBadges(true);
      renderLicensePanel(data);
    } catch {
      status.className = 'license-status error';
      status.textContent = 'Fikk ikke kontakt med serveren. Prøv igjen.';
      submit.disabled = false;
    }
  });

  form.append(label, input, submit);
  licensePanel.append(title, desc, form, status);
}

async function initLicensePortal() {
  applyCatalogFilter();
  if (!window.location.protocol.startsWith('http')) return;

  const params = new URLSearchParams(window.location.search);
  const queryCode = params.get('kode');
  const lockedLesson = params.get('las');

  if (queryCode) {
    params.delete('kode');
    const cleanQuery = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
    try {
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: queryCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.active) {
        if (lockedNotice) lockedNotice.hidden = true;
        updateCardBadges(true);
        renderLicensePanel(data);
        return;
      }
      renderLicensePanel({ active: false }, data.error || 'Skolekoden i lenken var ugyldig eller utløpt.', true);
      return;
    } catch {}
  }

  try {
    const response = await fetch('/api/license/status', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return;
    const status = await response.json();
    updateCardBadges(Boolean(status.active));
    renderLicensePanel(status);
    if (!status.active && lockedLesson) {
      showLockedLessonBanner(lockedLesson);
    }
  } catch {
    // Plain static server without Express API routes; keep clean static portal.
  }
}

void initLicensePortal();
