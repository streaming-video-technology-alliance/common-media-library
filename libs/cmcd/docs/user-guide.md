---
title: User Guide
description: How to use the CMCD reporter
---

# CMCD User Guide

The `CmcdReporter` class provides a centralized way to manage CMCD (Common Media Client Data) reporting in a video player. It handles both request-mode reporting (adding CMCD data to segment requests) and event-mode reporting (sending periodic reports to analytics endpoints).

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
> The library defaults to the latest CMCD version (`CMCD_V2`). When upgrading the library, if you need to maintain compatibility with an older CMCD version, explicitly set the `version` option (e.g., `version: CMCD_V1`).

## Setting CMCD Data

Use the `update()` method to set or update CMCD data. The reporter maintains an internal state that is applied to all subsequent requests and events.

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
> In CMCD v2, several keys that were previously plain numbers are now typed as `CmcdObjectTypeList` — an inner list that supports per-object-type annotations. Keys like `br`, `bl`, `mtp`, `tb`, `lb`, `ab`, `tab`, `lab`, `tbl`, `pb`, `bsa`, `bsd`, `bsda`, and `tpb` must be passed as arrays (e.g., `br: [5000]`).

### Value Formatting

The CMCD specification requires certain keys to be formatted before transmission. The `CmcdReporter` handles this automatically, so always pass raw, unformatted values in their base units. Do not round or truncate values yourself. For example, pass the exact buffer length in milliseconds:

```typescript
// Correct: pass the raw value, the reporter rounds to nearest 100
reporter.update({ bl: [25432] }); // encoded as bl=(25400)

// Incorrect: do not pre-round the value
reporter.update({ bl: [25400] });
```

### Parameterized Values with toCmcdValue

Some CMCD keys like `nor` (next object request) and `br` (encoded bitrate) support parameterized values in CMCD v2. Use the `toCmcdValue` helper function to attach parameters to values:

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

1. **value** - The bare item value (string, number, boolean, etc.)
2. **params** - An object containing key-value pairs for parameters

```typescript
reporter.update({
	nor: [
		toCmcdValue("seg1.m4s", { r: "0-5000" }),
		toCmcdValue("seg1.m4s", { r: "5000-10000" }),
	],
});

// This encodes to: nor=("seg1.m4s";r="0-5000" "seg1.m4s";r="5000-10000")
```

Many keys allow for a list of numeric values with an associated object type, represented by a boolean flag.

```typescript
reporter.update({
	br: [toCmcdValue(5000, { v: true }), toCmcdValue(3000, { a: true })],
});

// This encodes to: br=(5000;v 3000;a)
```

### Absolute URLs for `nor`

The CMCD specification defines `nor` (next object request) as a path relative to the current request URL. For convenience, `CmcdReporter` also accepts absolute URLs and converts them automatically — same-origin URLs are emitted as relative paths, and cross-origin or already-relative values are passed through unchanged.

```typescript
// When the current request URL is:
//   https://cdn.example.com/streams/video/segment_001.m4s
// either form below produces the same encoded output.

// Already relative (per spec):
reporter.update({
	nor: ["segment_002.m4s"],
});

// Absolute URL — converted automatically:
reporter.update({
	nor: ["https://cdn.example.com/streams/video/segment_002.m4s"],
});

// Both encode to: nor=("segment_002.m4s")
```

## Custom Keys

CMCD allows player-defined key/value pairs alongside the standard keys. Per CTA-5004-B, custom key names MUST carry a hyphenated prefix to ensure there is no namespace collision with future revisions of the specification, and clients SHOULD use reverse-DNS syntax when defining their own prefix (e.g., `com.example-mykey`).

### Naming Rules

The `CmcdCustomKey` type requires a lowercase hyphenated string at compile time. At runtime, `isCmcdCustomKey` enforces the full rule, and keys that fail it are silently dropped: a lowercase first letter, then characters from `a-z 0-9 . -`, with a hyphen that is neither the first nor the last character. These are the CTA-5004-B custom-key rules restricted to names that survive RFC 8941 key serialization, so a key that passes the check is guaranteed to reach the wire.

In practice: **use lowercase reverse-DNS names** like `com.example-mykey`.

### Enabling Custom Keys

