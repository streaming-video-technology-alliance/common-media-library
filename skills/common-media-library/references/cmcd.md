<!-- libs/cmcd/README.md -->
# @svta/cml-cmcd

Common Media Client Data (CMCD) encoding and decoding.

## When to use

- Add a CMCD report to a segment request as a query string or as headers: `appendCmcdQuery`, `appendCmcdHeaders`, `toCmcdQuery`, `toCmcdHeaders`
- Encode or decode CMCD key and value pairs: `encodeCmcd`, `decodeCmcd`, `fromCmcdQuery`, `fromCmcdHeaders`
- Report CMCD v2 events and time intervals to a collector: `CmcdReporter`, `createFetchTransport`, `createXhrTransport`
- Validate a CMCD payload against CTA-5004: `validateCmcd`, `validateCmcdEventReport`
- Capture the CMCD that a player sends in a test: `CmcdReportRecorder`

Do not write your own CMCD serializer, key sorter, header grouper, or event reporter. Open an issue for a key or a reporting mode that is missing.

## Installation

```bash
npm i @svta/cml-cmcd
```

## Usage

```typescript
import { CmcdReportingMode, encodeCmcd } from "@svta/cml-cmcd";

const input = {
	br: [1000],
	"com.example-hello": "world",
	ec: ["ERR001", "ERR002"],
	su: true,
};
const options = { version: 2 as const, reportingMode: CmcdReportingMode.REQUEST };
const result = encodeCmcd(input, options);
// result === 'br=(1000),com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2'
```

## Testing CMCD output with `CmcdReportRecorder`

