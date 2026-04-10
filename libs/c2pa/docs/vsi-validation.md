---
title: VSI/EMSG Validation
description: Validate live streams using the Verifiable Segment Info method (C2PA section 19.4)
---

# VSI/EMSG Validation

The Verifiable Segment Info (VSI) method is a two-phase approach to C2PA live video validation defined in section 19.4 of the C2PA specification. The init segment carries the full C2PA manifest and session keys, while each media segment carries a lightweight EMSG box with a COSE_Sign1 signature that is verified against those session keys.

## Overview

The validation flow has two phases:

1. **Init segment** — call `validateC2paInitSegment` once to parse the C2PA manifest, verify its integrity, and extract the validated session keys.
2. **Media segments** — call `validateC2paSegment` for each media segment. The function locates the C2PA EMSG box, verifies the COSE_Sign1 signature against a session key, checks the BMFF content hash, and validates the sequence number.

A `SequenceState` object is threaded through the media segment calls to track sequence number history across the stream.

## Step 1: Validate the Init Segment

```typescript
import { validateC2paInitSegment } from '@svta/cml-c2pa'

const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
const init = await validateC2paInitSegment(initBytes)

if (!init.isValid) {
  console.error('Init segment validation failed:', init.errorCodes)
}
```

The returned `InitSegmentValidation` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `manifest` | `C2paManifest \| null` | Parsed manifest (label, assertions, signature info) |
| `certificate` | `Uint8Array \| null` | DER-encoded end-entity certificate |
| `manifestId` | `string \| null` | Manifest identifier |
| `sessionKeys` | `readonly ValidatedSessionKey[]` | Session keys with valid signer binding |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

### Accessing Session Keys

Only keys whose signer binding is valid and whose validity period has not expired are included in `sessionKeys`:

```typescript
for (const key of init.sessionKeys) {
  console.log('Key ID:', key.kid)
  console.log('Curve:', key.jwk.crv)
  console.log('Min sequence number:', key.minSequenceNumber)
  console.log('Validity period (seconds):', key.validityPeriod)
  console.log('Created at:', key.createdAt)
}
```

Each `ValidatedSessionKey` contains:

| Field | Type | Description |
|-------|------|-------------|
| `kid` | `string` | Key ID (hex-encoded) |
| `jwk` | `CoseKeyJwk` | Public key in JWK format (WebCrypto-compatible) |
| `minSequenceNumber` | `number` | Minimum accepted sequence number |
| `validityPeriod` | `number` | Key lifetime in seconds |
| `createdAt` | `string` | ISO 8601 timestamp of key creation |

## Step 2: Validate Media Segments

```typescript
import { validateC2paSegment } from '@svta/cml-c2pa'
import type { SequenceState } from '@svta/cml-c2pa'

// undefined on first call — the function creates a fresh state internally
let sequenceState: SequenceState | undefined

for (const segmentUrl of segmentUrls) {
  const segmentBytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))
  const validated = await validateC2paSegment(segmentBytes, init.sessionKeys, sequenceState)

  if (!validated) {
    // No C2PA EMSG box in this segment — skip
    continue
  }

  const { result, nextSequenceState } = validated
  sequenceState = nextSequenceState

  if (result.isValid) {
    console.log(`Segment ${result.sequenceNumber}: valid`)
  } else {
    console.error(`Segment ${result.sequenceNumber}: failed`, result.errorCodes)
  }
}
```

`validateC2paSegment` returns `null` when the segment does not contain a C2PA EMSG box. Otherwise it returns an object with:

- `result` — a `SegmentValidationResult` with the validation outcome
- `nextSequenceState` — the updated sequence state to pass into the next call

The `SegmentValidationResult` contains:

| Field | Type | Description |
|-------|------|-------------|
| `sequenceNumber` | `number` | Segment sequence number from the VSI map |
| `manifestId` | `string` | Manifest ID referenced by this segment |
| `bmffHashHex` | `string \| null` | Hex-encoded BMFF content hash |
| `kidHex` | `string \| null` | Hex-encoded key ID used for verification |
| `sequenceResult` | `SequenceValidationResult` | Sequence number validation outcome |
| `isValid` | `boolean` | All crypto and sequence checks passed |
| `errorCodes` | `readonly LiveVideoStatusCode[]` | Failure codes (empty when valid) |