Custom keys pass through the same `enabledKeys` filter as standard keys — the top-level `enabledKeys` for request reports, and each target's `enabledKeys` for event reports. There is no wildcard: a custom key that is not listed is silently dropped.

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

Custom values may be strings, numbers, booleans, or tokens, optionally wrapped with `toCmcdValue()` to attach structured-field parameters (see the `CmcdCustomValue` type). Notes on the wire format:

- `true` is encoded as a bare valueless key (`com.example-flag`), per the RFC 8941 boolean convention; `false` is treated like other empty values and dropped entirely.
- Values that cannot be serialized as RFC 8941 structured fields are dropped — for example strings containing control characters, integers outside ±999,999,999,999,999, and token values with characters outside the token grammar.
- The package's receiving-side validators expect custom values to be strings of at most 64 characters — prefer short string values for maximum interoperability. See the [Validation Guide](./validation-guide.md#custom-keys).

### Custom Keys in Headers Mode

In headers transmission mode, custom keys are emitted in the `CMCD-Request` header by default. Use the `customHeaderMap` option to route custom keys into other CMCD header shards — for example, a session-scoped custom key belongs in `CMCD-Session` so intermediaries can treat it as invariant for the session:

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

Custom keys not listed in any shard still default to `CMCD-Request`. Standard keys have fixed shards per the CMCD specification and cannot be re-routed. The option has no effect in query transmission mode or on event reports (which POST a body and have no header shards).

## Recording Events

State-change events (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`,
`BACKGROUNDED_MODE`, `BITRATE_CHANGE`) are fired automatically by
`update()` whenever a tracked field's value differs from the last
reported value. Use `update()` as the canonical entry point.

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

reporter.update({ sta: "p" });        // → fires PLAY_STATE
reporter.update({ pr: 1.5 });         // → fires PLAYBACK_RATE
reporter.update({ cid: "movie-42" }); // → fires CONTENT_ID
reporter.update({ bg: true });        // → fires BACKGROUNDED_MODE
reporter.update({ br: [5000] });      // → fires BITRATE_CHANGE

// Consecutive updates with the same value are deduplicated.
reporter.update({ sta: "p" }); // dropped (unchanged)
```

### Snapshot context on state changes

Auto-fired events emit whatever is currently in the reporter's
persistent data store. Snapshot context can be attached either by
combining the continuous metrics with the state field in a single
`update()` call:

```typescript
reporter.update({ sta: "p", bl: [3000], mtp: [8500], pt: 12500 });
// → fires PLAY_STATE with sta="p", bl=[3000], mtp=[8500], pt=12500
```

…or by persisting them via earlier `update()` calls so they're already
in the data store when the state field changes:

```typescript
// Keep metrics fresh as the player computes them
reporter.update({ bl: [3000], mtp: [8500], pt: 12500 });

// Later, when state changes
reporter.update({ sta: "p" });
// → fires PLAY_STATE with sta="p", bl=[3000], mtp=[8500], pt=12500
```

The same pattern keeps `TIME_INTERVAL` reports useful: those events
are emitted by the reporter on a timer and carry whatever is in the
reporter's data store at that moment, with no caller hook for
per-event data. Keep continuous metrics fresh via `update()` as they
change in the player.

### Don't pair `update()` with `recordEvent()` for the same state-change field

The second call's payload is dropped by dedup:

```typescript
reporter.update({ sta: "p" });                              // auto-fires PLAY_STATE
reporter.recordEvent(CmcdEventType.PLAY_STATE, {            // suppressed:
  sta: "p",                                                 //   sta unchanged
  bl: [3000],                                               //   bl never emitted
});
```

Use the single-call form shown above instead.

### Using `recordEvent()`

`recordEvent()` is for events whose payload is intrinsic to the event
call — they don't represent a persisted state transition:

```typescript
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

For `RESPONSE_RECEIVED`, prefer `recordResponseReceived()` (see below)
— it derives the per-response fields for you.

> [!NOTE]
> The response-received keys (`url`, `rc`, `ttfb`, `ttlb`, `ttfbb`, `cmsdd`, `cmsds`, `smrt`) are only valid on `RESPONSE_RECEIVED` reports. If passed in the `data` of any other event, they are stripped even when listed in `enabledKeys`. Custom hyphenated keys are not affected.

### Custom Events

Custom events (`e=ce`) report player-defined events by name via the `cen` key (a string of at most 64 characters). Two configuration rules apply:

- An event target only receives custom events if `CmcdEventType.CUSTOM_EVENT` is listed in its `events` array — otherwise the event is silently dropped for that target.
- `cen` is always included on custom events and does not need to be in `enabledKeys`, but any additional payload — including custom keys — is still subject to the target's `enabledKeys`.

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

Per CTA-5004-B, when transferring a value with a custom event, the chosen names SHOULD associate the custom key name with the custom event name (as `com.example-quartile` does with `ad-quartile` above). See [Custom Keys](#custom-keys) for the naming rules.

### Recording Response Received Events

The `recordResponseReceived()` method provides a convenient way to record `RESPONSE_RECEIVED` events with automatic derivation of timing metrics from the HTTP response. This method is typically called after a segment request completes.

```typescript
import { CmcdReporter, CmcdEventType } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
	enabledKeys: ["br", "d", "ot", "url", "rc", "ttfb", "ttlb"],
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ["url", "rc", "ttfb", "ttlb", "br", "d", "ot"],
		},
	],
});
```

#### Basic Usage

The method accepts a `CommonMediaResponse` object and automatically derives the following keys:

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
	},
};

reporter.recordResponseReceived(response);
```