`CmcdReportRecorder` captures the CMCD requests that a player under test
sends, whether through `XMLHttpRequest` or `fetch`. Each capture is
normalized to
[`HttpRequest`](https://github.com/streaming-video-technology-alliance/common-media-library/tree/main/libs/utils),
so tests work the same for both transports.

````ts
import { CmcdReportRecorder, validateCmcdRequest } from '@svta/cml-cmcd'

const recorder = new CmcdReportRecorder()
recorder.attach({ eventTargetUrls: ['https://events.example.com'] })

// ... configure and start the player under test ...

const segments = await recorder.waitForSegments({ count: 3 })
for (const r of segments) {
  const result = validateCmcdRequest(r.request)
  if (!result.valid) {
    console.error(result.issues)
  }
}

recorder.detach()
````

<!-- libs/cmcd/docs/report-recorder-guide.md -->
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
import type { CmcdRecordedReportMode, CmcdRecordedRequestType } from "@svta/cml-cmcd";
import type { HttpRequest } from "@svta/cml-utils";

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
import { CmcdReportRecorder } from "@svta/cml-cmcd";

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
import { CmcdRecordedRequestType } from "@svta/cml-cmcd";

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

<!-- libs/cmcd/docs/user-guide.md -->
---
title: User Guide
description: How to use the CMCD reporter
---

# CMCD User Guide

The `CmcdReporter` class manages CMCD reporting in a video player from one place. It handles request-mode reporting, which adds CMCD data to media requests, and event-mode reporting, which sends periodic reports to analytics endpoints.

## Installation

```bash
npm install @svta/cml-cmcd
```

## Basic Usage

### Instantiating the Reporter

Create a new `CmcdReporter` instance with configuration options:

```typescript
import {
	CmcdReporter,
	CmcdEventType,
	CMCD_QUERY,
	CMCD_V2,
} from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	// Optional: Provide a content ID for the current asset
	cid: "content-12345",

	// Optional: Provide a session ID (auto-generated if not provided)
	sid: "session-abc-123",

	// Optional: CMCD version (defaults to CMCD_V2)
	version: CMCD_V2,

	// Optional: Transmission mode for request reports (defaults to 'query')
	transmissionMode: CMCD_QUERY,

	// Optional: Keys to include in request reports (if not provided, request reporting is disabled)
	enabledKeys: ["br", "bl", "d", "ot", "sid", "cid", "mtp", "sf", "st"],

	// Event reporting targets
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			// The events to report. If not provided, the event target is disabled.
			events: [
				CmcdEventType.PLAY_STATE,
				CmcdEventType.ERROR,
				CmcdEventType.TIME_INTERVAL,
			],
			interval: 30, // seconds between TIME_INTERVAL reports
			batchSize: 5, // number of events to batch before sending
			enabledKeys: ["br", "bl", "sid", "cid"],
		},
	],
});
```

### Minimal Configuration

For basic request-mode reporting without event reporting:

```typescript
import { CmcdReporter } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "my-video-id",
});
```

> [!NOTE]
> The library defaults to the latest CMCD version (`CMCD_V2`). If you upgrade the library and need an older CMCD version, set the `version` option, such as `version: CMCD_V1`.

## Setting CMCD Data

Use the `update()` method to set or change CMCD data. The reporter keeps the values in its data store and applies them to all later requests and events.

```typescript
// Update multiple fields at once
reporter.update({
	br: [5000], // Encoded bitrate (kbps)
	d: 4000, // Segment duration (ms)
	ot: "v", // Object type: video
	bl: [25000], // Buffer length (ms)
	mtp: [12000], // Measured throughput (kbps)
	sf: "d", // Streaming format: DASH
	st: "v", // Stream type: VOD
});

// Update individual fields as playback state changes
reporter.update({ bl: [30000] }); // Buffer increased
reporter.update({ pr: 1.5 }); // Playback rate changed
reporter.update({ bs: true }); // Buffer starvation occurred
```

> [!NOTE]
> In CMCD v2, several keys that were plain numbers in v1 have the type `CmcdObjectTypeList`. This type is an inner list that supports an annotation per object type. Pass these keys as arrays, such as `br: [5000]`: `br`, `bl`, `mtp`, `tb`, `lb`, `ab`, `tab`, `lab`, `tbl`, `pb`, `bsa`, `bsd`, `bsda`, and `tpb`.

### Value Formatting

CTA-5004 and CTA-5004-B define every numeric key as an integer, except `pr`. `CmcdReporter` and the encoding functions, such as `encodeCmcd`, format each value before transmission. Pass raw values in their base units. Do not round or truncate values yourself. The table shows the formatting rules:

| Keys                            | Formatting                     |
| ------------------------------- | ------------------------------ |
| `bl`, `dl`, `mtp`, `rtp`, `tbl` | Rounded to the nearest 100     |
| `pr`                            | Not rounded                    |
| Every other numeric key         | Rounded to the nearest integer |

For example, pass the exact buffer length in milliseconds and the exact bitrate in kbps:

```typescript
reporter.update({ bl: [25432], br: [2500.7] }); // sent as bl=(25400) and br=(2501)
```

### Keys the Reporter Omits

The reporter applies the "MUST NOT" rules of CTA-5004-B when it encodes a report. It omits a key without an error in these cases:

- The value is `undefined`, `null`, an empty string, an empty array, or a number that is not finite. The specification requires the key to be absent when the value is unknown. A `false` value is also omitted. The exception is a `bg: false` that a transform adds to a backgrounded-mode report (see [Recording Events](#recording-events)).
- The value does not match the type of its key, such as `pt: "123"` or `sid: 123`. In a list, the reporter drops each element of the wrong type, such as `null` in `pb: [2500, null]`. It omits the key when no element is left.
- The value is a string longer than the maximum of its key, such as a `sid` of more than 64 characters.
- `d` when `ot` is not `a`, `v`, `av`, `tt`, `c`, or `o`. For example, a manifest request with `ot: "m"` never carries `d`. The rule uses the object type you set, even if `ot` is not in `enabledKeys`.
- `tpb` when `ot` is not `a`, `v`, `av`, or `c`.
- `ab`, `lab`, or `tab` when the same report also carries `br`, `lb`, or `tb`. The report keeps the exact bitrate.
- `cen` on every event except a custom event.
- `cmsdd`, `cmsds`, `rc`, `smrt`, `ttfb`, `ttfbb`, `ttlb`, and `url` on every report except a response-received report.
- `pr` when the value is `1`, except on a playback rate event.

When `ot` is absent, `d` and `tpb` are sent unchanged. The validators report the same conflicts as errors. See the [Validation Guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/validation-guide.md#version-specific-behavior).

These rules read the value inside an `SfItem`. For example, the reporter omits a `pr` of `1` with a parameter, as it omits `pr: 1`.

> [!NOTE]
> Version 1 output follows CTA-5004. `cid` has at most 64 characters, and a custom string has no length limit. Version 1 has no `st=ll` and no `sf=e`, so the reporter sends `st=l` and `sf=o`.

### Parameterized Values with toCmcdValue

In CMCD v2, some keys support values with parameters, such as `nor` (next object request) and `br` (encoded bitrate). Use the `toCmcdValue` helper function to attach parameters to a value:

```typescript
import { CmcdReporter, toCmcdValue } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
});

// Using toCmcdValue to add byte-range parameters to next object requests
reporter.update({
	nor: [
		toCmcdValue("segment_002.m4s", { r: "0-50000" }),
		toCmcdValue("segment_003.m4s", { r: "0-50000" }),
	],
});

// This encodes to: nor=("segment_002.m4s";r="0-50000" "segment_003.m4s";r="0-50000")
```

The `toCmcdValue` utility accepts two arguments:

1. **value** - The bare item value, such as a string, number, or boolean
2. **params** - An object of key-value pairs for the parameters

```typescript
import { toCmcdValue } from "@svta/cml-cmcd";

reporter.update({
	nor: [
		toCmcdValue("seg1.m4s", { r: "0-5000" }),
		toCmcdValue("seg1.m4s", { r: "5000-10000" }),
	],
});

// This encodes to: nor=("seg1.m4s";r="0-5000" "seg1.m4s";r="5000-10000")
```

Many keys accept a list of numeric values, each with an object type given as a boolean parameter.

```typescript
import { toCmcdValue } from "@svta/cml-cmcd";

reporter.update({
	br: [toCmcdValue(5000, { v: true }), toCmcdValue(3000, { a: true })],
});

// This encodes to: br=(5000;v 3000;a)
```

> [!NOTE]
> CMCD version 1 has one number for each of these keys. For version 1, the reporter sends the value that has the object type (`ot`) of the request. It uses a value without an object type for every `ot`. If no value matches, it omits the key. For example, the list above gives `br=3000` for an audio request and no `br` for a manifest request.

`decodeCmcd` keeps the parameters of a member. A member with parameters becomes an `SfItem`. For an inner list with parameters, such as `br=(3000 6000);p=2`, the value of the `SfItem` is the whole list. The encoder writes the parameters again, and the validators check the values inside the list:

```typescript
import { decodeCmcd, encodeCmcd, validateCmcd } from "@svta/cml-cmcd";

const data = decodeCmcd("br=(3000 6000);p=2,v=2", { convertToLatest: true });

console.log(encodeCmcd(data)); // br=(3000 6000);p=2,v=2
console.log(validateCmcd(data).valid); // true
```

### Absolute URLs for `nor`

The CMCD specification defines `nor` (next object request) as a path relative to the current request URL. `CmcdReporter` also accepts absolute URLs and converts them. It emits same-origin URLs as relative paths. It passes cross-origin values, and values that are already relative, through unchanged.

```typescript
// When the current request URL is:
//   https://cdn.example.com/streams/video/segment_001.m4s
// either form below produces the same encoded output.

// Already relative (per spec):
reporter.update({
	nor: ["segment_002.m4s"],
});

// Absolute URL, converted automatically:
reporter.update({
	nor: ["https://cdn.example.com/streams/video/segment_002.m4s"],
});

// Both encode to: nor=("segment_002.m4s")
```

## Custom Keys

CMCD allows player-defined key/value pairs next to the standard keys. Per CTA-5004-B, a custom key name MUST have a hyphenated prefix, so that it cannot collide with keys in future revisions of the specification. Clients SHOULD use reverse domain name syntax (reverse-DNS) for their prefix, such as `com.example-mykey`.

### Naming Rules

The `CmcdCustomKey` type requires a lowercase hyphenated string at compile time. At runtime, `isCmcdCustomKey` enforces the full rule. A key needs a lowercase first letter, then characters from `a-z 0-9 . -`. A hyphen must be neither the first nor the last character. Keys that fail the rule are dropped without an error. The rule is the CTA-5004-B custom key rule, restricted to names that RFC 8941 key serialization accepts. So a key that passes the check always reaches the wire.

In practice: **use lowercase reverse-DNS names**.

### Enabling Custom Keys

Custom keys pass through the same `enabledKeys` filter as standard keys: the top-level `enabledKeys` for request reports, and each target's `enabledKeys` for event reports. There is no wildcard. A custom key that is not listed is dropped without an error.

```typescript
import { CmcdReporter, CmcdEventType } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	// Request mode: the custom key must be listed here
	enabledKeys: ["br", "bl", "sid", "cid", "com.example-experiment"],
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.TIME_INTERVAL, CmcdEventType.ERROR],
			// Event mode: and here, for each target that should receive it
			enabledKeys: ["br", "bl", "sid", "cid", "com.example-experiment"],
		},
	],
});

// Persist the value; it rides all subsequent request and event reports
reporter.update({ "com.example-experiment": "variant-b" });

// Or attach it to a single event report only
reporter.recordEvent(CmcdEventType.ERROR, {
	ec: ["FATAL"],
	"com.example-experiment": "variant-b",
});
```

### Value Types and Wire Format

Custom values may be strings, numbers, booleans, or tokens. Wrap a value with `toCmcdValue()` to attach structured field parameters (see the `CmcdCustomValue` type). Notes on the wire format:

- `true` is encoded as a bare key without a value (`com.example-flag`), per the RFC 8941 boolean convention. `false` is treated like other empty values and dropped.
- In version 2, a string value has at most 64 characters. The reporter drops a longer string. It also drops a value of another type, such as a plain object.
- Values that RFC 8941 cannot serialize currently make encoding throw. Examples are strings with control characters and integers outside ±999,999,999,999,999. Validate custom values before you pass them to the reporter. Graceful handling of such values is tracked in [#327](https://github.com/streaming-video-technology-alliance/common-media-library/issues/327).
- The validators in this package expect custom values to be strings of at most 64 characters. Prefer short string values for interoperability. See the [Validation Guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/validation-guide.md#custom-keys).

### Custom Keys in Headers Mode

In headers transmission mode, custom keys go in the `CMCD-Request` header by default. Use the `customHeaderMap` option to route custom keys to other CMCD header shards. For example, a session-scoped custom key belongs in `CMCD-Session`, so intermediaries can treat it as constant for the session:

```typescript
import { CmcdReporter, CMCD_HEADERS } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	transmissionMode: CMCD_HEADERS,
	enabledKeys: ["sid", "cid", "com.example-experiment"],
	customHeaderMap: {
		"CMCD-Session": ["com.example-experiment"],
	},
});

reporter.update({ "com.example-experiment": "variant-b" });

const request = reporter.createRequestReport({
	url: "https://cdn.example.com/video/segment_001.m4s",
});

// request.headers will contain:
// {
//   'CMCD-Session': 'cid="video-123",com.example-experiment="variant-b",sid="…",v=2',
// }
```

Standard keys have fixed shards per the CMCD specification and cannot be moved. The option has no effect in query transmission mode or on event reports, which POST a body and have no header shards.

## Recording Events

`update()` fires the state-change events (`PLAY_STATE`, `PLAYBACK_RATE`,
`CONTENT_ID`, `BACKGROUNDED_MODE`, `BITRATE_CHANGE`) whenever a tracked
key's value differs from the last reported value. Use `update()` as the
one entry point for these events.

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

reporter.update({ sta: "p" });        // → fires PLAY_STATE
reporter.update({ pr: 1.5 });         // → fires PLAYBACK_RATE
reporter.update({ cid: "movie-42" }); // → fires CONTENT_ID
reporter.update({ bg: true });        // → fires BACKGROUNDED_MODE
reporter.update({ bg: false });       // → fires BACKGROUNDED_MODE without bg
reporter.update({ br: [5000] });      // → fires BITRATE_CHANGE

// Consecutive updates with the same value are deduplicated.
reporter.update({ sta: "p" }); // dropped (unchanged)
```

A `BACKGROUNDED_MODE` report with `bg` is the entry to backgrounded mode. A report without `bg` is the exit, as CTA-5004-B defines it. If the session has not reported `bg: true`, `update({ bg: false })` fires no event. The exception is a session that starts while `bg` is `true`, after a `sid` change.

If a collector expects `bg=?0` on the exit, add `bg: false` to the exit report in the target's transform. The encoder writes that value as `?0`:

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	eventTargets: [
		{
			url: "https://legacy-collector.example.com/cmcd",
			events: [CmcdEventType.BACKGROUNDED_MODE],
			enabledKeys: ["bg", "sid", "v", "e", "ts", "sn"],
			transform: (data) =>
				data.e === CmcdEventType.BACKGROUNDED_MODE && !("bg" in data) ? { ...data, bg: false } : data,
		},
	],
});
```

### Snapshot context on state changes

State-change events report whatever is in the data store at that
moment. To attach snapshot context, either combine the continuous
metrics with the state key in one `update()` call:

```typescript
reporter.update({ sta: "p", bl: [3000], mtp: [8500], pt: 12500 });
// → fires PLAY_STATE with sta="p", bl=[3000], mtp=[8500], pt=12500
```

Or set the metrics with earlier `update()` calls, so they are already
in the data store when the state key changes:

```typescript
// Keep metrics fresh as the player computes them
reporter.update({ bl: [3000], mtp: [8500], pt: 12500 });

// Later, when state changes
reporter.update({ sta: "p" });
// → fires PLAY_STATE with sta="p", bl=[3000], mtp=[8500], pt=12500
```

The same pattern keeps `TIME_INTERVAL` reports useful. The reporter
emits those events on a timer with whatever is in the data store at
that moment. There is no callback for per-event data. Keep the
continuous metrics current with `update()`.

### Do not pair `update()` with `recordEvent()` for the same state-change field

Dedup drops the payload of the second call:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

reporter.update({ sta: "p" });                              // auto-fires PLAY_STATE
reporter.recordEvent(CmcdEventType.PLAY_STATE, {            // suppressed:
  sta: "p",                                                 //   sta unchanged
  bl: [3000],                                               //   bl never emitted
});
```

Use the single-call form shown above instead.

### Using `recordEvent()`

`recordEvent()` is for events whose payload belongs to the event call
itself. These events do not represent a stored state transition:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

// Custom event: the name and any payload only make sense for this call.
// See "Custom Events" below for the required target configuration.
reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: "ad-quartile" });

// Error: ec carries the player error code(s). Per CTA-5004-B the list
// notation is required even for a single code.
reporter.recordEvent(CmcdEventType.ERROR, { ec: ["FATAL"] });

// Ad lifecycle, mute/unmute, player expand/collapse, skip.
reporter.recordEvent(CmcdEventType.AD_START, { /* ad metadata */ });
reporter.recordEvent(CmcdEventType.MUTE);
```

For `RESPONSE_RECEIVED`, prefer `recordResponseReceived()` (see below).
It derives the per-response keys for you.

> [!NOTE]
> The response-received keys (`url`, `rc`, `ttfb`, `ttlb`, `ttfbb`, `cmsdd`, `cmsds`, `smrt`) are valid only on `RESPONSE_RECEIVED` reports. If you pass them in the `data` of any other event, the reporter removes them, even when `enabledKeys` lists them. Custom hyphenated keys are not affected.

### Custom Events

Custom events (`e=ce`) report player-defined events by name in the `cen` key, a string of at most 64 characters. Two configuration rules apply:

- An event target receives custom events only if its `events` array lists `CmcdEventType.CUSTOM_EVENT`. Otherwise the target drops the event without an error.
- `cen` is always included on custom events and does not need to be in `enabledKeys`. Any other payload, including custom keys, still passes through the target's `enabledKeys`.

```typescript
import { CmcdReporter, CmcdEventType } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			// CUSTOM_EVENT must be listed for the target to receive it
			events: [CmcdEventType.CUSTOM_EVENT],
			// cen is force-included; the custom payload key must be enabled
			enabledKeys: ["sid", "cid", "com.example-quartile"],
		},
	],
});

reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, {
	cen: "ad-quartile",
	"com.example-quartile": "q3",
});

// The event report contains:
// cen="ad-quartile",cid="video-123",com.example-quartile="q3",e=ce,sid=…,ts=…,v=2
```

Per CTA-5004-B, when a custom event transfers a value, the custom key name SHOULD relate to the custom event name. Above, `com.example-quartile` relates to `ad-quartile`. See [Custom Keys](#custom-keys) for the naming rules.

### Recording Response Received Events

The `recordResponseReceived()` method records `RESPONSE_RECEIVED` events and derives the timing metrics from the HTTP response. It is usually called after a segment request completes.

```typescript
import { CmcdReporter, CmcdEventType } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	enabledKeys: ["br", "d", "ot", "url", "rc", "ttfb", "ttlb"],
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ["url", "rc", "ttfb", "ttfbb", "ttlb", "cmsdd", "cmsds", "smrt", "br", "d", "ot"],
		},
	],
});
```

#### Basic Usage

The method accepts a `CommonMediaResponse` object and derives the following keys:

| Key    | Description                      | Source                                             |
| ------ | -------------------------------- | -------------------------------------------------- |
| `url`  | The requested URL (without CMCD) | `response.request.url` (CMCD query param stripped) |
| `rc`   | HTTP response status code        | `response.status`                                  |
| `ts`   | Request initiation timestamp     | `response.resourceTiming.startTime`                |
| `ttfb` | Time to first byte (ms)          | `responseStart - startTime`                        |
| `ttlb` | Time to last byte (ms)           | `response.resourceTiming.duration`                 |

```typescript
// After receiving a response
const response = {
	status: 200,
	request: decoratedRequest,
	resourceTiming: {
		startTime: performance.now(),
		responseStart: performance.now() + 50,
		duration: 150,
		encodedBodySize: 512000,
	},
};

reporter.recordResponseReceived(response);
```

#### Complete Request/Response Flow

For full request and response tracking, call `createRequestReport()` before the request and `recordResponseReceived()` after the response. The response event includes the CMCD data from the original request:

```typescript
async function fetchSegment(
	url: string,
	segmentInfo: SegmentInfo,
): Promise<ArrayBuffer> {
	// Update player state
	reporter.update({
		bl: [player.getBufferLength()],
		mtp: [player.getMeasuredThroughput()],
	});

	// Decorate the request with CMCD data
	const request = reporter.createRequestReport(
		{ url, method: "GET" },
		{
			br: [segmentInfo.bitrate],
			d: segmentInfo.duration,
			ot: segmentInfo.type,
		},
	);

	// Fetch the segment and capture timing
	const startTime = performance.now();
	const response = await fetch(request.url, request);
	const responseStart = performance.now();
	const buffer = await response.arrayBuffer();
	const duration = performance.now() - startTime;

	// Record the response received event
	reporter.recordResponseReceived({
		status: response.status,
		request,
		resourceTiming: {
			startTime,
			responseStart,
			duration,
			encodedBodySize: buffer.byteLength,
		},
	});

	return buffer;
}
```

#### Providing Additional Data

You can supply CMCD keys that the method cannot derive. The keys `cmsdd`, `cmsds`, and `smrt` are strings. Each one holds a Base64 copy of the data in a header:

```typescript
reporter.recordResponseReceived(response, {
	ttfbb: 25, // Time to first body byte (player-measured)
	cmsdd: "ImNkbi1hIjtldHA9OTY7cnR0PTg=", // Base64 copy of the CMSD-Dynamic response header
	cmsds: "b3Q9dixzZj1oLHN0PXYsZD00MDAwLGJyPTI1MDA=", // Base64 copy of the CMSD-Static response header
	smrt: "KCk7bj1PcmlnaW5BO3N5bg==", // Base64 copy of the response tracing data, from the Request Tracing header
});
```

Values in the `data` parameter override derived values.

## Decorating Segment Requests

Use the `createRequestReport()` method to add CMCD data to segment requests. The method returns a new request object with the CMCD data in query parameters or in headers, depending on the configuration.

### Query Parameter Mode (Default)

```typescript
import { CmcdReporter, CMCD_QUERY } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	transmissionMode: CMCD_QUERY,
});

// Update CMCD data before the request
reporter.update({
	br: [5000],
	bl: [25000],
	d: 4000,
	ot: "v",
});

// Create the original request
const request = {
	url: "https://cdn.example.com/video/segment_001.m4s",
	method: "GET",
	headers: {},
};

// Create the decorated request
const decoratedRequest = reporter.createRequestReport(request);

// Use the decorated request with your HTTP client
fetch(decoratedRequest.url, decoratedRequest);
```

`createRequestReport()` adds the `CMCD` parameter and makes no other change to the URL. If the URL already has a `CMCD` parameter, the new value replaces it. The value uses the encoding of the CTA-5004-B query examples. Only letters, digits, `-`, `.`, `_`, and `~` stay unencoded.

### Headers Mode

```typescript
import { CmcdReporter, CMCD_HEADERS } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	transmissionMode: CMCD_HEADERS,
});

reporter.update({
	br: [5000],
	bl: [25000],
	d: 4000,
});

const request = {
	url: "https://cdn.example.com/video/segment_001.m4s",
	method: "GET",
	headers: {},
};

const decoratedRequest = reporter.createRequestReport(request, { ot: "v" });

// decoratedRequest.headers will contain:
// {
//   'CMCD-Object': 'br=(5000),d=4000,ot=v',
//   'CMCD-Request': 'bl=(25000)',
// }
```

## Lifecycle Management

### Starting the Reporter

Call `start()` to begin automatic `TIME_INTERVAL` event reporting:

```typescript
reporter.start();
```

The timer fires at the configured interval.

### Stopping the Reporter

Call `stop()` to stop automatic reporting:

```typescript
reporter.stop();
```

### Flushing Events

Call `flush()` to send all queued events now, regardless of the batch size:

```typescript
// Send all pending events (useful when playback ends)
reporter.flush();
```

### Session Changes and Late Responses

Changing the session ID starts a new session. Sequence numbers restart, the media start delay (`msd`) gate re-arms, state-change dedup baselines clear, and targets disposed by an HTTP 410 are active again. The data store is kept, so `cid`, `br`, custom keys, and the rest survive the change.

```typescript
reporter.update({ sid: "next-session" });
```

The reporter retains state for recently ended sessions. `sessionRetention` sets how many, and `0` disables retention. So a media request that completes after a session change reports under the session that issued it. The report uses that session's `sid`, sequence numbers, and data snapshot. The snapshot is frozen at the transition. Mutating an array that you passed to `update()` earlier does not change the late reports of an ended session.

Attribution uses a frozen provenance record (`CmcdRequestProvenance`). `createRequestReport()` stores the record on the request's `customData` under the exported `CMCD_REQUEST_PROVENANCE` symbol, on every request it returns, including requests it does not decorate. The record contains:

- the `sid` of the issuing session, which is the attribution key
- the `cid` that was current when the request was issued
- the per-call data of the request, as an encoded CMCD string

The reporter rebuilds a `RESPONSE_RECEIVED` event from the record, with the record's `cid` and the caller's request-time inputs. So a response that completes after a session or content change keeps the meaning it had when its request was sent.

The `sid` itself is the session identity. CTA-5004-B expects it to be unique per playback session, so generate a new UUID for every session.

> [!WARNING]
> Never reuse a session ID. Everything session-scoped depends on the `sid`, so reusing one corrupts the collected data. The reporter replaces the retained session that has the same `sid`. The late responses of the replaced session are then relabeled onto the replacement, and they consume the replacement's sequence numbers and gates.

Spread and `Object.assign` keep the record in ordinary request clones. `JSON.stringify` and structured clone drop symbol-keyed properties. A request that crosses such a boundary, such as a worker or a JSON cache, needs the record stored next to it and restored afterwards:

```typescript
import { CMCD_REQUEST_PROVENANCE } from "@svta/cml-cmcd";

// Symbol keys do not survive JSON, so carry the record explicitly. The
// record itself is JSON-safe.
const payload = JSON.parse(
	JSON.stringify({
		request,
		provenance: request.customData[CMCD_REQUEST_PROVENANCE],
	}),
);

// Restore it before reporting the response and attribution stays exact.
payload.request.customData[CMCD_REQUEST_PROVENANCE] = payload.provenance;
reporter.recordResponseReceived({ status: 200, request: payload.request });
```

The record is the only key that selects an ended session. A response whose request has no record reports under the current session, as in version 2.4.0. The request-time data then comes from `customData.cmcd`. A per-call `data.sid` is no substitute. The reporter accepts any record whose `sid` resolves, so you can also construct one. A hand-built request, or a request decorated by another reporter configured with the same session, attributes by naming the `sid`:

```typescript
import { CMCD_REQUEST_PROVENANCE } from "@svta/cml-cmcd";

// The request was never decorated, so the player names the session.
request.customData[CMCD_REQUEST_PROVENANCE] = { sid: "previous-session" };
reporter.recordResponseReceived({ status: 200, request });
```

A response attributed to a session that is no longer retained is dropped, not relabeled with the current session ID. A session change sends the unsent event reports of an ended session before eviction can discard them. Each report keeps the `sid` and sequence number of its own session. A failed batch that is re-queued into an evicted session is discarded with the session.

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.TIME_INTERVAL, CmcdEventType.PLAY_STATE],
			interval: 30,
			batchSize: 3,
		},
	],
});

// Start reporting when playback begins
function onPlaybackStart() {
	reporter.start();
}

// Stop reporting and flush when playback ends
function onPlaybackEnd() {
	reporter.stop();
	reporter.flush();
}

// Clean up when the player is destroyed
function onPlayerDestroy() {
	reporter.stop();
	reporter.flush();
}
```

## Custom HTTP Client

By default, `CmcdReporter` uses the native `fetch` API to send event reports. You can provide a custom requester function:

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";
import type { HttpRequest } from "@svta/cml-utils";

const customRequester = async (request: HttpRequest) => {
	// Use your preferred HTTP client
	const response = await axios({
		url: request.url,
		method: request.method,
		headers: request.headers,
		data: request.body,
	});
	return { status: response.status };
};

const reporter = new CmcdReporter(
	{
		cid: "video-123",
		eventTargets: [
			{
				url: "https://analytics.example.com/cmcd",
				events: [CmcdEventType.TIME_INTERVAL],
			},
		],
	},
	customRequester,
);
```

## Filtering CMCD Keys

The `enabledKeys` option limits which CMCD keys the reports include:

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	// Only include these keys in request reports
	enabledKeys: ["br", "bl", "d", "ot", "sid", "cid"],
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.TIME_INTERVAL],
			// Override enabled keys for this specific target
			enabledKeys: ["br", "bl", "sid", "cid"],
		},
	],
});
```

> [!NOTE]
> The CMCD specification requires certain keys, such as `v` (version). Reports always include them, whatever the `enabledKeys` setting.

## Transforming and Cancelling Reports

`enabledKeys` decides which keys a destination may ever receive. When a decision depends on the individual report, such as this request, this response, or this target, use a `transform` instead. A transform is a synchronous function. It receives the assembled CMCD data and the associated media request, and it returns the data to send the report or `null` to cancel it:

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	enabledKeys: ["br", "bl", "sid", "cid", "v", "sn"],
	// Request mode: never decorate license requests with CMCD
	transform: (data, request) =>
		request.url.includes("/license") ? null : data,
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ["url", "rc", "sid", "cid", "v", "e", "ts", "sn"],
			// Event mode, this target only: report segment responses only
			transform: (data, request) =>
				request?.customData?.["requestType"] === "segment" ? data : null,
		},
	],
});
```

