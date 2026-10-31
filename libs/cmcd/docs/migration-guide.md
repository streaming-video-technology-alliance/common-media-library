---
title: Migration Guide
description: How to move a player from CmcdReporter to createCmcdSession
---

# Migrating from `CmcdReporter`

The release that adds `createCmcdSession()` deprecates `CmcdReporter`, and version 3.0.0 removes it. This guide maps each member of `CmcdReporter` to the session API. The [session guide](session-guide.md) describes the session API.

## Before and After

`CmcdReporter` keeps the data of the player in a store. A change of `sta` in the store sends a `ps` event:

```typescript
import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'

const reporter = new CmcdReporter({
	cid: 'movie-42',
	enabledKeys: ['bl', 'br', 'cid', 'd', 'ot', 'sid', 'sn', 'v'],
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE],
		enabledKeys: ['cid', 'e', 'sid', 'sn', 'sta', 'ts', 'v'],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

reporter.update({ sta: 'p', bl: [12000] })

const report = reporter.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ot: 'v', d: 4000, br: [3000] })
console.log(report.url)
```

The session keeps no store. The player keeps its data, passes it with each call, and sends the `ps` event itself:

```typescript
import type { CmcdSnapshot } from '@svta/cml-cmcd'
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	enabledKeys: ['bl', 'br', 'cid', 'd', 'ot', 'sid', 'sn', 'v'],
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE],
		enabledKeys: ['cid', 'e', 'sid', 'sn', 'sta', 'ts', 'v'],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const state: CmcdSnapshot = { sta: 'p', bl: [12000] }

session.recordEvent(CmcdEventType.PLAY_STATE, state)

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ...state, ot: 'v', d: 4000, br: [3000] })
console.log(report.url)
```

## Member Map

| `CmcdReporter` | Session API |
|---|---|
| `new CmcdReporter(config, requester)` | `createCmcdSession(config, requester)` |
| `sid`, `cid`, `version`, `transmissionMode`, `enabledKeys`, `customHeaderMap`, `eventTargets` | The same names. The types are `CmcdSessionRequestReportConfig` and `CmcdSessionEventReportConfig`, without `transform` |
| A custom `requester` for a transport that is not HTTP | `send` on the event target. The requester stays for the `url` targets. |
| `update(data)` for values that persist | The player keeps the values in a `CmcdSnapshot` object and passes them with each call |
| The events that `update()` fires for `sta`, `pr`, `cid`, `bg`, and `br` | The player compares the new value with the old value, then calls `recordEvent()` |
| `update({ sid })` | A new session. The player calls `flush()` and `stop()` on the old session. |
| `update({ msd })` | `msd` in the data of any call. The session sends it once to each destination. |
| The data store in `t` reports | `snapshot`, which returns `CmcdSnapshot` |
| `recordEvent()`, `createRequestReport()`, `recordResponseReceived()` | The same methods. The data includes the values that persist. |
| `start()`, `stop()`, `flush()` | The same methods. `stop(true)` becomes `flush()` and then `stop()`. |
| `isRequestReportingEnabled()` | No equivalent. The player decides whether to call `createRequestReport()`. |
| `applyRequestReport()`, deprecated | `createRequestReport()` |
| `transform` on an event target, to drop reports | `filter` |
| `transform` on the request configuration, to drop reports | No `createRequestReport()` call for that request |
| `transform`, to change a report | Other data in the call. A change for one target only has no equivalent. |
| `sessionRetention` and the provenance record | The player keeps the old session object and records late responses there |
| A new reporter for new request settings | `configure()` |
| A new reporter for a new `sid` or new event targets | A new session |
| A new reporter for a new `cid` | `cid` in the data of each call |

## Differences to Check

- Without `enabledKeys`, the session reports every key. In the same case, `CmcdReporter` reports nothing in request mode and only the required keys on a target.
- The session sends no event by itself. The player compares each new value with the old value, then calls `recordEvent()`.
- The session reads `msd`, `bs`, and `bsd` from the data of any call and sends them to every destination. `CmcdReporter` reads `msd` from `update()` only.
- A `bs` flag that stays in the store until the next request becomes `bs: true` in the data of one call. `CmcdSnapshot` rejects `bs` and `bsd`.
- The session types reject `transform`, and `CmcdSessionConfig` has no `sessionRetention`. Version 3.0.0 removes `transform` from the configuration types.
- Every target receives the same data. A `transform` that changes the report of one target has no equivalent, and neither has the `bg=?0` opt-in.
- After a failed send, a target waits from 1 to 60 seconds before the retry. `CmcdReporter` sends a failed batch again with the next send.
- An event target has a `url` or a `send` function. `CmcdReporter` sends every target through the requester.
- During a migration, report each `sid` through one API only. Each API keeps its own sequence numbers.
