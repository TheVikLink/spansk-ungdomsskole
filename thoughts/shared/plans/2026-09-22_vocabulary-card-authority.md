# Vocabulary cards and keyboard corrections

Beads: spansk-ungdomsskole-907. Builds on the uncommitted shortcut/audio-notice changes in 906.

## Evidence and intended behavior

The back-of-card synonym sentence currently compares unrelated cards sharing a prompt. Remove that inference and its UI. Standard card answers must be the first reviewed answer, including intentional punctuation/annotations; resolve standard cards by stable canonical ID before considering their stored labels.

`Russland på spansk` is a confirmed old bundled pair (corrected in d41a936), still present in some saved profiles without a canonical ID. Map only confirmed historical pairs to stable IDs, then read current labels from the generated review catalog. Preserve IDs, both schedules and counters; deduplicate against newly added standard copies using the existing progress reconciliation. Custom and assignment cards stay independent. Verify repeat load, old backup import, and a future removal of the canonical ID.

Ambiguous prompts need distinguishing letters, not identical initials. Use the first differing answer word, extending its prefix if necessary (morgen/day example: m/d). This affects the hint only, never accepted answers.

Select distractors must come from the same category and current reviewed answers, exclude every accepted answer and equivalent prompts, and rank number cards by numeric distance. Mix answer positions deterministically. If three suitable distractors are unavailable, use a recall card instead of padding with unrelated answers.

Long-press punctuation currently rejects Shift, which is needed to type ? and !. Allow Shift for punctuation while preserving normal uppercase-letter behavior. Track release by physical key so releasing Shift first cannot leave a conversion timer active.

The user also reports hidden final characters in long answers. Keep field width stable; after manual character insertion/conversion at the end, scroll to the end. Replace the held character without moving a caret that has advanced to subsequent letters. Preserve selection when editing in the middle, and cancel pending conversions on blur.

The user supplied `/Users/olehenrikvik/Downloads/korrigert json-fil.json`. Imported it byte-for-byte as `data/vocabulary-canonical-review.json` after validating the schema and confirming the same 522 stable IDs in the same order. It changes 107 entries: 109 added Norwegian accepted answers and two removals (`brus`, `brusen`), which were disclosed before import. `pommes friten`, `slipset` and `kartet` remain approved. The supplied file is authoritative; no inferred alternatives were merged into it. SHA-256: `f4158e6258ea339cb71948b20c91af3ba0411f174edb0e3836b9253ea85d8081`.

## Verification

Add focused regression tests before changes: canonical back text with stale labels, old Russia/Switzerland/500 cards and backups, distinct greeting hints, nearby number distractors and rejected synonyms, and shifted punctuation with quick release/blur/modifiers. Extend browser coverage for real study cards at 390 and 1440 pixels. Run focused Node tests, build:app, then test:all. Report browser launch restrictions separately if still present. No publish/commit requested.

Verification recorded 2026-09-22 before receiving the file: focused Node suite 21/21; full pre-browser gates and Node suite 47/47; build `16c02f1aab4a6334`; full application script parses and diff whitespace check passes. The browser runner discovers 466 tests but Chromium fails at launch with MachPortRendezvousServer Permission denied (1100); stopped after infrastructure failures. No browser available through the UI tool either. Logs: `/private/tmp/spansk-card-test-all.log`, `/private/tmp/spansk-card-build.log`.

After importing the supplied JSON: build `7072d6e4a34f6771`; source file byte identity and generated canonical entries verified; all content/catalog/offline checks and 47 Node tests pass again. Chromium startup still fails with the same permission error; no browser assertions ran successfully. `git diff --check` passes. Browser verification is the remaining gate. Log: `/private/tmp/spansk-corrected-json-test-all.log`.

Follow-up browser verification now works with direct test commands. The first completed local full run passed 465/466 browser tests, including all card, migration, punctuation, scrolling and shortcut regressions. The remaining Lingo Links failure was its test entering the raw catalog label `la religión (fag)` instead of the approved answer `la religión`; shuffled words had hidden that assumption in previous runs. The game test now reads a reviewed accepted answer for each recall card. All three tests in `report-game-support.spec.js` then passed. No vocabulary or application behavior changed in this follow-up.

Final verification 2026-09-22: `npm run test:all` completed successfully (exit 0): 47/47 Node tests, 466/466 browser tests, all content/catalog/Tailwind/offline checks. Build `7072d6e4a34f6771`. Browser coverage includes desktop/mobile card backs, input scrolling, shortcuts, shifted inverted punctuation and progress/backup compatibility. Changes remain local; no commit or publication performed.
