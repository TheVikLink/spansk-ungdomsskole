const copyBtn = document.querySelector('[data-copy-student-link]');
const qrBtn = document.querySelector('[data-open-qr]');
const boardBtn = document.querySelector('[data-open-board]');
const statusEl = document.querySelector('[data-student-link-status]');

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  return false;
}

async function resolveStudentLessonUrl(lessonId, isFree) {
  let targetUrl = new URL('elev.html', window.location.href).href;
  let expiresNote = '';
  if (!isFree && window.location.protocol.startsWith('http')) {
    const response = await fetch('/api/license/student-link', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ lessonId }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.url) targetUrl = new URL(data.url, window.location.origin).href;
      if (data?.expiresAt) expiresNote = `, gyldig til ${data.expiresAt}`;
    }
  }
  return { url: targetUrl, expiresNote };
}

if (copyBtn && statusEl) {
  copyBtn.addEventListener('click', async () => {
    const lessonId = copyBtn.dataset.lessonId || '';
    const isFree = copyBtn.dataset.free === 'true';
    copyBtn.disabled = true;
    statusEl.textContent = 'Lager elevlenke …';
    try {
      const { url, expiresNote } = await resolveStudentLessonUrl(lessonId, isFree);
      const copied = await copyText(url);
      statusEl.textContent = copied
        ? `Elevlenke kopiert (uten fasit${expiresNote}).`
        : `Kopier elevlenken (uten fasit${expiresNote}): ${url}`;
    } catch {
      const fallbackUrl = new URL('elev.html', window.location.href).href;
      const copied = await copyText(fallbackUrl);
      statusEl.textContent = copied
        ? 'Elevlenke kopiert (uten fasit).'
        : `Kopier elevlenken (uten fasit): ${fallbackUrl}`;
    } finally {
      copyBtn.disabled = false;
    }
  });
}

function bindAudioControls(audio, rootEl) {
  if (!audio || !rootEl) return;
  const speedButtons = [...rootEl.querySelectorAll('button[data-rate]')];
  const syncPressed = (rate) => {
    for (const candidate of speedButtons) {
      candidate.setAttribute('aria-pressed', Number(candidate.dataset.rate) === rate ? 'true' : 'false');
    }
  };
  for (const btn of speedButtons) {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.rate) || 1;
      audio.playbackRate = rate;
      audio.defaultPlaybackRate = rate;
      syncPressed(rate);
      document.querySelectorAll('[data-audio-speed] button[data-rate]').forEach((el) => {
        el.setAttribute('aria-pressed', Number(el.dataset.rate) === rate ? 'true' : 'false');
      });
    });
  }
  const backBtn = rootEl.querySelector('[data-audio-back]');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const delta = Number(backBtn.dataset.audioBack) || -5;
      audio.currentTime = Math.max(0, (audio.currentTime || 0) + delta);
    });
  }
  const restartBtn = rootEl.querySelector('[data-audio-restart]');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play?.().catch(() => {});
    });
  }
}

const pageAudio = document.querySelector('audio');
const pageSpeedGroup = document.querySelector('[data-audio-speed]');
bindAudioControls(pageAudio, pageSpeedGroup);

