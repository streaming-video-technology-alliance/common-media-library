---
title: Manifest Box Validation
description: Validate live streams using per-segment C2PA Manifest Boxes (C2PA section 19.3)
---

# Manifest Box Validation

The Manifest Box method embeds a full C2PA manifest directly into each media segment, as defined in section 19.3 of the C2PA specification. Each segment is self-contained with its own COSE signature, so no init segment or session keys are needed.

Continuity between segments is verified through manifest ID chaining: each segment declares the manifest ID of the previous segment, forming a verifiable chain.

## Overview

Unlike the [VSI/EMSG method](vsi-validation.md), the Manifest Box method does not require a separate init segment validation step. Instead, a single function — `validateC2paManifestBoxSegment` — handles everything: manifest parsing, signature verification, BMFF hash validation, and continuity checks.

Two pieces of state are threaded between calls:

- `lastManifestId` — the manifest ID from the previous segment, used for continuity verification
- `state` — a `ManifestBoxValidationState` object that tracks `lastStreamId` and `lastSequenceNumber`

## Validating Segments

```typescript
import { validateC2paManifestBoxSegment } from '@svta/cml-c2pa'
import type { ManifestBoxValidationState } from '@svta/cml-c2pa'

let lastManifestId: string | null = null
let state: ManifestBoxValidationState | undefined

for (const segmentUrl of segmentUrls) {
  const bytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))

  const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(
    bytes,
    lastManifestId,
    state,
  )
  lastManifestId = nextManifestId
  state = nextState

  if (result.isValid) {
    console.log(`Segment ${result.sequenceNumber}: valid`)
  } else {
    console.error(`Segment ${result.sequenceNumber}: failed`, result.errorCodes)
  }
}
```

The function returns an object with:

- `result` — a `ManifestBoxValidationResult` with the validation outcome
- `nextManifestId` — the manifest ID to pass into the next call
- `nextState` — the updated state to pass into the next call

> [!NOTE]
> For the first segment, pass `null` as `lastManifestId` and `undefined` (or omit) for `state`. Continuity checks are skipped when there is no previous segment to compare against.

## Complete Example

```typescript
import { validateC2paManifestBoxSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import type { ManifestBoxValidationState } from '@svta/cml-c2pa'

async function validateStream(segmentUrls: string[]) {
  let lastManifestId: string | null = null
  let state: ManifestBoxValidationState | undefined

  for (const segmentUrl of segmentUrls) {
    const bytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))

    const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(
      bytes,
      lastManifestId,
      state,
    )
    lastManifestId = nextManifestId
    state = nextState

    if (result.isValid) {
      console.log(
        `Segment ${result.sequenceNumber}: valid` +
        ` (stream: ${result.streamId}, issuer: ${result.issuer})`,
      )
    } else {
      for (const code of result.errorCodes) {
        switch (code) {
          case LiveVideoStatusCode.CONTINUITY_METHOD_INVALID:
            console.error('Continuity chain broken')
            break
          case LiveVideoStatusCode.ASSERTION_INVALID:
            console.error('Assertion field mismatch (sequenceNumber or streamId)')
            break
          default:
            console.error('Validation failure:', code)
        }
      }
    }

    // Access the full manifest when needed
    if (result.manifest) {
      console.log('Claim generator:', result.manifest.claimGenerator)
      console.log('Assertions:', result.manifest.assertions.length)
    }
  }
}
```

## State Management

The `ManifestBoxValidationState` object carries inter-segment state for continuity checks:

| Field | Type | Description |
|-------|------|-------------|
| `lastStreamId` | `string \| null` | Stream ID from the previous segment |
| `lastSequenceNumber` | `number \| null` | Sequence number from the previous segment |

The function is pure — it does not mutate any external state. The caller is responsible for persisting `nextManifestId` and `nextState` between calls.

When `state` is omitted or `undefined`, the function skips streamId consistency and sequence number monotonicity checks (suitable for the first segment).

## Manifest ID Chaining

Each segment's `c2pa.livevideo.segment` assertion includes a `previousManifestId` field that must match the manifest ID of the preceding segment. This creates a verifiable chain:

```
Segment 1: manifestId = "abc-123", previousManifestId = null
Segment 2: manifestId = "def-456", previousManifestId = "abc-123"  // must match segment 1
Segment 3: manifestId = "ghi-789", previousManifestId = "def-456"  // must match segment 2
```

The `continuityMethod` field indicates how continuity is verified. The currently supported method is `c2pa.manifestId`.

When the chain is broken (the `previousManifestId` does not match the previous segment's manifest ID), the result includes `LiveVideoStatusCode.CONTINUITY_METHOD_INVALID`.

## Result Fields

The `ManifestBoxValidationResult` contains:

| Field | Type | Description |
|-------|------|-------------|
| `manifest` | `C2paManifest \| null` | Parsed manifest, or `null` on parse failure |
| `issuer` | `string \| null` | Certificate issuer from the signature |
| `sequenceNumber` | `number \| null` | From the `c2pa.livevideo.segment` assertion |
| `previousManifestId` | `string \| null` | From the `c2pa.livevideo.segment` assertion |
| `streamId` | `string \| null` | From the `c2pa.livevideo.segment` assertion |
| `continuityMethod` | `string \| null` | From the `c2pa.livevideo.segment` assertion |
| `bmffHashHex` | `string \| null` | Hex-encoded BMFF content hash |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

> [!NOTE]
> Unlike the VSI method, the Manifest Box method can produce both `LiveVideoStatusCode` and `C2paStatusCode` error codes, since each segment carries a full manifest that undergoes integrity checks (assertion hashes, claim signature verification).
