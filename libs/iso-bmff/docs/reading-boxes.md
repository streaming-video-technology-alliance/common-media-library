---
title: Reading Boxes
description: Parse ISO BMFF boxes from a buffer
---

# Reading Boxes

Boxes can be read from a buffer using the `readIsoBoxes` function which returns an array of parsed boxes. By default the function will only read the box header. To parse the box content, a reader function must be provided for that box type.

> [!NOTE]
> Container boxes are automatically parsed and do not need a reader function. All known container types are listed in the `CONTAINERS` constant.

## Using default config

If tree shaking isn't a concern, use `defaultReaderConfig()` to get a configuration with all available readers pre-configured:

```typescript
import { defaultReaderConfig, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, defaultReaderConfig());
```

## Using specific readers

For optimal bundle size with tree shaking, import only the readers you need:

```typescript
import { readFtyp, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, {
	readers: {
		ftyp: readFtyp,
	},
});
```
