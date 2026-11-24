const root = document.querySelector('#main');
const userArea = document.querySelector('#user-area');
const areas = { vocabulary: 'Ordforråd', grammar: 'Grammatikk', verbs: 'Verbbøying', listening: 'Lytting' };
let currentSession = null;
let logoutNotice = '';
let sessionWarningTimer = null;
let sessionWarningElement = null;
let lastSessionHeartbeat = 0;
const pendingHomeworkSubmissions = new Map();
const teacherIdleLimitMs = 30 * 60 * 1000;
const schoolAssignmentsHref = '/school?view=assignments';
const practiceHref = '/?school=start';
let priorityMount = null;

function schoolFeedRequest(path, signal) {
  return fetch(path, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal });
}

export async function isSchoolFeedStudent(signal) {
  if (!csrfToken()) return false;
  try {
    const response = await schoolFeedRequest('/api/session', signal);
    return response.ok && (await response.json()).role === 'student';
  } catch {
    return false;
  }
}

export function mountSchoolFeedPriority(container) {
  priorityMount?.dispose();
  const controller = new AbortController();
  const { signal } = controller;
  let refreshTimer;
  let expiresTimer;
  let pendingRefresh;
  let displayed = null;

  function show(assignments, student) {
    const now = Date.now();
    const candidates = assignments
      .filter(item => item.answered < item.questionCount && Date.parse(item.pinnedUntil) > now)
      .sort((a, b) => Date.parse(a.pinnedUntil) - Date.parse(b.pinnedUntil));
    const assignment = candidates[0];
    const key = student && (assignment ? `${assignment.id}:${assignment.pinnedUntil}:${assignment.answered}` : 'school');
    window.clearTimeout(expiresTimer);
    if (assignment) expiresTimer = window.setTimeout(() => show(assignments, student), Date.parse(assignment.pinnedUntil) - now);
    if (key === displayed) return;
    displayed = key;
    container.replaceChildren();
    if (assignment) {
      const card = node('section', null, { className: 'home-primary-action' });
      const copy = node('div', null, { className: 'home-primary-copy' });
      const remaining = assignment.questionCount - assignment.answered;
      copy.append(node('p', 'Fra læreren'), node('h2', assignment.title), node('p', `${assignment.className} – ${remaining} ${remaining === 1 ? 'oppgave' : 'oppgaver'} igjen`));
      const params = new URLSearchParams({ assignment: assignment.id });
      const action = assignment.answered ? 'Fortsett lekse' : 'Start lekse';
      card.append(copy, node('a', action, { className: 'btn btn-primary btn-large', href: `/school?${params}` }));
      container.append(card);
    }
    if (student) container.append(node('a', 'Mine lekser', { href: schoolAssignmentsHref, className: 'btn btn-secondary' }));
    container.hidden = !student;
  }

  async function refresh() {
    if (!container.isConnected) { priorityMount?.dispose(); return; }
    if (pendingRefresh || document.hidden || !navigator.onLine || container.parentElement.closest('.hidden, [hidden]')) return;
    const request = new AbortController();
    pendingRefresh = request;
    window.clearTimeout(refreshTimer);
    try {
      const response = await schoolFeedRequest('/api/assignments?studentFeed=1', request.signal);
      const data = response.ok ? await response.json() : {};
      if (!request.signal.aborted && navigator.onLine) show(data.assignments || [], response.ok);
    } catch {
      if (!request.signal.aborted) show([], false);
    } finally {
      if (pendingRefresh === request) {
        pendingRefresh = null;
        refreshTimer = window.setTimeout(refresh, 60_000);
      }
    }
  }

  function clear() {
    pendingRefresh?.abort();
    pendingRefresh = null;
    window.clearTimeout(refreshTimer);
    show([], false);
  }

  priorityMount = {
    dispose() {
      controller.abort();
      clear();
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
    else void refresh();
  }, { signal });
  window.addEventListener('focus', () => { void refresh(); }, { signal });
  window.addEventListener('pageshow', () => { void refresh(); }, { signal });
  window.addEventListener('pagehide', clear, { signal });
  window.addEventListener('online', () => { void refresh(); }, { signal });
  window.addEventListener('offline', clear, { signal });
  void refresh();
}

function armSessionWarning() {
  window.clearTimeout(sessionWarningTimer);
  sessionWarningElement?.remove();
  sessionWarningElement = null;
  if (!currentSession || !['teacher', 'school_admin'].includes(currentSession.role)) return;
  sessionWarningTimer = window.setTimeout(() => {
    sessionWarningElement = message(userArea, 'Økten utløper om omtrent fem minutter uten aktivitet. Lagre arbeidet og logg inn på nytt før du fortsetter.', 'banner');
  }, teacherIdleLimitMs - 5 * 60 * 1000);
}

async function refreshActiveSession({ force = false } = {}) {
  if (!currentSession) return;
  const now = Date.now();
  if (!force && now - lastSessionHeartbeat < 2 * 60 * 1000) return;
  lastSessionHeartbeat = now;
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401 || response.status === 403) {
      root.replaceChildren();
      userArea.replaceChildren();
      currentSession = null;
      location.assign('/school?timeout=1');
      return;
    }
    if (response.ok) {
      const latestSession = await response.json();
      if (latestSession.userId !== currentSession.userId || latestSession.role !== currentSession.role
          || latestSession.schoolId !== currentSession.schoolId) {
        const keepAssignmentList = new URLSearchParams(location.search).get('view') === 'assignments';
        root.replaceChildren();
        userArea.replaceChildren();
        currentSession = null;
        location.assign(keepAssignmentList ? schoolAssignmentsHref : '/school');
        return;
      }
      armSessionWarning();
    }
  } catch {}
}

function node(tag, text, attrs = {}) {
  const element = document.createElement(tag);
  if (text !== undefined && text !== null) element.textContent = String(text);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') element.className = value;
    else if (key === 'onClick') element.addEventListener('click', value);
    else if (key === 'disabled') element.disabled = Boolean(value);
    else if (key === 'checked') element.checked = Boolean(value);
    else if (key === 'value') element.value = value;
    else if (key === 'type') element.type = value;
    else if (key === 'name') element.name = value;
    else if (key === 'href') element.href = value;
    else if (key === 'method') element.method = value;
    else if (key === 'action') element.action = value;
    else if (key === 'required') element.required = Boolean(value);
    else if (key === 'min') element.min = value;
    else if (key === 'max') element.max = value;
    else if (key === 'step') element.step = value;
    else if (key === 'placeholder') element.placeholder = value;
    else if (key === 'ariaLabel') element.setAttribute('aria-label', value);
    else element.setAttribute(key, value);
  }
  return element;
}

