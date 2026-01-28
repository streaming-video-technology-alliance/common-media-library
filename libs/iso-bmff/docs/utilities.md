---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

## Traversing boxes

The `traverseIsoBoxes` function can be used to traverse box iterators. It returns a generator of boxes. The function takes an iterable of boxes, and optional arguments for depth-first traversal and maximum depth. By default the function will traverse the boxes depth-first with a maximum depth of infinity. A value of 0 for the maximum depth will only traverse the root boxes.

```typescript
import { traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = traverseIsoBoxes(buffer);
```

## Type guards

The library provides type guards for checking if a box is a container or full box. These can be used to narrow the type of a box in TypeScript.

The `isContainer` function can be used to check if a box is a container box.

```typescript
import { isContainer } from "@svta/cml-iso-bmff";

const box = { type: "meta", boxes: [] };
const isContainer = isContainer(box);
```

The `isFullBox` function can be used to check if a box is a full box.

```typescript
import { isFullBox } from "@svta/cml-iso-bmff";

const box = { type: "meta", version: 1, flags: 0 };
const isFullBox = isFullBox(box);
```
