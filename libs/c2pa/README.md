# @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for BMFF/MP4 containers.

Supports both segment validation methods defined in the C2PA specification:

- **§19.3 — Per-segment C2PA Manifest Box**: each segment embeds a full C2PA manifest with COSE signature
- **§19.4 — Verifiable Segment Info (VSI/EMSG)**: the init segment carries the manifest and session keys; each media segment carries a lightweight signed EMSG box


## Installation

```bash
npm i @svta/cml-c2pa
```

> **Note:** `@svta/cml-iso-bmff`, `@svta/cml-utils`, and `cbor-x` are peer dependencies. Most package managers install them automatically, but you may need to add them explicitly.

## Docs

- [VSI/EMSG Validation](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/vsi-validation.md) — Validate using Verifiable Segment Info (§19.4)
- [Manifest Box Validation](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/manifest-box-validation.md) — Validate using per-segment manifests (§19.3)
- [Results and Error Codes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/c2pa/docs/results-and-error-codes.md) — Interpret results, error codes, and manifest data

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [JUMBF — ISO 19566-5](https://www.iso.org/standard/84635.html)
- [COSE — RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)
