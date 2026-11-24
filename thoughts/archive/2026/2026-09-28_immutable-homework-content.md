# Immutable homework content snapshots

Beads: `spansk-ungdomsskole-c5tt`. This is a local implementation step under the Feide homework plan.

## Finding

Assignments store `content_version='1'`, but the learner open and answer endpoints call `getActivity(content_id)` against the current generated catalog. A catalog edit can therefore change a lesson after publication while persisted events still claim version 1.

## Contract

At publication, copy the complete server-side activity definition needed for rendering and grading into `assignment.content_snapshot` and derive `content_version` from a canonical SHA-256 digest. Snapshot includes prompt, options, correct option ID, explanation, area/title/audio reference, and stable item IDs. Student responses must receive only prompt/options, never answer keys or explanations before response. Both opening and scoring use the stored snapshot; they verify the digest before use and fail closed for corrupt/unsupported snapshots. Existing `content_version='1'` rows created before this migration have no trustworthy snapshot; keep them out of student homework and explain the required re-publication rather than silently claiming they are versioned. Preserve historical results for teacher reporting/export.

## Implementation and verification

1. Add unit tests for canonical hashing, detached immutable snapshot, version change on content change, answer projection, and grading from a frozen snapshot.
2. Add an additive SQL migration for snapshot storage and update publish/list/open/answer routes.
3. Extend synthetic OIDC end-to-end: publish, change the live in-memory catalog as a simulated new release, verify the learner sees and is graded against the published version, and verify a corrupt snapshot is unavailable.
4. Update Sikt/municipal documentation and test evidence. Run targeted server tests, build, full `npm run test:all`, and `git diff --check`.

No real learner data, external identity, deployment, or Sikt registration is used.
