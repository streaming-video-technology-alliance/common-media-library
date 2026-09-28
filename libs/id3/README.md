# @svta/cml-id3

ID3 tag parsing functionality.

## Installation

```bash
npm i @svta/cml-id3
```

## Usage

```typescript
import { getId3Frames } from "@svta/cml-id3";

// id3Data holds the bytes of one ID3 tag, for example from an HLS timed metadata sample.
function logId3Frames(id3Data: Uint8Array): void {
	for (const frame of getId3Frames(id3Data)) {
		console.log(frame.key, frame.data);
	}
}
```
