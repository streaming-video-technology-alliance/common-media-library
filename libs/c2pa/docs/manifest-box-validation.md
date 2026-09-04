---
title: Manifest Box Validation
description: Validate live streams using per-segment C2PA Manifest Boxes (C2PA section 19.3)
---

# Manifest Box Validation

The Manifest Box method embeds a full C2PA manifest in each media segment, as section 19.3 of the C2PA specification defines. Each segment is self-contained, with its own COSE signature, so it needs no init segment and no session keys.

Manifest ID chaining verifies the continuity between segments. See Manifest ID Chaining below.

## Overview

Unlike the [VSI/EMSG method](vsi-validation.md), the Manifest Box method needs no separate init segment validation step. One function, `validateC2paManifestBoxSegment`, does everything: manifest parsing, signature verification, BMFF hash validation, and continuity checks.

Two pieces of state pass from one call to the next:

- `lastManifestId`: the manifest ID from the previous segment, used for the continuity check
- `state`: a `ManifestBoxValidationState` object that tracks `lastStreamId` and `lastSequenceNumber`

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

- `result`: a `ManifestBoxValidationResult` with the validation outcome
- `nextManifestId`: the manifest ID to pass into the next call
- `nextState`: the updated state to pass into the next call

> [!NOTE]
> For the first segment, pass `null` as `lastManifestId`, and `undefined` or nothing for `state`. When `lastManifestId` is `null`, the validator skips the chain comparison with the previous segment. It still checks that the segment declares a valid `continuityMethod` and a non-empty `previousManifestId`.

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

The `ManifestBoxValidationState` object contains the state between segments for the continuity checks:

| Field | Type | Description |
|-------|------|-------------|
| `lastStreamId` | `string \| null` | Stream ID from the previous segment |
| `lastSequenceNumber` | `number \| null` | Sequence number from the previous segment |

The function is pure. It does not mutate any external state. The caller must keep `nextManifestId` and `nextState` between calls.

When `state` is omitted or `undefined`, the function skips the checks for a consistent stream ID and for increasing sequence numbers.

## Manifest ID Chaining

The `c2pa.livevideo.segment` assertion of each segment includes a `previousManifestId` field. That field must match the manifest ID of the previous segment, which creates a verifiable chain:

```
Segment 1: manifestId = "abc-123", previousManifestId = "initial-manifest"
Segment 2: manifestId = "def-456", previousManifestId = "abc-123"  // must match segment 1
Segment 3: manifestId = "ghi-789", previousManifestId = "def-456"  // must match segment 2
```

> [!NOTE]
> Every segment must declare a `previousManifestId`, including the first one. The first segment usually references the initial static manifest.

The `continuityMethod` field states how continuity is verified. The only built-in method is `c2pa.manifestId`, which the specification defines (C2PA §19.3.2).

When the chain is broken, because `previousManifestId` does not match the manifest ID of the previous segment, the result includes `LiveVideoStatusCode.SEGMENT_INVALID`.

### Custom continuity methods

The specification allows implementers to define their own continuity methods (§19.3.2), identified by a custom label such as `com.example.anchor-chain`. Their semantics are implementation-specific, so this library cannot validate them by default. Segments that declare an unrecognized method fail with `LiveVideoStatusCode.CONTINUITY_METHOD_INVALID`, as §19.7.2 requires. They also get `LiveVideoStatusCode.CONTINUITY_METHOD_UNSUPPORTED`, which lets consumers tell an unverifiable method from a broken chain.

To validate a custom method, register a validator for its label in the `options` parameter. A stream uses one continuity method, so one validator is registered at a time:

```ts
const { result } = await validateC2paManifestBoxSegment(bytes, lastManifestId, state, {
  continuityValidator: {
    method: 'com.example.anchor-chain',
    validate: (liveVideoAssertion, manifest) => {
      // method-specific fields are available on liveVideoAssertion
      return verifyAnchorChain(liveVideoAssertion['anchorToken'], manifest.instanceId)
    },
  },
})
```

The validator receives the full decoded `c2pa.livevideo.segment` assertion, including method-specific fields, and the parsed manifest of the segment. Anything else the method needs, such as `lastManifestId`, which the caller already has, can be captured in the closure of the callback. Returning `false` or throwing reports `LiveVideoStatusCode.SEGMENT_INVALID`. The built-in `c2pa.manifestId` method cannot be overridden.

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
> Unlike the VSI method, the Manifest Box method can produce both `LiveVideoStatusCode` and `C2paStatusCode` error codes. Each segment contains a full manifest, and the manifest goes through integrity checks: assertion hashes and claim signature verification.