// ============================================
// LOCAL SVG QR CODE GENERATOR (Versions 1-12, ECC L, Byte mode)
// ============================================

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let value = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = value;
    GF_LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsComputeEcc(data, eccLen) {
  const gen = rsGeneratorPoly(eccLen);
  const res = new Uint8Array(eccLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[eccLen - 1] = 0;
    for (let j = 0; j < eccLen; j++) {
      res[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return res;
}

// Version 1-12 ECC Level L specs: [totalDataBytes, [[count, dataPerBlock, eccPerBlock], ...]]
const QR_SPECS_L = [
  null,
  [19, [[1, 19, 7]]],
  [34, [[1, 34, 10]]],
  [55, [[1, 55, 15]]],
  [80, [[1, 80, 20]]],
  [108, [[1, 108, 26]]],
  [136, [[2, 68, 18]]],
  [156, [[2, 78, 20]]],
  [194, [[2, 97, 24]]],
  [232, [[2, 116, 30]]],
  [274, [[2, 68, 18], [2, 69, 18]]],
  [324, [[4, 81, 20]]],
  [370, [[2, 92, 24], [2, 93, 24]]],
];

const QR_ALIGN_COORDS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
];

function computeBch(value, poly, dataBits, totalBits) {
  let rem = value << (totalBits - dataBits);
  const polyShift = totalBits - dataBits;
  for (let bit = totalBits - 1; bit >= polyShift; bit--) {
    if ((rem >> bit) & 1) {
      rem ^= poly << (bit - polyShift);
    }
  }
  return (value << polyShift) | rem;
}

function encodeQrCodewords(bytes) {
  let version = -1;
  for (let v = 1; v < QR_SPECS_L.length; v++) {
    const countBits = v <= 9 ? 8 : 16;
    const totalBits = QR_SPECS_L[v][0] * 8;
    if (4 + countBits + bytes.length * 8 <= totalBits) {
      version = v;
      break;
    }
  }
  if (version < 0) return null;

  const [totalDataBytes, blockGroups] = QR_SPECS_L[version];
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  for (const byte of bytes) pushBits(byte, 8);

  const maxBits = totalDataBytes * 8;
  const terminatorLen = Math.min(4, maxBits - bits.length);
  pushBits(0, terminatorLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }
  const padBytes = [0xec, 0x11];
  for (let p = 0; dataBytes.length < totalDataBytes; p++) {
    dataBytes.push(padBytes[p % 2]);
  }

  const blocks = [];
  let offset = 0;
  for (const [count, dataLen, eccLen] of blockGroups) {
    for (let i = 0; i < count; i++) {
      const slice = dataBytes.slice(offset, offset + dataLen);
      offset += dataLen;
      blocks.push({ data: slice, ecc: rsComputeEcc(slice, eccLen) });
    }
  }

  const interleaved = [];
  const maxDataLen = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blocks) if (i < b.data.length) interleaved.push(b.data[i]);
  }
  const eccLen = blocks[0].ecc.length;
  for (let i = 0; i < eccLen; i++) {
    for (const b of blocks) interleaved.push(b.ecc[i]);
  }
  return { version, codewords: interleaved };
}

