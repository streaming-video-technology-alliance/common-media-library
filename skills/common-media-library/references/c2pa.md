<!-- libs/c2pa/README.md -->
# @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for BMFF and MP4 containers.

Supported C2PA segment validation methods:

- **§19.3 Per-segment C2PA Manifest Box**: each segment embeds a full C2PA manifest with a COSE signature
- **§19.4 Verifiable Segment Info (VSI/EMSG)**: the init segment contains the manifest and the session keys. Each media segment contains a small signed EMSG box
- **§15.12.2 / §18.6 VOD Merkle**: for VOD assets in fragmented MP4, the init manifest stores one Merkle tree row per track. Each media segment contains its own leaf hash and proof

## When to use

- Validate the C2PA manifest in an init segment: `validateC2paInitSegment`
- Validate a live segment with the VSI and EMSG method and the session keys of the init segment: `validateC2paSegment`
- Validate a per-segment C2PA manifest box: `validateC2paManifestBoxSegment`
- Validate the Merkle leaf and proof in a VOD segment: `validateC2paMerkleSegment`
- Map a validation result to a status code: `C2paStatusCode`, `LiveVideoStatusCode`

Do not write your own COSE, CBOR, or manifest box parsing for C2PA. Open an issue for a validation method that is missing.

## Installation

```bash
npm i @svta/cml-c2pa
```

> **Note:** `@svta/cml-iso-bmff` and `@svta/cml-utils` are peer dependencies. Most package managers install them automatically, but you may need to add them explicitly.

> **Note:** This library uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`crypto.subtle`) to verify COSE signatures and compute BMFF hashes. In Node.js 20+, `crypto.subtle` is available globally. In browsers, it requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or `localhost`).

## Usage

### Manifest Box method (per-segment manifests)

```typescript
import { validateC2paManifestBoxSegment } from '@svta/cml-c2pa'
import type { ManifestBoxValidationState } from '@svta/cml-c2pa'

async function validateManifestBoxStream(segmentUrls: string[]): Promise<void> {
  let lastManifestId: string | null = null
  let state: ManifestBoxValidationState | undefined

  for (const segmentUrl of segmentUrls) {
    const response = await fetch(segmentUrl)
    const bytes = new Uint8Array(await response.arrayBuffer())
    const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(
      bytes,
      lastManifestId,
      state,
    )
    lastManifestId = nextManifestId
    state = nextState

    console.log(result.isValid, result.errorCodes)
  }
}
```

### VSI/EMSG method (init segment + media segments)

```typescript
import { validateC2paInitSegment, validateC2paSegment } from '@svta/cml-c2pa'

async function validateVsiSegment(initUrl: string, segmentUrl: string): Promise<void> {
  const initResponse = await fetch(initUrl)
  const init = await validateC2paInitSegment(new Uint8Array(await initResponse.arrayBuffer()))
  if (!init.isValid) {
    console.error(init.errorCodes)
    return
  }

  const segmentResponse = await fetch(segmentUrl)
  const segmentBytes = new Uint8Array(await segmentResponse.arrayBuffer())
  const validated = await validateC2paSegment(segmentBytes, init.sessionKeys)
  console.log(validated?.result.isValid)
}
```

### VOD Merkle method (init segment + media segments)

```typescript
import { validateC2paInitSegment, validateC2paMerkleSegment } from '@svta/cml-c2pa'

async function validateMerkleSegment(initUrl: string, segmentUrl: string): Promise<void> {
  const initResponse = await fetch(initUrl)
  const init = await validateC2paInitSegment(new Uint8Array(await initResponse.arrayBuffer()))
  if (!init.isValid) {
    console.error(init.errorCodes)
    return
  }

  const segmentResponse = await fetch(segmentUrl)
  const segmentBytes = new Uint8Array(await segmentResponse.arrayBuffer())
  const { result } = await validateC2paMerkleSegment(segmentBytes, init.merkleMaps)
  console.log(result.isValid, result.errorCodes)
}
```

## Docs

