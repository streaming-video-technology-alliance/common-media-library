# @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for ISO Base Media File Format (BMFF) and MP4 containers.

Supported C2PA segment validation methods:

- **§19.3 Per-segment C2PA Manifest Box**: each segment embeds a full C2PA manifest with a CBOR Object Signing and Encryption (COSE) signature
- **§19.4 Verifiable Segment Info (VSI/EMSG)**: the init segment contains the manifest and the session keys. Each media segment contains a small signed event message (EMSG) box
- **§15.12.2 / §18.6 VOD Merkle**: for video on demand (VOD) assets in fragmented MP4, the init manifest stores one Merkle tree row per track. Each media segment contains its own leaf hash and proof


## Installation

```bash
npm i @svta/cml-c2pa
```

> **Note:** `@svta/cml-iso-bmff`, `@svta/cml-utils`, and `cbor-x` are peer dependencies. Most package managers install them automatically, but you may need to add them explicitly.

> **Note:** This library uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`crypto.subtle`) to verify COSE signatures and compute BMFF hashes. In Node.js 20+, `crypto.subtle` is available globally. In browsers, it requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or `localhost`).

## Usage

### Manifest Box method (per-segment manifests)

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

  console.log(result.isValid, result.errorCodes)
}
```

### VSI/EMSG method (init segment + media segments)

```typescript
import { validateC2paInitSegment, validateC2paSegment } from '@svta/cml-c2pa'

const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
const init = await validateC2paInitSegment(initBytes)

const segmentBytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))
const validated = await validateC2paSegment(segmentBytes, init.sessionKeys)
```

### VOD Merkle method (init segment + media segments)

```typescript
import { validateC2paInitSegment, validateC2paMerkleSegment } from '@svta/cml-c2pa'

const initBytes = new Uint8Array(await fetch(initUrl).then(r => r.arrayBuffer()))
const init = await validateC2paInitSegment(initBytes)

const segmentBytes = new Uint8Array(await fetch(segmentUrl).then(r => r.arrayBuffer()))
const { result } = await validateC2paMerkleSegment(segmentBytes, init.merkleMaps)
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
