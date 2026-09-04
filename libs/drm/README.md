# @svta/cml-drm

Digital Rights Management (DRM) functionality.

## Installation

```bash
npm i @svta/cml-drm
```

## Usage

```typescript
import { parsePsshList, W3C_CLEAR_KEY_UUID } from "@svta/cml-drm";

// A minimal pssh box: size, type, version and flags, system ID, data size.
const initData = new Uint8Array([
	0x00, 0x00, 0x00, 0x20, 0x70, 0x73, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00,
	0x10, 0x77, 0xef, 0xec, 0xc0, 0xb2, 0x4d, 0x02, 0xac, 0xe3, 0x3c, 0x1e, 0x52, 0xe2, 0xfb, 0x4b,
	0x00, 0x00, 0x00, 0x00,
]);

const psshList = parsePsshList(initData);
console.log(Object.keys(psshList));
// [ '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b' ]
console.log(Object.keys(psshList)[0] === W3C_CLEAR_KEY_UUID);
// true
```
