# CMAF HAM

## Overview

HTTP Live Streaming (HLS) and Dynamic Adaptive Streaming over HTTP (DASH) are the two main video streaming technologies today. Users often need to convert between HLS and DASH, edit manifests, and read manifest structures in code.

The Common Media Application Format (CMAF) for segmented media (ISO/IEC 23000-19) defines one universal format for both. The format is based on the ISO Base Media File Format (ISO BMFF). CMAF also defines the Hypothetical Application Model (HAM), a framework that shows how streaming applications use CMAF segments and fragments. This project is based on the principles of the CMAF standard and the [Hypothetical Application Model](https://cdn.cta.tech/cta/media/media/resources/standards/cta-5005-a-final.pdf).

## Features

* On-demand conversion between HLS and DASH manifests through HAM: HLS to HAM, HAM to HLS, DASH to HAM, and HAM to DASH.
* Elementary Media Presentation queries.

## Usage

The examples show how to use the CMAF HAM module in TypeScript:

```typescript
import {
  hamToHls,
  hamToDash
  hlsToHam,
} from "@svta/common-media-library";

const hamObject = hlsToHam(mainHlsManifest, playListHlsManifests); // Convert HLS to HAM object
const hlsManifest = hamToHls(hamObject); // Convert HAM object to HLS manifest
const dashManifest = hamToDash(hamObject); // Convert HAM object to DASH manifest
```

```typescript
import {
  hamToDash,
  hamToHls,
  dashToHam,
} from "@svta/common-media-library";

const hamObject = dashToHam(mainDashManifest); // Convert DASH to HAM object
const hlsManifest = hamToHls(hamObject); // Convert HAM object to HLS manifest
const dashManifest = hamToDash(hamObject); // Convert HAM object to DASH manifest

```

The library also offers presentation queries and track validation.

## Documentation

For the API reference and more examples, read the API documentation.

## Contribution

Contributions are welcome. To report a bug, request a feature, or contribute code, open an issue or a pull request.

## License

This library uses the Apache 2.0 License. You may use, modify, and distribute it for commercial and non-commercial purposes. See the LICENSE file for details.