The bracket access on the last line is the default, because the library cannot know the player's data type. [Typing `customData`](#typing-customdata) removes it.

Placement determines scope, the same way it does for `enabledKeys`:

| Placement                      | Applies to                                   |
| ------------------------------ | -------------------------------------------- |
| `transform` at the top level   | Request reports from `createRequestReport()` |
| `transform` on an event target | Event reports bound for that target          |

By design, there is no single function for both paths. An event report has its own type in `data.e`. The target's configuration is available where you write its transform, and the transform can close over anything else it needs. A policy that applies in more than one place is a shared function that you reference from each placement:

```typescript
import type { Cmcd } from "@svta/cml-cmcd";
import { CmcdEventType } from "@svta/cml-cmcd";

const sampled = Math.random() < 0.1;

const sampleIntervals = (data: Cmcd): Cmcd | null =>
	data.e === CmcdEventType.TIME_INTERVAL && !sampled ? null : data;
```

To combine several concerns at one placement, compose the functions yourself:

```typescript
import type { Cmcd } from "@svta/cml-cmcd";
import type { HttpRequest } from "@svta/cml-utils";

const scrubPii = (data: Cmcd, request: HttpRequest | undefined): Cmcd | null =>
	request?.url.includes("/private/") ? null : { ...data, cid: undefined };

const transform = (data: Cmcd, request: HttpRequest | undefined): Cmcd | null => {
	const scrubbed = scrubPii(data, request);
	return scrubbed === null ? null : sampleIntervals(scrubbed);
};
```

