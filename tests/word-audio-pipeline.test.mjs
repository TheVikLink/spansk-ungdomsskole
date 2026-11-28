import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

import { exportWordAudioBatches, slugifyWord } from '../scripts/export-word-audio-batches.mjs';
import { computeSpeechSegments, parseSilenceDetect, probeDurationSec, splitBatchAudio } from '../scripts/split-word-audio-batch.mjs';
import { syncWordAudio, validateWordAudio } from '../scripts/sync-word-audio.mjs';

test('exportWordAudioBatches produces 100 core words split into 2 x 50 batches prioritizing Madrigal words', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'word-audio-export-'));
  try {
    const emptyApprovedPath = join(dir, 'approved.json');
    writeFileSync(emptyApprovedPath, JSON.stringify({ schemaVersion: 1, entries: [] }));
    const { batches, manifest } = exportWordAudioBatches({ outDir: dir, approvedPath: emptyApprovedPath });
    assert.equal(manifest.totalWords, 100);
    assert.equal(batches.length, 2);
    assert.equal(batches[0].wordCount, 50);
    assert.equal(batches[1].wordCount, 50);
    assert.deepEqual(
      batches[0].items.slice(0, 3).map(item => item.spansk),
      ['la música', 'el hotel', 'la información'],
    );
    assert.equal(slugifyWord('la información'), 'la-informacion');
    const txt1 = readFileSync(join(dir, 'bolk-01-kjerneord.txt'), 'utf8').trim().split(/\n\n+/);
    assert.equal(txt1.length, 50);
    assert.equal(txt1[0], 'la música.');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('silence parser and segment splitter work with real ffmpeg burst audio and reject mismatches', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'word-audio-split-'));
  try {
    const sampleMp3 = join(dir, 'bolk-synth.mp3');
    // Generer tre korte pip separert av 0.7s stillhet for deterministisk segmentdeteksjon.
    execFileSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.35',
      '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono:d=0.7',
      '-f', 'lavfi', '-i', 'sine=frequency=523:duration=0.35',
      '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono:d=0.7',
      '-f', 'lavfi', '-i', 'sine=frequency=659:duration=0.35',
      '-filter_complex', '[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1',
      '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', sampleMp3,
    ]);

    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: 1,
      batches: [
        {
          batchId: 'bolk-test',
          items: [
            { vocabId: 'vocab-0525', spansk: 'la música', targetPath: 'audio/ord/la-musica.mp3' },
            { vocabId: 'vocab-0523', spansk: 'el hotel', targetPath: 'audio/ord/el-hotel.mp3' },
            { vocabId: 'vocab-0561', spansk: 'la información', targetPath: 'audio/ord/la-informacion.mp3' },
          ],
        },
        {
          batchId: 'bolk-mismatch',
          items: [
            { vocabId: 'vocab-0525', spansk: 'la música', targetPath: 'audio/ord/la-musica.mp3' },
            { vocabId: 'vocab-0523', spansk: 'el hotel', targetPath: 'audio/ord/el-hotel.mp3' },
          ],
        },
      ],
    }));

    const existingRefoldPath = join(dir, 'audio/uttale/refold-v1/mock.mp3');
    execFileSync('mkdir', ['-p', join(dir, 'audio/uttale/refold-v1')]);
    writeFileSync(existingRefoldPath, 'refold-bytes');

    const approvedPath = join(dir, 'approved-word-audio.json');
    writeFileSync(approvedPath, JSON.stringify({
      schemaVersion: 1,
      entries: [
        { word: 'casa', normalized: 'casa', path: 'audio/uttale/refold-v1/mock.mp3', source: 'refold-v1' },
      ],
    }));

    const htmlPath = join(dir, 'index.html');
    writeFileSync(htmlPath, 'const APPROVED_WORD_AUDIO_OVERRIDES = /* GENERATED APPROVED WORD AUDIO START */{}/* GENERATED APPROVED WORD AUDIO END */;');

    assert.throws(() => splitBatchAudio({
      inputPath: sampleMp3,
      batchId: 'bolk-mismatch',
      manifestPath,
      approvedPath,
      htmlPath,
      audioRootPrefix: dir,
      skipLoudnorm: true,
    }), /matcher ikke bolken/);
    assert.equal(existsSync(join(dir, 'audio/ord/la-musica.mp3')), false);

    const result = splitBatchAudio({
      inputPath: sampleMp3,
      batchId: 'bolk-test',
      manifestPath,
      approvedPath,
      htmlPath,
      audioRootPrefix: dir,
      syncHtml: true,
    });

    assert.equal(result.wordCount, 3);
    for (const rel of ['audio/ord/la-musica.mp3', 'audio/ord/el-hotel.mp3', 'audio/ord/la-informacion.mp3']) {
      assert.ok(probeDurationSec(join(dir, rel)) > 0.2);
    }

    const updated = JSON.parse(readFileSync(approvedPath, 'utf8'));
    assert.equal(updated.entries.length, 4);
    assert.equal(updated.entries[0].source, 'refold-v1');
    const overrides = validateWordAudio(updated, { baseDir: dir });
    assert.equal(overrides['la música'].path, 'audio/ord/la-musica.mp3');
    assert.equal(overrides.casa, undefined);

    syncWordAudio({ check: true, approvedPath, htmlPath, baseDir: dir });
    const syncedHtml = readFileSync(htmlPath, 'utf8');
    assert.match(syncedHtml, /"la música":\{"word":"la música","path":"audio\/ord\/la-musica\.mp3","source":"luvvoice-es-es"\}/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('parseSilenceDetect and computeSpeechSegments clamp segment boundaries cleanly', () => {
  const silences = parseSilenceDetect('silence_start: 0.50\nsilence_end: 1.20 | silence_duration: 0.70\nsilence_start: 1.90\n');
  const segments = computeSpeechSegments(silences, 2.5, { padSec: 0.1, minSpeechSec: 0.12 });
  assert.deepEqual(segments, [
    { start: 0, end: 0.6 },
    { start: 1.1, end: 2.0 },
  ]);
});
