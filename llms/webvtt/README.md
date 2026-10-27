# @svta/cml-webvtt

WebVTT parsing and rendering functionality.

## When to use

- Parse a WebVTT file or segment into cues, regions, and styles: `parseWebVtt`, `WebVttParser`
- Parse WebVTT chunks as the bytes arrive from a stream: `WebVttTransformStream`, `WebVttTransformer`
- Read the X-TIMESTAMP-MAP header of an HLS WebVTT segment: `WebVttParser`, `TimestampMap`
- Create native VTTCue and VTTRegion objects from parsed cues: `toVttCue`, `toVttRegion`
- Build cues and regions without a browser, for tests or servers: `createWebVttCue`, `createWebVttRegion`

Do not write your own WebVTT tokenizer, cue timing parser, or timestamp map handling. Open an issue for a cue setting that is missing.

## Installation

```bash
npm i @svta/cml-webvtt
```

## Usage

```typescript
import { parseWebVtt } from "@svta/cml-webvtt";

const vtt = `WEBVTT\n\nREGION\nid:test\n\nSTYLE\n::cue {}\n\nCUE_1\n00:00:00.000 --> 00:00:35.000\nWebVTT Sample\n`;

const { cues, errors, regions, styles } = await parseWebVtt(vtt);

console.log(cues[0].id, cues[0].text);
// CUE_1 WebVTT Sample
console.log(errors.length, regions[0].id, styles.length);
// 0 test 1
```
