---
title: Report Recorder Guide
description: Capture and assert on CMCD-bearing reports in player e2e tests
---

# CMCD Report Recorder Guide

`CmcdReportRecorder` is a test helper that captures the HTTP requests with CMCD data that a video player under test sends. It patches `XMLHttpRequest` and `fetch` in the current realm. It normalizes captured reports to one structure, whichever transport produced them. It offers functions for assertions after the run and for live inspection.

Use it when you need to:

- Verify that a player emits CMCD data correctly during a real playback session
- Assert on the number of reports with CMCD data of a given type (manifest, segment, event)
- Validate CMCD payloads with `validateCmcdRequest` from the same package
- Intercept event-mode POSTs without making real network calls to placeholder endpoints
- Show recorded reports live in a test harness page for human inspection

The recorder ships in `@svta/cml-cmcd`, so adopters get a tested, documented helper next to the encoder they already use.

## Quick start

```typescript
import { CmcdReportRecorder } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// ... configure and start the player under test ...

const segments = await recorder.waitForSegments({ count: 3 });
console.log(`Recorded ${segments.length} segment reports with CMCD data`);

recorder.detach();
```

`attach()` installs the transport patches, the player runs and sends requests, the test asserts on the recorded reports, and `detach()` restores the original transports.

## What gets recorded

The recorder records a request when it has CMCD data in any of three forms:

| Reporting mode | Trigger                                              |
| -------------- | ---------------------------------------------------- |
| `'query'`      | URL contains the `CMCD=...` query parameter          |
| `'header'`     | Request includes any `Cmcd-*` header                 |
| `'event'`      | POST to a URL registered in `eventTargetUrls` option |

Requests without CMCD data pass through untouched and are not stored.

The recorder classifies each report by URL extension and HTTP method:

| Type                          | Heuristic                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| `CmcdRecordedRequestType.MANIFEST`    | URL ends in `.m3u8` or `.mpd`                              |
| `CmcdRecordedRequestType.SEGMENT`     | URL ends in `.m4s`, `.m4v`, `.m4a`, `.mp4`, `.ts`, `.aac`  |
| `CmcdRecordedRequestType.EVENT`       | `POST` to a URL in `eventTargetUrls`                       |
| `CmcdRecordedRequestType.UNKNOWN`     | Anything else carrying CMCD data                           |

Recorded entries have one structure:

```typescript
type CmcdRecordedReport = {
    readonly request: HttpRequest;            // normalized; headers lowercase, body as string
    readonly type: CmcdRecordedRequestType;
    readonly reportingMode: CmcdRecordedReportMode;
    readonly timestamp: number;               // Date.now() at capture time
};
```

This structure is what `validateCmcdRequest` from `@svta/cml-cmcd` accepts, so you can pass recorded reports directly to validation.

## Reading recorded reports

There are three ways to read recorded reports:

### `getReports()`: snapshot

Returns a copy of everything recorded so far, so changes to the result do not affect the recorder. Best for tests that run the player to the end before they assert. Filter the result yourself if you need a subset:

```typescript
import { CmcdReportRecorder, CmcdRecordedRequestType } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// ... player runs to completion ...

const all = recorder.getReports();
const manifests = all.filter((r) => r.type === CmcdRecordedRequestType.MANIFEST);
const segments = all.filter((r) => r.type === CmcdRecordedRequestType.SEGMENT);

console.log(`Total: ${all.length}, manifests: ${manifests.length}, segments: ${segments.length}`);

recorder.detach();
```

### `waitFor*({ count?, timeout? })`: positive assertion

Resolves once at least `count` matching reports are recorded. Rejects with a diagnostic error on timeout. Use these methods for "expect N to happen" assertions while the player is still running. There is one method per request type, plus a generic `waitForReports` that matches any type:

| Method                                  | Matches                              |
| --------------------------------------- | ------------------------------------ |
| `waitForReports(options?)`              | any recorded report                  |
| `waitForManifest(options?)`             | reports with `type === MANIFEST`     |
| `waitForSegments(options?)`             | reports with `type === SEGMENT`      |
| `waitForEvents(options?)`               | reports with `type === EVENT` (POST) |

Each method takes one `CmcdReportRecorderWaitOptions` object with two optional fields. `count` defaults to `1`. `timeout` defaults to the recorder's `waitTimeout` option, which is 15 seconds if unset.

```typescript
import { CmcdReportRecorder } from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

// Kick off playback in the background...
startPlayer();

// Wait for the first three segment reports
const segments = await recorder.waitForSegments({ count: 3 });
for (const report of segments) {
    console.log(report.request.url, report.reportingMode);
}

recorder.detach();
```

