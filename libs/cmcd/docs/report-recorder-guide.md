---
title: Report Recorder Guide
description: Capture and assert on CMCD-bearing reports in player e2e tests
---

# CMCD Report Recorder Guide

`CmcdReportRecorder` is a test helper that captures CMCD-bearing HTTP requests emitted by a video player under test. It patches `XMLHttpRequest` and `fetch` in the current realm, normalizes captured reports to a single shape regardless of which transport produced them, and exposes ergonomic APIs for both post-hoc assertions and live inspection.

Use it when you need to:

- Verify that a player emits CMCD data correctly during a real playback session
- Assert on a specific number of CMCD-bearing reports of a given type (manifest, segment, event)
- Validate CMCD payloads with `validateCmcdRequest` from the same package
- Intercept event-mode POSTs without making real network calls to placeholder endpoints
- Stream recorded reports to a UI in a test harness page for human inspection

The recorder is shipped as part of `@svta/cml-cmcd` so adopters get a tested, documented helper alongside the encoder they already depend on.

## Quick start

```typescript
import { CmcdReportRecorder } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// ... configure and start the player under test ...

const segments = await recorder.waitForSegments(3);
console.log(`Recorded ${segments.length} segment reports with CMCD data`);

recorder.detach();
```

That's the whole loop: `attach()` installs the transport patches, the player runs and emits requests, the test asserts on whatever was recorded, `detach()` restores the original transports.

## What gets recorded

A request is recorded when it carries CMCD data in any of three forms:

| Reporting mode | Trigger                                              |
| -------------- | ---------------------------------------------------- |
| `'query'`      | URL contains the `CMCD=...` query parameter          |
| `'header'`     | Request includes any `Cmcd-*` header                 |
| `'event'`      | POST to a URL registered in `eventTargetUrls` option |

Requests without CMCD data pass through untouched and are not stored.

Each recorded report is classified by URL extension and HTTP method:

| Type                          | Heuristic                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| `CmcdRequestType.MANIFEST`    | URL ends in `.m3u8` or `.mpd`                              |
| `CmcdRequestType.SEGMENT`     | URL ends in `.m4s`, `.m4v`, `.m4a`, `.mp4`, `.ts`, `.aac`  |
| `CmcdRequestType.EVENT`       | Any `POST`                                                 |
| `CmcdRequestType.UNKNOWN`     | Anything else carrying CMCD data                           |

Recorded entries have a uniform shape:

```typescript
type CmcdRecordedReport = {
    readonly request: HttpRequest;            // normalized; headers lowercase, body as string
    readonly type: CmcdRequestType;
    readonly reportingMode: CmcdRecordedReportMode;
    readonly timestamp: number;               // Date.now() at capture time
};
```

This is the same shape that `validateCmcdRequest` from `@svta/cml-cmcd` accepts, so you can pipe recorded reports straight into validation.

## Reading recorded reports

There are three ways to observe recorded reports, suited to different test shapes.

### `getReports()`: snapshot

Returns a defensive copy of everything recorded so far. Best for tests that fully drive the player to completion before asserting. Filter the result yourself if you need a subset:

```typescript
import { CmcdReportRecorder, CmcdRequestType } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// ... player runs to completion ...

const all = recorder.getReports();
const manifests = all.filter((r) => r.type === CmcdRequestType.MANIFEST);
const segments = all.filter((r) => r.type === CmcdRequestType.SEGMENT);

console.log(`Total: ${all.length}, manifests: ${manifests.length}, segments: ${segments.length}`);

recorder.detach();
```

### `waitFor*(count?, timeout?)`: positive assertion

Resolves once at least `count` matching reports have been recorded. Rejects with a diagnostic error on timeout. Use for "expect N to happen" assertions where the test is racing the player. There is one method per request type, plus a generic `waitForReports` that matches any type:

| Method                                | Matches                              |
| ------------------------------------- | ------------------------------------ |
| `waitForReports(count?, timeout?)`    | any recorded report                  |
| `waitForManifest(count?, timeout?)`   | reports with `type === MANIFEST`     |
| `waitForSegments(count?, timeout?)`   | reports with `type === SEGMENT`      |
| `waitForEvents(count?, timeout?)`     | reports with `type === EVENT` (POST) |

`count` defaults to `1`. `timeout` defaults to the recorder's `waitTimeout` option (15 seconds if unset). Pass an explicit `timeout` to override per call.

```typescript
import { CmcdReportRecorder } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// Kick off playback in the background...
startPlayer();

// Wait for the first three segment reports
const segments = await recorder.waitForSegments(3);
for (const report of segments) {
    console.log(report.request.url, report.reportingMode);
}

recorder.detach();
```

Shorten the timeout per call or globally on the recorder:

```typescript
// Per call: fail in 2 seconds rather than the recorder default
await recorder.waitForManifest(1, 2000);

// All wait* calls on this recorder default to 2 seconds
const fastRecorder = new CmcdReportRecorder();
fastRecorder.attach({ waitTimeout: 2000 });
await fastRecorder.waitForManifest();
```

## Live inspection with `onReport`

For test harness pages that show a streaming view of CMCD activity, pass an `onReport` callback to `attach()`. The callback fires synchronously for each recorded report, immediately after it is appended to the buffer and before any pending `waitFor*` promises resolve.

```typescript
import {
    CmcdReportRecorder,
    type CmcdRecordedReport,
} from "@svta/cml-cmcd";

const tableBody = document.querySelector<HTMLTableSectionElement>("#cmcd-log tbody")!;

const recorder = new CmcdReportRecorder();
recorder.attach({
    onReport: (report: CmcdRecordedReport) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = new Date(report.timestamp).toISOString();
        row.insertCell().textContent = report.type;
        row.insertCell().textContent = report.reportingMode;
        row.insertCell().textContent = report.request.url;
    },
});

// ... player runs; the table updates in real time as reports arrive ...
```