### The associated request

The second argument is the media request that the report belongs to. In request mode the request is always present, and it is the object you passed to `createRequestReport()`. Mutating that object does not change the returned report. In event mode the request is present for events recorded through `recordResponseReceived()`. It is `undefined` for everything else, including state-change events from `update()` and periodic `TIME_INTERVAL` reports.

Player-specific request categories belong on the request. CMCD has no concept of a "segment request" or an "init request". A player that wants to filter on such a category puts it on `request.customData` and reads it back in the transform. For the narrower question of manifest or media, the `ot` key already answers in CMCD terms when the player sets it: `data.ot === "m"` is a manifest.

The request is a read-only view (`CmcdTransformRequest`). It is context for the decision, not something to change, and every member is `readonly`. The types cannot cover two cases. A mutable body such as `FormData` or `URLSearchParams` has mutating methods of its own, and JavaScript callers get no compile-time enforcement. Mutating the request in either way is unsupported, and the outgoing report may reflect the mutation. Treat the request as immutable, whatever the compiler can prove.

### Typing `customData`

By default, `customData` values are `unknown`, which forces the bracket access above. Describe the player's data type once, and those reads become ordinary dot access, checked at compile time. Annotating one transform is enough. The rest of the configuration infers the same type, including the top-level `transform`.

```typescript
import { CmcdEventType, CmcdReporter } from "@svta/cml-cmcd";
import type { CmcdEventReportTransform } from "@svta/cml-cmcd";

// The player's own request taxonomy, carried on customData.
type PlayerData = { requestType: "segment" | "manifest" | "license" };

// The only annotation in the configuration.
const segmentsOnly: CmcdEventReportTransform<PlayerData> = (data, request) =>
	request?.customData?.requestType === "segment" ? data : null;

const reporter = new CmcdReporter({
	cid: "video-123",
	enabledKeys: ["br", "bl", "sid", "cid", "v", "sn"],
	// Not annotated, but `customData` is typed here too, so a misspelt
	// "licence" is a compile error rather than a filter that never matches.
	transform: (data, request) =>
		request.customData?.requestType === "license" ? null : data,
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ["url", "rc", "sid", "cid", "v", "e", "ts", "sn"],
			transform: segmentsOnly,
		},
	],
});
```

`new CmcdReporter<PlayerData>({ ... })` states the same type explicitly. That form is clearer when no transform is annotated. Either way, the cost is one annotation per reporter, not one per transform. Without any annotation, nothing changes from the previous section: values remain `unknown` and bracket access still works.

Once a reporter has a type, `createRequestReport()` and `recordResponseReceived()` require the requests you pass to satisfy it. A typo, or a request from a different code path, is a compile error at the call site. Without the type, the transform would read `undefined` and cancel the report without an error:

```typescript
import { CmcdReporter } from "@svta/cml-cmcd";

type PlayerData = { requestType: "segment" | "manifest" | "license" };

const reporter = new CmcdReporter<PlayerData>({ cid: "video-123" });

// Error: 'requestTypo' does not exist in type 'PlayerData'
reporter.createRequestReport({
	url: "https://cdn.example.com/segment.mp4",
	// @ts-expect-error
	customData: { requestTypo: "segment" },
});
```

