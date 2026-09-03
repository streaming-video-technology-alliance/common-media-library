---
title: User Guide
description: How to use the CMCD reporter
---

# CMCD User Guide

The `CmcdReporter` class manages Common Media Client Data (CMCD) reporting in a video player from one place. It handles request-mode reporting, which adds CMCD data to media requests, and event-mode reporting, which sends periodic reports to analytics endpoints.

## Terms

| Term | Meaning |
| --- | --- |
| CMCD | Common Media Client Data. CTA-5004-B is the version 2 specification. |
| Request mode | The reporter adds CMCD data to a media request, as a query parameter or as headers. |
| Event mode | The reporter sends CMCD reports to event targets in a POST body. |
| Event target | An analytics endpoint configured in `eventTargets`, with its own events, keys, and interval. |
| Destination | The request path or one event target. |
| Data store | The values set with `update()`. The reporter keeps them and includes them in later reports. |
| Session | One playback session, identified by the session ID key `sid`. |
| State-change event | An event that `update()` fires when a tracked key changes value. |
| Dedup | Deduplication. `update()` drops a state-change event when the value did not change. |
| Transform | A function that changes or cancels one report before it is sent. |
| Provenance record | The frozen record that `createRequestReport()` attaches to a request, so that a late response reports under the right session. |
| Wire format | The encoded form of a report as it is transmitted. RFC 8941, the structured field values standard, defines the encoding. |
| Shard | One of the CMCD headers in headers mode, such as `CMCD-Object`, `CMCD-Request`, and `CMCD-Session`. |
| `msd` | The media start delay key. The reporter sends it once per session. |

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

The CMCD specification requires certain keys to be formatted before transmission. `CmcdReporter` does this formatting, so always pass raw values in their base units. Do not round or truncate values yourself. For example, pass the exact buffer length in milliseconds:

```typescript
// Correct: pass the raw value, the reporter rounds to nearest 100
reporter.update({ bl: [25432] }); // encoded as bl=(25400)

// Incorrect: do not pre-round the value
reporter.update({ bl: [25400] });
```

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
reporter.update({
	br: [toCmcdValue(5000, { v: true }), toCmcdValue(3000, { a: true })],
});

// This encodes to: br=(5000;v 3000;a)
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

// Absolute URL — converted automatically:
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
- Values that RFC 8941 cannot serialize currently make encoding throw. Examples are strings with control characters and integers outside ±999,999,999,999,999. Validate custom values before you pass them to the reporter. Graceful handling of such values is tracked in [#327](https://github.com/streaming-video-technology-alliance/common-media-library/issues/327).
- The validators in this package expect custom values to be strings of at most 64 characters. Prefer short string values for interoperability. See the [Validation Guide](./validation-guide.md#custom-keys).

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
reporter.update({ br: [5000] });      // → fires BITRATE_CHANGE

// Consecutive updates with the same value are deduplicated.
reporter.update({ sta: "p" }); // dropped (unchanged)
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

### Don't pair `update()` with `recordEvent()` for the same state-change field

Dedup drops the payload of the second call:

```typescript
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
			enabledKeys: ["url", "rc", "ttfb", "ttlb", "br", "d", "ot"],
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

You can supply CMCD keys that the method cannot derive, such as server-provided metrics:

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

The `sid` itself is the session identity. CTA-5004-B expects it to be unique per playback session, so generate a new universally unique identifier (UUID) for every session.

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

The record is the only attribution key. A response whose request has no record is dropped, and a per-call `data.sid` is no substitute. The reporter accepts any record whose `sid` resolves, so you can also construct one. A hand-built request, or a request decorated by another reporter configured with the same session, attributes by naming the `sid`:

```typescript
// The request was never decorated, so the player names the session.
request.customData[CMCD_REQUEST_PROVENANCE] = { sid: "previous-session" };
reporter.recordResponseReceived({ status: 200, request });
```

A response attributed to a session that is no longer retained is dropped, not relabeled with the current session ID. A session change sends the unsent event reports of an ended session before eviction can discard them. Each report keeps the `sid` and sequence number of its own session. A failed batch that is re-queued into an evicted session is discarded with the session.

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

The `enabledKeys` option limits which CMCD keys the reports include:

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
// Error: 'requestTypo' does not exist in type 'PlayerData'
reporter.createRequestReport({
	url: "https://cdn.example.com/segment.mp4",
	customData: { requestTypo: "segment" },
});
```

`customData` is readonly at every depth, not only at the top level. Describing a nested type does not cost you the [read-only guarantee](#the-associated-request):

```typescript
type PlayerData = { timing: { start: number } };

const transform: CmcdEventReportTransform<PlayerData> = (data, request) => {
	const customData = request?.customData;

	// Error: cannot assign to 'start' because it is a read-only property
	if (customData) customData.timing.start = 0;

	return data;
};
```

### The data you receive is yours

The first argument is a copy made for this one report. You can mutate it in place without affecting the data store or the reports for other targets. The same is true for nested values. Array keys such as `br` and `ec` are copied, so `data.ec.push("E100")` is safe, and so is changing the `params` of an `SfItem` inside one.

### What a transform cannot change

After your transform returns, the reporter sets `e` and `sid` again and assigns the sequence number `sn` and `msd`. So a transform cannot change the event type of a report to pass a target's `events` filter. It cannot substitute the session ID, create gaps in the sequence numbers, or replay the media start delay marker. Cancelling a report consumes neither a sequence number nor `msd`. Wire `sn` values remain contiguous per destination, and `msd` goes on the next report that is sent.

A transform also cannot remove a key that the event requires. Every event needs `e` and `ts`. State-change events need the key they signal (`sta`, `pr`, `cid`, `bg`, `br`). Custom events need `cen`, error events need `ec`, and response-received events need `url`. If your transform drops one of these keys, the reporter restores the value it had before. The reporter does not invent values. A required key that was already missing before your transform ran remains missing. That is a bug at the call site, not something the transform did.

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
