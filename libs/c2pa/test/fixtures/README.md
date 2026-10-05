# Test Fixtures

## vsi_init_with_signer_binding.mp4

This file is the init segment of an fMP4 live stream. The stream uses the Verifiable Segment Info method (C2PA 2.4 §19.4). Its manifest has a `c2pa.session-keys` assertion with one session key.

| Property | Value |
| --- | --- |
| Source repository | [Encypher C2PA](https://github.com/encypherai/encypher-c2pa) |
| Source path | `crates/encypher-c2pa/tests/fixtures/live-video/fmp4-verifiable-segment-info/init.mp4` |
| Source commit | `8b6040b9ff9475b64a0d3f30990344896b373cec` |
| SHA-256 | `a8737ac9cbdde52159d34a180a81232e5b8bc4da0d6af6b011d0f6497761b654` |
| Session key validity | 86400 seconds from `2026-09-20T21:12:18Z` |

The file is an unmodified copy of the source file. The Encypher C2PA repository distributes the file under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0), with this attribution notice:

```text
Encypher C2PA
Copyright 2026 Encypher Corporation (https://encypher.com)

This product includes software developed by Encypher Corporation.
```