`customData` is readonly at every depth, not only at the top level. Describing a nested type does not cost you the [read-only guarantee](#the-associated-request):

```typescript
import type { CmcdEventReportTransform } from "@svta/cml-cmcd";

type PlayerData = { timing: { start: number } };

const transform: CmcdEventReportTransform<PlayerData> = (data, request) => {
	const customData = request?.customData;

	// Error: cannot assign to 'start' because it is a read-only property
	// @ts-expect-error
	if (customData) customData.timing.start = 0;

	return data;
};
```

### The data you receive is yours

The first argument is a copy made for this one report. You can mutate it in place without affecting the data store or the reports for other targets. The same is true for nested values. Array keys such as `br` and `ec` are copied, so `data.ec.push("E100")` is safe, and so is changing the `params` of an `SfItem` inside one.

### What a transform cannot change

After your transform returns, the reporter sets `e` and `sid` again and assigns the sequence number `sn` and `msd`. So a transform cannot change the event type of a report to pass a target's `events` filter. It cannot substitute the session ID, create gaps in the sequence numbers, or replay the media start delay marker. Cancelling a report consumes neither a sequence number nor `msd`. Wire `sn` values remain contiguous per destination, and `msd` goes on the next report that is sent.

A transform also cannot remove a key that the event requires. Every event needs `e` and `ts`. State-change events need the key they signal (`sta`, `pr`, `cid`, `bg`, `br`). Custom events need `cen`, error events need `ec`, and response-received events need `url`. If your transform drops one of these keys, or replaces its value with `false` or an empty value, the reporter restores the value it had before. The reporter does not invent values. A required key that was already missing before your transform ran remains missing. The exit from backgrounded mode has no `bg` by design. For the other events, a missing required key is a bug at the call site, not something the transform did.

Configuration cannot remove required keys either. The reporter includes them after the `enabledKeys` filter, so omitting one from `enabledKeys` does not suppress it. The payload remains valid. If a destination must not receive a key that an event requires, leave that event out of the target's `events`. Do not try to remove the key.

`enabledKeys` is still the allowlist for the wire, and it still runs after the transform. A key that your transform adds must also be enabled at the same placement to reach the target. A key that the transform removes remains removed, unless the event requires it.

Cancelling a state-change report does not undo dedup. The transition still happened, and the transform only suppressed its transmission. So the next `update()` with the same value is still deduplicated.

Transforms change CMCD data only. They cannot modify the outgoing HTTP request.

> [!IMPORTANT]
> Transforms must not throw. An exception propagates to whatever called the reporter. For `TIME_INTERVAL` events the caller is the interval timer, so the exception becomes an unhandled error. The library does not catch these exceptions. Sending the data anyway would leak exactly the data that a redaction transform exists to remove. Dropping the data would make the loss impossible to debug. Wrap risky logic in `try` and `catch` and choose: return the data to send the report, or `null` to cancel it.

A throw affects only the target whose transform threw. The other targets still receive the report, and queued batches are still sent. The error reaches your code after the reporter has finished with the event. Only the throwing target loses its report, and the loss consumes no sequence number. Without this isolation, one throwing transform would block every target configured after it. The reason is that the state-change dedup baseline commits before the reporter distributes the report to the targets, and the baseline is never undone.

## Configuration Reference

### CmcdReporterConfig

| Property           | Type                      | Default             | Description                                                                    |
| ------------------ | ------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `sid`              | `string`                  | Auto-generated UUID | Session ID                                                                     |
| `cid`              | `string`                  | `undefined`         | Content ID                                                                     |
| `version`          | `CmcdVersion`             | `CMCD_V2`           | CMCD protocol version                                                          |
| `transmissionMode` | `CmcdTransmissionMode`    | `'query'`           | How to transmit CMCD data in request mode                                      |
| `customHeaderMap`  | `Partial<CmcdHeaderMap>`  | `undefined`         | Routes [custom keys](#custom-keys-in-headers-mode) into specific CMCD header shards in headers mode. |
| `enabledKeys`      | `CmcdKey[]`               | `undefined`         | Keys to include in request reports. If not provided, no keys will be reported. [Custom keys](#custom-keys) must be listed explicitly. |
| `eventTargets`     | `CmcdEventReportConfig[]` | `[]`                | Event reporting targets                                                        |
| `sessionRetention` | `number`                  | `2`                 | Ended sessions to retain state for, in addition to the current one. `0` disables retention. See [Session Changes and Late Responses](#session-changes-and-late-responses). |
| `transform`        | `CmcdRequestReportTransform` | `undefined`      | Transforms or cancels each request report. See [Transforming and Cancelling Reports](#transforming-and-cancelling-reports) and [Typing `customData`](#typing-customdata). |

### CmcdEventReportConfig

| Property      | Type              | Default     | Description                                                                 |
| ------------- | ----------------- | ----------- | --------------------------------------------------------------------------- |
| `url`         | `string`          | Required    | Analytics endpoint URL                                                      |
| `events`      | `CmcdEventType[]` | `undefined` | Events to report. If no events are provided, the target is disabled.        |
| `interval`    | `number`          | `30`        | Seconds between TIME_INTERVAL reports                                       |
| `batchSize`   | `number`          | `1`         | Events to batch before sending                                              |
| `version`     | `CmcdVersion`     | `CMCD_V2`   | CMCD version for this target (must be v2 or higher)                         |
| `enabledKeys` | `CmcdKey[]`       | `undefined` | Keys to include for this target. If not provided, no keys will be reported. [Custom keys](#custom-keys) must be listed explicitly. |
| `transform`   | `CmcdEventReportTransform` | `undefined` | Transforms or cancels each of this target's event reports. See [Typing `customData`](#typing-customdata). |

<!-- libs/cmcd/docs/validation-guide.md -->
---
title: Validation Guide
description: How to validate CMCD payloads
---

# CMCD Validation Guide

The `@svta/cml-cmcd` library provides composable validation functions. They verify that CMCD payloads conform to the CTA-5004 (v1) and CTA-5004-B (v2) specifications. Use them on the receiving side. Examples are an analytics server that collects CMCD event reports, and a CDN log processor that inspects CMCD request data.

## Overview

There are four main validation functions, each for a different aspect of CMCD compliance:

| Function                  | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `validateCmcd`            | Orchestrator: runs key, value, and structure checks               |
| `validateCmcdRequest`     | Validates a `Request` or `HttpRequest` as request-mode data       |
| `validateCmcdEvents`      | Validates a multi-line `application/cmcd` body as event-mode data |
| `validateCmcdEventReport` | Validates a full `HttpRequest` as an event-mode payload           |

All validators return a `CmcdValidationResult`:

```typescript
import type { CmcdValidationSeverity } from "@svta/cml-cmcd";

type CmcdValidationResult = {
	valid: boolean; // true if zero errors (warnings are OK)
	issues: CmcdValidationIssue[];
};

type CmcdValidationIssue = {
	key?: string;
	message: string;
	severity: CmcdValidationSeverity; // 'error' | 'warning'
};
```

## Validating Event Report Payloads

A common use case is validating CMCD v2 event reports received by POST. The payload is usually an `application/cmcd` body with newline-separated CMCD-encoded strings, or `application/json`.

### Using `validateCmcdEvents`

The `validateCmcdEvents` function accepts a raw CMCD string and validates it as an event-mode payload. It supports multi-line `application/cmcd` bodies directly. It validates each non-empty line on its own and merges the results. An empty payload, with no non-empty lines, is an error. A body that ends with a line feed is an error. CTA-5004-B separates records with a single line feed and does not allow a trailing one.

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

// Validate a complete application/cmcd POST body
const body = `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`;

const result = validateCmcdEvents(body);

if (!result.valid) {
	console.error("Invalid CMCD event:", result.issues);
}
```

A single-line string works as well:

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

const result = validateCmcdEvents(
	'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
);
```

### Parsing and Validating `application/cmcd` manually

The `validateCmcdEvents` function validates multi-line `application/cmcd` bodies directly. If you need to validate a single-line string, you can decode the CMCD string and validate the data yourself. `validateCmcdRequest` does the same internally.

```typescript
import { decodeCmcd, validateCmcd } from "@svta/cml-cmcd";

// Simulated POST body (application/cmcd)
const body = `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`;

// Parse each line and validate
const lines = body.split("\n");

for (const line of lines) {
	const data = decodeCmcd(line);
	const result = validateCmcd(data, { reportingMode: "event" });

	if (!result.valid) {
		console.error("Invalid CMCD event:", result.issues);
	}
}
```

## Validating Request Mode Data

In request mode, CMCD data is attached to segment requests as query parameters or HTTP headers. The validator checks that event-only and response-only keys are absent.

### Using `validateCmcdRequest`

The `validateCmcdRequest` function accepts a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object or an `HttpRequest` object from `@svta/cml-utils`. It checks for CMCD headers first. If it finds any CMCD header shards, it delegates to `validateCmcdHeaders`, which verifies the shard placement. Otherwise, it extracts the `CMCD` query parameter from the URL. A request that carries CMCD data in both the headers and the query parameter is an error. CTA-5004-B allows one transmission mode per request. The validator still checks the headers and returns their data. A `CMCD` parameter inside the URL fragment is ignored, because a server never receives the fragment. When it is the only CMCD data on the request, the error message names the fragment.

```typescript
import { validateCmcdRequest } from "@svta/cml-cmcd";

// From a Request with CMCD headers
const request = new Request("https://cdn.example.com/seg.mp4", {
	headers: {
		"CMCD-Object": "br=5000,d=4000,ot=v",
		"CMCD-Request": "bl=25000",
		"CMCD-Session": 'sid="abc"',
	},
});
const headerResult = validateCmcdRequest(request);

// From a Request with CMCD in the query parameter
const queryRequest = new Request(
	"https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000",
);
const queryResult = validateCmcdRequest(queryRequest);

// From an HttpRequest object
const httpRequestResult = validateCmcdRequest({
	url: "https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000",
});
```

### From Query Parameters manually

The `validateCmcdRequest` function validates the `CMCD` query parameter from the URL. If you need to validate the parameter yourself, extract it from the URL and validate the data with the `validateCmcd` function.

```typescript
import { fromCmcdQuery, validateCmcd } from "@svta/cml-cmcd";

// Extract CMCD from a request URL's query string
const url = new URL(
	"https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000%2Cd%3D4000%2Cot%3Dv%2Csid%3D%22abc%22",
);

const data = fromCmcdQuery(url.searchParams);
const result = validateCmcd(data, { reportingMode: "request" });

if (!result.valid) {
	console.error("Invalid CMCD request data:", result.issues);
}
```

### From HTTP Headers manually

When CMCD is transmitted in HTTP headers, you can validate the headers yourself with the `validateCmcdHeaders` function.

```typescript
import { validateCmcdHeaders } from "@svta/cml-cmcd";

// Pass raw header strings directly — decoding is handled internally.
// Request mode validation is applied automatically since headers are
// only used in request mode.
const result = validateCmcdHeaders({
	"CMCD-Object": "br=5000,d=4000,ot=v",
	"CMCD-Request": "bl=25000",
	"CMCD-Session": 'sid="abc",sf=d,st=v',
});

if (!result.valid) {
	// Issues may include shard placement errors and/or payload validation errors
	console.error("Validation issues:", result.issues);
}
```

## Version-Aware Validation

The validators detect the CMCD version from the `v` key in the payload. If `v` is absent, they assume version 1, per the specification. The `version` option overrides the detection.

```typescript
import { validateCmcd } from "@svta/cml-cmcd";

// Version inferred from payload (v=2)
const v2Result = validateCmcd({ v: 2, br: [5000], sid: "abc" });

// Version explicitly set via options
const v1Result = validateCmcd({ br: 5000, sid: "abc" }, { version: 1 });
```

### Version-Specific Behavior

- **Key validation**: v2-only keys, such as `sta`, `ec`, and `ab`, are rejected when validating as v1
- **Type validation**: Some keys have different types between versions. For example, `bl` is an integer in v1 but an inner list (array) in v2. Each element of an inner list must be an integer
- **Rounding**: `dl`, `mtp`, and `rtp` must be multiples of 100 in both versions. `bl` must be a multiple of 100 in v1. A value that violates one of these rules is an error. In v2, a `bl` or `tbl` value that is not a multiple of 100 produces a warning
- **Version key**: v2 payloads must include the `v` key. v1 payloads should omit it
- **Key conflicts**: In v2, `d` and `tpb` must match the object type in `ot`. `d` is allowed for `a`, `v`, `av`, `tt`, `c`, and `o`. `tpb` is allowed for `a`, `v`, `av`, and `c`. `ab`, `lab`, and `tab` must not appear together with `br`, `lb`, and `tb`. Each conflict is an error

## Handling Validation Results

### Errors and Warnings

A payload is `valid` if it has zero errors. Warnings mark specification recommendations that are not strict violations.

```typescript
import { validateCmcd, CMCD_VALIDATION_SEVERITY_ERROR } from "@svta/cml-cmcd";

const result = validateCmcd({ v: 2, bl: [150], sid: "abc" });

// Separate errors from warnings
const errors = result.issues.filter(
	(i) => i.severity === CMCD_VALIDATION_SEVERITY_ERROR,
);
const warnings = result.issues.filter(
	(i) => i.severity !== CMCD_VALIDATION_SEVERITY_ERROR,
);

console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

// bl=150 produces a warning (should be rounded to the nearest 100 ms)
// but the payload is still valid
```

### Logging Issues

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

function validateAndLog(body: string): boolean {
	const result = validateCmcdEvents(body);

	for (const issue of result.issues) {
		const level = issue.severity === "error" ? "ERROR" : "WARN";
		const key = issue.key ? `[${issue.key}] ` : "";
		console.log(`${level}: ${key}${issue.message}`);
	}

	return result.valid;
}
```

## Custom Keys

All validators recognize custom keys: lowercase hyphenated keys that `isCmcdCustomKey` accepts, such as `com.example-mykey`. Keys that fail the check, including names with uppercase letters or a leading digit, are reported as unknown keys. For sending custom keys through `CmcdReporter`, including the naming rules and the `enabledKeys` requirements, see the [User Guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/user-guide.md#custom-keys).

- `validateCmcdKeys`: accepts custom keys without error
- `validateCmcdValues`: checks that custom key values are strings of at most 64 characters, and that the key name contains a hyphen
- `validateCmcdHeaders`: allows custom keys in any header shard

```typescript
import { validateCmcdValues } from "@svta/cml-cmcd";

const result = validateCmcdValues({
	"com.example-debug": "enabled",
	"x-player-version": "2.1.0",
});

// result.valid === true
```

## References

- [CTA-5004-B: Common Media Client Data v2](https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html)
- [CTA-5004: Common Media Client Data v1 (PDF)](https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf)

<!-- libs/cmcd/config/cml-cmcd.api.md -->
## API Report File for "@svta/cml-cmcd"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { DeepReadonly } from '@svta/cml-utils';
import { ExclusiveRecord } from '@svta/cml-utils';
import { HttpRequest } from '@svta/cml-utils';
import { HttpResponse } from '@svta/cml-utils';
import { SfBareItem } from '@svta/cml-structured-field-values';
import { SfItem } from '@svta/cml-structured-field-values';
import { SfToken } from '@svta/cml-structured-field-values';
import { ValueOf } from '@svta/cml-utils';
import { ValueOrArray } from '@svta/cml-utils';

// @public
export function appendCmcdHeaders(headers: Record<string, string>, cmcd: Cmcd, options?: CmcdEncodeOptions): Record<string, string>;

// @public
export function appendCmcdQuery(url: string, cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @public
export type Cmcd = CmcdRequest & CmcdResponse & CmcdEvent;

// @public
export const CMCD_DEFAULT_TIME_INTERVAL = 30;

// @public
export const CMCD_EVENT_AD_BREAK_END: "abe";

// @public
export const CMCD_EVENT_AD_BREAK_START: "abs";

// @public
export const CMCD_EVENT_AD_END: "ae";

// @public
export const CMCD_EVENT_AD_START: "as";

// @public
export const CMCD_EVENT_BACKGROUNDED_MODE: "b";

// @public
export const CMCD_EVENT_BITRATE_CHANGE: "bc";

// @public
export const CMCD_EVENT_CONTENT_ID: "c";

// @public
export const CMCD_EVENT_CUSTOM_EVENT: "ce";

// @public
export const CMCD_EVENT_ERROR: "e";

// @public
export const CMCD_EVENT_KEYS: readonly ["cen", "e", "h", "ts"];

// @public
export const CMCD_EVENT_MODE: "event";

// @public
export const CMCD_EVENT_MUTE: "m";

// @public
export const CMCD_EVENT_PLAY_STATE: "ps";

// @public
export const CMCD_EVENT_PLAYBACK_RATE: "pr";

// @public
export const CMCD_EVENT_PLAYER_COLLAPSE: "pc";

// @public
export const CMCD_EVENT_PLAYER_EXPAND: "pe";

// @public
export const CMCD_EVENT_RESPONSE_RECEIVED: "rr";

// @public
export const CMCD_EVENT_SKIP: "sk";

// @public
export const CMCD_EVENT_TIME_INTERVAL: "t";

// @public
export const CMCD_EVENT_UNMUTE: "um";

// @public
export const CMCD_FORMATTER_MAP: Record<string, CmcdFormatter>;

// @public
export const CMCD_HEADER_FIELDS: readonly CmcdHeaderField[];

// @public
export const CMCD_HEADER_MAP: Record<CmcdRequestKey | "nrr", CmcdHeaderField>;

// @public
export const CMCD_HEADERS: "headers";

// @public @deprecated
export const CMCD_JSON: "json";

// @public
export const CMCD_KEYS: CmcdKey[];

// @public
export const CMCD_MIME_TYPE = "application/cmcd";

// @public
export const CMCD_OBJECT: "CMCD-Object";

// @public
export const CMCD_PARAM = "CMCD";

// @public
export const CMCD_QUERY: "query";

// @public
export const CMCD_RECORDED_REPORT_MODE_EVENT: "event";

// @public
export const CMCD_RECORDED_REPORT_MODE_HEADER: "header";

// @public
export const CMCD_RECORDED_REPORT_MODE_QUERY: "query";

// @public
export const CMCD_RECORDED_REQUEST_TYPE_EVENT: "event";

// @public
export const CMCD_RECORDED_REQUEST_TYPE_MANIFEST: "manifest";

// @public
export const CMCD_RECORDED_REQUEST_TYPE_SEGMENT: "segment";

// @public
export const CMCD_RECORDED_REQUEST_TYPE_UNKNOWN: "unknown";

// @public
export const CMCD_REQUEST: "CMCD-Request";

// @public
export const CMCD_REQUEST_KEYS: readonly ["ab", "bg", "bl", "br", "bs", "bsa", "bsd", "bsda", "cdn", "cid", "cs", "d", "dfa", "dl", "ec", "lab", "lb", "ltc", "msd", "mtp", "nor", "nr", "ot", "pb", "pr", "pt", "rtp", "sf", "sid", "sn", "st", "sta", "su", "tab", "tb", "tbl", "tpb", "v"];

// @public
export const CMCD_REQUEST_MODE: "request";

// @public
export const CMCD_REQUEST_PROVENANCE: unique symbol;

// @public
export const CMCD_RESPONSE_KEYS: readonly ["cmsdd", "cmsds", "rc", "smrt", "ttfb", "ttfbb", "ttlb", "url"];

// @public
export const CMCD_SESSION: "CMCD-Session";

// @public
export const CMCD_STATUS: "CMCD-Status";

// @public
export const CMCD_V1: 1;

// @public
export const CMCD_V1_KEYS: readonly ["bl", "br", "bs", "cid", "d", "dl", "mtp", "nor", "nrr", "ot", "pr", "rtp", "sf", "sid", "st", "su", "tb", "v"];

// @public
export const CMCD_V2: 2;

// @public
export const CMCD_VALIDATION_SEVERITY_ERROR: "error";

// @public
export const CMCD_VALIDATION_SEVERITY_WARNING: "warning";

// @public
export type CmcdCustomKey = Lowercase<`${string}-${string}`>;

// @public
export type CmcdCustomValue = string | SfItem<string> | (string | SfItem<string>)[] | number | SfItem<number> | (number | SfItem<number>)[] | boolean | SfItem<boolean> | (boolean | SfItem<boolean>)[] | symbol | SfItem<symbol> | (symbol | SfItem<symbol>)[] | SfToken | SfItem<SfToken> | (SfToken | SfItem<SfToken>)[];

// @public
export type CmcdData = CmcdV1Data | CmcdV2Data;

// @public
export type CmcdDataValidationResult = CmcdValidationResult & {
    data: CmcdData;
};

// @public
export type CmcdDecodeOptions = {
    convertToLatest?: boolean;
    useSymbol?: boolean;
};

// @public
export type CmcdEncodeOptions = {
    version?: CmcdVersion;
    reportingMode?: CmcdReportingMode;
    formatters?: Partial<CmcdFormatterMap>;
    customHeaderMap?: Partial<CmcdHeaderMap>;
    filter?: (key: CmcdKey) => boolean;
    baseUrl?: string;
    events?: string[];
};

// @public
export type CmcdEvent = CmcdRequest & {
    cen?: string;
    e?: CmcdEventType;
    h?: string;
    ts?: number;
};

// @public
export type CmcdEventReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
    version?: typeof CMCD_V2;
    url: string;
    events?: CmcdEventType[];
    interval?: number;
    batchSize?: number;
    transform?: CmcdEventReportTransform<C>;
};

// @public
export type CmcdEventReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C> | undefined) => Cmcd | null;

// @public
export type CmcdEventsValidationResult = CmcdValidationResult & {
    data: CmcdData[];
};

// @public
export const CmcdEventType: {
    readonly BITRATE_CHANGE: typeof CMCD_EVENT_BITRATE_CHANGE;
    readonly PLAY_STATE: typeof CMCD_EVENT_PLAY_STATE;
    readonly PLAYBACK_RATE: typeof CMCD_EVENT_PLAYBACK_RATE;
    readonly ERROR: typeof CMCD_EVENT_ERROR;
    readonly TIME_INTERVAL: typeof CMCD_EVENT_TIME_INTERVAL;
    readonly CONTENT_ID: typeof CMCD_EVENT_CONTENT_ID;
    readonly BACKGROUNDED_MODE: typeof CMCD_EVENT_BACKGROUNDED_MODE;
    readonly MUTE: typeof CMCD_EVENT_MUTE;
    readonly UNMUTE: typeof CMCD_EVENT_UNMUTE;
    readonly PLAYER_EXPAND: typeof CMCD_EVENT_PLAYER_EXPAND;
    readonly PLAYER_COLLAPSE: typeof CMCD_EVENT_PLAYER_COLLAPSE;
    readonly RESPONSE_RECEIVED: typeof CMCD_EVENT_RESPONSE_RECEIVED;
    readonly AD_START: typeof CMCD_EVENT_AD_START;
    readonly AD_END: typeof CMCD_EVENT_AD_END;
    readonly AD_BREAK_START: typeof CMCD_EVENT_AD_BREAK_START;
    readonly AD_BREAK_END: typeof CMCD_EVENT_AD_BREAK_END;
    readonly SKIP: typeof CMCD_EVENT_SKIP;
    readonly CUSTOM_EVENT: typeof CMCD_EVENT_CUSTOM_EVENT;
};

// @public (undocumented)
export type CmcdEventType = ValueOf<typeof CmcdEventType>;

// @public
export type CmcdFormatter = (value: CmcdValue, options: CmcdFormatterOptions) => ValueOrArray<number | SfItem<number>> | ValueOrArray<string | SfItem<string>>;

// @public
export type CmcdFormatterMap = Record<CmcdKey, CmcdFormatter>;

// @public
export type CmcdFormatterOptions = {
    version: CmcdVersion;
    reportingMode: CmcdReportingMode;
    baseUrl?: string;
};

// @public
export const CmcdHeaderField: {
    readonly OBJECT: typeof CMCD_OBJECT;
    readonly REQUEST: typeof CMCD_REQUEST;
    readonly SESSION: typeof CMCD_SESSION;
    readonly STATUS: typeof CMCD_STATUS;
};

// @public (undocumented)
export type CmcdHeaderField = ValueOf<typeof CmcdHeaderField>;

// @public
export type CmcdHeaderKey = keyof typeof CMCD_HEADER_MAP;

// @public
export type CmcdHeaderMap = Record<CmcdHeaderField, CmcdKey[]>;

// @public
export type CmcdHeaderValue = CmcdRequest | CmcdV1;

// @public
export type CmcdKey = keyof Cmcd | keyof CmcdV1;

// @public
export const CmcdObjectType: {
    readonly MANIFEST: "m";
    readonly AUDIO: "a";
    readonly VIDEO: "v";
    readonly MUXED: "av";
    readonly INIT: "i";
    readonly CAPTION: "c";
    readonly TIMED_TEXT: "tt";
    readonly KEY: "k";
    readonly OTHER: "o";
};

// @public (undocumented)
export type CmcdObjectType = ValueOf<typeof CmcdObjectType>;

// @public
export type CmcdObjectTypeList = (number | SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>)[];

// @public
export const CmcdPlayerState: {
    readonly STARTING: "s";
    readonly PLAYING: "p";
    readonly SEEKING: "k";
    readonly REBUFFERING: "r";
    readonly PAUSED: "a";
    readonly WAITING: "w";
    readonly ENDED: "e";
    readonly FATAL_ERROR: "f";
    readonly QUIT: "q";
    readonly PRELOADING: "d";
};

// @public (undocumented)
export type CmcdPlayerState = ValueOf<typeof CmcdPlayerState>;

// @public
export type CmcdRecordedReport = {
    readonly request: HttpRequest;
    readonly type: CmcdRecordedRequestType;
    readonly reportingMode: CmcdRecordedReportMode;
    readonly timestamp: number;
};

// @public
export const CmcdRecordedReportMode: {
    readonly QUERY: typeof CMCD_RECORDED_REPORT_MODE_QUERY;
    readonly HEADER: typeof CMCD_RECORDED_REPORT_MODE_HEADER;
    readonly EVENT: typeof CMCD_RECORDED_REPORT_MODE_EVENT;
};

// @public (undocumented)
export type CmcdRecordedReportMode = ValueOf<typeof CmcdRecordedReportMode>;

// @public
export const CmcdRecordedRequestType: {
    readonly MANIFEST: typeof CMCD_RECORDED_REQUEST_TYPE_MANIFEST;
    readonly SEGMENT: typeof CMCD_RECORDED_REQUEST_TYPE_SEGMENT;
    readonly EVENT: typeof CMCD_RECORDED_REQUEST_TYPE_EVENT;
    readonly UNKNOWN: typeof CMCD_RECORDED_REQUEST_TYPE_UNKNOWN;
};

// @public (undocumented)
export type CmcdRecordedRequestType = ValueOf<typeof CmcdRecordedRequestType>;

// @public
export type CmcdReportConfig = {
    version?: CmcdVersion;
    enabledKeys?: CmcdKey[];
};

// @public
export class CmcdReporter<C = Record<string, unknown>> {
    constructor(config: Partial<CmcdReporterConfig<C>>, requester?: (request: HttpRequest) => Promise<{
        status: number;
    }>);
    // @deprecated
    applyRequestReport(req: HttpRequest): HttpRequest;
    createRequestReport<R extends HttpRequest<CmcdReporterCustomData<C>> = HttpRequest<C>>(request: R, data?: Partial<Cmcd>): R & CmcdRequestReport<R["customData"]>;
    flush(): void;
    isRequestReportingEnabled(): boolean;
    recordEvent(type: CmcdEventType, data?: Partial<Cmcd>): void;
    recordResponseReceived<RD extends CmcdReporterCustomData<C> = C>(response: HttpResponse<HttpRequest<RD & {
        cmcd?: Cmcd;
        [CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance;
    }>>, data?: Partial<Cmcd>): void;
    start(): void;
    stop(flush?: boolean): void;
    update(data: Partial<Cmcd>): void;
}

// @public
export type CmcdReporterConfig<C = Record<string, unknown>> = CmcdRequestReportConfig<C> & {
    sid?: string;
    cid?: string;
    eventTargets?: CmcdEventReportConfig<C>[];
    sessionRetention?: number;
};

// @public
export type CmcdReporterCustomData<C> = Record<string, unknown> extends C ? any : C;

// @public
export const CmcdReportingMode: {
    readonly REQUEST: typeof CMCD_REQUEST_MODE;
    readonly EVENT: typeof CMCD_EVENT_MODE;
};

// @public (undocumented)
export type CmcdReportingMode = ValueOf<typeof CmcdReportingMode>;

// @public
export class CmcdReportRecorder {
    attach(options?: CmcdReportRecorderOptions): void;
    clear(): void;
    detach(): void;
    getReports(): CmcdRecordedReport[];
    waitForEvents(options?: CmcdReportRecorderWaitOptions): Promise<CmcdRecordedReport[]>;
    waitForManifest(options?: CmcdReportRecorderWaitOptions): Promise<CmcdRecordedReport[]>;
    waitForReports(options?: CmcdReportRecorderWaitOptions): Promise<CmcdRecordedReport[]>;
    waitForSegments(options?: CmcdReportRecorderWaitOptions): Promise<CmcdRecordedReport[]>;
}

// @public
export type CmcdReportRecorderOptions = {
    eventTargetUrls?: readonly string[];
    transports?: readonly CmcdTransportAdapter[];
    waitTimeout?: number;
    onReport?: (report: CmcdRecordedReport) => void;
};

// @public
export type CmcdReportRecorderWaitOptions = {
    count?: number;
    timeout?: number;
};

// @public
export type CmcdRequest = {
    [index: CmcdCustomKey]: CmcdCustomValue | undefined;
    ab?: CmcdObjectTypeList;
    bg?: boolean;
    bl?: CmcdObjectTypeList;
    br?: CmcdObjectTypeList;
    bs?: boolean;
    bsa?: CmcdObjectTypeList;
    bsd?: CmcdObjectTypeList;
    bsda?: CmcdObjectTypeList;
    cdn?: string;
    cid?: string;
    cs?: string;
    d?: number;
    dfa?: number;
    dl?: number;
    ec?: string[];
    lab?: CmcdObjectTypeList;
    lb?: CmcdObjectTypeList;
    ltc?: number;
    msd?: number;
    mtp?: CmcdObjectTypeList;
    nor?: (string | SfItem<string, {
        r: string;
    }>)[];
    nr?: boolean;
    ot?: CmcdObjectType;
    pb?: CmcdObjectTypeList;
    pr?: number;
    pt?: number;
    rtp?: number;
    sf?: CmcdStreamingFormat;
    sid?: string;
    sn?: number;
    st?: CmcdStreamType;
    sta?: CmcdPlayerState;
    su?: boolean;
    tab?: CmcdObjectTypeList;
    tb?: CmcdObjectTypeList;
    tbl?: CmcdObjectTypeList;
    tpb?: CmcdObjectTypeList;
    v?: number;
};

// @public
export type CmcdRequestDeliver = (request: HttpRequest) => Response | undefined;

// @public
export type CmcdRequestKey = keyof CmcdRequest | "nrr";

// @public
export type CmcdRequestProvenance = {
    readonly sid: string;
    readonly cid?: string;
    readonly data?: string;
};

// @public
export type CmcdRequestReport<D = unknown> = HttpRequest & {
    customData: {
        cmcd: Cmcd;
        [CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance;
    } & D;
    headers: Record<string, string>;
};

// @public
export type CmcdRequestReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
    transmissionMode?: CmcdTransmissionMode;
    customHeaderMap?: Partial<CmcdHeaderMap>;
    transform?: CmcdRequestReportTransform<C>;
};

// @public
export type CmcdRequestReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C>) => Cmcd | null;

// @public
export type CmcdResponse = CmcdRequest & {
    cmsdd?: string;
    cmsds?: string;
    rc?: number;
    smrt?: string;
    ttfb?: number;
    ttfbb?: number;
    ttlb?: number;
    url?: string;
};

// @public
export const CmcdStreamingFormat: {
    readonly DASH: "d";
    readonly HLS: "h";
    readonly SMOOTH: "s";
    readonly OTHER: "o";
};

// @public (undocumented)
export type CmcdStreamingFormat = ValueOf<typeof CmcdStreamingFormat>;

// @public
export const CmcdStreamType: {
    readonly VOD: "v";
    readonly LIVE: "l";
    readonly LOW_LATENCY: "ll";
};

// @public (undocumented)
export type CmcdStreamType = ValueOf<typeof CmcdStreamType>;

// @public
export type CmcdTransformRequest<C = Record<string, unknown>> = Readonly<Omit<HttpRequest, "customData" | "headers">> & {
    readonly headers?: Readonly<Record<string, string>>;
    readonly customData?: DeepReadonly<C>;
};

// @public
export const CmcdTransmissionMode: {
    readonly JSON: typeof CMCD_JSON;
    readonly QUERY: typeof CMCD_QUERY;
    readonly HEADERS: typeof CMCD_HEADERS;
};

// @public (undocumented)
export type CmcdTransmissionMode = ValueOf<typeof CmcdTransmissionMode>;

// @public
export type CmcdTransportAdapter = {
    attach(deliver: CmcdRequestDeliver): () => void;
};

// @public
export type CmcdV1 = {
    bl?: number;
    br?: number;
    mtp?: number;
    nor?: string;
    nrr?: string;
    tb?: number;
};

// @public
export type CmcdV1Data = Omit<CmcdRequest, keyof CmcdV1 | "v"> & CmcdV1 & {
    v?: 1;
};

// @public
export type CmcdV2Data = Omit<Cmcd, "v"> & {
    v: 2;
};

// @public
export type CmcdValidationIssue = {
    key?: string;
    message: string;
    severity: CmcdValidationSeverity;
};

// @public
export type CmcdValidationOptions = {
    version?: CmcdVersion;
    reportingMode?: CmcdReportingMode;
};

// @public
export type CmcdValidationResult = {
    valid: boolean;
    issues: CmcdValidationIssue[];
};

// @public
export const CmcdValidationSeverity: {
    readonly ERROR: typeof CMCD_VALIDATION_SEVERITY_ERROR;
    readonly WARNING: typeof CMCD_VALIDATION_SEVERITY_WARNING;
};

// @public
export type CmcdValidationSeverity = ValueOf<typeof CmcdValidationSeverity>;

// @public
export type CmcdValue = ValueOf<Cmcd>;

// @public
export type CmcdVersion = typeof CMCD_V1 | typeof CMCD_V2;

// @public
export function createFetchTransport(): CmcdTransportAdapter;

// @public
export function createXhrTransport(): CmcdTransportAdapter;

// @public
export function decodeCmcd(cmcd: string, options: CmcdDecodeOptions & {
    convertToLatest: true;
}): Cmcd;

// @public
export function decodeCmcd<T extends CmcdData = CmcdData>(cmcd: string, options?: CmcdDecodeOptions): T;

// @public
export function encodeCmcd(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @public
export function fromCmcdHeaders(headers: Record<string, string> | Headers, options: CmcdDecodeOptions & {
    convertToLatest: true;
}): Cmcd;

// @public
export function fromCmcdHeaders(headers: Record<string, string> | Headers, options?: CmcdDecodeOptions): CmcdData;

// @public
export function fromCmcdQuery(query: string | URLSearchParams, options: CmcdDecodeOptions & {
    convertToLatest: true;
}): Cmcd;

// @public
export function fromCmcdQuery(query: string | URLSearchParams, options?: CmcdDecodeOptions): CmcdData;

// @public
export function fromCmcdUrl(url: string, options: CmcdDecodeOptions & {
    convertToLatest: true;
}): Cmcd;

// @public
export function fromCmcdUrl(url: string, options?: CmcdDecodeOptions): CmcdData;

// @public
export function groupCmcdHeaders(cmcd: Cmcd, customHeaderMap?: Partial<CmcdHeaderMap>): Record<CmcdHeaderField, CmcdHeaderValue>;

// @public
export function isCmcdCustomKey(key: CmcdKey): boolean;

// @public
export function isCmcdEventKey(key: string): key is keyof Cmcd;

// @public
export function isCmcdRequestKey(key: string): key is keyof Cmcd;

// @public
export function isCmcdResponseReceivedKey(key: string): key is keyof Cmcd;

// @public
export function isCmcdV1Data(data: CmcdData): data is CmcdV1Data;

// @public
export function isCmcdV1Key(key: string): key is CmcdKey;

// @public
export function isCmcdV2Data(data: CmcdData): data is CmcdV2Data;

// @public
export function prepareCmcdData(obj: Record<string, any>, options?: CmcdEncodeOptions): Cmcd;

// @public
export function toCmcdHeaders(cmcd: Cmcd, options?: CmcdEncodeOptions): Record<CmcdHeaderField, string>;

// @public
export function toCmcdQuery(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @public
export function toCmcdUrl(cmcd: Cmcd, options?: CmcdEncodeOptions): string;

// @public
export function toCmcdValue<V extends SfBareItem, P>(value: V, params?: P): SfItem<V, P>;

// @public
export function validateCmcd(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult;

// @public
export function validateCmcdEventReport(request: HttpRequest, options?: Omit<CmcdValidationOptions, "reportingMode">): CmcdEventsValidationResult;

// @public
export function validateCmcdEvents(cmcd: string, options?: Omit<CmcdValidationOptions, "reportingMode">): CmcdEventsValidationResult;

// @public
export function validateCmcdHeaders(headers: Record<string, string> | Headers, options?: Omit<CmcdValidationOptions, "reportingMode">): CmcdDataValidationResult;

// @public
export function validateCmcdKeys(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult;

// @public
export function validateCmcdRequest(request: Request | HttpRequest, options?: Omit<CmcdValidationOptions, "reportingMode">): CmcdDataValidationResult;

// @public
export function validateCmcdStructure(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult;

// @public
export function validateCmcdValues(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult;

// (No @packageDocumentation comment for this package)

```