function buildQrMatrix(text) {
  const bytes = new TextEncoder().encode(text);
  const encoded = encodeQrCodewords(bytes);
  if (!encoded) return null;

  const { version, codewords } = encoded;
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Uint8Array(size));
  const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

  const setFn = (r, c, dark) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    modules[r][c] = dark ? 1 : 0;
    isFunction[r][c] = 1;
  };

  const placeFinder = (row, col) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const inOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const isDark = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (inOuter || inInner);
        setFn(r, c, isDark);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns
  const coords = QR_ALIGN_COORDS[version];
  for (const rCenter of coords) {
    for (const cCenter of coords) {
      if ((rCenter <= 8 && cCenter <= 8)
        || (rCenter <= 8 && cCenter >= size - 9)
        || (rCenter >= size - 9 && cCenter <= 8)) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.max(Math.abs(dr), Math.abs(dc)) === 2 || (dr === 0 && dc === 0);
          setFn(rCenter + dr, cCenter + dc, isDark);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Dark module
  setFn(size - 8, 8, true);

  // Reserve format info
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = 1;
      isFunction[i][8] = 1;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = 1;
    if (i < 7) isFunction[size - 1 - i][8] = 1;
  }

  // Version info (V7+)
  if (version >= 7) {
    const versionBits = computeBch(version, 0x1f25, 6, 18);
    for (let i = 0; i < 18; i++) {
      const bit = (versionBits >> i) & 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, bit);
      setFn(b, a, bit);
    }
  }

  // Place data bits
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = rightCol - dx;
        if (isFunction[r][c]) continue;
        let dark = 0;
        if (bitIdx < totalBits) {
          dark = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
          bitIdx++;
        }
        modules[r][c] = dark;
      }
    }
    upward = !upward;
  }

  const masks = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => ((r >> 1) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  const writeFormat = (grid, maskId) => {
    const formatInfo = computeBch((0b01 << 3) | maskId, 0x537, 5, 15) ^ 0x5412;
    for (let i = 0; i < 15; i++) {
      const bit = (formatInfo >> i) & 1;
      if (i < 6) grid[i][8] = bit;
      else if (i < 8) grid[i + 1][8] = bit;
      else grid[size - 15 + i][8] = bit;

      if (i < 8) grid[8][size - 1 - i] = bit;
      else if (i < 9) grid[8][15 - i] = bit;
      else grid[8][14 - i] = bit;
    }
  };

  const scoreGrid = (grid) => {
    let penalty = 0;
    // N1: 5+ adjacent modules of same color
    for (let r = 0; r < size; r++) {
      let runLen = 1;
      let colRunLen = 1;
      for (let c = 1; c < size; c++) {
        if (grid[r][c] === grid[r][c - 1]) runLen++;
        else {
          if (runLen >= 5) penalty += 3 + (runLen - 5);
          runLen = 1;
        }
        if (grid[c][r] === grid[c - 1][r]) colRunLen++;
        else {
          if (colRunLen >= 5) penalty += 3 + (colRunLen - 5);
          colRunLen = 1;
        }
      }
      if (runLen >= 5) penalty += 3 + (runLen - 5);
      if (colRunLen >= 5) penalty += 3 + (colRunLen - 5);
    }
    // N2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const sum = grid[r][c] + grid[r][c + 1] + grid[r + 1][c] + grid[r + 1][c + 1];
        if (sum === 0 || sum === 4) penalty += 3;
      }
    }
    // N3: finder-like 1:1:3:1:1 patterns
    const matchFinderSeq = (arr, idx) => (
      (arr[idx] && !arr[idx + 1] && arr[idx + 2] && arr[idx + 3] && arr[idx + 4] && !arr[idx + 5] && arr[idx + 6])
      && ((idx >= 4 && !arr[idx - 1] && !arr[idx - 2] && !arr[idx - 3] && !arr[idx - 4])
        || (idx + 10 < size && !arr[idx + 7] && !arr[idx + 8] && !arr[idx + 9] && !arr[idx + 10]))
    );
    for (let i = 0; i < size; i++) {
      const row = grid[i];
      const col = grid.map((r) => r[i]);
      for (let k = 0; k <= size - 7; k++) {
        if (matchFinderSeq(row, k)) penalty += 40;
        if (matchFinderSeq(col, k)) penalty += 40;
      }
    }
    // N4: dark ratio
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) darkCount += grid[r][c];
    }
    const percent = (darkCount * 100) / (size * size);
    const prevFive = Math.floor(Math.abs(percent - 50) / 5);
    penalty += prevFive * 10;
    return penalty;
  };

  let bestGrid = null;
  let bestScore = Infinity;
  for (let maskId = 0; maskId < 8; maskId++) {
    const candidate = modules.map((row, r) => row.map((cell, c) => (
      isFunction[r][c] ? cell : (cell ^ (masks[maskId](r, c) ? 1 : 0))
    )));
    writeFormat(candidate, maskId);
    const s = scoreGrid(candidate);
    if (s < bestScore) {
      bestScore = s;
      bestGrid = candidate;
    }
  }
  return bestGrid;
}

function createQrSvgElement(text) {
  const matrix = buildQrMatrix(text);
  if (!matrix) return null;
  const size = matrix.length;
  const quiet = 4;
  const total = size + quiet * 2;
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', `0 0 ${total} ${total}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR-kode til elevsiden');
  svg.setAttribute('shape-rendering', 'crispEdges');

  const bg = document.createElementNS(svgNs, 'rect');
  bg.setAttribute('width', String(total));
  bg.setAttribute('height', String(total));
  bg.setAttribute('fill', '#ffffff');
  svg.append(bg);

  let d = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        d += `M${c + quiet},${r + quiet}h1v1h-1z`;
      }
    }
  }
  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#111827');
  svg.append(path);
  return svg;
}

