---
title: VOD Merkle Validation
description: Validate on-demand fragmented MP4 assets using Merkle tree proofs (C2PA section 15.12.2 / 18.6)
---

# VOD Merkle Validation

The VOD Merkle method (C2PA section 15.12.2.2 / 18.6) validates fragmented MP4 (fMP4) assets, such as HLS or DASH VOD streams. The manifest does not list every segment hash. Instead, the init manifest stores one row of a Merkle tree per track. A Merkle tree is a hash tree: each row is computed from the row below. Each media segment has a small auxiliary `uuid` box. The box gives the leaf index of the segment (`location`) and the sibling hashes that derive the stored row from the leaf hash.

Unlike the [Manifest Box](manifest-box-validation.md) and [VSI/EMSG](vsi-validation.md) methods, VOD Merkle segments have no manifest or signature of their own. The manifest of the init segment is the only source of trust.

## Overview

Validation happens in two steps:

1. `validateC2paInitSegment` extracts the `merkleMaps`, one per track, from the `c2pa.hash.bmff.v3` assertion of the init segment. It also validates the `initHash` binding of each entry against the bytes of the init segment.
2. `validateC2paMerkleSegment` verifies the Merkle proof of each media segment against those `merkleMaps`. It also enforces `location` continuity per track, with state that the caller keeps.

A stream is in VOD Merkle mode only when `merkleMaps` is not empty. Otherwise it uses one of the other two methods.

## Validating the Init Segment

```typescript
import { validateC2paInitSegment } from '@svta/cml-c2pa'

const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
const init = await validateC2paInitSegment(initBytes)

if (init.merkleMaps.length > 0) {
  // VOD Merkle stream: proceed to validate media segments against init.merkleMaps
}
```

`merkleMaps` is not empty only when the `c2pa.hash.bmff.v3` assertion of the init segment has a `merkle` field.

## Validating Media Segments

```typescript
import { validateC2paMerkleSegment } from '@svta/cml-c2pa'
import type { MerkleSegmentState } from '@svta/cml-c2pa'

let state: MerkleSegmentState | undefined

for (const segmentUrl of segmentUrls) {
  const bytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))

  const { result, nextState } = await validateC2paMerkleSegment(bytes, init.merkleMaps, state)
  state = nextState

  if (result.isValid) {
    console.log(`Location ${result.location}: valid`)
  } else {
    console.error(`Location ${result.location}: failed`, result.errorCodes)
  }
}
```

Call this function only after `validateC2paInitSegment` has confirmed VOD Merkle mode, so `merkleMaps` is not empty.

> [!NOTE]
> Reset `state` after a seek by passing `undefined`. The first location seen for each track is always accepted, because there is no earlier state to compare with.

## Complete Example

```typescript
import { validateC2paInitSegment, validateC2paMerkleSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import type { MerkleSegmentState } from '@svta/cml-c2pa'

async function validateStream(initUrl: string, segmentUrls: string[]) {
  const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
  const init = await validateC2paInitSegment(initBytes)

  if (init.merkleMaps.length === 0) {
    console.error('Not a VOD Merkle stream')
    return
  }

  let state: MerkleSegmentState | undefined

  for (const segmentUrl of segmentUrls) {
    const bytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))

    const { result, nextState } = await validateC2paMerkleSegment(bytes, init.merkleMaps, state)
    state = nextState

    if (result.isValid) {
      console.log(`Location ${result.location}: valid`)
    } else {
      for (const code of result.errorCodes) {
        switch (code) {
          case LiveVideoStatusCode.ASSERTION_INVALID:
            console.error(`Location ${result.location}: discontinuity`)
            break
          default:
            console.error(`Location ${result.location}: failed`, code)
        }
      }
    }
  }
}
```

## Location Continuity

Per §15.12.2, the location values of a Merkle tree start at zero and increase by one for each following chunk. `MerkleSegmentState.lastLocations` tracks the last seen location per track, keyed by `${uniqueId}:${localId}`.

The baseline advances on any segment whose Merkle proof verifies, even at an unexpected location. A dropped or reordered segment is still flagged with `LiveVideoStatusCode.ASSERTION_INVALID`, but a later segment that resumes in order validates without an error. A segment whose proof fails does not advance the baseline.

## Result Fields

The `MerkleSegmentValidation` result contains:

| Field | Type | Description |
|-------|------|-------------|
| `location` | `number \| null` | This segment's leaf index, or `null` if no merkle box was found |
| `bmffHashHex` | `string \| null` | Hex-encoded leaf hash |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

A `MerkleMap`, one per track, is returned in `InitSegmentValidation.merkleMaps` and contains:

| Field | Type | Description |
|-------|------|-------------|
| `uniqueId` | `number` | Distinguishes tracks that share a `localId` |
| `localId` | `number` | Identifies the Merkle tree for this track |
| `count` | `number` | Number of leaf nodes in the tree |
| `hashes` | `readonly Uint8Array[]` | The tree row stored in the manifest |
| `initHash` | `Uint8Array \| null` | Hash binding the init segment's own bytes |
| `alg` | `string \| null` | Hash algorithm |
| `exclusions` | `readonly BmffHashExclusion[]` | Byte ranges excluded from hashing |
| `offsetPrefixSize` | `number` | Leaf hash offset-prefix size (0 or 8 bytes) |

> [!NOTE]
> `MerkleSegmentValidation.errorCodes` mixes two code sets. `C2paStatusCode` values (`assertion.bmffHash.malformed` and `assertion.bmffHash.mismatch`) report the Merkle proof. `LiveVideoStatusCode.ASSERTION_INVALID` reports location continuity. A failed `initHash` binding is reported on the init segment instead: `InitSegmentValidation.errorCodes` gets both `livevideo.init.invalid` and `assertion.bmffHash.mismatch`.
