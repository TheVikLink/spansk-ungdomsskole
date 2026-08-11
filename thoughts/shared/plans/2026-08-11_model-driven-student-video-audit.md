# Model-Driven Student Video Audit

## Goal

Create a repeatable, privacy-preserving audit actor that behaves like a new 13-16-year-old student, completes the real onboarding and mixed-quiz flow, records the browser session, captures interaction checkpoints, extracts representative frames with FFmpeg, and leaves a manifest that a vision-capable model or human can review.

## Design

- Use Playwright against the real `index.html` flow, not isolated DOM calls for the main journey.
- Use a deterministic student policy for reproducible regression evidence: fresh local storage, diagnosis answers with intentional wrong/near-miss cases, mixed quiz answers, Enter/button variants, and a navigation interruption attempt.
- Record video with Playwright and save it under an ignored audit artifact directory.
- Capture named screenshots at semantic checkpoints: welcome, diagnosis prompt, diagnosis feedback, home after diagnosis, quiz prompt, quiz feedback, quiz result, and second-quiz start.
- Use `ffprobe` for metadata and `ffmpeg` for a low-volume contact sheet plus sampled PNG frames.
- Write `manifest.json` with viewport, step names, timestamps, visible text summary, URL, console/page errors, video metadata, and frame paths. Do not record student names or export raw localStorage.
- Keep model analysis separate from the runner: the runner produces bounded evidence; a later vision model prompt consumes the manifest/contact sheet and returns findings. Do not add cloud upload or analytics.

## Acceptance criteria

- A single command runs the simulated student flow and exits non-zero on broken core interactions.
- Video, checkpoints, sampled frames, contact sheet, and manifest are produced.
- The actor verifies feedback after each answered item, result review count, repeat quiz CTA, and same-day quiz count.
- Artifacts are ignored by git and do not contain a real student identifier.
- A focused smoke test validates the runner contract without requiring FFmpeg in CI; FFmpeg post-processing is reported as skipped when unavailable.

## Verification

- Run the audit at mobile 390x844 and desktop 1440x900.
- Inspect `ffprobe` output and representative frames manually/model-assisted.
- Run the existing adaptive quiz, student-flow, and full checks after adding the runner.
