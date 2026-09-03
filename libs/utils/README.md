0
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
console.log(unescapeHtml("&quot;&lt;Hello&amp;World&gt;&quot;"));
// "<Hello&World>"

// Convert string to Uint16Array
console.log(stringToUint16("hello world"));
// Uint16Array(11) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]

// Convert hex string to ArrayBuffer
const hex = "a0564af760c2d94b9610c7ae70d5d970";
const arrayBuffer = hexToArrayBuffer(hex);
console.log(new Uint8Array(arrayBuffer));
// Uint8Array(16) [160, 86, 74, 247, 96, 194, 217, 75, 150, 16, 199, 174, 112, 213, 217, 112]

// Decode base64
console.log(decodeBase64("SGVsbG8gV29ybGQ="));
// Uint8Array(11) [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]

// Convert ArrayBuffer to UUID
const data = new Uint8Array([
	160, 86, 74, 247, 96, 194, 217, 75, 150, 16, 199, 174, 112, 213, 217, 112,
]);
console.log(arrayBufferToUuid(data.buffer));
// a0564af7-60c2-d94b-9610-c7ae70d5d970

// Convert ArrayBuffer to hex string
console.log(arrayBufferToHex(data.buffer));
// a0564af760c2d94b9610c7ae70d5d970
```
