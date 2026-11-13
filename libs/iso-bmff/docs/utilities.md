---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

## Traversing boxes

The `traverseIsoBoxes` function traverses box iterators and returns a generator of boxes. It takes an iterable of boxes and two optional arguments: depth-first traversal and maximum depth. By default, the function traverses depth-first with a maximum depth of infinity. A maximum depth of 0 traverses only the root boxes.

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type);
}
```

## Type guards

The library provides type guards that check whether a box is a container box or a full box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box is a container box.

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "meta", version: 0, flags: 0, boxes: [] };
const container = isContainer(box);
```

After `isContainer` returns `true`, each element of `box.boxes` has a box type. Test the `type` of a child before you read a field of that child.

```typescript
import { defaultReaderConfig, isContainer, readIsoBoxes } from "@svta/cml-iso-bmff";

for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
	if (isContainer(box)) {
		for (const child of box.boxes) {
			if (child.type === "tfdt") {
				console.log(child.baseMediaDecodeTime);
			}
		}
	}
}
```

`isFullBox` checks whether a box is a full box.

```typescript
import { isFullBox } from "@svta/cml-iso-bmff";

const box = { type: "meta", version: 1, flags: 0 };
const fullBox = isFullBox(box);
```