function getLessonQrSource() {
  const sourceBtn = qrBtn || copyBtn;
  return {
    lessonId: sourceBtn?.dataset.lessonId || '',
    isFree: sourceBtn?.dataset.free === 'true',
  };
}

async function openQrModal(triggerEl) {
  const { lessonId, isFree } = getLessonQrSource();
  const returnFocus = triggerEl || document.activeElement;
  document.getElementById('qrModalOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qrModalOverlay';
  overlay.className = 'qr-modal-overlay';

  const card = document.createElement('div');
  card.className = 'qr-modal-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'qrModalTitle');

  const header = document.createElement('div');
  header.className = 'qr-modal-head';
  const lessonTitle = document.querySelector('header h1')?.textContent?.trim() || 'Elevside';
  const heading = document.createElement('h2');
  heading.id = 'qrModalTitle';
  heading.textContent = `QR-kode: ${lessonTitle}`;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-secondary';
  closeBtn.textContent = 'Lukk';
  header.append(heading, closeBtn);

  const hint = document.createElement('p');
  hint.textContent = 'Elevene skanner koden med mobil eller Chromebook for å åpne elevsiden direkte uten fasit.';

  const svgWrap = document.createElement('div');
  svgWrap.className = 'qr-svg-wrap';
  svgWrap.textContent = 'Lager QR-kode …';

  const actions = document.createElement('div');
  actions.className = 'package-actions';
  const copyModalBtn = document.createElement('button');
  copyModalBtn.type = 'button';
  copyModalBtn.className = 'btn-primary';
  copyModalBtn.textContent = 'Kopier elevlenke';
  const modalStatus = document.createElement('p');
  modalStatus.className = 'toolbar-status';
  modalStatus.setAttribute('role', 'status');

  const closeModal = () => {
    document.removeEventListener('keydown', onKeyDown, true);
    overlay.remove();
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', onKeyDown, true);

  actions.append(copyModalBtn);
  card.append(header, hint, svgWrap, actions, modalStatus);
  overlay.append(card);
  document.body.append(overlay);
  closeBtn.focus();

  let targetUrl = new URL('elev.html', window.location.href).href;
  let expiresNote = '';
  try {
    const resolved = await resolveStudentLessonUrl(lessonId, isFree);
    targetUrl = resolved.url;
    expiresNote = resolved.expiresNote;
  } catch {}

  const svg = createQrSvgElement(targetUrl);
  svgWrap.replaceChildren();
  if (svg) {
    svgWrap.append(svg);
  } else {
    svgWrap.textContent = 'Lenken ble for lang for QR-koden. Bruk «Kopier elevlenke» under.';
  }

  copyModalBtn.addEventListener('click', async () => {
    const copied = await copyText(targetUrl);
    modalStatus.textContent = copied
      ? `Elevlenke kopiert (uten fasit${expiresNote}).`
      : `Kopier elevlenken: ${targetUrl}`;
  });
}

if (qrBtn) {
  qrBtn.addEventListener('click', () => {
    void openQrModal(qrBtn);
  });
}

// ============================================
// TAVLEMODUS / PROSJEKTORVISNING MED NEDTELLINGSTIMER
// ============================================

function collectBoardSteps() {
  const title = document.querySelector('header h1')?.textContent?.trim() || 'Undervisningstime';
  const goal = document.querySelector('header p:last-of-type')?.textContent?.trim() || '';

  const vocabItems = [...document.querySelectorAll('#steg-1 .lesson-vocab-chips li')].map((li) => li.textContent.trim()).filter(Boolean);
  const writingPrompts = [...document.querySelectorAll('#steg-2 ol li')].map((li) => li.textContent.trim()).filter(Boolean);
  const exampleAnswers = [...document.querySelectorAll('#steg-2 details div[lang="es"] li')].map((li) => li.textContent.trim()).filter(Boolean);
  const listeningQuestions = [...document.querySelectorAll('#steg-3 ol li')].map((li) => li.textContent.trim()).filter(Boolean);
  const retrievalText = document.querySelector('#steg-5 p')?.textContent?.trim() || 'Legg bort kortene og si én ny setning med to av ordene.';

  const minutesFor = (id, fallback) => {
    const raw = Number(document.getElementById(id)?.dataset.stepMinutes);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  };

  return [
    {
      id: 'steg-1',
      label: '1. Gloser',
      minutes: minutesFor('steg-1', 10),
      render(bodyEl) {
        const intro = document.createElement('p');
        intro.className = 'board-lead';
        intro.textContent = goal;
        const chips = document.createElement('ul');
        chips.className = 'board-vocab-grid';
        chips.lang = 'es';
        for (const word of vocabItems) {
          const li = document.createElement('li');
          li.textContent = word;
          chips.append(li);
        }
        const tip = document.createElement('p');
        tip.className = 'board-note';
        tip.textContent = 'Prøv å si hva hvert ord betyr på norsk før læreren eller du snur kortet.';
        bodyEl.append(intro, chips, tip);
      },
    },
    {
      id: 'steg-2',
      label: '2. Skriv',
      minutes: minutesFor('steg-2', 8),
      render(bodyEl) {
        const list = document.createElement('ol');
        list.className = 'board-numbered-list';
        for (const prompt of writingPrompts) {
          const li = document.createElement('li');
          li.textContent = prompt;
          list.append(li);
        }
        bodyEl.append(list);

        if (exampleAnswers.length) {
          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.className = 'btn-secondary';
          toggleBtn.textContent = 'Vis eksempelsvar';
          const answersBox = document.createElement('div');
          answersBox.className = 'board-examples-box';
          answersBox.hidden = true;
          answersBox.lang = 'es';
          const ansList = document.createElement('ol');
          ansList.className = 'board-numbered-list';
          for (const ans of exampleAnswers) {
            const li = document.createElement('li');
            li.textContent = ans;
            ansList.append(li);
          }
          answersBox.append(ansList);

          toggleBtn.addEventListener('click', () => {
            answersBox.hidden = !answersBox.hidden;
            toggleBtn.textContent = answersBox.hidden ? 'Vis eksempelsvar' : 'Skjul eksempelsvar';
          });
          bodyEl.append(toggleBtn, answersBox);
        }
      },
    },
    {
      id: 'steg-3',
      label: '3. Lytt',
      minutes: minutesFor('steg-3', 7),
      render(bodyEl) {
        const intro = document.createElement('p');
        intro.className = 'board-note';
        intro.textContent = 'Lytt to ganger etter hva samtalen handler om, og svar på spørsmålene:';
        const list = document.createElement('ol');
        list.className = 'board-numbered-list';
        for (const q of listeningQuestions) {
          const li = document.createElement('li');
          li.textContent = q;
          list.append(li);
        }
        bodyEl.append(intro, list);

        if (pageAudio) {
          const audioBar = document.createElement('div');
          audioBar.className = 'audio-speed board-audio-bar';
          audioBar.setAttribute('role', 'group');
          audioBar.setAttribute('aria-label', 'Lydkontroll for tavlemodus');

          const playBtn = document.createElement('button');
          playBtn.type = 'button';
          playBtn.className = 'btn-primary';
          const updatePlayLabel = () => {
            playBtn.textContent = pageAudio.paused ? '▶ Spill av samtale' : '⏸ Pause samtale';
          };
          updatePlayLabel();
          playBtn.addEventListener('click', () => {
            if (pageAudio.paused) pageAudio.play?.().catch(() => {});
            else pageAudio.pause?.();
          });
          pageAudio.addEventListener('play', updatePlayLabel);
          pageAudio.addEventListener('pause', updatePlayLabel);
          pageAudio.addEventListener('ended', updatePlayLabel);

          audioBar.append(playBtn);
          const currentRate = pageAudio.playbackRate || 1;
          for (const [rate, label] of [[1, '1x'], [0.75, '0,75x'], [0.5, '0,5x']]) {
            const rBtn = document.createElement('button');
            rBtn.type = 'button';
            rBtn.className = 'speed-btn';
            rBtn.dataset.rate = String(rate);
            rBtn.setAttribute('aria-pressed', currentRate === rate ? 'true' : 'false');
            rBtn.textContent = label;
            audioBar.append(rBtn);
          }
          const backBtn = document.createElement('button');
          backBtn.type = 'button';
          backBtn.className = 'speed-btn';
          backBtn.dataset.audioBack = '-5';
          backBtn.textContent = '↺ -5 sek';
          const restartBtn = document.createElement('button');
          restartBtn.type = 'button';
          restartBtn.className = 'speed-btn';
          restartBtn.dataset.audioRestart = '';
          restartBtn.textContent = '⏮ Fra start';
          audioBar.append(backBtn, restartBtn);

          bindAudioControls(pageAudio, audioBar);
          bodyEl.append(audioBar);
        }
      },
    },
    {
      id: 'steg-4',
      label: '4. Snakk i par',
      minutes: minutesFor('steg-4', 15),
      render(bodyEl) {
        const prompt = document.createElement('p');
        prompt.className = 'board-lead';
        prompt.textContent = 'Snakk i par – Samtalekort A og B.';
        const detail = document.createElement('p');
        detail.className = 'board-note';
        detail.textContent = 'Hold kortet skjult for partneren din, still spørsmål på spansk og fyll inn opplysningene du mangler. Bytt roller når dere er ferdige.';
        bodyEl.append(prompt, detail);
      },
    },
    {
      id: 'steg-5',
      label: '5. Hent fram',
      minutes: minutesFor('steg-5', 5),
      render(bodyEl) {
        const prompt = document.createElement('p');
        prompt.className = 'board-lead';
        prompt.textContent = retrievalText;
        bodyEl.append(prompt);
      },
    },
  ];
}

function formatClock(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function openBoardMode() {
  const returnFocus = document.activeElement;
  document.getElementById('boardModeOverlay')?.remove();
  const steps = collectBoardSteps();
  const title = document.querySelector('header h1')?.textContent?.trim() || 'Undervisningstime';

  let activeStep = 0;
  let remainingSeconds = steps[0].minutes * 60;
  let timerRunning = false;
  let timerInterval = null;

  const overlay = document.createElement('div');
  overlay.id = 'boardModeOverlay';
  overlay.className = 'board-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Tavlemodus: ${title}`);

  const topbar = document.createElement('div');
  topbar.className = 'board-topbar';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'board-title-wrap';
  const kicker = document.createElement('span');
  kicker.className = 'board-kicker';
  kicker.textContent = 'Tavlemodus';
  const heading = document.createElement('h2');
  heading.textContent = title;
  titleWrap.append(kicker, heading);

  const timerBox = document.createElement('div');
  timerBox.className = 'board-timer-box';
  const clockEl = document.createElement('span');
  clockEl.className = 'board-timer-clock';
  clockEl.setAttribute('aria-live', 'off');
  const doneBadge = document.createElement('span');
  doneBadge.className = 'board-timer-done';
  doneBadge.textContent = 'Tiden er ute';
  doneBadge.hidden = true;

  const startPauseBtn = document.createElement('button');
  startPauseBtn.type = 'button';
  startPauseBtn.className = 'btn-primary';
  const addMinBtn = document.createElement('button');
  addMinBtn.type = 'button';
  addMinBtn.className = 'btn-secondary';
  addMinBtn.textContent = '+1 min';
  const resetTimerBtn = document.createElement('button');
  resetTimerBtn.type = 'button';
  resetTimerBtn.className = 'btn-secondary';
  resetTimerBtn.textContent = 'Nullstill';
  timerBox.append(clockEl, doneBadge, startPauseBtn, addMinBtn, resetTimerBtn);

  const topActions = document.createElement('div');
  topActions.className = 'board-top-actions';
  const qrBoardBtn = document.createElement('button');
  qrBoardBtn.type = 'button';
  qrBoardBtn.className = 'btn-secondary';
  qrBoardBtn.textContent = 'Vis QR-kode';
  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'btn-secondary';
  exitBtn.textContent = 'Avslutt tavlemodus';
  topActions.append(qrBoardBtn, exitBtn);

  topbar.append(titleWrap, timerBox, topActions);

  const stepTabs = document.createElement('div');
  stepTabs.className = 'board-step-tabs';
  stepTabs.setAttribute('role', 'tablist');
  stepTabs.setAttribute('aria-label', 'Deler i timen');

  const stage = document.createElement('div');
  stage.className = 'board-stage';
  const stageHeading = document.createElement('h3');
  stageHeading.className = 'board-stage-heading';
  const stageBody = document.createElement('div');
  stageBody.className = 'board-stage-body';
  stage.append(stageHeading, stageBody);

  const bottomNav = document.createElement('div');
  bottomNav.className = 'board-bottom-nav';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'btn-secondary';
  prevBtn.textContent = '← Forrige del';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn-primary';
  nextBtn.textContent = 'Neste del →';
  bottomNav.append(prevBtn, nextBtn);

  overlay.append(topbar, stepTabs, stage, bottomNav);

  const stopTimer = () => {
    timerRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const syncTimerUi = () => {
    clockEl.textContent = formatClock(remainingSeconds);
    doneBadge.hidden = remainingSeconds > 0;
    timerBox.classList.toggle('is-finished', remainingSeconds <= 0);
    startPauseBtn.textContent = timerRunning ? 'Pause' : 'Start';
    startPauseBtn.disabled = remainingSeconds <= 0;
  };

  const startTimer = () => {
    if (timerRunning || remainingSeconds <= 0) return;
    timerRunning = true;
    syncTimerUi();
    timerInterval = setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      if (remainingSeconds === 0) stopTimer();
      syncTimerUi();
    }, 1000);
  };

  startPauseBtn.addEventListener('click', () => {
    if (timerRunning) {
      stopTimer();
      syncTimerUi();
    } else {
      startTimer();
    }
  });
  addMinBtn.addEventListener('click', () => {
    remainingSeconds += 60;
    syncTimerUi();
  });
  resetTimerBtn.addEventListener('click', () => {
    stopTimer();
    remainingSeconds = steps[activeStep].minutes * 60;
    syncTimerUi();
  });

  const selectStep = (index) => {
    activeStep = Math.max(0, Math.min(steps.length - 1, index));
    stopTimer();
    remainingSeconds = steps[activeStep].minutes * 60;
    syncTimerUi();

    [...stepTabs.children].forEach((tab, idx) => {
      tab.setAttribute('aria-selected', idx === activeStep ? 'true' : 'false');
    });
    const current = steps[activeStep];
    stageHeading.textContent = `${current.label} (${current.minutes} min)`;
    stageBody.replaceChildren();
    current.render(stageBody);
    prevBtn.disabled = activeStep === 0;
    nextBtn.disabled = activeStep === steps.length - 1;
  };

  steps.forEach((step, idx) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'board-step-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = step.label;
    tab.addEventListener('click', () => selectStep(idx));
    stepTabs.append(tab);
  });

  prevBtn.addEventListener('click', () => selectStep(activeStep - 1));
  nextBtn.addEventListener('click', () => selectStep(activeStep + 1));
  qrBoardBtn.addEventListener('click', () => {
    void openQrModal(qrBoardBtn);
  });

  const closeBoard = () => {
    stopTimer();
    document.removeEventListener('keydown', onKeyDown);
    document.body.classList.remove('board-mode-open');
    if (document.fullscreenElement === overlay) {
      document.exitFullscreen?.().catch(() => {});
    }
    overlay.remove();
    if (returnFocus?.isConnected) returnFocus.focus();
  };

  const onKeyDown = (e) => {
    if (document.getElementById('qrModalOverlay')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeBoard();
    }
  };
  document.addEventListener('keydown', onKeyDown);
  exitBtn.addEventListener('click', closeBoard);

  document.body.classList.add('board-mode-open');
  document.body.append(overlay);
  selectStep(0);
  exitBtn.focus();
  overlay.requestFullscreen?.().catch(() => {});
}

if (boardBtn) {
  boardBtn.addEventListener('click', openBoardMode);
}
