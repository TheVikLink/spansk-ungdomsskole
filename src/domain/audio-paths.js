/**
 * Pure audio URL builders for dictation and listening stories.
 */

export function dictationAudioUrl(story, filename) {
  if (!story?.audioDir || !filename) return '';
  const file = /\.[a-z0-9]+$/iu.test(filename) ? filename : `${filename}.${story.audioExt || 'mp3'}`;
  return `audio/diktat/${encodeURIComponent(story.audioDir)}/${encodeURIComponent(file)}`;
}

export function listeningAudioUrl(story) {
  return story?.fullAudio ? `audio/lyttehistorier/${encodeURIComponent(story.fullAudio)}` : '';
}

export function getDictationAudioUrls(story) {
  if (!story?.audioDir) return [];
  const files = [
    ...(story.fullAudio ? [story.fullAudio] : []),
    ...((story.segments || []).map(([, file]) => file).filter(Boolean)),
  ];
  return [...new Set(files.map((file) => dictationAudioUrl(story, file)).filter(Boolean))];
}
