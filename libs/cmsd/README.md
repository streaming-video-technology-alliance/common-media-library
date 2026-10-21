# @svta/cml-cmsd

Common Media Server Data (CMSD) encoding and decoding.

## When to use

- Decode the CMSD-Static and CMSD-Dynamic response headers: `decodeCmsdStatic`, `decodeCmsdDynamic`
- Encode CMSD headers on a server or an edge: `encodeCmsdStatic`, `encodeCmsdDynamic`
- Type the CMSD keys and values that a player reads: `CmsdStatic`, `CmsdDynamic`, `CmsdObjectType`
- Tell a custom key from a standard key: `isCmsdCustomKey`

Do not write your own CMSD header parser or serializer. Open an issue for a key that is missing.

## Installation

```bash
npm i @svta/cml-cmsd
```

## Usage

```typescript
import {
	CmsdObjectType,
	CmsdStreamingFormat,
	CmsdStreamType,
	encodeCmsdStatic,
} from "@svta/cml-cmsd";
import type { CmsdStatic } from "@svta/cml-cmsd";

const input: CmsdStatic = {
	ot: CmsdObjectType.VIDEO,
	sf: CmsdStreamingFormat.HLS,
	st: CmsdStreamType.VOD,
	d: 5000,
	br: 2000,
	n: "OriginProviderA",
};

console.log(encodeCmsdStatic(input));
// ot=v,sf=h,st=v,d=5000,br=2000,n="OriginProviderA"
```