Shorten the timeout per call or for the whole recorder:

```typescript
// Per call: fail in 2 seconds rather than the recorder default
await recorder.waitForManifest({ timeout: 2000 });

// All wait* calls on this recorder default to 2 seconds
const fastRecorder = new CmcdReportRecorder();
fastRecorder.attach({ waitTimeout: 2000 });
await fastRecorder.waitForManifest();
```

## Live inspection with `onReport`

For test harness pages that show CMCD activity live, pass an `onReport` callback to `attach()`. The callback fires synchronously for each recorded report, right after the report is appended to the buffer and before any pending `waitFor*` promises resolve.

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

The callback receives the same object reference that `getReports()` returns. So one panel can subscribe to all reports and branch on `report.type` or `report.reportingMode` to send each report to its own view:

```typescript
recorder.attach({
    onReport: (report) => {
        switch (report.type) {
            case CmcdRecordedRequestType.MANIFEST:
                manifestPanel.append(report);
                break;
            case CmcdRecordedRequestType.SEGMENT:
                segmentPanel.append(report);
                break;
            case CmcdRecordedRequestType.EVENT:
                eventPanel.append(report);
                break;
        }
    },
});
```

The listener is bound to the attach lifecycle, so `detach()` clears it. To resume notifications after a detach and reattach, pass the callback again on the next `attach()` call.

## Stubbing event-mode POSTs

CMCD v2 event reports are POSTed to a configured target URL. In tests, you usually do not want those requests to reach a real endpoint. The `eventTargetUrls` option intercepts matching POSTs and responds with a synthetic `204 No Content`. It still records the request body for inspection.

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

const events = await recorder.waitForEvents();
console.log("Event report body:", events[0].request.body);

recorder.detach();
```

A request matches if its URL starts with any entry in the list. POSTs whose URLs do not match are not stubbed and pass through to the underlying transport. The recorder still records them if they have CMCD data.

## Combining recorded reports with validation

`CmcdRecordedReport.request` is an `HttpRequest`. Pass it directly to `validateCmcdRequest` or the other validators in this package:

```typescript
import {
    CmcdReportRecorder,
    validateCmcdRequest,
} from "@svta/cml-cmcd";

const recorder = new CmcdReportRecorder();
recorder.attach();

startPlayer();

const segments = await recorder.waitForSegments({ count: 3 });
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

const events = await recorder.waitForEvents();
const result = validateCmcdEventReport(events[0].request);
if (!result.valid) {
    console.error("Bad event report:", result.issues);
}

recorder.detach();
```

## Custom transports

By default, the recorder patches `globalThis.XMLHttpRequest` and `globalThis.fetch`. If the player under test uses a different HTTP client, supply a custom `CmcdTransportAdapter` in the `transports` option. Examples are a custom wrapper, `node-fetch`, and `undici`.

A transport adapter installs its patch, calls the supplied `deliver` function for every outbound request, and returns a teardown function that removes the patch:

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

The `deliver` function returns a `Response` only when the request matched `eventTargetUrls`. In that case the adapter must return the synthetic response instead of forwarding the request to the underlying client.

## Lifecycle and teardown

`attach()` does nothing when the recorder is already attached, so it is safe to call once per test setup. `detach()`:

- Removes the transport patches and restores the original `XMLHttpRequest` and `fetch` references
- Clears the `onReport` listener
- Rejects any pending `waitFor*` promises with `Error('Recorder detached while waiting')`
- Does **not** clear the recorded report buffer. Call `clear()` for that

Always pair `attach()` with `detach()` in your test teardown (`afterEach` or equivalent). A recorder that remains attached keeps patching `XMLHttpRequest` and `fetch` for the rest of the process, which breaks later tests.

## Tips

- **Fill a live view from existing reports.** When you open an inspection panel during a session, call `getReports()` once after `attach()` to fill the table. Then use `onReport` for the updates.
- **Filter inside `onReport`.** The listener does not accept a type filter. If you need only a subset, branch on `report.type` or `report.reportingMode` inside the callback.
- **Use `clear()` between test phases.** When one test runs several playback scenarios, call `recorder.clear()` between phases to reset the buffer without a reattach.
- **Default timeout is 15 seconds.** For fast unit-style tests, set a shorter default for the recorder with the `waitTimeout` attach option. Or pass an explicit `timeout` to one `waitFor*` call.
- **Body normalization.** The transports read POST bodies into strings at capture time, so `report.request.body` is always a string or `undefined`, never a `ReadableStream`. Pass it directly to `validateCmcdEventReport`.