> [!NOTE]
> Always persist `nextSequenceState` and pass it to the next `validateC2paSegment` call. This enables duplicate detection, gap detection, and out-of-order detection across the stream.

## Complete Example

```typescript
import {
  validateC2paInitSegment,
  validateC2paSegment,
  SequenceValidationReason,
} from '@svta/cml-c2pa'
import type { SequenceState } from '@svta/cml-c2pa'

async function validateStream(initUrl: string, segmentUrls: string[]) {
  // Phase 1: Validate the init segment
  const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
  const init = await validateC2paInitSegment(initBytes)

  if (!init.isValid) {
    console.error('Init segment invalid:', init.errorCodes)
    return
  }

  console.log('Manifest:', init.manifest?.label)
  console.log('Issuer:', init.manifest?.signatureInfo.issuer)
  console.log('Session keys:', init.sessionKeys.length)

  // Phase 2: Validate each media segment
  // undefined on first call — the function creates a fresh state internally
  let sequenceState: SequenceState | undefined

  for (const segmentUrl of segmentUrls) {
    const bytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))
    const validated = await validateC2paSegment(bytes, init.sessionKeys, sequenceState)

    if (!validated) {
      console.log('No C2PA data in segment, skipping')
      continue
    }

    const { result, nextSequenceState } = validated
    sequenceState = nextSequenceState

    if (result.isValid) {
      console.log(`Segment ${result.sequenceNumber}: valid (key: ${result.kidHex})`)
    } else {
      console.error(`Segment ${result.sequenceNumber}: failed`, result.errorCodes)
    }

    // Check sequence continuity
    if (result.sequenceResult.reason === SequenceValidationReason.GAP_DETECTED) {
      console.warn(
        `Missing segments ${result.sequenceResult.missingFrom}` +
        ` through ${result.sequenceResult.missingTo}`,
      )
    }
  }
}
```

## Session Key Lifecycle

Session keys are extracted from the `c2pa.session-keys` assertion in the init segment manifest. Each key goes through signer binding verification before being included in the validation result.

The validation function automatically handles key matching and expiration:

1. **Key matching** — `validateC2paSegment` matches the `kid` (key ID) from the COSE_Sign1 header against the available session keys.
2. **Expiration** — A key expires when `createdAt + validityPeriod` is in the past. If the matched key has expired, the result includes `LiveVideoStatusCode.SESSIONKEY_INVALID`.
3. **No match** — If no session key matches the `kid`, the result includes `LiveVideoStatusCode.SEGMENT_INVALID`.

> [!NOTE]
> When a session key expires mid-stream, the signer is expected to produce a new init segment with fresh session keys. Your application should re-validate the new init segment and use its `sessionKeys` for subsequent media segments.

## Sequence Number Validation

Each media segment carries a monotonically increasing sequence number in its VSI map. The `sequenceResult` field in the validation result is a discriminated union on `reason`, using `SequenceValidationReason` constants:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'
```

| Constant | Value | Valid | Description |
|----------|-------|-------|-------------|
| `VALID` | `valid` | `true` | Sequence number is the next expected value |
| `DUPLICATE` | `duplicate` | `false` | Sequence number was already seen |
| `GAP_DETECTED` | `gap_detected` | `false` | One or more sequence numbers were skipped |
| `OUT_OF_ORDER` | `out_of_order` | `false` | Sequence number is less than the last seen |
| `SEQUENCE_NUMBER_BELOW_MINIMUM` | `sequence_number_below_minimum` | `false` | Below the session key's `minSequenceNumber` |

Narrow the type to access additional fields:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'

const { sequenceResult } = result

switch (sequenceResult.reason) {
  case SequenceValidationReason.VALID:
    // All good
    break
  case SequenceValidationReason.GAP_DETECTED:
    console.warn(
      `Gap detected: missing segments ${sequenceResult.missingFrom}` +
      ` to ${sequenceResult.missingTo}`,
    )
    break
  case SequenceValidationReason.DUPLICATE:
  case SequenceValidationReason.OUT_OF_ORDER:
  case SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM:
    console.warn(`Sequence issue: ${sequenceResult.reason}`)
    break
}
```

> [!NOTE]
> The sequence state maintains a bounded sliding window of the last 32 sequence numbers, so memory usage stays constant regardless of stream length.
