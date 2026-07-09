# Handoff: CMAF HAM upstream contribution

> Local working note (not intended for commit). Continue here in the CML repo (`~/dev/common-media-library`).

## Where it stands
- **CML PR [#376](https://github.com/streaming-video-technology-alliance/common-media-library/pull/376)** is open (branch `docs/cmaf-ham-cross-implementation`, base `main`): a neutral avia-js vs. video.js comparison doc at `docs/superpowers/specs/2026-07-09-cmaf-ham-cross-implementation-comparison.md`. DCO-signed, no AI trailer, diagrams validated. **Awaiting video.js maintainer review.**
- A **working-group Discussion is drafted but not posted** (held until video.js reviews the doc, co-review-first).
- **avia side (separate private repo `~/dev/avia-js`, branch `docs/cmaf-ham-model`, pushed):** the fuller per-change proposal `libs/plugins/cmaf/docs/ham-upstream-proposal.md`, plus `TIMING.md`, `ham-cross-implementation-comparison.md`, and `stringifyCmafManifest`. This is avia's own copy; the CML PR is the neutral version.

## Repos & paths
- **CML** (resume here): `~/dev/common-media-library`. Doc lives in `docs/superpowers/specs/`. `libs/cmaf-ham` is the target library.
- **video.js**: `~/dev/v10`, model at `packages/spf/src/media/types/index.ts` (HLS-first, self-contained, "based on CMAF-HAM").
- **avia-js**: `~/dev/avia-js` (PRIVATE: do not link from public CML/Discussion; share doc contents directly instead).

## Conventions / watch-outs
- CML commits: `git commit -s` (DCO) as `Casey Occhialini <1508707+littlespex@users.noreply.github.com>`; conventional commits; **no `Co-Authored-By: Claude`**; per CONTRIBUTING, changes also need changelog + contributors-list entries and tests/docs.
- No em dashes in docs. Validate Mermaid against the real `mermaid` lib (parse), not a previewer.
- **Do not merge #376 before the WG discussion**: it is RFC input, and its fate depends on the decisions.

## The substance (quick recap)
**Converged independently -> upstream candidates:** `AddressableObject { url, byteRange?: { start, end } }`; `initialization` as an addressable object (vs `urlInitialization: string`); split `mimeType` + `codecs` (vs single `codec`); track-type discriminators on the set layers.

**Diverged -> open questions (two production data points):**
- **A. parent navigation vs JSON**: avia cyclic back-refs (not serializable) / video.js acyclic (serializable; required by its immutable-signal updates).
- **B. timing**: avia `startTime`+`endTime`+`duration` / video.js `TimeSpan { startTime, duration }`.
- **C. "not resolved yet"**: avia `null` sentinel / video.js type-states (`PartiallyResolved<T>` + guards).
- **D. extensibility**: avia per-layer override / video.js generics (`SwitchingSetOf<T>`).
- Minor: E frame rate (avia `number` / video.js `FrameRate` object), F image tracks (avia only), G manifest/live/multi-period (avia only; video.js HLS-first, single-period).

A and B point in opposite directions; video.js's choices preserve the acyclic / JSON-serializable invariant.

## Remaining steps
1. **Add the video.js maintainers as reviewers** on #376 (need their GitHub handles; `gh pr edit 376 --add-reviewer <handle>` or the UI).
2. **Iterate the comparison doc** per their review on the `docs/cmaf-ham-cross-implementation` branch.
3. **When video.js approves:** post the WG Discussion (draft below) in CML -> Discussions (Ideas/RFC), and ping the Players & Playback Discord.
4. **After the WG gives direction:**
   - Open **focused PRs** for the converged items into `libs/cmaf-ham` (one per change).
   - Record the divergent decisions (A-D) as short **ADRs** in `docs/` (no ADR convention exists yet; may need to establish `docs/rfcs/` or `docs/adr/`).
5. **(avia-side, separate)** the **slideshow** for the maintainers meeting, from the two docs on `docs/cmaf-ham-model`. Not started.

## Ready-to-post WG Discussion draft

```markdown
Title: RFC: Extending the CMAF-HAM model, convergent practice and open questions (avia-js + video.js)
Category: Ideas / RFC (Players & Playback)

Two production players maintained in this community independently built on cmaf-ham and extended
it very similarly: avia-js (Paramount) and video.js v10 (self-contained SPF model). They landed on
many of the same additions and diverged on a handful of design questions.

Neutral comparison (side-by-side graphs + full matrix):
https://github.com/streaming-video-technology-alliance/common-media-library/pull/376

Converged independently (candidates to adopt):
- AddressableObject: { url, byteRange?: { start, end } } with numeric ranges (both chose that name)
- initialization typed as an addressable object (replacing urlInitialization: string)
- Splitting mimeType from codecs
- Track-type discriminators on switching/selection layers

Diverged (want the working group to weigh in):
- A. Parent navigation vs JSON-serializability (avia cyclic back-refs vs video.js acyclic/serializable)
- B. Redundant vs minimal timing (startTime+endTime+duration vs { startTime, duration })
- C. Signaling "not resolved yet" (null sentinel vs type-states)
- D. Layer extension (per-layer override vs generics)

A and B are the sharp ones: opposite directions, and video.js's choices keep the model serializable.

Ask: input on A-D ahead of the next Players & Playback meeting. Happy to open focused PRs for the
converged items now, and to turn A-D into short ADRs once there's a direction.

Links: PR #376 (above); video.js SPF types
(https://github.com/videojs/v10/blob/main/packages/spf/src/media/types/index.ts);
avia per-change proposal (attach/paste, private repo).
```

## Blocking input to resume
The **video.js maintainers' GitHub handles**, so reviewers can be added to #376 (step 1).
