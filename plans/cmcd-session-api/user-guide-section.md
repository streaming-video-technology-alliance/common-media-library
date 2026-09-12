# User guide section for the session API

Task 14 of [`steps.md`](./steps.md) inserts the text below into `libs/cmcd/docs/user-guide.md`, after `## Installation` and before `## Basic Usage`. Copy it as is, from the first heading to the last paragraph.

---

## Reporting with a session

The session API is the CMCD version 2 reporter. One `CmcdSession` per playback owns the report targets, the requester, the interval timers, and `bg`. One `CmcdSessionReporter` per media player pushes state, records events, decorates requests, and records responses. The reporter derives `msd`, `bs`, `bsa`, `bsda`, `bsd`, `su`, `sn`, `h`, and the response timing keys. `CmcdReporter` remains available and unchanged.

```typescript
import { createCmcdSession, CmcdEventType } from '@svta/cml-cmcd'

const session = createCmcdSession({
	keys: ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'sf', 'st', 'su', 'nor'],
	eventTargets: [{ url: 'https://collector.example.com/cmcd' }],
})

const reporter = session.createReporter({ cid: 'movie-42' })

reporter.update({ sf: 'h', st: 'v' })
reporter.update({ sta: 'p', bl: 3200, mtp: 15000, pt: 12000 }) // emits e=ps with this snapshot

const req = reporter.decorate({ url: 'https://cdn.example.com/seg-1.m4s' }, { ot: 'v', d: 4000, br: 3000 })
const res = await fetch(req.url, { headers: req.headers })
const bytes = await res.arrayBuffer() // read the body first, so ttlb measures the last byte
reporter.recordResponse(req, { status: res.status, headers: res.headers }) // emits e=rr

reporter.recordError('MEDIA_ERR_NETWORK')
reporter.recordEvent(CmcdEventType.AD_BREAK_START)

session.dispose()
```

### Pushing state

`update()` merges plain values into the reporter's store. Numbers are in the spec's units, and the reporter rounds them. A metric that the spec allows per object type takes a number or a record such as `{ v: 3000, a: 128 }`. A member set to `undefined` removes the key. `ts` is the time of the transition for a push that arrives late, and it is not stored.

A change of `sta`, `pr`, `cid`, `bg`, or `br` emits the matching state-change event, `ps`, `pr`, `c`, `b`, or `bc`, once per changed value. Push the state and let the reporter emit. Do not call `recordEvent()` for these five.

### Events and errors

`recordEvent()` takes the discrete events: `as`, `ae`, `abs`, `abe`, `sk`, `m`, `um`, `pe`, `pc`, and `ce`. A `ce` event needs `cen` in its data. `recordError()` takes one code or a list. The codes are buffered per destination and go out with the next report to that destination. Destinations that list `e` receive an `e` event at once.

### Requests and responses

`decorate()` returns a copy of the request with the report placed on it. Query mode adds the `CMCD` query parameter, and header mode adds the `CMCD-` headers. The copy carries a `cmcd` record. Pass that returned request to `recordResponse()` with the status, the headers, and a Resource Timing entry when you have one. Without timing, `ttlb` measures the moment of the call, so record the response after the body is read. A request you did not keep can be recorded with `{ url }` and reports under the current `sid`.

### Interstitials

Create one reporter per media player with `session.createReporter({ cid })`. Every reporter reports under the same `sid`, and each destination sees one sequence of `sn`. Set `nr: true` on the player that is not rendered.

### Changing the sid

`session.rotate(sid)` starts the next `sid` for every reporter with no new objects. Counters, gates, and buffers restart, a startup measurement in progress carries over, and nothing is emitted. `session.configure()` replaces the request-mode settings `version`, `transmissionMode`, `keys`, and `headerMap` without a reset. A manifest that supplies CMCD parameters is handled with `configure()`, then `rotate(sid)`, then `update({ cid })`.

### Lifecycle

`createCmcdSession()` starts the interval timers and the visibility listener. `session.flush()` sends every queued line now. `session.dispose()` stops the timers, drains the queues, and turns every later call into a no-op. A response that arrives after `dispose()` or `rotate()` still reports under the `sid` that issued its request.

### Derived defaults

`derive` names three observations the reporter turns into defaults: `bg` from document visibility, `dl` from `bl` and `pr`, and `su` from the play state. Each is on by default. `derive: { bg: false }` turns one off, and a pushed value always wins.
