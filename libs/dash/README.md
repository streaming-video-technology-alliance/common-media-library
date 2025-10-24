# @svta/cml-dash

DASH manifest parsing functionality.

## Installation

```bash
npm i @svta/cml-dash
```

## Usage

```typescript
import { processUriTemplate, parseFrameRate } from "@svta/cml-dash";

// Process URI template
const result = processUriTemplate(
	"http://example.com/$RepresentationID$/$Number$/$SubNumber$/$Bandwidth$/$Time%02d$/$$",
	"rep1", // RepresentationID
	1, // Number
	2, // SubNumber
	3, // Bandwidth
	4 // Time
);

assert(result === "http://example.com/rep1/1/2/3/04/$");

// Parse frame rate
const frameRate = parseFrameRate("24000/1001");
assert(frameRate === 23.976023976023978);
```
