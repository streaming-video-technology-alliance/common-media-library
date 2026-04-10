---
title: Results and Error Codes
description: Interpret validation results, error codes, and manifest data
---

# Results and Error Codes

All validation functions in `@svta/cml-c2pa` return structured results with an `isValid` boolean and an `errorCodes` array. This guide covers how to interpret these results, understand error codes, and work with manifest data.

## Checking Validation Results

Every validation result follows the same pattern:

```typescript
if (!result.isValid) {
  for (const code of result.errorCodes) {
    console.error(`Validation failure: ${code}`)
  }
}
```

The `errorCodes` array may contain multiple codes when several checks fail simultaneously. When `isValid` is `true`, the array is empty.

## Live Video Error Codes

The `LiveVideoStatusCode` constants represent failures specific to live video validation, as defined in C2PA specification section 19.7.

```typescript
import { LiveVideoStatusCode } from '@svta/cml-c2pa'
```

| Constant | Value | Meaning |
|----------|-------|---------|
| `INIT_INVALID` | `livevideo.init.invalid` | Init segment contains an `mdat` box or BMFF hash mismatch |
| `MANIFEST_INVALID` | `livevideo.manifest.invalid` | C2PA Manifest Box failed standard validation |
| `SEGMENT_INVALID` | `livevideo.segment.invalid` | Crypto failure: signature, hash, or key mismatch |
| `ASSERTION_INVALID` | `livevideo.assertion.invalid` | sequenceNumber or streamId mismatch |
| `CONTINUITY_METHOD_INVALID` | `livevideo.continuityMethod.invalid` | Continuity chain broken or method unsupported |
| `SESSIONKEY_INVALID` | `livevideo.sessionkey.invalid` | Session key invalid or expired |

Example of handling specific error codes:

```typescript
import { LiveVideoStatusCode } from '@svta/cml-c2pa'

for (const code of result.errorCodes) {
  switch (code) {
    case LiveVideoStatusCode.SEGMENT_INVALID:
      // Cryptographic check failed (signature, hash, or key)
      break
    case LiveVideoStatusCode.SESSIONKEY_INVALID:
      // Session key expired — may need a fresh init segment
      break
    case LiveVideoStatusCode.ASSERTION_INVALID:
      // Sequence number or stream ID problem
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

## C2PA Status Codes

The `C2paStatusCode` constants represent manifest integrity failures defined in C2PA specification sections 15 and 18.

```typescript
import { C2paStatusCode } from '@svta/cml-c2pa'
```

| Constant | Value | Meaning |
|----------|-------|---------|
| `ASSERTION_HASHEDURI_MISMATCH` | `assertion.hashedURI.mismatch` | Assertion hash does not match the claim reference |
| `ASSERTION_MISSING` | `assertion.missing` | Referenced assertion not found in the assertion store |
| `ASSERTION_ACTION_INGREDIENT_MISMATCH` | `assertion.action.ingredientMismatch` | Action requires an ingredient reference but none is present |
| `CLAIM_SIGNATURE_MISMATCH` | `claim.signature.mismatch` | Claim signature verification failed |

> [!NOTE]
> `C2paStatusCode` values appear in `InitSegmentValidation.errorCodes` and `ManifestBoxValidationResult.errorCodes` (which perform manifest integrity checks). They do not appear in `SegmentValidationResult.errorCodes` — the VSI/EMSG segment validation uses only `LiveVideoStatusCode`.

## Working with Manifest Data

The `C2paManifest` type represents a parsed C2PA manifest. It is available through `InitSegmentValidation.manifest` (VSI method) and `ManifestBoxValidationResult.manifest` (Manifest Box method).

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Manifest label (identifier within the manifest store) |
| `instanceId` | `string \| null` | Unique instance ID |
| `claimGenerator` | `string \| null` | Tool that generated the claim |
| `signatureInfo` | `C2paSignatureInfo` | Signature metadata |
| `assertions` | `readonly C2paAssertion[]` | All assertions in the manifest |

The `signatureInfo` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `issuer` | `string \| null` | Certificate issuer (Common Name or Organization) |
| `certNotBefore` | `string \| null` | Certificate validity start (ISO 8601) |

```typescript
const { manifest } = init // or result.manifest for the Manifest Box method

if (manifest) {
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

## Sequence Validation Reasons

When using the [VSI/EMSG method](vsi-validation.md), each segment's `SegmentValidationResult` includes a `sequenceResult` field. This is a discriminated union on `reason`, using `SequenceValidationReason` constants:

```typescript
import { SequenceValidationReason } from '@svta/cml-c2pa'
```

| Constant | Value | Valid | Additional Fields | Description |
|----------|-------|-------|-------------------|-------------|
| `VALID` | `valid` | `true` | — | Sequence number is the next expected value |
| `DUPLICATE` | `duplicate` | `false` | — | Sequence number was already seen |
| `GAP_DETECTED` | `gap_detected` | `false` | `missingFrom`, `missingTo` | One or more sequence numbers were skipped |
| `OUT_OF_ORDER` | `out_of_order` | `false` | — | Sequence number is less than the last seen |
| `SEQUENCE_NUMBER_BELOW_MINIMUM` | `sequence_number_below_minimum` | `false` | — | Below the session key's `minSequenceNumber` |

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

The VSI/EMSG method is designed for low-overhead real-time streaming where bandwidth matters. The Manifest Box method provides self-contained segments that can be independently verified without prior context.

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [C2PA Live Video Validation (section 19.7)](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html#_live_video_validation_process)
- [COSE — RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)
