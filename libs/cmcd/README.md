# @svta/cml-cmcd

Common Media Client Data (CMCD) encoding and decoding.

## Installation

```bash
npm i @svta/cml-cmcd
```

## Usage

```typescript
import { CmcdReportingMode, encodeCmcd } from "@svta/cml-cmcd";

const input = {
	br: 1000,
	"com.example-hello": "world",
	ec: ["ERR001", "ERR002"],
	su: true,
};
const options = { version: 2, reportingMode: CmcdReportingMode.REQUEST };
const result = encodeCmcd(input, options);
// result === 'br=1000,com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2'
```

## Testing CMCD output with `CmcdReportRecorder`

`CmcdReportRecorder` captures CMCD-bearing requests emitted by a
player under test, regardless of whether the player uses
`XMLHttpRequest` or `fetch`. Each capture is normalized to
[`HttpRequest`](https://github.com/streaming-video-technology-alliance/common-media-library/tree/main/libs/utils),
so tests work identically across transports.

````ts
import { CmcdReportRecorder, CmcdRequestType, validateCmcdRequest } from '@svta/cml-cmcd'

const recorder = new CmcdReportRecorder()
recorder.attach({ eventTargetUrls: ['https://events.example.com'] })

// ... configure and start the player under test ...

const segments = await recorder.waitForReports(CmcdRequestType.SEGMENT, 3)
for (const r of segments) {
  const result = validateCmcdRequest(r.request)
  if (!result.valid) {
    console.error(result.issues)
  }
}

recorder.detach()
````

Use `recordFor(timeout, type?)` instead of `waitForReports` when you
need to verify that reports did *not* arrive within a window.