function field(label, control) {
  const wrapper = node('label', null, { className: 'field' });
  wrapper.append(node('span', label), control);
  return wrapper;
}

function button(text, onClick, style = '') {
  return node('button', text, { className: `button ${style}`.trim(), type: 'button', onClick });
}

function message(target, text, kind = 'success') {
  const box = node('div', text, { className: kind, role: 'status' });
  target.prepend(box);
  return box;
}

function csrfToken() {
  const prefix = 'spansk_csrf';
  const cookie = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${prefix}=`) || part.startsWith(`${prefix}_dev=`) || part.startsWith(`__Host-${prefix}=`));
  return cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : '';
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken();
  const response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && pendingHomeworkSubmissions.size > 0) {
    throw Object.assign(new Error('Økten er utløpt. Logg inn på nytt for å lagre svaret.'), { reauthenticationRequired: true });
  }
  if (response.status === 401 || data.sessionRevoked) {
    root.replaceChildren();
    userArea.replaceChildren();
    currentSession = null;
    location.assign('/school?timeout=1');
    throw new Error('Økten eller skoletilgangen er avsluttet. Logg inn på nytt eller kontakt skolens administrator.');
  }
  if (data.reauthenticationRequired) {
    root.replaceChildren();
    userArea.replaceChildren();
    currentSession = null;
    location.assign('/school');
    throw new Error(data.error);
  }
  if (response.status !== 403) armSessionWarning();
  if (!response.ok) throw new Error(data.error || 'Noe gikk galt. Prøv igjen.');
  return data;
}

async function reauthenticateSameStudent(userId) {
  const popup = window.open('/auth/login', 'school-homework-reauth', 'popup,width=640,height=720');
  if (!popup) throw new Error('Nettleseren blokkerte innloggingsvinduet. Tillat popup-vinduet og prøv igjen.');
  const deadline = Date.now() + 2 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    let response;
    try { response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' }); }
    catch { continue; }
    if (!response.ok) continue;
    const session = await response.json();
    if (session.userId !== userId) {
      popup.close();
      throw Object.assign(new Error('En annen konto ble logget inn. Leksebesvarelsen ble ikke sendt til den kontoen.'), { differentAccount: true });
    }
    popup.close();
    return session;
  }
  if (!popup.closed) popup.close();
  throw new Error('Innloggingen ble ikke bekreftet. Leksebesvarelsen ligger fortsatt bare i minnet.');
}

function addLogout() {
  const form = node('form', null, { method: 'post', action: '/auth/logout' });
  const csrfInput = node('input', null, { type: 'hidden', name: 'csrfToken', value: csrfToken() });
  form.append(csrfInput);
  // Joining a class rotates the session and cookie without replacing this form.
  form.addEventListener('submit', () => { csrfInput.value = csrfToken(); });
  form.append(node('button', 'Logg ut', { className: 'button secondary', type: 'submit' }));
  const deleteAccount = button('Slett konto', async () => {
    const phrase = window.prompt('Dette sletter Feide-kontoens tilganger, lekseresultater og identitetskobling ved alle skoler. Handlingen kan ikke angres. Skriv SLETT KONTO for å fortsette.');
    if (phrase !== 'SLETT KONTO') return;
    try {
      await api('/api/account/delete', { method: 'POST', body: { confirmation: phrase } });
      location.assign('/school');
    } catch (error) { window.alert(error.message); }
  }, 'secondary');
  userArea.replaceChildren(node('span', currentSession.displayName, { className: 'muted' }), deleteAccount, form);
}

function loginView(localTest, requiredRole = null) {
  userArea.replaceChildren();
  const card = node('section', null, { className: 'card' });
  if (localTest) message(card, 'Lokal testmodus. Innloggingen bruker syntetiske testkontoer, ikke Feide.', 'banner');
  if (logoutNotice) message(card, logoutNotice, 'banner');
  if (requiredRole) message(card, 'Feide må bekrefte skolens sterkere innloggingsnivå før du får åpne lærer- eller administratorområdet.', 'banner');
  card.append(node('h1', 'Lekser i spansk, samlet på ett sted'), node('p', 'Læreren deler en digital lekse. Elevene øver i ordforråd, grammatikk, verbbøying og lytting. Læreren følger med på gjennomføring og faglig arbeid.', { className: 'lead' }));
  const level = requiredRole === 'school_admin' ? 'school_admin' : requiredRole === 'teacher' ? 'teacher' : '';
  const link = node('a', requiredRole ? 'Logg inn med sterkere Feide-nivå' : (localTest ? 'Åpne lokal testinnlogging' : 'Logg inn med Feide'), { className: 'button', href: level ? `/auth/login?level=${level}` : '/auth/login' });
  card.append(link, node('p', 'Fri øving uten konto er fortsatt tilgjengelig.', { className: 'muted' }));
  root.replaceChildren(card);
}

async function pendingView() {
  addLogout();
  const card = node('section', null, { className: 'card' });
  card.append(node('h1', 'Skoletilgang må godkjennes først'), node('p', 'Du trenger en engangskode fra skolens administrator før Feide-kontoen kan knyttes til skolen. Koden er personlig, utløper etter sju dager og kan bare brukes én gang.'));
  const form = node('form', null, { className: 'form-grid' });
  const code = node('input', null, { required: true, minlength: '20', maxlength: '100', autocomplete: 'off' });
  const status = node('div', null, { role: 'status' });
  form.append(field('Engangskode fra skolens administrator', code));
  form.append(button('Godta skoleinvitasjon', async () => {
    status.replaceChildren();
    try { await api('/api/join-school', { method: 'POST', body: { code: code.value.trim() } }); location.reload(); }
    catch (error) { message(status, error.message, 'error'); }
  }));
  card.append(form, status, node('p', 'Etter godkjenning kan administratoren gi deg lærerrolle. Elever får fortsatt bare tilgang til klassen gjennom en egen kode fra læreren.', { className: 'muted' }));
  root.replaceChildren(card);
}

async function loadSchoolAdmin() {
  addLogout();
  const page = node('div');
  page.append(node('h1', 'Skoleadministrasjon'), node('p', 'Gi lærerrolle bare til personer skolen har verifisert. Invitasjonskoden er en tilgangsfullmakt: del den direkte via en verifisert kanal.', { className: 'lead' }));
  const card = node('section', null, { className: 'card' });
  card.append(node('h2', 'Inviter en lærer'), node('p', 'Koden kan brukes én gang innen sju dager. Eleven og klassen får ingen tilgang gjennom denne invitasjonen.', { className: 'muted' }));
  const result = node('div', null, { role: 'status' });
  card.append(button('Lag lærerinvitasjon', async () => {
    result.replaceChildren();
    try {
      const invitation = await api('/api/school/teacher-invitations', { method: 'POST', body: {} });
      const code = node('strong', invitation.code);
      const revoke = button('Trekk tilbake invitasjonen', async () => {
        try { await api(`/api/school/teacher-invitations/${invitation.id}/revoke`, { method: 'POST', body: {} }); message(result, 'Invitasjonen er trukket tilbake.', 'success'); revoke.disabled = true; }
        catch (error) { message(result, error.message, 'error'); }
      }, 'secondary');
      result.append(node('p', invitation.note), node('p', null, { className: 'invite-code' }));
      result.lastChild.append(code);
      result.append(revoke);
    } catch (error) { message(result, error.message, 'error'); }
  }));
  card.append(result);
  page.append(card);

  const membersCard = node('section', null, { className: 'card' });
  membersCard.append(node('h2', 'Skolemedlemmer'), node('p', 'Fjerning stenger skoletilgang og aktive økter ved denne skolen. Tilgang ved andre skoler påvirkes ikke.', { className: 'muted' }));
  try {
    const { members = [] } = await api('/api/school/members');
    const list = node('ul', null, { className: 'list' });
    for (const member of members) {
      const row = node('li');
      const role = member.role === 'school_admin' ? 'skoleadministrator' : member.role === 'teacher' ? 'lærer' : 'elev';
      row.append(node('span', `${member.displayName} – ${role} – ${member.status === 'active' ? 'aktiv' : 'tilgang fjernet'}`));
      if (member.status === 'active' && member.userId !== currentSession.userId) {
        row.append(button('Fjern skoletilgang', async () => {
          if (!window.confirm(`Fjerne ${role.toLowerCase()} ${member.displayName} fra denne skolen? Klassemedlemskap, leksetilgang og økter ved skolen stenges.`)) return;
          try { await api(`/api/school/members/${member.userId}/revoke`, { method: 'POST', body: {} }); load(); }
          catch (error) { message(membersCard, error.message, 'error'); }
        }, 'secondary'));
      }
      list.append(row);
    }
    if (!members.length) list.append(node('li', 'Ingen skolemedlemmer er registrert.', { className: 'muted' }));
    membersCard.append(list);
  } catch (error) { message(membersCard, error.message, 'error'); }
  page.append(membersCard);
  root.replaceChildren(page);
}

async function chooseSchoolView() {
  addLogout();
  const { schools = [] } = await api('/api/session');
  const card = node('section', null, { className: 'card' });
  card.append(node('h1', 'Velg skole'), node('p', 'Velg en skole som allerede er knyttet til Feide-kontoen din.'));
  for (const school of schools) card.append(button(`${school.name} – ${school.role}`, async () => {
    try { await api('/api/select-school', { method: 'POST', body: { schoolId: school.id } }); location.reload(); }
    catch (error) { message(card, error.message, 'error'); }
  }));
  card.append(node('h2', 'Har du fått invitasjon som lærer?'));
  card.append(node('p', 'Skriv inn engangskoden fra den andre skolens administrator.'));
  const inviteCode = node('input', null, { minlength: '20', maxlength: '100', autocomplete: 'off' });
  card.append(field('Skoleinvitasjon', inviteCode));
  card.append(button('Godta skoleinvitasjon', async () => {
    try { await api('/api/join-school', { method: 'POST', body: { code: inviteCode.value.trim() } }); location.reload(); }
    catch (error) { message(card, error.message, 'error'); }
  }));
  root.replaceChildren(card);
}

async function loadTeacher() {
  addLogout();
  const [classData, activityData] = await Promise.all([api('/api/classes'), api('/api/activities')]);
  const page = node('div');
  page.append(node('h1', 'Læreroversikt'), node('p', 'Lag en klasse, inviter elever og gi dem digitale lekser. Følg gjennomføring og øving i fire fagområder.', { className: 'lead' }));

  const urlParams = new URLSearchParams(location.search);
  const classJoinCard = node('section', null, { className: 'card' });
  classJoinCard.append(node('h2', 'Bli med som medlærer'), node('p', 'Skriv inn engangskoden du fikk fra en lærer i klassen. Du får tilgang når læreren har godkjent forespørselen.', { className: 'muted' }));
  const classJoinCode = node('input', null, { minlength: '20', maxlength: '100', autocomplete: 'off', value: urlParams.get('joinCode') || '' });
  const classJoinStatus = node('div', null, { role: 'status' });
  classJoinCard.append(field('Klasseinvitasjon', classJoinCode));
  classJoinCard.append(button('Send forespørsel', async () => {
    try {
      await api('/api/join-class', { method: 'POST', body: { code: classJoinCode.value.trim() } });
      classJoinCode.value = '';
      message(classJoinStatus, 'Forespørselen er sendt. Klassen vises her når læreren har godkjent den.', 'success');
    } catch (error) { message(classJoinStatus, error.message, 'error'); }
  }));
  classJoinCard.append(classJoinStatus);
  page.append(classJoinCard);

  const classCard = node('section', null, { className: 'card' });
  classCard.append(node('h2', 'Klasser'));
  const classList = node('ul', null, { className: 'list' });
  const showInviteResult = (result) => {
    const box = message(classCard, `Invitasjonskode: ${result.code}. ${result.note}`, 'success');
    const joinUrl = `${location.origin}/school?joinCode=${encodeURIComponent(result.code)}`;
    if (navigator.clipboard?.writeText) {
      box.append(node('span', ' '), button('Kopier invitasjonslenke', async () => {
        try {
          await navigator.clipboard.writeText(joinUrl);
          message(classCard, 'Invitasjonslenken er kopiert til utklippstavlen.', 'success');
        } catch {}
      }, 'secondary'));
    }
  };
  for (const item of classData.classes) {
    const row = node('li');
    const detail = node('span', `${item.name}, skoleår ${item.schoolYear}, ${item.studentCount} elever`);
    const actions = node('div', null, { className: 'actions' });
    actions.append(button('Inviter elev', async () => {
      try { showInviteResult(await api(`/api/classes/${item.id}/invitations`, { method: 'POST', body: { role: 'student' } })); }
      catch (error) { message(classCard, error.message, 'error'); }
    }, 'secondary'));
    actions.append(button('Inviter medlærer', async () => {
      try { showInviteResult(await api(`/api/classes/${item.id}/invitations`, { method: 'POST', body: { role: 'teacher' } })); }
      catch (error) { message(classCard, error.message, 'error'); }
    }, 'secondary'));
    actions.append(button(`Forespørsler (${item.pendingMemberCount})`, () => showClassRequests(item, classCard), 'secondary'));
    actions.append(button('Se fremgang', () => showProgress(item), 'secondary'));
    row.append(detail, actions);
    classList.append(row);
  }
  if (!classData.classes.length) classList.append(node('li', 'Du har ikke opprettet noen klasser ennå.', { className: 'muted' }));
  classCard.append(classList);

  const createClass = node('form', null, { className: 'form-grid' });
  const className = node('input', null, { required: true, maxlength: '100', placeholder: 'For eksempel Spanskgruppe 1' });
  const year = new Date().getFullYear();
  const schoolYear = node('input', null, { required: true, value: `${year}-${year + 1}`, pattern: '\\d{4}(-\\d{4})?' });
  createClass.append(field('Klassenavn', className), field('Skoleår', schoolYear));
  createClass.append(button('Opprett klasse', async () => {
    try { await api('/api/classes', { method: 'POST', body: { name: className.value, schoolYear: schoolYear.value } }); location.reload(); }
    catch (error) { message(classCard, error.message, 'error'); }
  }));
  classCard.append(createClass);

  const assignmentCard = node('section', null, { className: 'card' });
  assignmentCard.append(node('h2', 'Gi en digital lekse'), node('p', 'Velg eksisterende oppgaver fra appen. Leksen deles med elevlisten slik den er når du publiserer.', { className: 'muted' }));
  const form = node('form', null, { className: 'form-grid' });
  const classSelect = node('select', null, { required: true });
  for (const item of classData.classes) classSelect.append(node('option', `${item.name}, ${item.studentCount} elever`, { value: item.id }));
  const activitySelect = node('select', null, { required: true });
  const preselectedActivity = urlParams.get('activity');
  for (const item of activityData.activities) {
    activitySelect.append(node('option', `${item.label} – ${item.title} (${item.questionCount} oppgaver)`, {
      value: item.id,
      ...(preselectedActivity === item.id ? { selected: 'selected' } : {}),
    }));
  }
  if (preselectedActivity && activityData.activities.some((item) => item.id === preselectedActivity)) {
    activitySelect.value = preselectedActivity;
  }
  const title = node('input', null, { required: true, maxlength: '120', placeholder: 'For eksempel Verb i presens', value: urlParams.get('title') || '' });
  const count = node('input', null, { type: 'number', required: true, min: '1', max: '50', value: '5' });
  const due = node('input', null, { type: 'date' });
  form.append(field('Klasse', classSelect), field('Øvingsområde og tema', activitySelect), field('Tittel på lekse', title), field('Antall oppgaver', count), field('Frist (valgfritt)', due));
  const publish = button('Publiser lekse', async () => {
    try {
      const dueAt = due.value ? new Date(`${due.value}T23:59:00`).toISOString() : undefined;
      const created = await api('/api/assignments', { method: 'POST', body: { classId: classSelect.value, activityId: activitySelect.value, title: title.value, questionCount: Number(count.value), ...(dueAt ? { dueAt } : {}) } });
      message(assignmentCard, `Leksen «${created.title}» er publisert til ${created.recipientCount} elever.`, 'success');
      await loadTeacherAssignments(currentWork, created.id);
    } catch (error) { message(assignmentCard, error.message, 'error'); }
  });
  form.append(publish);
  assignmentCard.append(form);

  const currentWork = node('section', null, { className: 'card' });
  currentWork.append(node('h2', 'Publiserte lekser'));
  await loadTeacherAssignments(currentWork);
  page.append(classCard, assignmentCard, currentWork);
  root.replaceChildren(page);
}

function localPinDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function teacherPinControl(assignment, currentWork) {
  const actions = node('div', null, { className: 'assignment-pin-actions' });
  const update = async (pinnedUntil, control) => {
    control.disabled = true;
    try {
      await api(`/api/assignments/${assignment.id}/pin`, { method: 'POST', body: { pinnedUntil } });
      await loadTeacherAssignments(currentWork, assignment.id);
      message(currentWork, pinnedUntil ? 'Leksen ligger øverst for klassen.' : 'Prioriteringen er opphevet.', 'success');
    } catch (error) {
      message(currentWork, error.message, 'error');
    } finally {
      control.disabled = false;
    }
  };
  if (Date.parse(assignment.pinnedUntil) > Date.now()) {
    const expiry = new Date(assignment.pinnedUntil).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const remove = button('Opphev prioritering', () => update(null, remove), 'secondary');
    actions.append(node('span', `Vises øverst til ${expiry}`, { className: 'muted' }), remove);
    return actions;
  }
  const now = Date.now();
  const until = node('input', null, {
    type: 'datetime-local', required: true,
    min: localPinDate(new Date(now + 60_000)),
    max: localPinDate(new Date(now + 24 * 60 * 60_000)),
    value: localPinDate(new Date(now + 60 * 60_000)),
  });
  until.addEventListener('input', () => until.setCustomValidity(''));
  const pin = button('Vis øverst i timen', () => {
    if (!until.reportValidity()) return;
    const deadline = new Date(until.value);
    const remaining = deadline.getTime() - Date.now();
    if (!(remaining > 0 && remaining <= 24 * 60 * 60_000) || localPinDate(deadline) !== until.value) {
      until.setCustomValidity('Velg et gyldig tidspunkt i løpet av de neste 24 timene.');
      until.reportValidity();
      return;
    }
    void update(deadline.toISOString(), pin);
  }, 'secondary');
  actions.append(field('Vis øverst fram til', until), pin);
  return actions;
}

async function loadTeacherAssignments(currentWork, focusId = null) {
  try {
    const data = await api('/api/assignments');
    const list = node('ul', null, { className: 'list' });
    let focusControl;
    for (const assignment of data.assignments) {
      const row = node('li');
      const info = node('div', null, { className: 'assignment-info' });
      info.append(node('strong', assignment.title), node('span', `${assignment.className} – ${areas[assignment.area]} – frist ${assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString('nb-NO') : 'ingen frist'}${assignment.contentAvailable ? '' : ' – innholdet må publiseres på nytt'}`));
      if (assignment.contentAvailable) {
        const control = teacherPinControl(assignment, currentWork);
        info.append(control);
        if (assignment.id === focusId) focusControl = control.querySelector('button');
      }
      row.append(info);
      row.append(button('Avslutt lekse', async () => {
        if (!window.confirm(`Avslutte «${assignment.title}»? Elevene får ikke lenger åpnet eller sendt svar på leksen.`)) return;
        try { await api(`/api/assignments/${assignment.id}/close`, { method: 'POST', body: {} }); location.reload(); }
        catch (error) { message(currentWork, error.message, 'error'); }
      }, 'secondary'));
      list.append(row);
    }
    if (!data.assignments.length) list.append(node('li', 'Ingen lekser er publisert ennå.', { className: 'muted' }));
    currentWork.replaceChildren(node('h2', 'Publiserte lekser'), list);
    focusControl?.focus();
  } catch (error) { message(currentWork, error.message, 'error'); }
}

function renderPeriodProgress(rows) {
  const section = node('section');
  const pupils = new Map();
  const questions = new Map();
  const byArea = new Map(Object.keys(areas).map(area => [area, { answered: 0, correct: 0 }]));
  let answered = 0;
  let correct = 0;
  for (const row of rows) {
    if (!pupils.has(row.studentId)) pupils.set(row.studentId, { name: row.name, results: [] });
    for (const answer of row.recent) {
      answered += 1;
      const area = byArea.get(row.area);
      area.answered += 1;
      if (answer.outcome === 'correct') {
        correct += 1;
        area.correct += 1;
      }
      pupils.get(row.studentId).results.push({ ...answer, title: row.title, area: row.area });
      const key = JSON.stringify([row.assignmentId, answer.id]);
      if (!questions.has(key)) questions.set(key, { prompt: answer.prompt, title: row.title, answered: 0, incorrect: 0 });
      const question = questions.get(key);
      question.answered += 1;
      if (answer.outcome === 'incorrect') question.incorrect += 1;
    }
  }

  const active = [...pupils.values()].filter(pupil => pupil.results.length).length;
  const metrics = node('div', null, { className: 'period-metrics' });
  for (const [label, value] of [
    ['Elever som har svart', `${active} av ${pupils.size}`],
    ['Oppgaver besvart', answered],
    ['Riktige ved siste forsøk', correct],
  ]) {
    const item = node('div');
    item.append(node('strong', value), node('span', label));
    metrics.append(item);
  }
  section.append(metrics);
  if (!rows.length) {
    section.append(node('p', 'Ingen aktive elevlekser å vise ennå.'));
    return section;
  }
  if (!answered) section.append(node('p', 'Ingen registrerte svar i denne perioden.'));
  section.append(node('h3', 'Resultater per fagområde'));
  const subjects = node('ul');
  for (const [area, totals] of byArea) {
    const result = totals.answered ? `${totals.correct} riktige av ${totals.answered} besvarte oppgaver` : 'Ingen svar i perioden';
    subjects.append(node('li', `${areas[area]}: ${result}`));
  }
  section.append(subjects);
  const missed = [...questions.values()].filter(item => item.incorrect).sort((a, b) => b.incorrect - a.incorrect);
  section.append(node('h3', 'Oppgaver å ta opp i timen'));
  if (missed.length) {
    const list = node('ul');
    for (const item of missed) {
      const entry = node('li');
      entry.append(node('strong', item.prompt ?? 'Oppgavetekst utilgjengelig'), node('p', `${item.title}: ${item.incorrect} av ${item.answered} som svarte, svarte feil ved siste forsøk.`));
      list.append(entry);
    }
    section.append(list);
  } else section.append(node('p', answered ? 'Ingen oppgaver med feil ved siste forsøk i perioden.' : 'Oppfølgingsbehov vises når det finnes svar.'));

  section.append(node('h3', 'Svar per elev'));
  for (const { name, results } of pupils.values()) {
    const detail = node('details', null, { className: 'pupil-progress' });
    detail.append(node('summary', `${name} – ${results.length ? `${results.length} besvart` : 'ingen svar i perioden'}`));
    if (results.length) {
      const list = node('ul');
      for (const answer of results) {
        const outcome = { correct: 'Riktig', incorrect: 'Feil', completed: 'Gjennomført' }[answer.outcome];
        list.append(node('li', `${areas[answer.area]} / ${answer.title}: ${answer.prompt ?? 'Oppgavetekst utilgjengelig'} – ${outcome}`));
      }
      detail.append(list);
    } else detail.append(node('p', 'Ingen svar på aktive lekser i valgt periode.'));
    section.append(detail);
  }
  return section;
}

async function showProgress(classInfo) {
  const card = node('section', null, { className: 'card' });
  root.querySelector('[data-class-progress]')?.remove();
  card.setAttribute('data-class-progress', '');
  const heading = node('h2', `Fremgang – ${classInfo.name}`, { tabindex: '-1' });
  const period = node('select');
  for (const days of [7, 30]) period.append(node('option', `Siste ${days} dager`, { value: days }));
  const output = node('div');
  const close = button('Lukk', () => card.remove(), 'secondary');
  card.append(close, heading, field('Periode', period),
    node('p', 'Oversikten gjelder elever med aktive, tildelte lekser. Hver oppgave teller én gang per elev og lekse i perioden, også når eleven prøver flere ganger.', { className: 'muted' }), output);
  root.prepend(card);
  heading.focus();
  let revision = 0;
  async function refresh() {
    const request = ++revision;
    output.replaceChildren(node('p', 'Henter resultater …', { role: 'status' }));
    try {
      const progress = await api(`/api/classes/${classInfo.id}/progress?days=${period.value}`);
      if (request !== revision || !card.isConnected) return;
      output.replaceChildren(renderPeriodProgress(progress.rows), node('h3', 'Samlet status for aktive lekser'),
        node('p', 'Gjennomføring og riktige svar gjelder hele lekseperioden.', { className: 'muted' }));
      const table = node('table');
      const head = node('thead');
      const header = node('tr');
      for (const label of ['Elev', 'Område', 'Lekse', 'Gjennomført', 'Riktige svar sist']) header.append(node('th', label));
      head.append(header);
      const body = node('tbody');
      for (const row of progress.rows) {
        const tr = node('tr');
        for (const value of [row.name, areas[row.area], row.title, `${row.attempted}/${row.total}`, row.attempted ? `${row.correct}/${row.attempted}` : 'Ingen svar']) tr.append(node('td', value));
        body.append(tr);
      }
      table.append(head, body);
      const wrap = node('div', null, { className: 'table-wrap' });
      wrap.append(table);
      output.append(wrap);
    } catch (error) {
      if (request === revision) {
        output.replaceChildren();
        message(output, error.message, 'error');
        output.append(button('Prøv igjen', refresh, 'secondary'));
      }
    }
  }
  period.addEventListener('change', refresh);
  await refresh();
  const exportButton = button('Eksporter klasseoversikt', async () => {
    try {
      const data = await api(`/api/classes/${classInfo.id}/export`, { method: 'POST', body: {} });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = node('a', null, { href: URL.createObjectURL(blob), download: `spansk123-klasseoversikt-${classInfo.name.replace(/[^a-z0-9-]/giu, '-')}.json` });
      link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      message(card, 'Eksporten er lastet ned på denne enheten.', 'success');
    } catch (error) { message(card, error.message, 'error'); }
  }, 'secondary');
  card.append(exportButton);
}

async function showClassRequests(classInfo, target) {
  try {
    const { requests = [] } = await api(`/api/classes/${classInfo.id}/requests`);
    const card = node('section', null, { className: 'card' });
    card.append(node('h2', `Elevforespørsler – ${classInfo.name}`));
    if (!requests.length) card.append(node('p', 'Ingen ventende elevforespørsler.', { className: 'muted' }));
    if (requests.length > 1) {
      const approveAllBtn = button(`Godkjenn alle ventende (${requests.length})`, async () => {
        approveAllBtn.disabled = true;
        try {
          for (const request of requests) {
            await api(`/api/classes/${classInfo.id}/members/${request.studentId}/approve`, { method: 'POST', body: {} });
          }
          await showClassRequests(classInfo, target);
        } catch (error) {
          approveAllBtn.disabled = false;
          message(card, error.message, 'error');
        }
      });
      card.append(approveAllBtn);
    }
    const list = node('ul', null, { className: 'list' });
    for (const request of requests) {
      const row = node('li');
      const roleLabel = request.role === 'teacher' ? 'Medlærer' : 'Elev';
      row.append(node('span', `${request.displayName} – ${roleLabel}`));
      row.append(button(`Godkjenn ${roleLabel.toLowerCase()}`, async () => {
        try { await api(`/api/classes/${classInfo.id}/members/${request.studentId}/approve`, { method: 'POST', body: {} }); await showClassRequests(classInfo, target); }
        catch (error) { message(card, error.message, 'error'); }
      }));
      row.append(button('Avslå', async () => {
        try { await api(`/api/classes/${classInfo.id}/members/${request.studentId}/revoke`, { method: 'POST', body: {} }); await showClassRequests(classInfo, target); }
        catch (error) { message(card, error.message, 'error'); }
      }, 'secondary'));
      list.append(row);
    }
    if (requests.length) card.append(list);
    target.replaceChildren(card);
  } catch (error) { message(target, error.message, 'error'); }
}

async function loadStudent(assignmentId = null) {
  addLogout();
  const urlParams = new URLSearchParams(location.search);
  const page = node('div');
  page.append(node('h1', 'Mine lekser'), node('p', 'Svarene lagres på serveren når du får kvitteringen «Lagret». Fri øving uten konto blir ikke delt med læreren.', { className: 'lead' }));
  page.append(node('a', 'Til anbefalt øving', { className: 'button secondary', href: practiceHref }));
  const listCard = node('section', null, { className: 'card' });
  listCard.append(node('h2', 'Tildelte lekser'));
  const classTools = node('section', null, { className: 'card student-tools' });
  classTools.append(node('h2', 'Klasse og egne data'));
  const invitationForm = node('form', null, { className: 'form-grid' });
  const invitationCode = node('input', null, { required: true, autocomplete: 'off', maxlength: '100', value: urlParams.get('joinCode') || '' });
  const invitationStatus = node('div');
  invitationForm.append(field('Engangskode fra spansklæreren', invitationCode));
  invitationForm.append(button('Bli med i klassen', async () => {
    invitationStatus.replaceChildren();
    try {
      await api('/api/join-class', { method: 'POST', body: { code: invitationCode.value.trim() } });
      invitationCode.value = '';
      message(invitationStatus, 'Forespørselen er sendt. Du får tilgang til klassens lekser når læreren har godkjent den.', 'success');
    }
    catch (error) { message(invitationStatus, error.message, 'error'); }
  }, 'secondary'));
  classTools.append(invitationForm, invitationStatus);
  classTools.append(button('Last ned egne øvingsdata', async () => {
    try {
      const data = await api('/api/me/export', { method: 'POST', body: {} });
      const link = node('a', null, { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), download: `spansk123-egne-ovingsdata-${new Date().toISOString().slice(0, 10)}.json` });
      link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      message(classTools, 'Dine øvingsdata er lastet ned på denne enheten.', 'success');
    } catch (error) { message(classTools, error.message, 'error'); }
  }, 'secondary'));
  try {
    const { assignments = [] } = await api('/api/assignments');
    const selected = assignmentId && assignments.find(assignment => assignment.id === assignmentId);
    if (selected) return openAssignment(selected, true);
    if (assignmentId) message(listCard, 'Leksen er ikke tilgjengelig. Du kan velge en annen lekse eller gå tilbake til anbefalt øving.', 'banner');
    const list = node('ul', null, { className: 'list' });
    for (const assignment of assignments) {
      const row = node('li');
      const info = node('div', null, { className: 'assignment-info' });
      info.append(node('strong', assignment.title));
      if (assignment.className) info.append(node('span', assignment.className));
      info.append(node('span', `${areas[assignment.area]} – ${assignment.answered}/${assignment.questionCount} besvart${assignment.dueAt ? ` – frist ${new Date(assignment.dueAt).toLocaleDateString('nb-NO')}` : ''}`, { className: 'muted' }));
      let action = 'Fortsett';
      if (assignment.answered === 0) action = 'Start lekse';
      else if (assignment.answered >= assignment.questionCount) action = 'Se lekse';
      row.append(info, button(action, () => openAssignment(assignment)));
      list.append(row);
    }
    if (!assignments.length) list.append(node('li', 'Læreren har ikke delt noen lekser med deg ennå.', { className: 'muted' }));
    listCard.append(list);
  } catch (error) { message(listCard, error.message, 'error'); }
  page.append(listCard, classTools);
  root.replaceChildren(page);
}

async function openAssignment(item, fromPractice = false) {
  root.replaceChildren(node('p', 'Åpner leksen …'));
  let data;
  try { data = await api(`/api/assignments/${item.id}`); }
  catch (error) {
    if (currentSession) {
      await loadStudent();
      message(root, error.message, 'error');
    }
    return;
  }
  const { assignment, exercise, answers } = data;
  const prior = new Map();
  for (const answer of answers) prior.set(answer.question_id, answer);
  let position = exercise.questions.findIndex((question) => !prior.has(question.id) || prior.get(question.id).outcome !== 'correct');
  if (prior.size === exercise.questions.length || position < 0) position = exercise.questions.length;
  const card = node('section', null, { className: 'card homework-card' });
  const back = button(fromPractice ? '← Anbefalt øving' : '← Mine lekser', () => {
    const pendingKey = `${assignment.id}:${exercise.questions[position]?.id}`;
    if (pendingHomeworkSubmissions.has(pendingKey)) {
      if (!window.confirm('Svaret er ikke bekreftet lagret. Hvis du går ut nå, kan det gå tapt. Vil du forkaste det og gå tilbake?')) return;
      pendingHomeworkSubmissions.delete(pendingKey);
    }
    if (fromPractice) location.assign(practiceHref);
    else loadStudent();
  }, 'secondary');
  const progress = node('p', null, { className: 'muted' });
  const updateProgress = () => { progress.textContent = `${areas[assignment.area]} – ${prior.size}/${exercise.questionCount} besvart`; };
  updateProgress();
  card.append(back, node('h1', assignment.title), progress);
  if (exercise.audio) {
    card.append(node('p', 'Lytt til lydfilen før du svarer. Hvis lyd ikke kan spilles av, si fra til læreren.'), node('audio', null, { controls: true, preload: 'metadata', src: exercise.audio, ariaLabel: 'Lyd til lytteoppgaven' }));
  }
  const interaction = node('div');
  card.append(interaction);
  root.replaceChildren(card);

  const render = (newAttempt = false) => {
    interaction.replaceChildren();
    if (position >= exercise.questions.length) {
      const done = node('h2', 'Leksen er gjennomført', { tabindex: '-1' });
      interaction.append(done, node('p', `${prior.size} ${prior.size === 1 ? 'oppgave' : 'oppgaver'} er lagret. Du kan fortsette å øve når du vil.`),
        fromPractice
          ? node('a', 'Fortsett med anbefalt øving', { className: 'button', href: practiceHref })
          : button('Tilbake til Mine lekser', () => loadStudent()));
      const retryIndex = exercise.questions.findIndex(question => prior.get(question.id)?.outcome === 'incorrect');
      if (retryIndex >= 0) {
        interaction.append(button('Øv igjen på feil svar', () => { position = retryIndex; render(true); }, 'secondary'));
      }
      done.focus();
      return;
    }
    const question = exercise.questions[position];
    const pendingKey = `${assignment.id}:${question.id}`;
    const pendingSubmission = pendingHomeworkSubmissions.get(pendingKey);
    const oldAnswer = prior.get(question.id);
    const number = node('p', `Oppgave ${position + 1} av ${exercise.questionCount}`, { className: 'question-number' });
    const [sentence, ...translation] = assignment.area === 'grammar' ? question.prompt.split('\n') : [question.prompt];
    const heading = node('h2', sentence, { className: 'question-prompt', tabindex: '-1' });
    if (assignment.area === 'grammar') heading.lang = 'es';
    interaction.append(number, heading);
    if (translation.length) interaction.append(node('p', translation.join('\n'), { className: 'question-meaning' }));
    const fieldset = node('fieldset', null, { className: 'answer-list' });
    fieldset.append(node('legend', 'Velg ett svar'));
    let selected = '';
    let typingMode = Boolean(pendingSubmission?.textAnswer);
    let typedText = pendingSubmission?.textAnswer || '';
    for (const option of question.options) {
      const radio = node('input', null, { type: 'radio', name: 'answer', value: option.id });
      radio.checked = pendingSubmission?.answerId === option.id;
      radio.disabled = Boolean(pendingSubmission);
      radio.addEventListener('change', () => { selected = option.id; submit.disabled = false; });
      const label = node('label', null, { className: 'answer-option' });
      label.append(radio, node('span', option.text));
      fieldset.append(label);
    }
    const textWrap = node('div', null, { className: 'form-grid' });
    const textInput = node('input', null, {
      type: 'text',
      maxlength: '160',
      autocomplete: 'off',
      lang: 'es',
      placeholder: 'Skriv svaret på spansk',
      value: typedText,
      disabled: Boolean(pendingSubmission),
    });
    textInput.addEventListener('input', () => {
      typedText = textInput.value;
      submit.disabled = !typedText.trim();
    });
    const accentRow = node('div', null, { className: 'actions' });
    for (const ch of ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡']) {
      accentRow.append(button(ch, () => {
        if (textInput.disabled) return;
        const start = textInput.selectionStart ?? textInput.value.length;
        const end = textInput.selectionEnd ?? textInput.value.length;
        textInput.value = `${textInput.value.slice(0, start)}${ch}${textInput.value.slice(end)}`;
        typedText = textInput.value;
        textInput.focus();
        textInput.setSelectionRange(start + ch.length, start + ch.length);
        submit.disabled = !typedText.trim();
      }, 'secondary'));
    }
    textWrap.append(field('Skriv svaret på spansk', textInput), accentRow);
    textWrap.hidden = !typingMode;
    fieldset.hidden = typingMode;

    let modeToggle = null;
    if (assignment.area !== 'listening') {
      modeToggle = button(typingMode ? 'Velg blant alternativer' : 'Skriv svaret selv', () => {
        if (pendingSubmission) return;
        typingMode = !typingMode;
        fieldset.hidden = typingMode;
        textWrap.hidden = !typingMode;
        modeToggle.textContent = typingMode ? 'Velg blant alternativer' : 'Skriv svaret selv';
        submit.disabled = typingMode ? !typedText.trim() : !selected;
        if (typingMode) textInput.focus();
      }, 'secondary');
      interaction.append(modeToggle);
    }

    const feedback = node('div');
    const actions = node('div', null, { className: 'homework-actions' });
    const nextLabel = position + 1 < exercise.questions.length ? 'Neste oppgave' : 'Se resultat';
    const goForward = () => { position += 1; render(); };
    const showReceipt = (outcome, explanation) => {
      const correct = outcome === 'correct';
      fieldset.disabled = true;
      textInput.disabled = true;
      if (modeToggle) modeToggle.disabled = true;
      feedback.replaceChildren();
      const receipt = message(feedback, `${correct ? 'Riktig.' : 'Ikke helt.'} ${explanation}`.trim(), correct ? 'success' : 'banner');
      receipt.append(node('span', 'Svar lagret.', { className: 'save-receipt' }));
      const advance = correct ? button(nextLabel, goForward) : button('Prøv et nytt svar', () => render(true));
      actions.replaceChildren(advance);
      if (!correct) actions.append(button(nextLabel, goForward, 'secondary'));
      advance.focus();
    };
    const submitAnswerPayload = (submission) => ({
      eventId: submission.eventId,
      practiceSession: data.practiceSession,
      questionId: question.id,
      ...(submission.textAnswer ? { textAnswer: submission.textAnswer } : { answerId: submission.answerId }),
    });
    const submit = button(pendingSubmission ? 'Prøv å lagre igjen' : 'Sjekk svaret', async () => {
      submit.disabled = true;
      feedback.replaceChildren();
      const existing = pendingHomeworkSubmissions.get(pendingKey);
      const currentPayload = typingMode ? { textAnswer: typedText.trim() } : { answerId: selected };
      const submission = existing || { eventId: crypto.randomUUID(), ...currentPayload, userId: currentSession?.userId };
      if (existing && (( !typingMode && selected && selected !== existing.answerId ) || ( typingMode && typedText.trim() && typedText.trim() !== existing.textAnswer ))) {
        message(feedback, 'Prøv først å lagre det samme svaret på nytt. Du kan endre svaret når lagringen er bekreftet.', 'error');
        submit.disabled = false;
        return;
      }
      pendingHomeworkSubmissions.set(pendingKey, submission);
      fieldset.disabled = true;
      textInput.disabled = true;
      if (modeToggle) modeToggle.disabled = true;
      try {
        const result = await api(`/api/assignments/${assignment.id}/answers`, { method: 'POST', body: submitAnswerPayload(submission) });
        pendingHomeworkSubmissions.delete(pendingKey);
        prior.set(question.id, { question_id: question.id, outcome: result.outcome });
        updateProgress();
        showReceipt(result.outcome, result.explanation || '');
      } catch (error) {
        if (error.reauthenticationRequired && submission.userId) {
          currentSession = null;
          userArea.replaceChildren();
          const recovery = node('section', null, { className: 'card' });
          recovery.append(node('h1', 'Leksebesvarelsen venter i minnet'), node('p', 'Logg inn med samme Feide-konto i et nytt vindu. Svaret blir ikke sendt før den opprinnelige kontoen er bekreftet.'));
          const recover = button('Logg inn igjen og lagre', async () => {
            recover.disabled = true;
            try {
              currentSession = await reauthenticateSameStudent(submission.userId);
              armSessionWarning();
              addLogout();
              const result = await api(`/api/assignments/${assignment.id}/answers`, { method: 'POST', body: submitAnswerPayload(submission) });
              pendingHomeworkSubmissions.delete(pendingKey);
              prior.set(question.id, { question_id: question.id, outcome: result.outcome });
              await openAssignment(item, fromPractice);
            } catch (reauthError) {
              recover.disabled = false;
              recovery.replaceChildren(node('h1', 'Leksebesvarelsen venter i minnet'), node('p', reauthError.message));
              recovery.append(button('Forkast svaret og fortsett med innlogget konto', () => {
                if (!window.confirm('Dette forkaster et ukvittert svar. Vil du fortsette?')) return;
                pendingHomeworkSubmissions.delete(pendingKey);
                load();
              }, 'secondary'));
              if (!reauthError.differentAccount) recovery.append(button('Prøv innlogging igjen', () => recover.click(), 'secondary'));
            }
          });
          recovery.append(recover);
          root.replaceChildren(recovery);
          return;
        }
        const detail = error instanceof TypeError ? '' : ` ${error.message}`;
        message(feedback, `Svaret er ikke bekreftet lagret.${detail} Prøv å lagre samme svar igjen.`, 'error');
        submit.textContent = 'Prøv å lagre igjen';
        submit.disabled = false;
        submit.focus();
      }
    });
    submit.disabled = !pendingSubmission;
    actions.append(submit);
    interaction.append(fieldset, textWrap, feedback, actions);
    if (oldAnswer && !newAttempt && !pendingSubmission) {
      showReceipt(oldAnswer.outcome, '');
    } else if (newAttempt) {
      fieldset.querySelector('input').focus();
    } else {
      heading.focus();
    }
  };
  render();
}

async function load() {
  try {
    const mode = await fetch('/api/runtime-mode', { cache: 'no-store' }).then((response) => response.json());
    const logoutState = new URLSearchParams(location.search).get('logout');
    const timedOut = new URLSearchParams(location.search).get('timeout');
    if (logoutState === 'local') logoutNotice = 'Den lokale økten er avsluttet. Feide-utloggingen kunne ikke bekreftes.';
    if (timedOut) logoutNotice = 'Økten eller skoletilgangen ble avsluttet. Logg inn på nytt eller kontakt skolens administrator.';
    if (logoutState || timedOut) history.replaceState(null, '', '/school');
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) return loginView(mode.localOidcTest);
    if (response.status === 403) {
      const denied = await response.json().catch(() => ({}));
      return loginView(mode.localOidcTest, denied.reauthenticationRequired ? denied.reauthenticationRole : null);
    }
    const data = await response.json();
    currentSession = data;
    armSessionWarning();
    if (data.role === 'pending') return pendingView();
    if (data.role === 'select_school') return chooseSchoolView();
    if (data.role === 'teacher') return loadTeacher();
    if (data.role === 'student') {
      const params = new URLSearchParams(location.search);
      const assignmentId = params.get('assignment');
      if (location.pathname === '/school' && !assignmentId && !params.get('joinCode') && params.get('view') !== 'assignments') {
        location.replace(practiceHref);
        return;
      }
      return loadStudent(assignmentId);
    }
    if (data.role === 'school_admin') return loadSchoolAdmin();
    return loginView(mode.localOidcTest);
  } catch (error) {
    root.replaceChildren(node('section', null, { className: 'card' }), node('p', 'Vi fikk ikke kontakt med skoleområdet. Kontroller nettforbindelsen og prøv igjen.'));
  }
}

if (root && userArea) {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  });
  window.addEventListener('beforeunload', (event) => {
    if (pendingHomeworkSubmissions.size === 0) return;
    event.preventDefault();
    event.returnValue = '';
  });
  void load();
  for (const eventName of ['pointerdown', 'keydown', 'touchstart']) {
    document.addEventListener(eventName, () => { void refreshActiveSession(); }, { passive: true });
  }
  window.setInterval(() => { void refreshActiveSession(); }, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refreshActiveSession({ force: true });
  });
}
