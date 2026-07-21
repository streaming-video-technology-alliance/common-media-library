---
title: VOD Merkle Validation
description: Validate on-demand fragmented MP4 assets using Merkle tree proofs (C2PA section 15.12.2 / 18.6)
---

# VOD Merkle Validation

The VOD Merkle method validates fragmented MP4 (fMP4) assets, such as HLS or DASH VOD streams, without requiring every media segment's hash to be listed individually in the manifest. Instead, the init manifest stores one row of a Merkle tree per track, and each media segment carries a small auxiliary `uuid` box declaring which leaf it is (`location`) plus the sibling hashes needed to derive that row from the segment's own computed leaf hash, as defined in section 15.12.2.2 / 18.6 of the C2PA specification.

Unlike the [Manifest Box](manifest-box-validation.md) and [VSI/EMSG](vsi-validation.md) methods, VOD Merkle segments carry no manifest or signature of their own; the init segment's manifest is the sole source of trust, and each media segment is verified against it via its Merkle proof.

## Overview

Validation happens in two steps:

1. `validateC2paInitSegment` extracts the `merkleMaps` (one per track) from the init segment's `c2pa.hash.bmff.v3` assertion, and validates each entry's `initHash` binding against the init segment's own bytes.
2. `validateC2paMerkleSegment` verifies each media segment's Merkle proof against those `merkleMaps`, and enforces per-track `location` continuity via caller-held state.

A stream is only in VOD Merkle mode when `merkleMaps` is non-empty; a stream without merkle maps uses one of the other two methods instead.

## Validating the Init Segment

```typescript
import { validateC2paInitSegment } from '@svta/cml-c2pa'

const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
const init = await validateC2paInitSegment(initBytes)

if (init.merkleMaps.length > 0) {
  // VOD Merkle stream: proceed to validate media segments against init.merkleMaps
}
```

`merkleMaps` is empty for VSI and Manifest Box streams, and non-empty only when the init segment's `c2pa.hash.bmff.v3` assertion carries a `merkle` field.

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

`merkleMaps` must be non-empty; only call this function once `validateC2paInitSegment` has confirmed the stream is in VOD Merkle mode.

> [!NOTE]
> Reset `state` (pass `undefined`) after a seek. The first location seen for each track is always accepted, since there's no prior state to compare against.

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

Per §15.12.2, a Merkle tree's location values start at zero and increment by one for each following chunk. `MerkleSegmentState.lastLocations` tracks the last-seen location per track, keyed by `${uniqueId}:${localId}`.

The baseline advances on any segment whose Merkle proof verifies, whether or not it's the expected next location: a discontinuity (dropped or reordered segment) is still flagged with `LiveVideoStatusCode.ASSERTION_INVALID`, but a subsequent segment that resumes in order validates cleanly instead of being flagged forever relative to a stale baseline. A segment whose proof fails to verify does not advance the baseline.

## Result Fields

The `MerkleSegmentValidation` result contains:

| Field | Type | Description |
|-------|------|-------------|
| `location` | `number \| null` | This segment's leaf index, or `null` if no merkle box was found |
| `bmffHashHex` | `string \| null` | Hex-encoded leaf hash |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

A `MerkleMap` (one per track, returned in `InitSegmentValidation.merkleMaps`) contains:

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
> `MerkleSegmentValidation.errorCodes` mixes `C2paStatusCode` (`assertion.bmffHash.malformed` and `assertion.bmffHash.mismatch`, for the Merkle proof) with `LiveVideoStatusCode.ASSERTION_INVALID` (location continuity). A failed `initHash` binding is reported separately, on the init segment: `InitSegmentValidation.errorCodes` gets both `livevideo.init.invalid` and `assertion.bmffHash.mismatch`.