- [VSI/EMSG Validation](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md) (§19.4)
- [Manifest Box Validation](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/manifest-box-validation.md) (§19.3)
- [VOD Merkle Validation](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/merkle-validation.md) (§15.12.2 / §18.6)
- [Results and Error Codes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/results-and-error-codes.md)

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [JUMBF (JPEG Universal Metadata Box Format), ISO 19566-5](https://www.iso.org/standard/84635.html)
- [COSE, RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)

<!-- libs/c2pa/docs/manifest-box-validation.md -->
---
title: Manifest Box Validation
description: Validate live streams using per-segment C2PA Manifest Boxes (C2PA section 19.3)
---

# Manifest Box Validation

The Manifest Box method embeds a full C2PA manifest in each media segment, as section 19.3 of the C2PA specification defines. Each segment is self-contained, with its own COSE signature, so it needs no init segment and no session keys.

Manifest ID chaining verifies the continuity between segments. See Manifest ID Chaining below.

## Overview

Unlike the [VSI/EMSG method](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md), the Manifest Box method needs no separate init segment validation step. If you validate the init segment of a section 19.3 stream with `validateC2paInitSegment`, the function accepts it without a `c2pa.session-keys` assertion. One function, `validateC2paManifestBoxSegment`, does everything: manifest parsing, signature verification, BMFF hash validation, and continuity checks.

Two pieces of state pass from one call to the next:

- `lastManifestId`: the manifest ID from the last segment that updated the state, used for the continuity check
- `state`: a `ManifestBoxValidationState` object that tracks `lastStreamId` and `lastSequenceNumber`

## Validating Segments

```typescript
import { validateC2paManifestBoxSegment } from '@svta/cml-c2pa'
import type { ManifestBoxValidationState } from '@svta/cml-c2pa'

let lastManifestId: string | null = null
let state: ManifestBoxValidationState | undefined

for (const segmentUrl of segmentUrls) {
  const response = await fetch(segmentUrl)
  const bytes = new Uint8Array(await response.arrayBuffer())

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
- `nextState`: the state to pass into the next call

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
    const response = await fetch(segmentUrl)
    const bytes = new Uint8Array(await response.arrayBuffer())

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

    // Access the full manifest when needed. Its assertions list is the raw store, so check isValid first.
    if (result.isValid && result.manifest) {
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
| `lastStreamId` | `string \| null` | Stream ID from the last segment that updated the state |
| `lastSequenceNumber` | `number \| null` | Sequence number from the last segment that updated the state |

The function is pure. It does not mutate any external state. The caller must keep `nextManifestId` and `nextState` between calls. A segment with an integrity error, a malformed or mismatched content hash, or no live video assertion does not change `nextManifestId` or `nextState`. The same applies to a segment on another stream or with a sequence number that does not move forward. A segment that fails only the continuity check still updates both values. After a seek, an encoder restart, or a new stream ID, pass `null` as `lastManifestId` and `undefined` as `state` to start a new state. If your application rejects the signer of a segment, discard the `nextManifestId` and `nextState` of that call.

When `state` is omitted or `undefined`, the function skips the checks for a consistent stream ID and for increasing sequence numbers.

## Manifest ID Chaining

The `c2pa.livevideo.segment` assertion of each segment includes a `previousManifestId` field. That field must match the manifest ID of the previous segment, which creates a verifiable chain:

```
Segment 1: manifestId = "urn:c2pa:1b3b...", previousManifestId = "urn:c2pa:f916..."
Segment 2: manifestId = "urn:c2pa:2e52...", previousManifestId = "urn:c2pa:1b3b..."  // must match segment 1
Segment 3: manifestId = "urn:c2pa:3000...", previousManifestId = "urn:c2pa:2e52..."  // must match segment 2
```

The manifest ID is the manifest identifier of C2PA, a `urn:c2pa:` URN. The manifest stores it as the JUMBF label of the manifest box. The claim `instanceID` is a different value and does not take part in the chain. The validator compares the two manifest IDs exactly, without normalization.

The JUMBF label is outside the signed claim. The claim `signature` field is a JUMBF URI of the signature box (C2PA section 8.4.2.1). The validator uses the label as the manifest ID only if this signed URI names it:

- An absolute URI, such as `self#jumbf=/c2pa/urn:c2pa:1b3b.../c2pa.signature`, names the label. Only a URI that starts with a slash names it.
- A URI relative to the manifest, `self#jumbf=c2pa.signature`, resolves to the signature box but does not name the label. The validator cannot verify the manifest ID chain, so the segment fails with `LiveVideoStatusCode.SEGMENT_INVALID`, whatever `lastManifestId` you pass. The rule applies to every continuity method, including a custom one. The segment does not update `nextManifestId` or `nextState`.
- A URI that does not resolve to the signature box of the same manifest fails with `C2paStatusCode.CLAIM_SIGNATURE_MISSING`. The segment does not update the state.

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
| `certificate` | `Uint8Array \| null` | DER-encoded end-entity certificate from the claim signature, or `null` when the signature is absent or carries no certificate |
| `sequenceNumber` | `number \| null` | From the `c2pa.livevideo.segment` assertion, or `null` if the value is not an unsigned integer up to `Number.MAX_SAFE_INTEGER` or the claim does not verify the assertion |
| `previousManifestId` | `string \| null` | From the `c2pa.livevideo.segment` assertion, or `null` if the claim does not verify it |
| `streamId` | `string \| null` | From the `c2pa.livevideo.segment` assertion, or `null` if the claim does not verify it |
| `continuityMethod` | `string \| null` | From the `c2pa.livevideo.segment` assertion, or `null` if the claim does not verify it |
| `bmffHashHex` | `string \| null` | Hex-encoded hash from the `c2pa.hash.bmff.v3` assertion, or `null` if the claim does not verify it |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

> [!NOTE]
> Unlike the VSI method, the Manifest Box method can produce both `LiveVideoStatusCode` and `C2paStatusCode` error codes. Each segment contains a full manifest. The library runs these integrity checks on it: assertion references and hashes, undeclared assertions, the hard binding count, duplicate manifest boxes, and claim signature verification. The segment fields above come only from assertions whose hash matches a claim reference. Check `isValid` before you use any field. A `ManifestBoxContinuityValidator` receives the parsed manifest, whose `assertions` list is the raw assertion store.
>
> A segment without a `c2pa.signature` box fails with `C2paStatusCode.CLAIM_SIGNATURE_MISSING`. The claim signature is verified with the certificate inside the segment. The library does not check that certificate against a trust list. See [Signer Trust](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/results-and-error-codes.md#signer-trust).
>
> C2PA section 19.3 requires a `c2pa.hash.bmff.v3` assertion in the manifest of each segment. A segment without that assertion fails with `LiveVideoStatusCode.SEGMENT_INVALID`. If the manifest also has no other hard binding assertion, the result also includes `C2paStatusCode.CLAIM_HARD_BINDINGS_MISSING`. The library adds that code only for a claim that decodes. A manifest with a claim code such as `C2paStatusCode.CLAIM_MISSING` does not also report `CLAIM_HARD_BINDINGS_MISSING`.
>
> A `c2pa.hash.bmff.v3` assertion that is not a map, has no `hash`, or has a `hash` that is not a byte string fails with `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED`. The validator does not read a `value` field in place of `hash`. An assertion with an exclusion that does not conform to C2PA section 18.6 fails with the same code. Each `data` constraint of an exclusion needs an unsigned integer `offset` and a byte string `value`. The `xpath` of an exclusion must follow the grammar of section 18.6.2. Each node is a `/`, a four-character box type, and an optional index such as `[2]`. The validator also checks the `length`, `subset`, `version`, `flags`, and `exact` fields against the CDDL of section 18.6.2.

<!-- libs/c2pa/docs/merkle-validation.md -->
---
title: VOD Merkle Validation
description: Validate on-demand fragmented MP4 assets using Merkle tree proofs (C2PA section 15.12.2 / 18.6)
---

# VOD Merkle Validation

The VOD Merkle method (C2PA section 15.12.2.2 / 18.6) validates fragmented MP4 (fMP4) assets, such as HLS or DASH VOD streams. The manifest does not list every segment hash. Instead, the init manifest stores one row of a Merkle tree per track. A Merkle tree is a hash tree: each row is computed from the row below. Each media segment has a small auxiliary `uuid` box. The box gives the leaf index of the segment (`location`) and the sibling hashes that derive the stored row from the leaf hash.

Unlike the [Manifest Box](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/manifest-box-validation.md) and [VSI/EMSG](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md) methods, VOD Merkle segments have no manifest or signature of their own. The manifest of the init segment is the only source of trust.

## Overview

Validation happens in two steps:

1. `validateC2paInitSegment` extracts the `merkleMaps`, one per track, from the `c2pa.hash.bmff.v3` assertion of the init segment. It also validates the `initHash` binding of each entry against the bytes of the init segment.
2. `validateC2paMerkleSegment` verifies the Merkle proof of each media segment against those `merkleMaps`. It also enforces `location` continuity per track, with state that the caller keeps.

A stream is in VOD Merkle mode only when `merkleMaps` is not empty. Otherwise it uses one of the other two methods.

## Validating the Init Segment

```typescript
import { validateC2paInitSegment } from '@svta/cml-c2pa'

const initResponse = await fetch(initUrl)
const initBytes = new Uint8Array(await initResponse.arrayBuffer())
const init = await validateC2paInitSegment(initBytes)

if (init.isValid && init.merkleMaps.length > 0) {
  // VOD Merkle stream: proceed to validate media segments against init.merkleMaps
}
```

`merkleMaps` is not empty only when the `c2pa.hash.bmff.v3` assertion of the init segment has a `merkle` field.

Check `isValid` before you use `merkleMaps`. The init manifest must carry a claim signature that verifies. An init segment without a `c2pa.signature` box fails with `C2paStatusCode.CLAIM_SIGNATURE_MISSING`, and its `merkleMaps` must not be trusted. The signature is verified with the certificate inside the manifest. The library does not check that certificate against a trust list. See [Signer Trust](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/results-and-error-codes.md#signer-trust).

If the `exclusions` of the `c2pa.hash.bmff.v3` assertion exclude the whole `moov` box, the init segment fails with `LiveVideoStatusCode.INIT_INVALID`. The library applies this rule of C2PA section 19.2.3 to VOD Merkle init segments too. A nested exclusion such as `/moov/udta` keeps the init segment valid. A `subset` exclusion of the `moov` box also keeps the init segment valid, unless the ranges cover the whole box.

## Validating Media Segments

```typescript
import { validateC2paMerkleSegment } from '@svta/cml-c2pa'
import type { MerkleSegmentState } from '@svta/cml-c2pa'

let state: MerkleSegmentState | undefined

for (const segmentUrl of segmentUrls) {
  const response = await fetch(segmentUrl)
  const bytes = new Uint8Array(await response.arrayBuffer())

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
  const initResponse = await fetch(initUrl)
  const initBytes = new Uint8Array(await initResponse.arrayBuffer())
  const init = await validateC2paInitSegment(initBytes)

  if (!init.isValid) {
    console.error('Init segment failed', init.errorCodes)
    return
  }

  if (init.merkleMaps.length === 0) {
    console.error('Not a VOD Merkle stream')
    return
  }

  let state: MerkleSegmentState | undefined

  for (const segmentUrl of segmentUrls) {
    const response = await fetch(segmentUrl)
    const bytes = new Uint8Array(await response.arrayBuffer())

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

<!-- libs/c2pa/docs/results-and-error-codes.md -->
---
title: Results and Error Codes
description: Interpret validation results, error codes, and manifest data
---

# Results and Error Codes

All validation functions in `@svta/cml-c2pa` return structured results with an `isValid` boolean and an `errorCodes` array. This guide explains the results, the error codes, and the manifest data.

## Checking Validation Results

Every result follows the same pattern:

```typescript
if (!result.isValid) {
  for (const code of result.errorCodes) {
    console.error(`Validation failure: ${code}`)
  }
}
```

The `errorCodes` array may contain several codes when several checks fail. When `isValid` is `true`, the array is empty.

## Signer Trust

`isValid` is `true` when the manifest is well formed and the claim signature verifies. Every store assertion must be referenced by the claim and match its hash. The manifest must have exactly one hard binding. The signature is verified with the end-entity certificate that the manifest carries in its `x5chain` header. The library does not check that certificate against a trust list. Any party with a certificate can produce a manifest that validates.

Before you present content as authentic, compare the signer with your own trust anchors. `InitSegmentValidation.certificate` and `ManifestBoxValidationResult.certificate` hold the DER-encoded end-entity certificate from the claim signature. The value is `null` when the signature is absent or carries no certificate.

A manifest without a `c2pa.signature` box, or with a claim `signature` URI that does not resolve to that box, fails with `C2paStatusCode.CLAIM_SIGNATURE_MISSING`. A signature that carries no certificate, or that does not verify over the claim, fails with `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH`.

A claim box whose CBOR does not decode fails with `C2paStatusCode.CLAIM_CBOR_INVALID`. A claim box whose CBOR is not a map, for example a map inside a CBOR tag, fails with `C2paStatusCode.CLAIM_MALFORMED`. The library does not check the fields of the claim.

An assertion whose CBOR does not decode fails with `C2paStatusCode.ASSERTION_CBOR_INVALID` (C2PA section 15.10.3.1). An assertion whose JSON is not UTF-8 or does not parse fails with `C2paStatusCode.ASSERTION_JSON_INVALID`. These checks apply to every assertion, whatever the label. CBOR that is not deterministic still passes, for example a map with unsorted keys.

The CBOR decoder also rejects some CBOR that is well-formed. An assertion with such CBOR reports `ASSERTION_CBOR_INVALID`, and a claim with such CBOR reports `CLAIM_CBOR_INVALID`. The rejected forms are:

- a map key that is an array, a map, a byte string, or a tag
- a map with a duplicate key, where keys with the same name as a string count as duplicates, for example `1` and `"1"`
- an unassigned simple value
- a tag number above 2^53
- nesting deeper than 128 levels

## Live Video Error Codes

The `LiveVideoStatusCode` constants are the live video validation failures that C2PA specification section 19.7 defines.

```typescript
import { LiveVideoStatusCode } from '@svta/cml-c2pa'
```

| Constant | Value | Meaning |
|----------|-------|---------|
| `INIT_INVALID` | `livevideo.init.invalid` | Init segment contains an `mdat` box. Init manifest without a `c2pa.hash.bmff.v3` assertion. Init content hash that does not include the `moov` box, or that does not match (with `ASSERTION_BMFFHASH_MISMATCH`). |
| `MANIFEST_INVALID` | `livevideo.manifest.invalid` | C2PA Manifest Box failed standard validation |
| `SEGMENT_INVALID` | `livevideo.segment.invalid` | Signature, hash, or key failure. Key outside the validity period. Manifest box segment without a `c2pa.hash.bmff.v3` assertion. VSI sequence number not moving forward or below the key minimum. Broken `c2pa.manifestId` chain. Manifest box claim `signature` URI that does not name the manifest label. Failed custom continuity validator. |
| `ASSERTION_INVALID` | `livevideo.assertion.invalid` | Manifest box segment: sequenceNumber or streamId mismatch |
| `CONTINUITY_METHOD_INVALID` | `livevideo.continuityMethod.invalid` | `continuityMethod` absent, unsupported, or required companion fields missing |
| `CONTINUITY_METHOD_UNSUPPORTED` | `livevideo.continuityMethod.unsupported` | Custom continuity method with no registered validator (always alongside `continuityMethod.invalid`) |
| `SESSIONKEY_INVALID` | `livevideo.sessionkey.invalid` | A session key in the init segment is invalid, or the `c2pa.session-keys` assertion has no session key or does not decode |

Versions 1.3.0 and earlier report `SESSIONKEY_INVALID` from `validateC2paSegment` for a session key that expired after init segment validation. That code does not match C2PA section 19.7.3. To check the validity period of a session key, see [Session Key Lifecycle](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md#session-key-lifecycle).

Example of handling specific error codes:

```typescript
import { LiveVideoStatusCode } from '@svta/cml-c2pa'

for (const code of result.errorCodes) {
  switch (code) {
    case LiveVideoStatusCode.SEGMENT_INVALID:
      // Signature, hash, key, or VSI sequence failure
      break
    case LiveVideoStatusCode.SESSIONKEY_INVALID:
      // Init segment has an invalid session key
      break
    case LiveVideoStatusCode.ASSERTION_INVALID:
      // Sequence number or stream ID problem (manifest box method)
      break
    case LiveVideoStatusCode.CONTINUITY_METHOD_INVALID:
      // Manifest ID chain is broken
      break
    case LiveVideoStatusCode.INIT_INVALID:
      // Init segment structure is invalid
      break
    case LiveVideoStatusCode.MANIFEST_INVALID:
      // Embedded manifest failed validation
      break
  }
}
```

### Invalid Session Keys

`validateC2paInitSegment` reports `SESSIONKEY_INVALID` if it finds an invalid session key in the `c2pa.session-keys` assertion (C2PA section 19.7.3). A session key is invalid if it does not conform to section 18.25.2, or if its signer binding fails verification. The library does not check every rule of section 18.25.2. `sessionKeys` contains only the session keys that pass these checks.

The COSE key must include a `kid` (label 2). `minSequenceNumber` and `validityPeriod` must be unsigned integers up to `Number.MAX_SAFE_INTEGER` (2^53 - 1). `createdAt` must be CBOR tag 0 with an RFC 3339 date-time string (RFC 8949 section 3.4.1). The letters `T` and `Z` must be uppercase. The date must exist, so `2025-02-30T00:00:00Z` is invalid. A leap second (second 60) is also invalid, because a JavaScript `Date` cannot represent it.

An expired session key does not count as invalid. `sessionKeys` excludes the expired key, and the result has no error code for that key.

The assertion must contain at least one session key (section 18.25.2). `validateC2paInitSegment` reports `SESSIONKEY_INVALID` if the assertion has no session key, or if its CBOR does not decode. This rule also applies in VOD Merkle mode. If the CBOR does not decode, the result also includes `C2paStatusCode.ASSERTION_CBOR_INVALID`.

Versions 1.3.0 and earlier report no error code for an invalid session key if another session key is valid. These versions also accept a `kid` outside the COSE key. They throw an error if the library cannot verify a session key, for example a key type that it does not support. They also throw an error if the CBOR of the `c2pa.session-keys` assertion does not decode. If your code catches these errors, check `errorCodes` instead.

## C2PA Status Codes

The `C2paStatusCode` constants represent manifest integrity failures defined in C2PA specification sections 15 and 18.

```typescript
import { C2paStatusCode } from '@svta/cml-c2pa'
```

| Constant | Value | Meaning |
|----------|-------|---------|
| `ASSERTION_HASHEDURI_MISMATCH` | `assertion.hashedURI.mismatch` | Assertion hash does not match the claim reference |
| `ASSERTION_MISSING` | `assertion.missing` | The store has no box for a claim reference, or more than one box for its label |
| `ASSERTION_MULTIPLE_HARD_BINDINGS` | `assertion.multipleHardBindings` | The manifest has more than one hard binding assertion |
| `ASSERTION_UNDECLARED` | `assertion.undeclared` | The assertion store holds an assertion that the claim does not reference |
| `ASSERTION_CBOR_INVALID` | `assertion.cbor.invalid` | An assertion box holds CBOR that does not decode |
| `ASSERTION_JSON_INVALID` | `assertion.json.invalid` | An assertion box holds JSON that is not UTF-8 or does not parse |
| `ASSERTION_ACTION_INGREDIENT_MISMATCH` | `assertion.action.ingredientMismatch` | Action requires an ingredient reference but none is present |
| `CLAIM_SIGNATURE_MISMATCH` | `claimSignature.mismatch` | Claim signature verification failed, or the signature carries no certificate |
| `CLAIM_SIGNATURE_MISSING` | `claimSignature.missing` | The manifest has no `c2pa.signature` box, or the claim `signature` URI does not resolve to it |
| `CLAIM_MISSING` | `claim.missing` | The manifest has no claim box |
| `CLAIM_CBOR_INVALID` | `claim.cbor.invalid` | The claim box holds CBOR that does not decode |
| `CLAIM_MALFORMED` | `claim.malformed` | The claim box holds CBOR that is not a map |
| `CLAIM_MULTIPLE` | `claim.multiple` | The manifest has more than one claim box |
| `CLAIM_HARD_BINDINGS_MISSING` | `claim.hardBindings.missing` | The manifest has no hard binding assertion |
| `ASSERTION_BMFFHASH_MALFORMED` | `assertion.bmffHash.malformed` | BMFF hash assertion or Merkle structure is malformed |
| `ASSERTION_BMFFHASH_MISMATCH` | `assertion.bmffHash.mismatch` | BMFF content hash does not match the committed value |

Versions 1.2.0 and earlier report `claim.signature.mismatch` for `CLAIM_SIGNATURE_MISMATCH`. That value does not match the C2PA specification. Compare codes with the `C2paStatusCode` constants, not with string literals.

> [!NOTE]
> `C2paStatusCode` values appear in `InitSegmentValidation.errorCodes` and `ManifestBoxValidationResult.errorCodes`, which check manifest integrity. They do not appear in `SegmentValidationResult.errorCodes`: the VSI/EMSG segment validation (Verifiable Segment Info, in event message boxes) uses only `LiveVideoStatusCode`.
>
> For VOD Merkle streams, `InitSegmentValidation` extracts `merkleMaps` from the `c2pa.hash.bmff.v3` assertion and validates the `initHash` binding of each entry. VOD Merkle segments do not use session keys. An invalid session key still causes `SESSIONKEY_INVALID`. See [Invalid Session Keys](#invalid-session-keys).

## Working with Manifest Data

The `C2paManifest` type represents a parsed C2PA manifest. It is available through `InitSegmentValidation.manifest` (VSI method) and `ManifestBoxValidationResult.manifest` (Manifest Box method).

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Manifest label (identifier within the manifest store) |
| `instanceId` | `string \| null` | Unique instance ID |
| `claimGenerator` | `string \| null` | Tool that generated the claim |
| `signatureInfo` | `C2paSignatureInfo` | Signature metadata |
| `assertions` | `readonly C2paAssertion[]` | All assertions in the assertion store. Read them only when `isValid` is `true`. |

The `signatureInfo` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `issuer` | `string \| null` | Certificate issuer (Common Name or Organization) |
| `certNotBefore` | `string \| null` | Certificate validity start (ISO 8601) |

```typescript
const { isValid, manifest } = init // or result for the Manifest Box method

// The assertions list is the raw assertion store, so read it only when isValid is true.
if (isValid && manifest) {
  console.log('Label:', manifest.label)
  console.log('Instance ID:', manifest.instanceId)
  console.log('Claim generator:', manifest.claimGenerator)
  console.log('Issuer:', manifest.signatureInfo.issuer)
  console.log('Cert not before:', manifest.signatureInfo.certNotBefore)

  for (const assertion of manifest.assertions) {
    console.log(`Assertion [${assertion.label}]:`, assertion.data)
  }
}
```

`data` is the decoded content of the assertion. For a CBOR assertion, a map is a plain object with string keys, a byte string is a `Uint8Array`, and an unsigned integer up to `Number.MAX_SAFE_INTEGER` (2^53 - 1) is a number. A larger integer is a BigInt. CBOR tag 0 and tag 1 are a `Date`. Every other tag is a `{ tag, value }` object. For a JSON assertion, `data` is the parsed JSON. For other content, `data` is the raw bytes of the content box. `data` is also the raw bytes for CBOR that does not decode or JSON that does not parse.

## Sequence Validation Reasons

With the [VSI/EMSG method](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md), each `SegmentValidationResult` includes a `sequenceResult` field: a discriminated union on `reason` with `SequenceValidationReason` constants:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'
```

| Constant | Value | Valid | Additional Fields | Description |
|----------|-------|-------|-------------------|-------------|
| `VALID` | `valid` | `true` | none | Sequence number is the next expected value |
| `DUPLICATE` | `duplicate` | `false` | none | Sequence number was already seen |
| `GAP_DETECTED` | `gap_detected` | `false` | `missingFrom`, `missingTo` | One or more sequence numbers were skipped. The segment is not invalid for this reason. |
| `OUT_OF_ORDER` | `out_of_order` | `false` | none | Sequence number is less than the last seen |
| `SEQUENCE_NUMBER_BELOW_MINIMUM` | `sequence_number_below_minimum` | `false` | none | Below the session key's `minSequenceNumber` |

Narrow the type to access the `GAP_DETECTED` fields:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'

if (result.sequenceResult.reason === SequenceValidationReason.GAP_DETECTED) {
  console.warn(
    `Missing segments ${result.sequenceResult.missingFrom}` +
    ` through ${result.sequenceResult.missingTo}`,
  )
}
```

## Choosing a Validation Method

The two validation methods serve different use cases:

| Aspect | VSI/EMSG (section 19.4) | Manifest Box (section 19.3) |
|--------|-------------------------|---------------------------|
| Init segment required | Yes | No |
| Per-segment overhead | Low (EMSG box only) | High (full manifest per segment) |
| Session keys | Yes | No |
| Manifest access | Init segment only | Every segment |
| Continuity mechanism | Sequence numbers | Manifest ID chaining |
| Functions | `validateC2paInitSegment` + `validateC2paSegment` | `validateC2paManifestBoxSegment` |

The VSI/EMSG method suits low-overhead real-time streaming where bandwidth matters. The Manifest Box method gives self-contained segments that are verifiable without earlier context.

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [C2PA Live Video Validation (section 19.7)](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html#_live_video_validation_process)
- [COSE, RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)

<!-- libs/c2pa/docs/vsi-validation.md -->
---
title: VSI/EMSG Validation
description: Validate live streams using the Verifiable Segment Info method (C2PA section 19.4)
---

# VSI/EMSG Validation

The Verifiable Segment Info (VSI) method is a two-phase approach to C2PA live video validation, defined in section 19.4 of the C2PA specification. The init segment contains the full C2PA manifest and the session keys. Each media segment contains a small EMSG box with a COSE_Sign1 signature, verified against those session keys.

## Overview

The validation flow has two phases:

1. **Init segment**: call `validateC2paInitSegment` once. It parses the C2PA manifest, verifies its integrity, and extracts the validated session keys.
2. **Media segments**: call `validateC2paSegment` for each media segment. The function finds the C2PA EMSG box and verifies the COSE_Sign1 signature against a session key. It then checks the BMFF content hash and validates the sequence number.

A `SequenceState` object passes from each media segment call to the next and tracks the sequence numbers.

## Step 1: Validate the Init Segment

```typescript
import { validateC2paInitSegment } from '@svta/cml-c2pa'

const initResponse = await fetch(initUrl)
const initBytes = new Uint8Array(await initResponse.arrayBuffer())
const init = await validateC2paInitSegment(initBytes)

if (!init.isValid) {
  throw new Error(`Init segment validation failed: ${init.errorCodes.join(', ')}`)
}
```

The returned `InitSegmentValidation` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `manifest` | `C2paManifest \| null` | Parsed manifest (label, assertions, signature info) |
| `certificate` | `Uint8Array \| null` | DER-encoded end-entity certificate |
| `manifestId` | `string \| null` | Manifest identifier (`urn:c2pa:` URN), from the JUMBF label of the manifest. `null` if the claim `signature` URI does not name the label, as with a URI relative to the manifest. Compare it with the `manifestId` of each segment. |
| `sessionKeys` | `readonly ValidatedSessionKey[]` | Session keys with valid signer binding |
| `isValid` | `boolean` | All checks passed |
| `errorCodes` | `readonly (LiveVideoStatusCode \| C2paStatusCode)[]` | Failure codes (empty when valid) |

C2PA section 19.2.3 requires a `c2pa.hash.bmff.v3` assertion in the init manifest. The content hash of that assertion must include the `moov` box. If the init segment does not conform, the result has `LiveVideoStatusCode.INIT_INVALID` and no `sessionKeys`.

### Accessing Session Keys

`sessionKeys` includes only keys with a valid signer binding and an unexpired validity period:

```typescript
for (const key of init.sessionKeys) {
  console.log('Key ID:', key.kid)
  console.log('Curve:', key.jwk.crv)
  console.log('Min sequence number:', key.minSequenceNumber)
  console.log('Validity period (seconds):', key.validityPeriod)
  console.log('Created at:', key.createdAt)
}
```

If a session key is invalid, the result includes `LiveVideoStatusCode.SESSIONKEY_INVALID`. See [Invalid Session Keys](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/results-and-error-codes.md#invalid-session-keys).

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
  const segmentResponse = await fetch(segmentUrl)
  const segmentBytes = new Uint8Array(await segmentResponse.arrayBuffer())
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

- `result`: a `SegmentValidationResult` with the validation outcome
- `nextSequenceState`: the sequence state to pass into the next call

The `SegmentValidationResult` contains:

| Field | Type | Description |
|-------|------|-------------|
| `sequenceNumber` | `number` | Segment sequence number from the VSI map |
| `manifestId` | `string` | Manifest ID referenced by this segment |
| `bmffHashHex` | `string \| null` | Hex-encoded BMFF content hash |
| `kidHex` | `string \| null` | Hex-encoded key ID used for verification |
| `sequenceResult` | `SequenceValidationResult` | Sequence number validation outcome |
| `isValid` | `boolean` | All checks passed. A gap does not fail the segment. |
| `errorCodes` | `readonly LiveVideoStatusCode[]` | Failure codes (empty when valid) |

> [!NOTE]
> Always keep `nextSequenceState` and pass it to the next `validateC2paSegment` call. It enables the detection of duplicates, gaps, and out-of-order segments. A duplicate, out-of-order, or below-minimum sequence number fails the segment with `LiveVideoStatusCode.SEGMENT_INVALID`. C2PA 2.4 section 19.7.3 defines only the below-minimum check. The duplicate and out-of-order check is a library rule with the code of the C2PA 2.5 draft. A gap does not fail the segment. `sequenceResult` reports the gap and its missing range. A segment whose signature or content hash does not verify leaves `nextSequenceState` equal to the `sequenceState` that the function received. The same applies to a segment whose session key is missing, not yet active, or expired. After a seek or an encoder restart, pass `undefined` to start a new state.

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
  const initResponse = await fetch(initUrl)
  const initBytes = new Uint8Array(await initResponse.arrayBuffer())
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
    const response = await fetch(segmentUrl)
    const bytes = new Uint8Array(await response.arrayBuffer())
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

    // A gap does not fail the segment. Report the missing segments before a valid segment.
    if (result.isValid && result.sequenceResult.reason === SequenceValidationReason.GAP_DETECTED) {
      console.warn(
        `Missing segments ${result.sequenceResult.missingFrom}` +
        ` through ${result.sequenceResult.missingTo}`,
      )
    }
  }
}
```

## Session Key Lifecycle

Session keys are extracted from the `c2pa.session-keys` assertion in the init segment manifest. Each key passes signer binding verification before it is included in the validation result. The signer binding verification accepts two forms of the signed payload: the end-entity certificate itself, or the certificate as a CBOR byte string. The text of C2PA section 18.25.2 allows both forms.

The signer binding is a `COSE_Sign1` structure with CBOR tag 18 and a payload field. The payload field can be nil, an empty byte string, or an exact copy of the signed payload. If the payload field has other content, the signer binding verification fails.

The validation function handles key matching and the validity period:

1. **Key matching**: `validateC2paSegment` matches the `kid` (key ID) from the COSE_Sign1 header against the available session keys.
2. **Validity period**: A key is active from `createdAt` until `createdAt + validityPeriod` (C2PA section 18.25.2). If the matched key is not yet active or has expired, the result includes `LiveVideoStatusCode.SEGMENT_INVALID` (C2PA section 19.7.3).
3. **No match**: If no session key matches the `kid`, the result includes `LiveVideoStatusCode.SEGMENT_INVALID`.

`SEGMENT_INVALID` is also the code for signature and hash failures. If you need to know whether the validity period caused the failure, check the matched key:

```typescript
import type { SegmentValidationResult, ValidatedSessionKey } from '@svta/cml-c2pa'

function isOutsideValidityPeriod(
  result: SegmentValidationResult,
  sessionKeys: readonly ValidatedSessionKey[],
): boolean {
  const key = sessionKeys.find(k => k.kid === result.kidHex)
  if (!key) return false

  const now = Date.now()
  const activeFrom = Date.parse(key.createdAt)
  const activeUntil = activeFrom + key.validityPeriod * 1000
  return now < activeFrom || now > activeUntil
}
```

> [!NOTE]
> An init segment can contain a session key that becomes active later. `sessionKeys` includes that key. You do not need to validate the same init segment again when the key becomes active.
>
> When a session key expires during the stream, the signer is expected to produce a new init segment with new session keys. Validate the new init segment and use its `sessionKeys` for the following media segments.

## Sequence Number Validation

Each media segment has an increasing sequence number in its VSI map. The sequence number must be an unsigned integer (C2PA section 19.4.2). The library supports values up to `Number.MAX_SAFE_INTEGER` (2^53 - 1). For any other value, `validateC2paSegment` throws an error.

The `sequenceResult` field is a discriminated union on `reason`, with `SequenceValidationReason` constants:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'
```

| Constant | Value | Valid | Description |
|----------|-------|-------|-------------|
| `VALID` | `valid` | `true` | Sequence number is the next expected value |
| `DUPLICATE` | `duplicate` | `false` | Sequence number was already seen |
| `GAP_DETECTED` | `gap_detected` | `false` | One or more sequence numbers were skipped. The segment is not invalid for this reason. |
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
> The sequence state keeps a bounded sliding window of the last 32 sequence numbers, so memory use is constant whatever the stream length.

<!-- libs/c2pa/config/cml-c2pa.api.md -->
## API Report File for "@svta/cml-c2pa"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ValueOf } from '@svta/cml-utils';

// @public
export type BmffHashConstraint = {
    readonly offset: number;
    readonly value: Uint8Array | readonly number[];
};

// @public
export type BmffHashExclusion = {
    readonly xpath: string;
    readonly length?: number;
    readonly data?: readonly BmffHashConstraint[];
    readonly subset?: readonly BmffHashSubset[];
    readonly version?: number;
    readonly flags?: Uint8Array | readonly number[];
    readonly exact?: boolean;
};

// @public
export type BmffHashSubset = {
    readonly offset: number;
    readonly length: number;
};

// @public
export type C2paAssertion = {
    readonly label: string;
    readonly data: unknown;
};

// @public
export type C2paManifest = {
    readonly label: string;
    readonly instanceId: string | null;
    readonly claimGenerator: string | null;
    readonly signatureInfo: C2paSignatureInfo;
    readonly assertions: readonly C2paAssertion[];
};

// @public
export type C2paSignatureInfo = {
    readonly issuer: string | null;
    readonly certNotBefore: string | null;
};

// @public
export const C2paStatusCode: {
    readonly ASSERTION_HASHEDURI_MISMATCH: "assertion.hashedURI.mismatch";
    readonly ASSERTION_MISSING: "assertion.missing";
    readonly ASSERTION_MULTIPLE_HARD_BINDINGS: "assertion.multipleHardBindings";
    readonly ASSERTION_UNDECLARED: "assertion.undeclared";
    readonly ASSERTION_CBOR_INVALID: "assertion.cbor.invalid";
    readonly ASSERTION_JSON_INVALID: "assertion.json.invalid";
    readonly ASSERTION_ACTION_INGREDIENT_MISMATCH: "assertion.action.ingredientMismatch";
    readonly CLAIM_SIGNATURE_MISMATCH: "claimSignature.mismatch";
    readonly CLAIM_SIGNATURE_MISSING: "claimSignature.missing";
    readonly CLAIM_MISSING: "claim.missing";
    readonly CLAIM_CBOR_INVALID: "claim.cbor.invalid";
    readonly CLAIM_MALFORMED: "claim.malformed";
    readonly CLAIM_MULTIPLE: "claim.multiple";
    readonly CLAIM_HARD_BINDINGS_MISSING: "claim.hardBindings.missing";
    readonly ASSERTION_BMFFHASH_MALFORMED: "assertion.bmffHash.malformed";
    readonly ASSERTION_BMFFHASH_MISMATCH: "assertion.bmffHash.mismatch";
};

// @public
export type C2paStatusCode = ValueOf<typeof C2paStatusCode>;

// @public
export type CoseKeyJwk = {
    readonly kty: string;
    readonly crv: string;
    readonly x: string;
    readonly y?: string;
};

// @public
export type InitSegmentValidation = {
    readonly manifest: C2paManifest | null;
    readonly certificate: Uint8Array | null;
    readonly manifestId: string | null;
    readonly sessionKeys: readonly ValidatedSessionKey[];
    readonly merkleMaps: readonly MerkleMap[];
    readonly isValid: boolean;
    readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[];
};

// @public
export const LiveVideoStatusCode: {
    readonly INIT_INVALID: "livevideo.init.invalid";
    readonly MANIFEST_INVALID: "livevideo.manifest.invalid";
    readonly SEGMENT_INVALID: "livevideo.segment.invalid";
    readonly ASSERTION_INVALID: "livevideo.assertion.invalid";
    readonly CONTINUITY_METHOD_INVALID: "livevideo.continuityMethod.invalid";
    readonly CONTINUITY_METHOD_UNSUPPORTED: "livevideo.continuityMethod.unsupported";
    readonly SESSIONKEY_INVALID: "livevideo.sessionkey.invalid";
};

// @public
export type LiveVideoStatusCode = ValueOf<typeof LiveVideoStatusCode>;

// @public
export type ManifestBoxContinuityValidator = (liveVideoAssertion: Readonly<Record<string, unknown>>, manifest: C2paManifest) => boolean | Promise<boolean>;

// @public
export type ManifestBoxValidationOptions = {
    readonly continuityValidator?: {
        readonly method: string;
        readonly validate: ManifestBoxContinuityValidator;
    };
};

// @public
export type ManifestBoxValidationResult = {
    readonly manifest: C2paManifest | null;
    readonly issuer: string | null;
    readonly certificate: Uint8Array | null;
    readonly sequenceNumber: number | null;
    readonly previousManifestId: string | null;
    readonly streamId: string | null;
    readonly continuityMethod: string | null;
    readonly bmffHashHex: string | null;
    readonly isValid: boolean;
    readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[];
};

// @public
export type ManifestBoxValidationState = {
    readonly lastStreamId?: string | null;
    readonly lastSequenceNumber?: number | null;
};

// @public
export type MerkleMap = {
    readonly uniqueId: number;
    readonly localId: number;
    readonly count: number;
    readonly hashes: readonly Uint8Array[];
    readonly initHash: Uint8Array | null;
    readonly alg: string | null;
    readonly exclusions: readonly BmffHashExclusion[];
    readonly offsetPrefixSize: number;
};

// @public
export type MerkleSegmentState = {
    readonly lastLocations: ReadonlyMap<string, number>;
};

// @public
export type MerkleSegmentValidation = {
    readonly location: number | null;
    readonly bmffHashHex: string | null;
    readonly isValid: boolean;
    readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[];
};

// @public
export type SegmentValidationResult = {
    readonly sequenceNumber: number;
    readonly manifestId: string;
    readonly bmffHashHex: string | null;
    readonly kidHex: string | null;
    readonly sequenceResult: SequenceValidationResult;
    readonly isValid: boolean;
    readonly errorCodes: readonly LiveVideoStatusCode[];
};

// @public
export type SequenceState = {
    readonly lastSequenceNumber: number | null;
    readonly seenSequences: ReadonlySet<number>;
};

// @public
export const SequenceValidationReason: {
    readonly VALID: "valid";
    readonly DUPLICATE: "duplicate";
    readonly GAP_DETECTED: "gap_detected";
    readonly OUT_OF_ORDER: "out_of_order";
    readonly SEQUENCE_NUMBER_BELOW_MINIMUM: "sequence_number_below_minimum";
};

// @public
export type SequenceValidationReason = ValueOf<typeof SequenceValidationReason>;

// @public
export type SequenceValidationResult = {
    readonly isValid: true;
    readonly reason: typeof SequenceValidationReason.VALID;
} | {
    readonly isValid: false;
    readonly reason: typeof SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM | typeof SequenceValidationReason.DUPLICATE | typeof SequenceValidationReason.OUT_OF_ORDER;
} | {
    readonly isValid: false;
    readonly reason: typeof SequenceValidationReason.GAP_DETECTED;
    readonly missingFrom: number;
    readonly missingTo: number;
};

// @public
export function validateC2paInitSegment(bytes: Uint8Array): Promise<InitSegmentValidation>;

// @public
export function validateC2paManifestBoxSegment(bytes: Uint8Array, lastManifestId: string | null, state?: ManifestBoxValidationState, options?: ManifestBoxValidationOptions): Promise<{
    readonly result: ManifestBoxValidationResult;
    readonly nextManifestId: string | null;
    readonly nextState: ManifestBoxValidationState;
}>;

// @public
export function validateC2paMerkleSegment(segmentBytes: Uint8Array, merkleMaps: readonly MerkleMap[], state?: MerkleSegmentState): Promise<{
    readonly result: MerkleSegmentValidation;
    readonly nextState: MerkleSegmentState;
}>;

// @public
export function validateC2paSegment(segmentBytes: Uint8Array, sessionKeys: readonly ValidatedSessionKey[], sequenceState?: SequenceState): Promise<{
    readonly result: SegmentValidationResult;
    readonly nextSequenceState: SequenceState;
} | null>;

// @public
export type ValidatedSessionKey = {
    readonly kid: string;
    readonly jwk: CoseKeyJwk;
    readonly minSequenceNumber: number;
    readonly validityPeriod: number;
    readonly createdAt: string;
};

// (No @packageDocumentation comment for this package)

```
