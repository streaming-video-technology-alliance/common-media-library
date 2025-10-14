# @svta/cml-utils

Common utility functions for media processing.

## Installation

```bash
npm i @svta/cml-utils
```

## Usage

```typescript
import {
	stringToUint16,
	hexToArrayBuffer,
	decodeBase64,
	arrayBufferToUuid,
	arrayBufferToHex,
	unescapeHtml,
} from "@svta/cml-utils";

// Unescape HTML entities
const unescaped = unescapeHtml("&quot;&lt;Hello&amp;World&gt;&quot;");
assert(unescaped === `"<Hello&World>"`);

// Convert string to Uint16Array
const uint16Array = stringToUint16("hello world");
assert(
	uint16Array ===
		new Uint16Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
);

// Convert hex string to ArrayBuffer
const hex = "a0564af760c2d94b9610c7ae70d5d970";
const arrayBuffer = hexToArrayBuffer(hex);
const expected = new Uint8Array([
	160, 86, 74, 247, 96, 194, 217, 75, 150, 16, 199, 174, 112, 213, 217, 112,
]);
assert(new Uint8Array(arrayBuffer) === expected);

// Decode base64
const decoded = decodeBase64("SGVsbG8gV29ybGQ=");
assert(
	decoded ===
		new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100])
);

// Convert ArrayBuffer to UUID
const data = new Uint8Array([
	160, 86, 74, 247, 96, 194, 217, 75, 150, 16, 199, 174, 112, 213, 217, 112,
]);
const uuid = arrayBufferToUuid(data.buffer);
assert(uuid === "a0564af7-60c2-d94b-9610-c7ae70d5d970");

// Convert ArrayBuffer to hex string
const hexString = arrayBufferToHex(data.buffer);
assert(hexString === "a0564af760c2d94b9610c7ae70d5d970");
```
