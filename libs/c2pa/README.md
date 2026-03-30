# @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for BMFF/MP4 containers.

## Installation

```bash
npm i @svta/cml-c2pa @svta/cml-iso-bmff cbor-x
```

> **Note:** `@svta/cml-iso-bmff` and `cbor-x` are peer dependencies.

## Available exports

| Export | Description |
|---|---|
| `LiveVideoStatusCode` | C2PA §19.7 error code constants |
| `C2paManifest` | Type: parsed C2PA manifest structure |
| `C2paAssertion` | Type: assertion within a manifest |
| `C2paSignatureInfo` | Type: signature metadata (issuer, time) |

## References

- [C2PA Specification v2.3](https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [JUMBF — ISO 19566-5](https://www.iso.org/standard/84635.html)
- [COSE — RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)
