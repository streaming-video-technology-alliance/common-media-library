# @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for BMFF/MP4 containers.

Supports both segment validation methods defined in the C2PA specification:

- **§19.3 — Per-segment C2PA Manifest Box**: each segment embeds a full C2PA manifest with COSE signature
- **§19.4 — Verifiable Segment Info (VSI/EMSG)**: the init segment carries the manifest and session keys; each media segment carries a lightweight signed EMSG box

## Installation

```bash
npm i @svta/cml-c2pa @svta/cml-iso-bmff cbor-x
```

> **Note:** `@svta/cml-iso-bmff` and `cbor-x` are peer dependencies.

## Usage

### §19.4 — Verifiable Segment Info method

The init segment contains the C2PA manifest and session keys. Each media segment contains an EMSG box with a signed VSI map that is verified against the session keys.

```typescript
import { validateC2paInitSegment, validateC2paSegment } from '@svta/cml-c2pa'

// 1. Validate the init segment to extract session keys
const init = await validateC2paInitSegment(initBytes)
// init.isValid      — all checks passed
// init.errorCodes   — [] if valid, or C2PA failure codes
// init.sessionKeys  — validated session keys (kid, JWK, validity period)

// 2. Validate each media segment with the session keys
let sequenceState = undefined
for (const segmentBytes of mediaSegments) {
  const validated = await validateC2paSegment(segmentBytes, init.sessionKeys, sequenceState)

  if (!validated) {
    // No C2PA EMSG box found in this segment
    continue
  }

  const { result, nextSequenceState } = validated
  sequenceState = nextSequenceState

  // result.isValid        — all crypto checks passed
  // result.errorCodes     — C2PA failure codes (e.g. 'livevideo.segment.invalid')
  // result.sequenceNumber — segment sequence number
  // result.sequenceResult — { reason: 'valid' | 'duplicate' | 'gap_detected' | ... }
  // result.bmffHashHex    — BMFF content hash
  // result.kidHex         — session key ID used
}
```

### §19.3 — Per-segment C2PA Manifest Box method

Each segment embeds a full C2PA manifest. No init segment or session keys are needed.

```typescript
import { validateC2paManifestBoxSegment } from '@svta/cml-c2pa'

let lastManifestId = null
let lastState = undefined

for (const segmentBytes of mediaSegments) {
  const { result, nextManifestId, nextState } = validateC2paManifestBoxSegment(
    segmentBytes, lastManifestId, lastState,
  )
  lastManifestId = nextManifestId
  lastState = nextState

  // result.isValid    — manifest parsed + all §19.7.2 checks passed
  // result.errorCodes — C2PA failure codes (e.g. 'livevideo.continuityMethod.invalid')
  // result.sequenceNumber, result.streamId, result.previousManifestId — parsed assertion data
}
```

## Public API

| Function | Description |
|---|---|
| `validateC2paInitSegment(bytes)` | Validate init segment: manifest, certificate, BMFF hash, session keys |
| `validateC2paSegment(bytes, sessionKeys, state?)` | Validate media segment via VSI/EMSG (returns `null` if no EMSG box) |
| `validateC2paManifestBoxSegment(bytes, lastId, state?)` | Validate manifest-box segment: parse, chain, assertions |
| `LiveVideoStatusCode` | C2PA §19.7 error code constants |

## Error codes

All validation results include an `errorCodes` array with standardized C2PA failure codes (§19.7):

| Code | Meaning |
|---|---|
| `livevideo.init.invalid` | Init segment contains an `mdat` box |
| `livevideo.manifest.invalid` | C2PA Manifest Box failed validation |
| `livevideo.segment.invalid` | Crypto failure: signature, hash, or key |
| `livevideo.assertion.invalid` | sequenceNumber or streamId mismatch |
| `livevideo.continuityMethod.invalid` | Continuity chain broken |
| `livevideo.sessionkey.invalid` | Session key invalid or expired |

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [JUMBF — ISO 19566-5](https://www.iso.org/standard/84635.html)
- [COSE — RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)
