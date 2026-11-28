import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeAudioLookup } from './export-word-audio-batches.mjs';
import { syncWordAudio } from './sync-word-audio.mjs';

export function parseSilenceDetect(stderrText) {
  const silences = [];
  let pendingStart = null;
  for (const line of String(stderrText || '').split(/\r?\n/)) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/);
    if (startMatch) {
      pendingStart = Number(startMatch[1]);
      continue;
    }
    const endMatch = line.match(/silence_end:\s*([0-9.]+)/);
    if (endMatch) {
      const end = Number(endMatch[1]);
      silences.push({ start: pendingStart ?? 0, end });
      pendingStart = null;
    }
  }
  if (pendingStart !== null) {
    silences.push({ start: pendingStart, end: null });
  }
  return silences;
}

export function computeSpeechSegments(silences, durationSec, { padSec = 0.08, minSpeechSec = 0.12 } = {}) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error(`Ugyldig lydvarighet: ${durationSec}`);
  }
  const raw = [];
  let cursor = 0;

  for (const silence of silences) {
    if (silence.start > cursor) {
      raw.push({ start: cursor, end: silence.start });
    }
    cursor = silence.end === null ? durationSec : Math.max(cursor, silence.end);
  }
  if (cursor < durationSec) {
    raw.push({ start: cursor, end: durationSec });
  }

  return raw
    .filter(seg => (seg.end - seg.start) >= minSpeechSec)
    .map(seg => ({
      start: Math.max(0, Number((seg.start - padSec).toFixed(3))),
      end: Math.min(durationSec, Number((seg.end + padSec).toFixed(3))),
    }));
}

export function probeDurationSec(audioPath) {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    audioPath,
  ], { encoding: 'utf8' });
  const seconds = Number(out.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Kunne ikke lese varighet fra ${audioPath}`);
  }
  return seconds;
}

export function detectSilences(audioPath, { silenceDb = '-35dB', minSilenceSec = 0.35 } = {}) {
  const proc = spawnSync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i', audioPath,
    '-af', `silencedetect=noise=${silenceDb}:d=${minSilenceSec}`,
    '-f', 'null',
    '-',
  ], { encoding: 'utf8' });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    throw new Error(`ffmpeg silencedetect feilet (${proc.status}): ${proc.stderr}`);
  }
  return parseSilenceDetect(proc.stderr);
}

export function splitBatchAudio({
  inputPath,
  batchId,
  manifestPath = 'output/word-audio-batches/manifest.json',
  approvedPath = 'data/approved-word-audio.json',
  htmlPath = 'index.html',
  audioRootPrefix = '',
  silenceDb = '-35dB',
  minSilenceSec = 0.35,
  padSec = 0.08,
  minSpeechSec = 0.12,
  skipLoudnorm = false,
  dryRun = false,
  syncHtml = true,
  sourceName = 'luvvoice-es-es',
} = {}) {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error(`Finner ikke innfil: ${inputPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const batch = (manifest.batches || []).find(b => b.batchId === batchId);
  if (!batch) {
    throw new Error(`Ukjent bolk-ID «${batchId}». Tilgjengelige bolker: ${(manifest.batches || []).map(b => b.batchId).join(', ')}`);
  }

  const durationSec = probeDurationSec(inputPath);
  const silences = detectSilences(inputPath, { silenceDb, minSilenceSec });
  const segments = computeSpeechSegments(silences, durationSec, { padSec, minSpeechSec });

  if (segments.length !== batch.items.length) {
    const preview = segments.slice(0, 8).map((s, i) => `#${i + 1} ${s.start}-${s.end}s`).join(', ');
    throw new Error(
      `Antall oppdagede ordsegmenter (${segments.length}) matcher ikke bolken «${batchId}» (${batch.items.length} ord). `
      + `Juster --min-silence (nå ${minSilenceSec}s) eller --silence-db (nå ${silenceDb}). Første segmenter: ${preview}`,
    );
  }

  if (dryRun) {
    return {
      batchId,
      dryRun: true,
      wordCount: batch.items.length,
      segments,
      outputs: batch.items.map((item, i) => ({ word: item.spansk, targetPath: item.targetPath, segment: segments[i] })),
    };
  }

  const written = [];
  for (let i = 0; i < batch.items.length; i += 1) {
    const item = batch.items[i];
    const seg = segments[i];
    const outFile = audioRootPrefix ? `${audioRootPrefix.replace(/\/$/, '')}/${item.targetPath}` : item.targetPath;
    mkdirSync(dirname(outFile), { recursive: true });

    const args = [
      '-y',
      '-hide_banner',
      '-loglevel', 'error',
      '-ss', String(seg.start),
      '-to', String(seg.end),
      '-i', inputPath,
    ];
    if (!skipLoudnorm) {
      args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }
    args.push('-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '4', outFile);
    execFileSync('ffmpeg', args, { stdio: 'inherit' });

    written.push({
      word: item.spansk,
      normalized: normalizeAudioLookup(item.spansk),
      path: item.targetPath,
      source: sourceName,
      vocabId: item.vocabId,
    });
  }

  const approvedJson = JSON.parse(readFileSync(approvedPath, 'utf8'));
  const existingEntries = Array.isArray(approvedJson.entries) ? approvedJson.entries : [];
  const byPath = new Map(existingEntries.map(entry => [entry.path, entry]));
  for (const entry of written) {
    byPath.set(entry.path, entry);
  }
  approvedJson.entries = [...byPath.values()];
  writeFileSync(approvedPath, `${JSON.stringify(approvedJson, null, 2)}\n`, 'utf8');

  if (syncHtml) {
    syncWordAudio({ approvedPath, htmlPath, baseDir: audioRootPrefix || '.' });
  }

  return { batchId, dryRun: false, wordCount: written.length, written };
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--skip-loudnorm') opts.skipLoudnorm = true;
    else if (arg.startsWith('--input=')) opts.inputPath = arg.split('=')[1];
    else if (arg === '--input' && argv[i + 1]) opts.inputPath = argv[++i];
    else if (arg.startsWith('--batch=')) opts.batchId = arg.split('=')[1];
    else if (arg === '--batch' && argv[i + 1]) opts.batchId = argv[++i];
    else if (arg.startsWith('--manifest=')) opts.manifestPath = arg.split('=')[1];
    else if (arg === '--manifest' && argv[i + 1]) opts.manifestPath = argv[++i];
    else if (arg.startsWith('--silence-db=')) opts.silenceDb = arg.split('=')[1];
    else if (arg === '--silence-db' && argv[i + 1]) opts.silenceDb = argv[++i];
    else if (arg.startsWith('--min-silence=')) opts.minSilenceSec = Number(arg.split('=')[1]);
    else if (arg === '--min-silence' && argv[i + 1]) opts.minSilenceSec = Number(argv[++i]);
    else if (arg.startsWith('--pad=')) opts.padSec = Number(arg.split('=')[1]);
    else if (arg === '--pad' && argv[i + 1]) opts.padSec = Number(argv[++i]);
  }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = splitBatchAudio(parseArgs(process.argv.slice(2)));
  if (result.dryRun) {
    console.log(`Tørrkjøring OK for ${result.batchId}: ${result.wordCount} segmenter matchet eksakt.`);
  } else {
    console.log(`Klippet og synkroniserte ${result.wordCount} lydfiler for ${result.batchId}.`);
  }
}
