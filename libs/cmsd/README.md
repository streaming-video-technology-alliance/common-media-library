0
# @svta/cml-cmsd

Common Media Server Data (CMSD) encoding and decoding.

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