#### Complete Request/Response Flow

For full request/response tracking, use `createRequestReport()` before the request and `recordResponseReceived()` after the response. The CMCD data from the original request is automatically included in the response event:

```typescript
async function fetchSegment(
	url: string,
	segmentInfo: SegmentInfo,
): Promise<ArrayBuffer> {
	// Update player state
	reporter.update({
		bl: [this.getBufferLength()],
		mtp: [this.getMeasuredThroughput()],
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
		},
	});

	return buffer;
}
```

#### Providing Additional Data

You can supply additional CMCD keys that cannot be auto-derived, such as server-provided metrics:

```typescript
// Include server-reported metrics from response headers
const serverDeliveryDuration = parseFloat(
	fetchResponse.headers.get("X-Server-Duration") || "0",
);

reporter.recordResponseReceived(response, {
	ttfbb: 25, // Time to first body byte (player-measured)
	cmsdd: serverDeliveryDuration, // CMS delivery duration (from server)
	cmsds: 1500, // CMS delivery speed (from server)
	smrt: 2000, // Server measured round-trip time (from server)
});
```

Values provided in the `data` parameter override any auto-derived values.

## Decorating Segment Requests

Use the `createRequestReport()` method to add CMCD data to segment requests. This method returns a new request object with CMCD data added via query parameters or headers (depending on configuration).

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

This starts an interval timer that automatically records `TIME_INTERVAL` events based on the configured interval.

### Stopping the Reporter

Call `stop()` to stop automatic reporting:

```typescript
reporter.stop();
```

### Flushing Events

Call `flush()` to immediately send all queued events, regardless of batch size:

```typescript
// Send all pending events (useful when playback ends)
reporter.flush();
```

### Complete Lifecycle Example

```typescript
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
import { CmcdReporter } from "@svta/cml-cmcd";

const customRequester = async (request) => {
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

You can limit which CMCD keys are included in reports using the `enabledKeys` option:

```typescript
import { CmcdReporter, CMCD_KEYS } from "@svta/cml-cmcd";

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
> Certain keys, such as `v` (version), are required by the CMCD specification and will always be included in reports regardless of the `enabledKeys` setting. The `enabledKeys` property cannot be used to disable these keys.

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

### CmcdEventReportConfig

| Property      | Type              | Default     | Description                                                                 |
| ------------- | ----------------- | ----------- | --------------------------------------------------------------------------- |
| `url`         | `string`          | Required    | Analytics endpoint URL                                                      |
| `events`      | `CmcdEventType[]` | `undefined` | Events to report. If no events are provided, the target is disabled.        |
| `interval`    | `number`          | `30`        | Seconds between TIME_INTERVAL reports                                       |
| `batchSize`   | `number`          | `1`         | Events to batch before sending                                              |
| `version`     | `CmcdVersion`     | `CMCD_V2`   | CMCD version for this target (must be v2 or higher)                         |
| `enabledKeys` | `CmcdKey[]`       | `undefined` | Keys to include for this target. If not provided, no keys will be reported. [Custom keys](#custom-keys) must be listed explicitly. |