The callback receives the same object reference that `getReports()` returns, so a single panel can subscribe to all reports and branch on `report.type` / `report.reportingMode` to dispatch into separate UI surfaces:

```typescript
recorder.attach({
    onReport: (report) => {
        switch (report.type) {
            case CmcdRequestType.MANIFEST:
                manifestPanel.append(report);
                break;
            case CmcdRequestType.SEGMENT:
                segmentPanel.append(report);
                break;
            case CmcdRequestType.EVENT:
                eventPanel.append(report);
                break;
        }
    },
});
```

The listener is bound to the attach lifecycle: it is cleared automatically on `detach()`. To resume notification after a detach/reattach cycle, pass the callback again on the next `attach()` call.

## Stubbing event-mode POSTs

CMCD v2 event reports are POSTed to a configured target URL. In tests, you usually don't want those requests to hit a real endpoint. The `eventTargetUrls` option intercepts matching POSTs and responds with a synthetic `204 No Content`, while still recording the request body for inspection.

```typescript
import { CmcdReportRecorder } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach({
    eventTargetUrls: [
        "https://events.example.com",
        "https://analytics.example.com",
    ],
});

startPlayer();

const events = await recorder.waitForEvents(1);
console.log("Event report body:", events[0].request.body);

recorder.detach();
```

A request matches if its URL starts with any entry in the list. Non-event POSTs (those whose URLs don't match) are not stubbed and pass through to the underlying transport, but they are still recorded if they carry CMCD data.

## Combining recorded reports with validation

`CmcdRecordedReport.request` is an `HttpRequest`, which is exactly what `validateCmcdRequest` and the other validators in this package accept. Pipe one straight into the other:

```typescript
import {
    CmcdReportRecorder,
    validateCmcdRequest,
} from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

startPlayer();

const segments = await recorder.waitForSegments(3);
for (const report of segments) {
    const result = validateCmcdRequest(report.request);
    if (!result.valid) {
        console.error(`Bad CMCD on ${report.request.url}:`, result.issues);
    }
}

recorder.detach();
```

For event-mode reports, use `validateCmcdEventReport`:

```typescript
import {
    CmcdReportRecorder,
    validateCmcdEventReport,
} from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach({ eventTargetUrls: ["https://events.example.com"] });

startPlayer();

const events = await recorder.waitForEvents(1);
const result = validateCmcdEventReport(events[0].request);
if (!result.valid) {
    console.error("Bad event report:", result.issues);
}

recorder.detach();
```

## Custom transports

By default, the recorder patches `globalThis.XMLHttpRequest` and `globalThis.fetch`. If the player under test uses a different HTTP client (a custom wrapper, `node-fetch`, `undici`, etc.), supply a custom `CmcdTransportAdapter` via the `transports` option.

A transport adapter installs its hook, calls the supplied `deliver` function for every outbound request, and returns a teardown function that uninstalls the hook:

```typescript
import {
    CmcdReportRecorder,
    type CmcdTransportAdapter,
    type CmcdRequestDeliver,
} from "@svta/cml-cmcd";
import type { HttpRequest } from "@svta/cml-utils";

function createMyClientTransport(): CmcdTransportAdapter {
    return {
        attach(deliver: CmcdRequestDeliver): () => void {
            const original = myClient.send;
            myClient.send = (req: MyRequest) => {
                const httpRequest: HttpRequest = normalize(req);
                const stub = deliver(httpRequest);
                if (stub) {
                    // Event-target match: return the synthetic 204 response
                    return stub;
                }
                return original.call(myClient, req);
            };
            return () => {
                myClient.send = original;
            };
        },
    };
}

const recorder = new CmcdReportRecorder();
recorder.attach({
    transports: [createMyClientTransport()],
});
```

The `deliver` function returns a `Response` only when the request matched `eventTargetUrls`; in that case the adapter must short-circuit and use the synthetic response instead of forwarding to the underlying client.

## Lifecycle and teardown

`attach()` is a no-op when the recorder is already attached, so it is safe to call once per test setup. `detach()`:

- Removes the transport patches (restoring the original `XMLHttpRequest`/`fetch` references)
- Clears the `onReport` listener
- Rejects any pending `waitFor*` promises with `Error('Recorder detached while waiting')`
- Does **not** clear the recorded report buffer; call `clear()` for that

Always pair `attach()` with `detach()` in your test teardown (`afterEach` or equivalent). A leaked attached recorder continues to patch `XMLHttpRequest`/`fetch` for the rest of the process, which corrupts subsequent tests.

## Tips

- **Seed a live UI from existing reports.** When opening an inspection panel mid-session, call `getReports()` once after `attach()` to populate the table, then rely on `onReport` for incremental updates.
- **Filter inside `onReport`.** The listener does not accept a type filter directly. Branch on `report.type` or `report.reportingMode` inside the callback if you only care about a subset.
- **Use `clear()` between test phases.** When a single test exercises multiple playback scenarios, call `recorder.clear()` between phases to reset the buffer without re-attaching.
- **Default timeout is 15 seconds.** For fast unit-style tests, set a shorter recorder-wide default via the `waitTimeout` attach option, or pass an explicit `timeout` to a single `waitFor*` call to override.
- **Body normalization.** POST bodies are eagerly read into strings by the transports, so `report.request.body` is always a string (or `undefined`), never a `ReadableStream`. Pass it directly to `validateCmcdEventReport`.
