---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

In the examples, `buffer` holds the bytes of a segment.

## Traversing boxes

The `traverseIsoBoxes` function traverses box iterators and returns a generator of boxes. It takes an iterable of boxes and one optional configuration with two options. `depthFirst` selects a depth-first or a breadth-first traversal, and the default is `true`. `maxDepth` is the maximum depth, and the default is `Infinity`. A maximum depth of 0 traverses only the root boxes.

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type);
}
```

This example traverses breadth-first, and stops at the children of the root boxes:

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes, { depthFirst: false, maxDepth: 1 })) {
	console.log(box.type);
}
```

## Finding boxes

`findIsoBox` returns the first box that matches a callback, or `null`. `filterIsoBoxes` returns every box that matches. Both functions traverse the boxes as `traverseIsoBoxes` does and take the same configuration. A callback that tests `box.type` narrows the result to that box type.

```typescript
import {
	createDefaultReaderConfig,
	filterIsoBoxes,
	findIsoBox,
	readIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, createDefaultReaderConfig());

const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");
const trafs = filterIsoBoxes(boxes, (box) => box.type === "traf");

console.log(tfdt?.baseMediaDecodeTime, trafs.length);
```

The traversal follows the `boxes` field. If the readers map has `readStsd` and `readDref`, the search also reaches the sample entries and the data entries.

`isIsoBoxType` checks the type of one box and narrows the box to that type:

```typescript
import {
	isIsoBoxType,
	readIsoBoxes,
	readTfdt,
	traverseIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });

for (const box of traverseIsoBoxes(boxes)) {
	if (isIsoBoxType("tfdt", box)) {
		console.log(box.baseMediaDecodeTime);
	}
}
```

## Type guards

The package provides type guards that check whether a box is a container box or a full box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box is a container box.

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "moov", boxes: [] };
const container = isContainer(box);
```

After `isContainer` returns `true`, each element of `box.boxes` has a box type. Test the `type` of a child before you read a field of that child.

```typescript
import { createDefaultReaderConfig, isContainer, readIsoBoxes } from "@svta/cml-iso-bmff";

for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
	if (isContainer(box)) {
		for (const child of box.boxes) {
			if (child.type === "mfhd") {
				console.log(child.sequenceNumber);
			}
		}
	}
}
```
