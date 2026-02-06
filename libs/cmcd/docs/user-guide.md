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

## Recording Events

Use the `recordEvent()` method to record player events for event-mode reporting. The second argument is an optional object of data to include in the event report:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

// Persistent data should be updated using `update()` before recording events
reporter.update({ sta: "p" });
reporter.recordEvent(CmcdEventType.PLAY_STATE);

// Event specific data should be passed as the second argument to `recordEvent()`
reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: "custom-event-name" });
```

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
| `enabledKeys`      | `CmcdKey[]`               | `undefined`         | Keys to include in request reports. If not provided, no keys will be reported. |
| `eventTargets`     | `CmcdEventReportConfig[]` | `[]`                | Event reporting targets                                                        |

### CmcdEventReportConfig

| Property      | Type              | Default     | Description                                                                 |
| ------------- | ----------------- | ----------- | --------------------------------------------------------------------------- |
| `url`         | `string`          | Required    | Analytics endpoint URL                                                      |
| `events`      | `CmcdEventType[]` | `undefined` | Events to report. If no events are provided, the target is disabled.        |
| `interval`    | `number`          | `30`        | Seconds between TIME_INTERVAL reports                                       |
| `batchSize`   | `number`          | `1`         | Events to batch before sending                                              |
| `version`     | `CmcdVersion`     | `CMCD_V2`   | CMCD version for this target (must be v2 or higher)                         |
| `enabledKeys` | `CmcdKey[]`       | `undefined` | Keys to include for this target. If not provided, no keys will be reported. |
