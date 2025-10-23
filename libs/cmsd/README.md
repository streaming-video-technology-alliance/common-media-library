# @svta/cml-cmsd

Common Media Server Data (CMSD) encoding and decoding.

## Installation

```bash
npm i @svta/cml-cmsd
```

## Usage

```typescript
import { encodeCmsdStatic } from "@svta/cml-cmsd";

const input = Object.assign({}, CMSD_STATIC_OBJ, {
	ot: new SfToken(CmsdObjectType.VIDEO),
	sf: new SfToken(CmsdStreamingFormat.HLS),
	st: new SfToken(CmsdStreamType.VOD),
});

assert(
	encodeCmsdStatic(input) ===
		`ot=v,sf=h,st=v,d=5000,br=2000,n="OriginProviderA"`
);
```
