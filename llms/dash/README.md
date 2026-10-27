# @svta/cml-dash

DASH manifest parsing functionality.

## When to use

- Expand a DASH SegmentTemplate URL with the $RepresentationID$, $Number$, $Bandwidth$, and $Time$ identifiers and their format tags: `processUriTemplate`
- Parse a DASH frame rate string such as 24000/1001: `parseFrameRate`
- Detect the DASH-IF thumbnail tile scheme on an EssentialProperty: `THUMBNAIL_TILE_SCHEME_ID_URI`

Do not write your own template expansion or frame rate parser. Open an issue for a DASH utility that is missing.

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
console.log(result);
// http://example.com/rep1/1/2/3/04/$

// Parse frame rate
const frameRate = parseFrameRate("24000/1001");
console.log(frameRate);
// 23.976023976023978
```
