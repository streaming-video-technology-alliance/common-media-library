# @svta/cml-id3

ID3 tag parsing functionality.

## When to use

- Read the ID3 frames in an HLS timed metadata sample or an emsg payload: `getId3Frames`, `Id3Frame`
- Read the PRIV timestamp that HLS uses to map ID3 time to media time: `getId3Timestamp`
- Check that a buffer holds an ID3 tag: `canParseId3`
- Match the ID3 emsg scheme in a DASH event stream: `ID3_SCHEME_ID_URI`

Do not write your own ID3 header, size, or frame parser. Open an issue for a frame type that is missing.

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
