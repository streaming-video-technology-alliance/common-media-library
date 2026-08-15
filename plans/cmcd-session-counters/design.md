# Automatic starvation-counter tracking: design pass

Design pass for the direction recorded in the child-reporters RFC (`rfc/cmcd-reporter-child-reporters.md`, Unresolved questions item 4, 2026-08-11): derive `bsa`, `bsda`, and `bsd` automatically from the play-state transitions the reporter already observes, instead of treating them as caller-supplied session totals the reporter cannot aggregate. `dfa` stays application-supplied.

This document settles the four questions the RFC deferred to this pass. Implementation is not part of the session-fixes PR; see "When to implement" at the end.

## Why automatic tracking is correct by construction

CTA-5004-B defines the counting rule in terms of the state machine itself: "a buffer starvation event occurs when the state changes to rebuffering" (`sta` transitioning to `'r'`), and the rebuffering state "is not reported during startup or seeking", so the spec's own state definition filters out the non-events. Per-player state-change dedup (RFC decision 1) detects exactly the accepted transitions, so:

- `bsa` is the count of accepted transitions into `'r'` for the session, across all players.
- `bsda` is the accumulated span from each accepted entry into `'r'` to the next accepted transition out of it.
- `bsd` is the list of completed spans, each delivered once per reporting mode and report destination.

The reporter counts events it already observes, so multi-player session totals need no aggregation of opaque inputs, which retires the RFC's "cannot aggregate" constraint for these three keys and the `bsd` repetition trap (a persisted `update({ bsd })` repeating on every report) at the same time.

## 1. Supplied-value precedence

**Decision: supplied values win, per key, sticky for the session.**

If the application supplies `bsa`, `bsda`, or `bsd` (via `update()` or per-call data), the reporter uses the supplied value and disables automatic tracking for that key until the next `sid` reset. Keys the application never supplies are tracked automatically.

Rationale:

- Automatic derivation depends entirely on the player feeding `sta` transitions. Event-mode players must do that anyway (state-change events require it), but a request-mode-only player may never report state. Hard reporter ownership (ignoring supplied values the way `sid` and `msd` now are) would silently lose that player's data, which fails the adoption priorities harder than the multi-player hazard it prevents.
- Mixing sources within one session would produce an incoherent series (an automatic count followed by an unrelated supplied total under the same `sid`), so the switch is sticky per key: the first accepted supply for a key ends automatic tracking of that key for the session.
- Consistent with the reporter's silent-tolerance convention (RFC decision 5): no warning on the switch; the `update()` TSDoc documents it.

The multi-player drawback the RFC records stays true for applications that supply values: per-player totals under one `sid` are the application's responsibility. Automatic tracking is what fixes it; supplying values opts out of the fix.

## 2. Cause-token enrichment

**Decision: v1 emits token-less entries; cause enrichment is deferred.**

All three keys are inner lists whose items carry an optional token identifier for the rebuffering cause, and the spec says the token "MAY be omitted if the cause of the rebuffering is unknown". The reporter observes that a starvation happened, never why, so automatic entries omit the token, which is spec-compliant.

Applications that know causes have two paths today: supply the keys themselves (section 1) or attach nothing and accept token-less counts. A future enrichment hook (for example a `starvationCause` callback on `CmcdReporterConfig` invoked at each accepted transition into `'r'`, returning a token or `undefined`) composes cleanly with this design, but it is new public surface with no demonstrated demand, so it waits for a concrete request.

## 3. Duration fidelity

**Decision: spans are measured between transition timestamps, using the caller's `ts` when supplied, and only completed spans count.**

- A span opens at the accepted transition into `'r'` and closes at the next accepted transition out of it, on the same player. The timestamps are the ones the transitions already carry: per-call `ts` when the caller supplies it, otherwise `Date.now()` at the call. Fidelity therefore equals the player's own state-reporting latency, which is the same fidelity the state-change events themselves have; a player that reports `sta` late is late everywhere, and a player that needs exact spans can pass `ts`.
- `bsda` accumulates completed spans only, and `bsd` lists completed spans only, matching the spec's "reported once the rebuffering has completed" for `bsd` and keeping the two keys consistent (an in-progress span would otherwise appear in `bsda` but never in `bsd`).
- A span still open at session reset is dropped, not carried into the new session: the starvation belongs to the session in which it began, and its duration cannot be known before the reset. A span still open when the player is destroyed is likewise never reported. Both are the same data loss the caller-supplied model has today.

## 4. dfa ownership

**Decision: `dfa` stays application-supplied.**

Dropped frames are rendering-pipeline data the reporter cannot observe from CMCD inputs. No change in mechanics; the documentation obligation is to state, in the user guide's session-counter section, that `dfa` is the application's to maintain as a session total and that multi-player sessions must aggregate it themselves (the RFC's recorded drawback shrinks to this one key plus any supplied overrides from section 1).

## bsd delivery mechanics

`bsd` is once per reporting mode and report destination, the same clause shape as `msd`, but it is a growing list rather than a scalar, so the gate is a per-target cursor instead of a boolean: each target (the request target and every event target) remembers how many completed spans it has delivered, and each report attaches the spans beyond that cursor, advancing it only when the prepared output retains `bsd` (the same filter-aware consumption rule the session-fixes PR establishes for `msd`). Session reset clears the span list and every cursor.

## When to implement

With, or immediately after, the child-reporters feature PR, not the session-fixes PR:

- The multi-player correctness payoff only exists once children exist; the shared session state the counters live in (accepted-transition detection per player) is built by that PR.
- The single-reporter behavior change is non-breaking under section 1 precedence: players supplying values today keep their output byte-identical, and players supplying nothing gain counters they previously never emitted.
- The session-fixes PR already lands the machinery this design reuses: session-owned stamping order, filter-aware gate consumption, and session-reset clearing.
