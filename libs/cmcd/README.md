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
