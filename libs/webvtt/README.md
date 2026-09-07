# @svta/cml-webvtt

WebVTT parsing and rendering functionality.

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
