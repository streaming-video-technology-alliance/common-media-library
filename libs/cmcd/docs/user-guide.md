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

	// Optional: Keys to include in request reports (if not provided, target is disabled)
	enabledKeys: ["br", "bl", "d", "ot", "sid", "cid", "mtp", "sf", "st"],

	// Event reporting targets
	eventTargets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [
				CmcdEventType.PLAY_STATE,
				CmcdEventType.ERROR,
				CmcdEventType.TIME_INTERVAL,
			],
			interval: 10, // seconds between TIME_INTERVAL reports
			batchSize: 5, // number of events to batch before sending
			enabledKeys: ["br", "bl", "sid", "cid", "e", "ts", "sn"],
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
	br: 5000, // Encoded bitrate (kbps)
	d: 4000, // Segment duration (ms)
	ot: "v", // Object type: video
	bl: 25000, // Buffer length (ms)
	mtp: 12000, // Measured throughput (kbps)
	sf: "d", // Streaming format: DASH
	st: "v", // Stream type: VOD
});

// Update individual fields as playback state changes
reporter.update({ bl: 30000 }); // Buffer increased
reporter.update({ pr: 1.5 }); // Playback rate changed
reporter.update({ bs: true }); // Buffer starvation occurred
```

### Parameterized Values with CmcdItem

Some CMCD keys like `nor` (next object request) and `br` (encoded bitrate) support parameterized values in CMCD v2. Use the `toCmcdValue` helper function to attach parameters to values:

```typescript
import { CmcdReporter, CmcdItem } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	cid: "video-123",
});

// Using CmcdItem to add byte-range parameters to next object requests
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

// This encodes to: br=("5000";v "3000";a)
```

## Recording Events

Use the `recordEvent()` method to record player events for event-mode reporting. The second argument is an optional object of data to include in the event report:

```typescript
import { CmcdEventType } from "@svta/cml-cmcd";

// Record a play state change
reporter.recordEvent(CmcdEventType.PLAY_STATE);

// Record an error
reporter.recordEvent(CmcdEventType.ERROR);

// Record user interactions
reporter.recordEvent(CmcdEventType.MUTE);
reporter.recordEvent(CmcdEventType.PLAYER_EXPAND);

// Record ad events
reporter.recordEvent(CmcdEventType.AD_BREAK_START);
reporter.recordEvent(CmcdEventType.AD_START);
reporter.recordEvent(CmcdEventType.AD_END);
reporter.recordEvent(CmcdEventType.AD_BREAK_END);

// Record skip event
reporter.recordEvent(CmcdEventType.SKIP);

// Record custom events
reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: "custom-event-name" });
```

## Decorating Segment Requests

Use the `applyRequestReport()` method to add CMCD data to segment requests. This method returns a modified request object with CMCD data added via query parameters or headers (depending on configuration).

### Query Parameter Mode (Default)

```typescript
import { CmcdReporter, CMCD_QUERY } from "@svta/cml-cmcd";

const reporter = new CmcdReporter({
	transmissionMode: CMCD_QUERY,
});

// Update CMCD data before the request
reporter.update({
	br: [5000],
	bl: 25000,
	d: 4000,
	ot: "v",
});

// Create the original request
const request = {
	url: "https://cdn.example.com/video/segment_001.m4s",
	method: "GET",
	headers: {},
};

// Apply CMCD data to the request
const decoratedRequest = reporter.applyRequestReport(request);

// decoratedRequest.url will be:
// https://cdn.example.com/video/segment_001.m4s?CMCD=br%3D(%225000%22%3Bv)%26bl%3D25000%26d%3D4000%26ot%3Dv

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
	br: 5000,
	bl: 25000,
	d: 4000,
	ot: "v",
	sid: "session-123",
});

const request = {
	url: "https://cdn.example.com/video/segment_001.m4s",
	method: "GET",
	headers: {},
};

const decoratedRequest = reporter.applyRequestReport(request);

// decoratedRequest.headers will contain:
// {
//   'CMCD-Object': 'br=5000,d=4000,ot=v',
//   'CMCD-Request': 'bl=25000',
//   'CMCD-Session': 'sid="session-123"',
// }
```

### Integration with a Video Player

```typescript
class VideoPlayer {
	private reporter: CmcdReporter;

	constructor() {
		this.reporter = new CmcdReporter({
			cid: "video-content-id",
			transmissionMode: CMCD_QUERY,
			targets: [
				{
					url: "https://analytics.example.com/cmcd",
					events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR],
				},
			],
		});
	}

	async fetchSegment(url: string, segmentInfo: SegmentInfo): Promise<Response> {
		// Update CMCD data based on current player state
		this.reporter.update({
			br: segmentInfo.bitrate,
			d: segmentInfo.duration,
			ot: segmentInfo.type,
			bl: this.getBufferLength(),
			mtp: this.getMeasuredThroughput(),
		});

		// Create and decorate the request
		const request = { url, method: "GET", headers: {} };
		const cmcdRequest = this.reporter.applyRequestReport(request);

		return fetch(cmcdRequest.url, cmcdRequest);
	}

	play() {
		this.reporter.recordEvent(CmcdEventType.PLAY_STATE);
		// ... player logic
	}

	onError(error: Error) {
		this.reporter.update({ ec: error.code });
		this.reporter.recordEvent(CmcdEventType.ERROR);
	}
}
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
	targets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.TIME_INTERVAL, CmcdEventType.PLAY_STATE],
			interval: 10,
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
		targets: [
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
	targets: [
		{
			url: "https://analytics.example.com/cmcd",
			events: [CmcdEventType.TIME_INTERVAL],
			// Override enabled keys for this specific target
			enabledKeys: ["br", "bl", "sid", "cid", "e", "ts", "sn"],
		},
	],
});
```

## Configuration Reference

### CmcdReporterConfig

| Property           | Type                      | Default             | Description                                                                         |
| ------------------ | ------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `sid`              | `string`                  | Auto-generated UUID | Session ID                                                                          |
| `cid`              | `string`                  | `undefined`         | Content ID                                                                          |
| `version`          | `CmcdVersion`             | `CMCD_V2`           | CMCD protocol version                                                               |
| `transmissionMode` | `CmcdTransmissionMode`    | `'query'`           | How to transmit CMCD data                                                           |
| `enabledKeys`      | `CmcdKey[]`               | `undefined`         | Keys to include in request reports. If not provided, request reporting is disabled. |
| `targets`          | `CmcdEventReportConfig[]` | `[]`                | Event reporting targets                                                             |

### CmcdEventReportConfig

| Property      | Type              | Default     | Description                                                               |
| ------------- | ----------------- | ----------- | ------------------------------------------------------------------------- |
| `url`         | `string`          | Required    | Analytics endpoint URL                                                    |
| `events`      | `CmcdEventType[]` | `undefined` | Events to report. If no events are provided, the target is disabled.      |
| `interval`    | `number`          | `10`        | Seconds between TIME_INTERVAL reports                                     |
| `batchSize`   | `number`          | `1`         | Events to batch before sending                                            |
| `version`     | `CmcdVersion`     | `CMCD_V2`   | CMCD version for this target                                              |
| `enabledKeys` | `CmcdKey[]`       | `undefined` | Keys to include for this target. If not provided, the target is disabled. |
